import React from "react";
import { Scissors } from "lucide-react";

export function LoadingSpinner({
  message = "Loading...",
  fullscreen = false,
}: {
  message?: string;
  fullscreen?: boolean;
}) {
  const content = (
    <>
      <Scissors size={30} strokeWidth={1.4} className="animate-spin" />
      <p>{message}</p>
    </>
  );

  if (fullscreen) {
    return (
      <main className="initial-loader" aria-busy="true">
        {content}
      </main>
    );
  }

  return (
    <div className="flex-center p-8" aria-busy="true">
      {content}
    </div>
  );
}
