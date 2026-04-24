import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { UploadZone } from './components/UploadZone';
import { WatermarkForm } from './components/WatermarkForm';
import { PreviewPanel } from './components/PreviewPanel';
import { DownloadPanel } from './components/DownloadPanel';
import { submitWatermark } from './api';
import type { WatermarkFormValues } from './types';

// Bootstrap icons are referenced via CSS — no JS import needed for icons

let currentFile: File | null = null;
const formValues: Partial<WatermarkFormValues> = {};

new UploadZone(
  document.getElementById('upload-zone')!,
  (file) => {
    currentFile = file;
    downloadPanel.clear();
  }
);

const watermarkForm = new WatermarkForm(
  document.getElementById('watermark-form')!,
  (values) => {
    Object.assign(formValues, values);
    previewPanel.update(values);
  }
);

const previewPanel = new PreviewPanel(document.getElementById('preview-panel')!);
const downloadPanel = new DownloadPanel(document.getElementById('download-panel')!);

// Initialise preview with defaults
previewPanel.update(watermarkForm.getValues());

document.getElementById('submit-btn')!.addEventListener('click', async () => {
  if (!currentFile) {
    alert('Please select a PDF file first.');
    return;
  }

  const values: WatermarkFormValues = {
    file: currentFile,
    watermarkType: formValues.watermarkType ?? 'Visible',
    contentType: formValues.contentType ?? 'Timestamp',
    customText: formValues.customText,
    position: formValues.position ?? 'Diagonal',
    fontSize: formValues.fontSize ?? 36,
    opacity: formValues.opacity ?? 0.3,
    color: formValues.color ?? '#FF0000',
  };

  if (values.contentType === 'Custom' && !values.customText?.trim()) {
    alert('Please enter your custom watermark text.');
    return;
  }

  downloadPanel.showLoading();

  try {
    const response = await submitWatermark(values);
    downloadPanel.show(response);
  } catch (err: any) {
    downloadPanel.showError(err.message ?? 'An unexpected error occurred.');
  }
});
