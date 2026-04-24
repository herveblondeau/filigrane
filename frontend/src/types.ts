export type WatermarkType = 'Visible' | 'Invisible' | 'Both';
export type WatermarkContentType = 'Timestamp' | 'Custom';
export type WatermarkPosition =
  | 'Diagonal'
  | 'TopLeft' | 'TopCenter' | 'TopRight'
  | 'Center'
  | 'BottomLeft' | 'BottomCenter' | 'BottomRight';

export interface WatermarkFormValues {
  file: File;
  watermarkType: WatermarkType;
  contentType: WatermarkContentType;
  customText?: string;
  position: WatermarkPosition;
  fontSize: number;
  opacity: number;
  color: string;
}

export interface WatermarkResponse {
  token: string;
  downloadUrl: string;
  expiresAt: string;
  expiresInSeconds: number;
}

export interface ApiError {
  error: string;
  code: string;
}
