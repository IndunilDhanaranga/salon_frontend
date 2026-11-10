"use client";

import { useState } from "react";
import {
  ArrowRight,
  Scissors,
  Check,
  CalendarDays,
  Users,
  Wallet,
  Compass,
} from "lucide-react";
import { api } from "@/lib/api";
import type { Session } from "@/lib/types";
import { message } from "@/lib/format";
import { autoRequestPushPermission } from "@/lib/device-registry";
import { GoogleSignupButton } from "./google-signup-button";

export function AuthScreen({
  onAuthenticated,
  notice,
  initialRegister = false,
}: {
  onAuthenticated: (session: Session, startTour?: boolean) => void;
  notice?: string;
  initialRegister?: boolean;
}) {
  const [register, setRegister] = useState(initialRegister);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [googleCredential, setGoogleCredential] = useState("");

  async function signIn(
    form: FormData,
    demo: boolean | "google" = false,
    startTour = false,
  ) {
    setBusy(true);
    setError("");
    void autoRequestPushPermission();
    const values = Object.fromEntries(form);
    const body =
      demo === true
        ? { email: "demo@salon.test", password: "password" }
        : demo === "google"
          ? {
              credential: googleCredential,
              salon_name: values.salon_name,
              phone: values.phone,
              currency: values.currency,
              timezone: values.timezone,
            }
          : values;
    try {
      onAuthenticated(
        await api<Session>(
          demo === "google"
            ? "google/register"
            : register && !demo
              ? "register"
              : "login",
          {
            method: "POST",
            body,
          },
        ),
        startTour,
      );
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-story">
        <a href="/" className="brand">
          <Scissors size={24} strokeWidth={1.5} />
          <span>
            salon<span className="brand-dot">.</span>
          </span>
        </a>
        <div className="auth-editorial">
          <span className="eyebrow light">
            A LITTLE ORDER. MORE ROOM TO CREATE.
          </span>
          <h1>
            Good days
            <br />
            start here.
          </h1>
          <p>
            Your appointments, your people, your business.
            <br />A calmer workspace for the salon you’re building.
          </p>
          <div className="story-line">
            <CalendarDays size={20} />
            <span>Keep the day moving.</span>
          </div>
          <div className="story-line">
            <Users size={20} />
            <span>Look after your team.</span>
          </div>
          <div className="story-line">
            <Wallet size={20} />
            <span>Make payroll clearer.</span>
          </div>
        </div>
        <div className="auth-foot">
          <span>MADE FOR THE EVERYDAY</span>
          <Scissors size={36} strokeWidth={1} />
        </div>
      </section>
      <section className="auth-form-wrap">
        <div className="auth-form">
          <span className="eyebrow">YOUR SALON WORKSPACE</span>
          <h2>{register ? "Make yourself at home." : "Welcome back."}</h2>
          <p className="muted">
            {register
              ? "Create your owner account, then add your first salon branch."
              : "Sign in and see what’s happening today."}
          </p>
          {notice && (
            <div
              className="connection-notice"
              role="status"
              style={{ marginBottom: "1.25rem" }}
            >
              {notice}
            </div>
          )}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void signIn(
                new FormData(event.currentTarget),
                googleCredential ? "google" : false,
              );
            }}
          >
            {register && !googleCredential && (
              <div className="google-signup-section">
                <GoogleSignupButton
                  onCredential={(credential) => {
                    setGoogleCredential(credential);
                    setError("");
                  }}
                />
                <div className="auth-divider">
                  <span>or use email and password</span>
                </div>
              </div>
            )}
            {register && (
              <>
                {googleCredential ? (
                  <div className="connection-notice" role="status">
                    Google account selected. Add your workspace details to
                    continue.
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => setGoogleCredential("")}
                    >
                      Choose another account
                    </button>
                  </div>
                ) : (
                  <label>
                    Your name
                    <input
                      name="name"
                      autoComplete="name"
                      required
                      maxLength={120}
                    />
                  </label>
                )}
                <label>
                  Salon name
                  <input name="salon_name" required maxLength={120} />
                  <span className="field-hint">
                    Your workspace address will be generated from this name.
                  </span>
                </label>
                <label>
                  Phone number
                  <input
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    maxLength={30}
                  />
                </label>
              </>
            )}
            {(!register || !googleCredential) && (
              <label>
                Email address
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                />
              </label>
            )}
            {(!register || !googleCredential) && (
              <label>
                Password
                <input
                  name="password"
                  type="password"
                  autoComplete={register ? "new-password" : "current-password"}
                  minLength={register ? 8 : 1}
                  required
                />
              </label>
            )}
            {!register && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: "-0.5rem",
                }}
              >
                <a className="text-button" href="/forgot-password">
                  Forgot password?
                </a>
              </div>
            )}
            {register && (
              <>
                {!googleCredential && (
                  <label>
                    Confirm password
                    <input
                      name="password_confirmation"
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />
                  </label>
                )}
                <div className="form-grid">
                  <label>
                    Currency
                    <select name="currency" defaultValue="LKR">
                      <option>LKR</option>
                      <option>USD</option>
                      <option>GBP</option>
                      <option>EUR</option>
                      <option>INR</option>
                    </select>
                  </label>
                  <label>
                    Time zone
                    <input
                      name="timezone"
                      defaultValue="Asia/Colombo"
                      required
                    />
                  </label>
                </div>
              </>
            )}
            {error && (
              <p className="error-box" role="alert">
                {error}
              </p>
            )}
            <button className="button primary full" disabled={busy}>
              {busy
                ? "Please wait…"
                : register
                  ? googleCredential
                    ? "Create workspace with Google"
                    : "Create my workspace"
                  : "Sign in"}
              <ArrowRight size={17} />
            </button>
          </form>
          <p className="auth-toggle">
            {register ? "Already have a workspace?" : "New to Salon?"}{" "}
            <button
              className="text-button"
              disabled={busy}
              onClick={() => {
                setRegister(!register);
                setGoogleCredential("");
                setError("");
              }}
            >
              {register ? "Sign in" : "Create a workspace"}
            </button>
          </p>
          <div className="demo-box">
            <span className="demo-mark">
              <Check size={17} />
            </span>
            <div>
              <strong>Take a look around</strong>
              <p>A seeded demo with two separate salons.</p>
            </div>
            <button
              className="text-button"
              disabled={busy}
              onClick={() => void signIn(new FormData(), true)}
            >
              Open demo <ArrowRight size={15} />
            </button>
          </div>
          <button
            type="button"
            className="button secondary full auth-tour-button"
            disabled={busy}
            onClick={() => void signIn(new FormData(), true, true)}
          >
            <Compass size={17} /> Take a tour
          </button>
          <p className="auth-note">
            Local starter · Demo data is created by the backend seeder.
          </p>
        </div>
      </section>
    </main>
  );
}
