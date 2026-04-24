import type { WatermarkFormValues, WatermarkResponse } from './types';

export async function submitWatermark(values: WatermarkFormValues): Promise<WatermarkResponse> {
  const body = new FormData();
  body.append('file', values.file);
  body.append('watermarkType', values.watermarkType);
  body.append('contentType', values.contentType);
  if (values.contentType === 'Custom' && values.customText) {
    body.append('customText', values.customText);
  }
  body.append('position', values.position);
  body.append('fontSize', String(values.fontSize));
  body.append('opacity', String(values.opacity));
  body.append('color', values.color);

  const res = await fetch('/api/watermark', { method: 'POST', body });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unexpected error', code: 'UNKNOWN' }));
    throw Object.assign(new Error(err.error ?? 'Request failed'), { code: err.code, status: res.status });
  }

  return res.json();
}
