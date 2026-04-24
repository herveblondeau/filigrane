import type { WatermarkFormValues, WatermarkPosition } from '../types';

// Position of the watermark label as [x%, y%] within the preview area
const POSITION_MAP: Record<WatermarkPosition, [number, number]> = {
  TopLeft:      [15, 10],
  TopCenter:    [50, 10],
  TopRight:     [85, 10],
  Center:       [50, 50],
  Diagonal:     [50, 50],
  BottomLeft:   [15, 88],
  BottomCenter: [50, 88],
  BottomRight:  [85, 88],
};

export class PreviewPanel {
  private el: HTMLElement;
  private badge: HTMLElement;
  private currentValues: Partial<WatermarkFormValues> = {};

  constructor(container: HTMLElement) {
    this.el = container;
    this.el.innerHTML = `
      <div class="position-relative bg-white border rounded shadow-sm mx-auto"
           style="width:180px; height:255px; overflow:hidden">
        <!-- Page lines -->
        <div style="padding:12px; opacity:.12">
          ${Array.from({ length: 18 }, () =>
            '<div style="height:6px; background:#000; margin-bottom:6px; border-radius:2px"></div>'
          ).join('')}
        </div>
        <!-- Watermark badge -->
        <div id="wm-badge" class="position-absolute" style="transform:translate(-50%,-50%); pointer-events:none; transition: left .2s, top .2s">
          <span class="badge" style="font-size:.55rem; opacity:.5; white-space:nowrap; transform:rotate(0deg); display:inline-block"></span>
        </div>
      </div>
      <p class="text-center text-secondary small mt-2 mb-0">Preview is indicative</p>`;

    this.badge = this.el.querySelector<HTMLElement>('#wm-badge')!;
  }

  update(values: Partial<WatermarkFormValues>) {
    this.currentValues = { ...this.currentValues, ...values };
    const v = this.currentValues;

    const invisible = v.watermarkType === 'Invisible';
    this.badge.style.display = invisible ? 'none' : '';
    if (invisible) return;

    const pos = v.position ?? 'Diagonal';
    const [xPct, yPct] = POSITION_MAP[pos];
    this.badge.style.left = `${xPct}%`;
    this.badge.style.top = `${yPct}%`;

    const span = this.badge.querySelector('span')!;
    const text = v.contentType === 'Custom' && v.customText?.trim()
      ? v.customText
      : 'Generated: 2026-03-10 12:00:00 UTC';
    span.textContent = text;
    span.style.color = v.color ?? '#FF0000';
    span.style.opacity = String(v.opacity ?? 0.3);
    span.style.fontSize = `${Math.round((v.fontSize ?? 36) * 0.35)}px`;
    span.style.transform = pos === 'Diagonal' ? 'rotate(-45deg)' : 'rotate(0deg)';
  }
}
