import type { WatermarkFormValues, WatermarkPosition } from '../types';

export class WatermarkForm {
  private el: HTMLElement;
  private onChange: (values: Partial<WatermarkFormValues>) => void;

  constructor(container: HTMLElement, onChange: (values: Partial<WatermarkFormValues>) => void) {
    this.el = container;
    this.onChange = onChange;
    this.render();
  }

  private render() {
    this.el.innerHTML = `
      <div class="row g-3">

        <div class="col-12">
          <label class="form-label fw-semibold">Watermark type</label>
          <div class="btn-group w-100" role="group">
            <input type="radio" class="btn-check" name="watermarkType" id="wt-visible"   value="Visible"   autocomplete="off" checked>
            <label class="btn btn-outline-primary" for="wt-visible">Visible</label>
            <input type="radio" class="btn-check" name="watermarkType" id="wt-invisible" value="Invisible" autocomplete="off">
            <label class="btn btn-outline-primary" for="wt-invisible">Invisible</label>
            <input type="radio" class="btn-check" name="watermarkType" id="wt-both"      value="Both"      autocomplete="off">
            <label class="btn btn-outline-primary" for="wt-both">Both</label>
          </div>
        </div>

        <div class="col-12">
          <label class="form-label fw-semibold">Content</label>
          <div class="btn-group w-100" role="group">
            <input type="radio" class="btn-check" name="contentType" id="ct-timestamp" value="Timestamp" autocomplete="off" checked>
            <label class="btn btn-outline-secondary" for="ct-timestamp">Timestamp</label>
            <input type="radio" class="btn-check" name="contentType" id="ct-custom"    value="Custom"    autocomplete="off">
            <label class="btn btn-outline-secondary" for="ct-custom">Custom text</label>
          </div>
        </div>

        <div class="col-12" id="custom-text-row" style="display:none">
          <input type="text" id="custom-text" class="form-control" placeholder="Enter your watermark text" maxlength="200">
        </div>

        <div class="col-12" id="visible-options">
          <label class="form-label fw-semibold">Position</label>
          <div id="position-grid" class="d-grid gap-1 mb-3" style="grid-template-columns: repeat(3,1fr); grid-template-rows: repeat(3,1fr)">
            ${this.positionButtons()}
          </div>

          <div class="row g-2">
            <div class="col-6">
              <label class="form-label small">Font size: <span id="font-size-val">36</span>px</label>
              <input type="range" class="form-range" id="font-size" min="8" max="96" value="36">
            </div>
            <div class="col-6">
              <label class="form-label small">Opacity: <span id="opacity-val">30</span>%</label>
              <input type="range" class="form-range" id="opacity" min="5" max="100" value="30">
            </div>
            <div class="col-6">
              <label class="form-label small">Color</label>
              <input type="color" class="form-control form-control-color w-100" id="color" value="#FF0000">
            </div>
          </div>
        </div>

      </div>`;

    this.bindEvents();
  }

  private positionButtons(): string {
    // Build grid manually
    const grid: { value: WatermarkPosition; label: string; icon: string }[] = [
      { value: 'TopLeft',      label: 'Top left',      icon: '↖' },
      { value: 'TopCenter',    label: 'Top center',    icon: '↑' },
      { value: 'TopRight',     label: 'Top right',     icon: '↗' },
      { value: 'Center',       label: 'Center',        icon: '✛' },
      { value: 'Diagonal',     label: 'Diagonal',      icon: '⤡' },
      { value: 'Center',       label: '',              icon: '' },  // empty cell
      { value: 'BottomLeft',   label: 'Bottom left',   icon: '↙' },
      { value: 'BottomCenter', label: 'Bottom center', icon: '↓' },
      { value: 'BottomRight',  label: 'Bottom right',  icon: '↘' },
    ];

    return grid.map((p, i) => {
      if (i === 5) return '<div></div>';  // empty cell at row2, col3
      const checked = p.value === 'Diagonal' ? 'checked' : '';
      return `
        <div>
          <input type="radio" class="btn-check" name="position" id="pos-${p.value}-${i}" value="${p.value}" autocomplete="off" ${checked}>
          <label class="btn btn-outline-secondary w-100 py-2" for="pos-${p.value}-${i}" title="${p.label}">${p.icon}</label>
        </div>`;
    }).join('');
  }

  private bindEvents() {
    const emit = () => this.onChange(this.getValues());

    // Watermark type toggle
    this.el.querySelectorAll<HTMLInputElement>('input[name="watermarkType"]').forEach(r => {
      r.addEventListener('change', () => {
        const visibleOptions = this.el.querySelector<HTMLElement>('#visible-options')!;
        visibleOptions.style.display = r.value === 'Invisible' ? 'none' : '';
        emit();
      });
    });

    // Content type toggle
    this.el.querySelectorAll<HTMLInputElement>('input[name="contentType"]').forEach(r => {
      r.addEventListener('change', () => {
        const row = this.el.querySelector<HTMLElement>('#custom-text-row')!;
        row.style.display = r.value === 'Custom' ? '' : 'none';
        emit();
      });
    });

    // All other inputs
    ['custom-text', 'font-size', 'opacity', 'color'].forEach(id => {
      this.el.querySelector(`#${id}`)?.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        if (id === 'font-size') this.el.querySelector('#font-size-val')!.textContent = target.value;
        if (id === 'opacity') this.el.querySelector('#opacity-val')!.textContent = target.value;
        emit();
      });
    });

    this.el.querySelectorAll<HTMLInputElement>('input[name="position"]').forEach(r => {
      r.addEventListener('change', emit);
    });
  }

  getValues(): Partial<WatermarkFormValues> {
    const get = <T extends HTMLInputElement>(id: string) => this.el.querySelector<T>(`#${id}`);
    const radio = (name: string) =>
      this.el.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`)?.value;

    return {
      watermarkType: (radio('watermarkType') ?? 'Visible') as WatermarkFormValues['watermarkType'],
      contentType: (radio('contentType') ?? 'Timestamp') as WatermarkFormValues['contentType'],
      customText: get('custom-text')?.value,
      position: (radio('position') ?? 'Diagonal') as WatermarkPosition,
      fontSize: Number(get('font-size')?.value ?? 36),
      opacity: Number(get('opacity')?.value ?? 30) / 100,
      color: get('color')?.value ?? '#FF0000',
    };
  }
}
