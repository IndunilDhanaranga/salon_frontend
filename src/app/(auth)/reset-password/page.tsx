"use client";

import { FormEvent, Suspense, useState } from "react";
import { ArrowLeft, ArrowRight, Scissors } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { message } from "@/lib/format";

function ResetPasswordForm() {
  const params = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const submittedEmail = String(values.email ?? "").trim();
    try {
      await api("reset-password", {
        method: "POST",
        body: { ...values, token, email: submittedEmail },
      });
      setComplete(true);
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-story">
        <a href="/" className="brand"><Scissors size={24} strokeWidth={1.5} /><span>salon<span className="brand-dot">.</span></span></a>
        <div className="auth-editorial"><span className="eyebrow light">A LITTLE ORDER. MORE ROOM TO CREATE.</span><h1>Good days<br />start here.</h1><p>Choose a new password for your salon workspace.</p></div>
        <div className="auth-foot"><span>MADE FOR THE EVERYDAY</span><Scissors size={36} strokeWidth={1} /></div>
      </section>
      <section className="auth-form-wrap">
        <div className="auth-form">
          <span className="eyebrow">ACCOUNT RECOVERY</span>
          <h2>{complete ? "Password updated." : "Choose a new password."}</h2>
          <p className="muted">{complete ? "You can now sign in with your new password." : "Use at least 8 characters for your new password."}</p>
          {complete ? <div className="connection-notice" role="status">Your password has been reset.</div> : (
            <form onSubmit={(event) => void submit(event)}>
              <label>Email address<input name="email" type="email" autoComplete="email" defaultValue={email} required maxLength={255} /></label>
              <label>New password<input name="password" type="password" autoComplete="new-password" minLength={8} maxLength={72} required /></label>
              <label>Confirm new password<input name="password_confirmation" type="password" autoComplete="new-password" minLength={8} maxLength={72} required /></label>
              {error && <p className="error-box" role="alert">{error}</p>}
              <button className="button primary full" disabled={busy || !token}>{busy ? "Please wait…" : "Reset password"}<ArrowRight size={17} /></button>
              {!token && <p className="error-box" role="alert">This reset link is missing its token. <a href="/forgot-password">Request a new reset link</a>.</p>}
            </form>
          )}
          <p className="auth-toggle"><a className="text-button" href="/login"><ArrowLeft size={15} /> Back to sign in</a></p>
        </div>
      </section>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="auth-layout" aria-busy="true" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
