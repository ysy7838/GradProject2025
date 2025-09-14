// src/contexts/types.ts
export type ToastType = 'success' | 'error';

export interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}