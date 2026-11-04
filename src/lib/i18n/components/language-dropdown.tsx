"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Globe, Check } from "lucide-react";
import { useTranslation } from "../i18n-context";
import { languageNames, type Language } from "../index";

export function LanguageDropdown({ className }: { className?: string }) {
  const { language, setLanguage } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const current = languageNames[language] ?? languageNames.en;

  const handleSelect = (lang: Language) => {
    setLanguage(lang);
    setOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`language-dropdown-wrapper ${className ?? ""}`}
      style={{ position: "relative", display: "inline-block" }}
    >
      <button
        type="button"
        className="language-selector-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select display language"
        onClick={() => setOpen(!open)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 10px",
          borderRadius: 20,
          border: "1px solid var(--line)",
          background: "var(--surface)",
          color: "var(--ink)",
          fontSize: "11px",
          fontWeight: 500,
          cursor: "pointer",
          transition: "all 0.15s ease",
          outline: "none",
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ fontSize: "13px" }}>{current.flag}</span>
        <span>{current.nativeName}</span>
        <ChevronDown
          size={12}
          strokeWidth={2}
          style={{
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.15s ease",
            opacity: 0.7,
          }}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Languages"
          className="language-dropdown-menu"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            zIndex: 100,
            minWidth: 150,
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: 8,
            boxShadow: "var(--menu-shadow)",
            padding: "4px 0",
            overflow: "hidden",
            animation: "fadeIn 0.15s ease",
          }}
        >
          {(Object.keys(languageNames) as Language[]).map((key) => {
            const item = languageNames[key];
            const isSelected = language === key;
            return (
              <button
                key={key}
                type="button"
                role="option"
                aria-selected={isSelected}
                className="language-option-item"
                onClick={() => handleSelect(key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "7px 12px",
                  border: "none",
                  background: isSelected ? "var(--mint)" : "transparent",
                  color: isSelected ? "var(--teal)" : "var(--ink)",
                  fontWeight: isSelected ? 600 : 400,
                  fontSize: "11px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.12s ease",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: "14px" }}>{item.flag}</span>
                  <span>{item.nativeName}</span>
                </span>
                {isSelected && <Check size={13} strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
