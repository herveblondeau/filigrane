export class UploadZone {
  private el: HTMLElement;
  private input: HTMLInputElement;
  private label: HTMLElement;
  private onFile: (file: File) => void;

  constructor(container: HTMLElement, onFile: (file: File) => void) {
    this.onFile = onFile;
    this.el = container;

    this.el.innerHTML = `
      <div id="drop-zone" class="border border-2 border-dashed rounded-3 p-5 text-center" style="cursor:pointer; border-color: var(--bs-border-color)!important; transition: border-color .2s, background .2s">
        <i class="bi bi-file-earmark-arrow-up fs-1 text-secondary"></i>
        <p class="mt-3 mb-1 fw-semibold">Drop your PDF here</p>
        <p class="text-secondary small mb-3">or click to browse &mdash; max 3 MB</p>
        <span id="file-label" class="badge bg-secondary">No file selected</span>
        <input type="file" id="file-input" accept="application/pdf" class="d-none">
      </div>`;

    const zone = this.el.querySelector<HTMLElement>('#drop-zone')!;
    this.input = this.el.querySelector<HTMLInputElement>('#file-input')!;
    this.label = this.el.querySelector<HTMLElement>('#file-label')!;

    zone.addEventListener('click', () => this.input.click());
    this.input.addEventListener('change', () => {
      if (this.input.files?.[0]) this.setFile(this.input.files[0]);
    });

    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.style.borderColor = 'var(--bs-primary)';
      zone.style.background = 'rgba(var(--bs-primary-rgb), .05)';
    });
    zone.addEventListener('dragleave', () => this.resetZoneStyle(zone));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.resetZoneStyle(zone);
      const file = e.dataTransfer?.files[0];
      if (file?.type === 'application/pdf') this.setFile(file);
      else this.showError('Only PDF files are accepted.');
    });
  }

  private setFile(file: File) {
    if (file.size > 3 * 1024 * 1024) {
      this.showError('File exceeds 3 MB limit.');
      return;
    }
    this.label.textContent = file.name;
    this.label.className = 'badge bg-primary';
    this.onFile(file);
  }

  private showError(msg: string) {
    this.label.textContent = msg;
    this.label.className = 'badge bg-danger';
  }

  private resetZoneStyle(zone: HTMLElement) {
    zone.style.borderColor = '';
    zone.style.background = '';
  }
}
