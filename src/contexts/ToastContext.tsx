"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import ToastComponent from "@/components/Toast";

type ToastType = "success" | "error" | "info";
type ToastContextType = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && <ToastComponent message={toast.message} type={toast.type} />}
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};