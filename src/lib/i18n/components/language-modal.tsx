"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Globe, Sparkles } from "lucide-react";
import { useTranslation } from "../i18n-context";
import type { Language } from "../types";

export function LanguagePreferenceModal() {
  const { language, needsLanguageSelection, completeLanguageSelection } =
    useTranslation();
  const [selected, setSelected] = useState<Language>(language);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialog.current;
    if (needsLanguageSelection) node?.showModal();
    return () => node?.close();
  }, [needsLanguageSelection]);

  if (!needsLanguageSelection) return null;

  return (
    <dialog
      ref={dialog}
      className="language-dialog"
      aria-labelledby="lang-modal-title"
      onCancel={(event) => {
        event.preventDefault();
        completeLanguageSelection(selected);
      }}
    >
      <div className="language-modal-card">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: "16px",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "var(--mint)",
              color: "var(--teal)",
              flexShrink: 0,
            }}
          >
            <Globe size={22} strokeWidth={1.8} />
          </span>
          <div>
            <span
              className="eyebrow"
              style={{
                letterSpacing: "0.08em",
                fontSize: "10px",
                marginBottom: 2,
                display: "block",
              }}
            >
              LANGUAGE PREFERENCE / භාෂා තේරීම
            </span>
            <h2
              id="lang-modal-title"
              style={{
                fontSize: "1.25rem",
                fontWeight: 600,
                color: "var(--ink)",
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              Which language do you prefer?
            </h2>
          </div>
        </div>

        <p
          className="muted"
          style={{
            fontSize: "0.88rem",
            marginBottom: "1.25rem",
            lineHeight: 1.5,
          }}
        >
          Select your preferred display language for the workspace. You can
          change this anytime from the top navigation bar.
          <br />
          <span
            style={{
              fontSize: "0.82rem",
              color: "var(--muted)",
              marginTop: "4px",
              display: "inline-block",
            }}
          >
            ඔබ කැමති භාෂාව තෝරාගන්න. මෙය ඉහළ මෙනුවෙන් (Navbar) ඕනෑම වේලාවක වෙනස්
            කළ හැක.
          </span>
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            marginBottom: "24px",
          }}
        >
          <button
            type="button"
            className={`language-card-btn ${selected === "en" ? "active" : ""}`}
            onClick={() => setSelected("en")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px",
              borderRadius: "10px",
              border:
                selected === "en"
                  ? "2px solid var(--teal)"
                  : "1px solid var(--line)",
              background: selected === "en" ? "var(--mint)" : "var(--surface)",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.15s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: "1.5rem" }}>🇬🇧</span>
              <div>
                <strong
                  style={{
                    display: "block",
                    fontSize: "0.95rem",
                    color: "var(--ink)",
                    fontWeight: 600,
                  }}
                >
                  English
                </strong>
                <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                  Default workspace language
                </span>
              </div>
            </div>
            {selected === "en" && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "var(--teal)",
                  color: "#fff",
                }}
              >
                <Check size={15} strokeWidth={2.5} />
              </span>
            )}
          </button>

          <button
            type="button"
            className={`language-card-btn ${selected === "si" ? "active" : ""}`}
            onClick={() => setSelected("si")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px",
              borderRadius: "10px",
              border:
                selected === "si"
                  ? "2px solid var(--teal)"
                  : "1px solid var(--line)",
              background: selected === "si" ? "var(--mint)" : "var(--surface)",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.15s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: "1.5rem" }}>🇱🇰</span>
              <div>
                <strong
                  style={{
                    display: "block",
                    fontSize: "0.95rem",
                    color: "var(--ink)",
                    fontWeight: 600,
                  }}
                >
                  සිංහල (Sinhala)
                </strong>
                <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                  සිංහල මාධ්‍යයෙන් පද්ධතිය භාවිතා කරන්න
                </span>
              </div>
            </div>
            {selected === "si" && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "var(--teal)",
                  color: "#fff",
                }}
              >
                <Check size={15} strokeWidth={2.5} />
              </span>
            )}
          </button>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
          }}
        >
          <button
            type="button"
            className="button primary"
            style={{
              minWidth: 170,
              padding: "10px 20px",
              fontSize: "0.92rem",
              borderRadius: "8px",
            }}
            onClick={() => completeLanguageSelection(selected)}
          >
            <Sparkles size={16} />
            <span>{selected === "si" ? "ඉදිරියට යන්න" : "Continue"}</span>
          </button>
        </div>
      </div>
    </dialog>
  );
}
