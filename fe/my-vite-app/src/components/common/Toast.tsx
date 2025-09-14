// src/components/common/Toast.tsx
import { type ToastType } from "@/contexts/types"; // 경로 수정
import { CheckCircle, X } from "lucide-react";

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-[716px] flex items-center">
      <div
        className={`
          w-full px-6 py-4 flex items-center justify-between
          rounded-[50px] shadow-lg
          ${type === "success" ? "bg-primary" : "bg-red-500"}
          text-white
        `}
      >
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span className="text-base font-medium">{message}</span>
        </div>
        <button onClick={onClose} className="hover:opacity-80">
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
