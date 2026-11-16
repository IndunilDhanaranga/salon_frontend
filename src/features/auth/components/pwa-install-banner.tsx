"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Download,
  Smartphone,
  Monitor,
  PlusSquare,
  X,
  ChevronRight,
  CheckCircle,
  ArrowUpFromLine,
  Laptop,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Platform Detection                                                 */
/* ------------------------------------------------------------------ */

type Platform = "ios" | "android" | "windows" | "mac" | "linux" | "unknown";
type ExpandedSection = "ios" | "android" | "windows" | null;

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  const platform =
    (
      navigator as unknown as {
        userAgentData?: { platform?: string };
        platform?: string;
      }
    ).platform || "";

  const isIOS =
    /iPhone|iPad|iPod/i.test(ua) ||
    (platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (isIOS) return "ios";

  if (/Android/i.test(ua)) return "android";

  if (/Mac/i.test(platform) || /Macintosh/i.test(ua)) return "mac";

  if (/Linux/i.test(ua)) return "linux";

  // Default to windows for Win + everything else on desktop
  return "windows";
}

function detectBrowser(): "chrome" | "edge" | "firefox" | "safari" | "other" {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/Edg/i.test(ua)) return "edge";
  if (/Firefox/i.test(ua)) return "firefox";
  if (/Safari/i.test(ua) && !/Chrome|CriOS/i.test(ua)) return "safari";
  if (/Chrome|CriOS/i.test(ua)) return "chrome";
  return "other";
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone ===
      true
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function PwaInstallBanner() {
  const [platform, setPlatform] = useState<Platform>("unknown");
  const [browser, setBrowser] = useState<ReturnType<typeof detectBrowser>>("other");
  const [isPwa, setIsPwa] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState<ExpandedSection>(null);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
    setBrowser(detectBrowser());
    setIsPwa(isStandalone());

    // Check if user previously dismissed
    try {
      if (localStorage.getItem("salon_pwa_dismissed") === "1") {
        setDismissed(true);
      }
    } catch {
      /* empty */
    }

    // Chrome / Edge install prompt (works on Android, Windows, Mac, Linux)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const installedHandler = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleNativeInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem("salon_pwa_dismissed", "1");
    } catch {
      /* empty */
    }
  }, []);

  const toggleSection = useCallback(
    (section: ExpandedSection) => {
      setExpanded((prev) => (prev === section ? null : section));
    },
    [],
  );

  // Don't show if already installed as PWA, dismissed, or can't detect
  if (isPwa || dismissed || installed) return null;

  const isDesktop =
    platform === "windows" || platform === "mac" || platform === "linux";

  // Decide which browser name to show in Windows/Mac steps
  const desktopBrowserLabel =
    browser === "edge"
      ? "Microsoft Edge"
      : browser === "chrome"
        ? "Google Chrome"
        : "Google Chrome or Microsoft Edge";

  return (
    <div className="pwa-install-banner">
      {/* Header */}
      <div className="pwa-banner-header">
        <div className="pwa-banner-icon-wrap">
          <Download size={16} />
        </div>
        <div className="pwa-banner-title">
          <strong>Install Salon App</strong>
          <span>Get push notifications &amp; fast access</span>
        </div>
        <button
          type="button"
          className="pwa-dismiss-btn"
          onClick={handleDismiss}
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>

      {/* Platform Buttons */}
      <div className="pwa-platform-buttons">
        {/* -------- iPhone / iOS -------- */}
        <button
          type="button"
          className={`pwa-platform-btn ios ${expanded === "ios" ? "active" : ""} ${platform === "ios" ? "current" : ""}`}
          onClick={() => toggleSection("ios")}
        >
          <Smartphone size={16} />
          <span>iPhone / iPad</span>
          {platform === "ios" && (
            <span className="pwa-current-badge">Your device</span>
          )}
          <ChevronRight
            size={14}
            className={`pwa-chevron ${expanded === "ios" ? "rotated" : ""}`}
          />
        </button>

        {expanded === "ios" && (
          <div className="pwa-install-steps">
            <div className="pwa-step">
              <div className="pwa-step-number">1</div>
              <div className="pwa-step-content">
                <strong>Open in Safari</strong>
                <p>
                  This app must be opened in{" "}
                  <strong>Safari browser</strong> (not Chrome or Firefox).
                </p>
              </div>
            </div>
            <div className="pwa-step">
              <div className="pwa-step-number">2</div>
              <div className="pwa-step-content">
                <strong>
                  Tap the Share button{" "}
                  <ArrowUpFromLine
                    size={14}
                    style={{ verticalAlign: "middle" }}
                  />
                </strong>
                <p>
                  Find the Share icon at the bottom of Safari (square with
                  arrow pointing up).
                </p>
              </div>
            </div>
            <div className="pwa-step">
              <div className="pwa-step-number">3</div>
              <div className="pwa-step-content">
                <strong>
                  Tap &quot;Add to Home Screen&quot;{" "}
                  <PlusSquare
                    size={14}
                    style={{ verticalAlign: "middle" }}
                  />
                </strong>
                <p>Scroll down in the share menu and tap this option.</p>
              </div>
            </div>
            <div className="pwa-step">
              <div className="pwa-step-number">4</div>
              <div className="pwa-step-content">
                <strong>Tap &quot;Add&quot;</strong>
                <p>
                  Confirm the name and tap <strong>Add</strong> in the top
                  right corner.
                </p>
              </div>
            </div>
            <div className="pwa-step-note">
              <CheckCircle size={13} />
              <span>
                After installing, open from your Home Screen to receive push
                notifications — just like WhatsApp or Facebook.
              </span>
            </div>
          </div>
        )}

        {/* -------- Android -------- */}
        <button
          type="button"
          className={`pwa-platform-btn android ${expanded === "android" ? "active" : ""} ${platform === "android" ? "current" : ""}`}
          onClick={() => {
            if (deferredPrompt && platform === "android") {
              void handleNativeInstall();
            } else {
              toggleSection("android");
            }
          }}
        >
          <Smartphone size={16} />
          <span>Android</span>
          {platform === "android" && (
            <span className="pwa-current-badge">Your device</span>
          )}
          {deferredPrompt && platform === "android" ? (
            <span className="pwa-install-now-badge">Install Now</span>
          ) : (
            <ChevronRight
              size={14}
              className={`pwa-chevron ${expanded === "android" ? "rotated" : ""}`}
            />
          )}
        </button>

        {expanded === "android" && (
          <div className="pwa-install-steps">
            {deferredPrompt ? (
              <div className="pwa-android-auto">
                <button
                  type="button"
                  className="button primary full pwa-auto-install-btn"
                  onClick={() => void handleNativeInstall()}
                >
                  <Download size={16} />
                  Install Salon App
                </button>
                <p className="pwa-step-note-text">
                  Tap the button above. A browser prompt will appear — tap{" "}
                  <strong>Install</strong>.
                </p>
              </div>
            ) : (
              <>
                <div className="pwa-step">
                  <div className="pwa-step-number">1</div>
                  <div className="pwa-step-content">
                    <strong>Open in Chrome</strong>
                    <p>Use Google Chrome browser for best experience.</p>
                  </div>
                </div>
                <div className="pwa-step">
                  <div className="pwa-step-number">2</div>
                  <div className="pwa-step-content">
                    <strong>Tap the menu ⋮</strong>
                    <p>
                      Tap the three dots in the top-right corner of Chrome.
                    </p>
                  </div>
                </div>
                <div className="pwa-step">
                  <div className="pwa-step-number">3</div>
                  <div className="pwa-step-content">
                    <strong>
                      Tap &quot;Add to Home screen&quot; or &quot;Install
                      app&quot;
                    </strong>
                    <p>
                      Select this option from the menu, then tap{" "}
                      <strong>Install</strong>.
                    </p>
                  </div>
                </div>
                <div className="pwa-step-note">
                  <CheckCircle size={13} />
                  <span>
                    The app will appear on your Home Screen. Push notifications
                    work automatically — no Play Store needed.
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {/* -------- Windows / Mac / Desktop -------- */}
        <button
          type="button"
          className={`pwa-platform-btn windows ${expanded === "windows" ? "active" : ""} ${isDesktop ? "current" : ""}`}
          onClick={() => {
            if (deferredPrompt && isDesktop) {
              void handleNativeInstall();
            } else {
              toggleSection("windows");
            }
          }}
        >
          {platform === "mac" ? (
            <Laptop size={16} />
          ) : (
            <Monitor size={16} />
          )}
          <span>
            {platform === "mac"
              ? "Mac"
              : platform === "linux"
                ? "Linux"
                : "Windows PC"}
          </span>
          {isDesktop && (
            <span className="pwa-current-badge">Your device</span>
          )}
          {deferredPrompt && isDesktop ? (
            <span className="pwa-install-now-badge">Install Now</span>
          ) : (
            <ChevronRight
              size={14}
              className={`pwa-chevron ${expanded === "windows" ? "rotated" : ""}`}
            />
          )}
        </button>

        {expanded === "windows" && (
          <div className="pwa-install-steps">
            {deferredPrompt ? (
              <div className="pwa-android-auto">
                <button
                  type="button"
                  className="button primary full pwa-auto-install-btn"
                  onClick={() => void handleNativeInstall()}
                >
                  <Download size={16} />
                  Install Salon App on{" "}
                  {platform === "mac"
                    ? "Mac"
                    : platform === "linux"
                      ? "Linux"
                      : "Windows"}
                </button>
                <p className="pwa-step-note-text">
                  Click the button above. Your browser will prompt you — click{" "}
                  <strong>Install</strong>.
                </p>
              </div>
            ) : (
              <>
                <div className="pwa-step">
                  <div className="pwa-step-number">1</div>
                  <div className="pwa-step-content">
                    <strong>{platform === "windows" ? "Open this page in Chrome or Edge" : `Open in ${desktopBrowserLabel}`}</strong>
                    <p>
                      {platform === "windows"
                        ? "Google Chrome and Microsoft Edge can install this app on Windows."
                        : <>Use <strong>{desktopBrowserLabel}</strong> for the best install experience.</>}
                    </p>
                  </div>
                </div>
                <div className="pwa-step">
                  <div className="pwa-step-number">2</div>
                  <div className="pwa-step-content">
                    <strong>Look for the install icon in the address bar</strong>
                    <p>
                      {browser === "edge" ? (
                        <>
                          In Edge, click the <strong>App available</strong>{" "}
                          icon (⊕) at the right side of the address bar.
                        </>
                      ) : browser === "chrome" ? (
                        <>
                          In Chrome, click the <strong>Install</strong> icon (⊕)
                          at the right side of the address bar. Or click{" "}
                          <strong>⋮ → Save and share → Install Salon Platform</strong>.
                        </>
                      ) : (
                        <>
                          Look for an install icon (⊕) in the address bar, or open
                          the browser menu (⋮ or ⋯) and select{" "}
                          <strong>&quot;Install Salon Platform&quot;</strong>.
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <div className="pwa-step">
                  <div className="pwa-step-number">3</div>
                  <div className="pwa-step-content">
                    <strong>Confirm the app installation</strong>
                    <p>
                      Confirm the installation in the popup dialog.
                    </p>
                  </div>
                </div>
                <div className="pwa-step-note">
                  <CheckCircle size={13} />
                  <span>
                    {platform === "windows" ? (
                      <>
                        The app will be added to your <strong>Start Menu</strong>,{" "}
                        <strong>Desktop</strong>, and <strong>Taskbar</strong>.
                        Push notifications will work even when the browser is closed
                        — just like a native Windows program.
                      </>
                    ) : platform === "mac" ? (
                      <>
                        The app will appear in your <strong>Dock</strong> and{" "}
                        <strong>Launchpad</strong>. Push notifications will
                        work through macOS notification center.
                      </>
                    ) : (
                      <>
                        The app will be installed as a standalone application.
                        Push notifications will work even when the browser is
                        closed.
                      </>
                    )}
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TypeScript: BeforeInstallPromptEvent (not in lib.dom)               */
/* ------------------------------------------------------------------ */

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
