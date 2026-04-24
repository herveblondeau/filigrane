import type { WatermarkResponse } from '../types';
import { startCountdown } from '../utils/countdown';

export class DownloadPanel {
  private el: HTMLElement;
  private stopCountdown?: () => void;

  constructor(container: HTMLElement) {
    this.el = container;
  }

  show(response: WatermarkResponse) {
    this.stopCountdown?.();

    this.el.innerHTML = `
      <div class="alert alert-success d-flex flex-column gap-2 mb-0">
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-check-circle-fill fs-5"></i>
          <strong>Your watermarked PDF is ready</strong>
        </div>
        <a id="download-link" href="${response.downloadUrl}" class="btn btn-success btn-sm align-self-start">
          <i class="bi bi-download me-1"></i>Download PDF
        </a>
        <small class="text-success-emphasis">
          Link expires in <span id="countdown" class="fw-semibold"></span>
        </small>
      </div>`;

    const countdownEl = this.el.querySelector<HTMLElement>('#countdown')!;
    const link = this.el.querySelector<HTMLAnchorElement>('#download-link')!;

    this.stopCountdown = startCountdown(
      response.expiresAt,
      (remaining) => { countdownEl.textContent = remaining; },
      () => {
        link.classList.replace('btn-success', 'btn-secondary');
        link.setAttribute('aria-disabled', 'true');
        link.style.pointerEvents = 'none';
        countdownEl.textContent = 'expired';
      }
    );
  }

  showError(message: string) {
    this.el.innerHTML = `
      <div class="alert alert-danger d-flex align-items-center gap-2 mb-0">
        <i class="bi bi-exclamation-triangle-fill fs-5"></i>
        <span>${message}</span>
      </div>`;
  }

  showLoading() {
    this.el.innerHTML = `
      <div class="d-flex align-items-center gap-2 text-secondary">
        <div class="spinner-border spinner-border-sm" role="status"></div>
        <span>Processing your PDF…</span>
      </div>`;
  }

  clear() {
    this.stopCountdown?.();
    this.el.innerHTML = '';
  }
}
