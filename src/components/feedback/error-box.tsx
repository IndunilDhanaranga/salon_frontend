import React from "react";
import { AlertCircle } from "lucide-react";

export function ErrorBox({
  message,
  onRetry,
  retryLabel = "Try again",
}: {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div className="error-box" role="alert">
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <AlertCircle size={18} />
        <span>{message}</span>
      </div>
      {onRetry && (
        <button
          type="button"
          className="text-button"
          onClick={onRetry}
          style={{ marginTop: "0.25rem" }}
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}
