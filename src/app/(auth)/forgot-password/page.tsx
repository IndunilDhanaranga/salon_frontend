"use client";

import { FormEvent, useState } from "react";
import { ArrowLeft, ArrowRight, Scissors } from "lucide-react";
import { api } from "@/lib/api";
import { message } from "@/lib/format";

export default function ForgotPasswordPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const email = new FormData(event.currentTarget).get("email");
    try {
      await api("forgot-password", { method: "POST", body: { email } });
      setSent(true);
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
        <div className="auth-editorial"><span className="eyebrow light">A LITTLE ORDER. MORE ROOM TO CREATE.</span><h1>Good days<br />start here.</h1><p>We’ll help you get back into your salon workspace.</p></div>
        <div className="auth-foot"><span>MADE FOR THE EVERYDAY</span><Scissors size={36} strokeWidth={1} /></div>
      </section>
      <section className="auth-form-wrap">
        <div className="auth-form">
          <span className="eyebrow">ACCOUNT RECOVERY</span>
          <h2>{sent ? "Check your inbox." : "Forgot your password?"}</h2>
          <p className="muted">{sent ? "If an account exists for that address, we’ve sent a password reset link. Follow the link in your email to choose a new password." : "Enter the email address for your account and we’ll send you a link to reset your password."}</p>
          {sent ? (
            <div className="connection-notice" role="status">A reset link has been sent if that email is registered.</div>
          ) : (
            <form onSubmit={(event) => void submit(event)}>
              <label>Email address<input name="email" type="email" autoComplete="email" required maxLength={255} /></label>
              {error && <p className="error-box" role="alert">{error}</p>}
              <button className="button primary full" disabled={busy}>{busy ? "Please wait…" : "Send reset link"}<ArrowRight size={17} /></button>
            </form>
          )}
          <p className="auth-toggle"><a className="text-button" href="/login"><ArrowLeft size={15} /> Back to sign in</a></p>
        </div>
      </section>
    </main>
  );
}
