// src/contexts/ToastProvider.tsx
import { useState, useCallback } from "react";
import { Toast } from "@/components/common/Toast";
import { ToastContext } from "./ToastContext";
import type { ToastType } from "./types";

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<
    Array<{
      id: string;
      message: string;
      type: ToastType;
    }>
  >([]);

  const showToast = useCallback(
    (message: string, type: ToastType = "success") => {
      // 사용자에게 표시하기 적합하지 않은 기술적 오류 메시지 필터링
      if (
        message.includes("status code 400") ||
        message.includes("Request failed")
      ) {
        message = "계정 정보가 올바르지 않습니다. 다시 시도해주세요.";
      }

      const id = String(Date.now());
      setToasts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, 3000);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => {
            setToasts((prev) => prev.filter((t) => t.id !== toast.id));
          }}
        />
      ))}
    </ToastContext.Provider>
  );
}
