namespace Filigrane.Api.Middleware;

public class FileSizeValidationMiddleware(RequestDelegate next, IConfiguration configuration)
{
    private readonly long _maxBytes =
        configuration.GetValue<long>("Filigrane:MaxFileSizeBytes", 3_145_728);

    public async Task InvokeAsync(HttpContext context)
    {
        if (context.Request.ContentLength > _maxBytes)
        {
            context.Response.StatusCode = StatusCodes.Status413RequestEntityTooLarge;
            await context.Response.WriteAsJsonAsync(new
            {
                error = $"File exceeds the maximum allowed size of {_maxBytes / 1024 / 1024} MB.",
                code = "FILE_TOO_LARGE"
            });
            return;
        }

        await next(context);
    }
}
