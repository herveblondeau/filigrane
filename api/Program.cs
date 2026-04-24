using System.Threading.RateLimiting;
using Filigrane.Api.Middleware;
using Filigrane.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddSingleton<ITokenStore, InMemoryTokenStore>();
builder.Services.AddSingleton<IFileStore, LocalFileStore>();
builder.Services.AddSingleton<PdfWatermarker>();
builder.Services.AddHostedService<CleanupService>();

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddPolicy("watermark", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = builder.Configuration.GetValue<int>("RateLimiting:WatermarkPermitLimit", 5),
                Window = TimeSpan.FromSeconds(builder.Configuration.GetValue<int>("RateLimiting:WatermarkWindowSeconds", 60)),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            }));

    options.AddPolicy("download", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = builder.Configuration.GetValue<int>("RateLimiting:DownloadPermitLimit", 20),
                Window = TimeSpan.FromSeconds(builder.Configuration.GetValue<int>("RateLimiting:DownloadWindowSeconds", 60)),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            }));
});

var app = builder.Build();

app.UseMiddleware<FileSizeValidationMiddleware>();
app.UseRateLimiter();
app.MapControllers();

app.Run();
