// src/contexts/useToast.ts
import { useContext } from 'react';
import { ToastContext } from './ToastContext';

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}