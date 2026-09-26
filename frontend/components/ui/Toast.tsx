"use client";

import React from "react";
import { AlertTriangle, Check, X, XCircle } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { Button } from "./Button";

export function ToastViewport() {
  const { toasts, dismissToast } = useToast();
  if (!toasts.length) return null;
  return (
    <div className="mf-toasts">
      {toasts.map((t) => (
        <div key={t.id} className="mf-toast" role="status">
          <div className={`mf-toast__icon mf-toast__icon--${t.variant}`}>
            {t.variant === "success" && <Check size={14} />}
            {t.variant === "warning" && <AlertTriangle size={14} />}
            {t.variant === "error" && <XCircle size={14} />}
          </div>
          <div style={{ flex: 1 }}>
            <div className="mf-toast__title">{t.title}</div>
            {t.body ? <div className="mf-toast__body">{t.body}</div> : null}
          </div>
          <Button variant="icon" aria-label="Dismiss" onClick={() => dismissToast(t.id)}>
            <X size={14} />
          </Button>
          <div className={`mf-toast__progress mf-toast__progress--${t.variant}`} />
        </div>
      ))}
    </div>
  );
}
