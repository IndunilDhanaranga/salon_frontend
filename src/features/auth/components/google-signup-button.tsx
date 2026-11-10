"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type GoogleCredentialResponse = { credential: string };

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              theme: string;
              size: string;
              shape: string;
              width: number;
            },
          ) => void;
        };
      };
    };
  }
}

export function GoogleSignupButton({
  onCredential,
}: {
  onCredential: (credential: string) => void;
}) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);
  const [scriptReady, setScriptReady] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    callbackRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!scriptReady || !clientId || !buttonRef.current || !window.google)
      return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: ({ credential }) => callbackRef.current(credential),
    });
    buttonRef.current.replaceChildren();
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      shape: "rectangular",
      width: Math.min(buttonRef.current.clientWidth || 360, 400),
    });
  }, [clientId, scriptReady]);

  if (!clientId) {
    return (
      <p className="field-hint" role="status">
        Google workspace creation is not configured yet. Set
        NEXT_PUBLIC_GOOGLE_CLIENT_ID to enable it.
      </p>
    );
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      <div ref={buttonRef} className="google-signup-button" />
    </>
  );
}
