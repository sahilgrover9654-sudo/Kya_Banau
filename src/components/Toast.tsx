import React, { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";

interface ToastProps {
  message: string;
  onClose: () => void;
}

export function Toast({ message, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 max-w-[360px] w-[90%] z-50 animate-in fade-in slide-in-from-top-4 duration-200">
      <div className="bg-[#1A1A1A] text-white px-4 py-3 rounded-[16px] shadow-lg flex items-center gap-3 border border-[#333333]">
        <CheckCircle2 className="w-5 h-5 text-[#D1654B] shrink-0" />
        <span className="text-sm font-medium leading-snug">{message}</span>
      </div>
    </div>
  );
}
