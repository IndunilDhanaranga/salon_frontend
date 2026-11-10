"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Landmark,
  ReceiptText,
  UploadCloud,
  FileImage,
  X,
  Eye,
  Building,
  CreditCard,
  Info,
} from "lucide-react";
import { api } from "@/lib/api";
import { money, message } from "@/lib/format";
import type {
  PlatformPaymentSettings,
  Subscription,
  Tenant,
} from "@/lib/types";
import { useTranslation } from "@/lib/i18n";

export function SubscriptionRenewalForm({
  tenant,
  subscription,
  onSubmitted,
}: {
  tenant: Tenant;
  subscription: Subscription;
  onSubmitted?: () => void;
}) {
  const { language } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultBankDetails: PlatformPaymentSettings = {
    bank_name: "Commercial Bank of Ceylon / BOC",
    account_name: "Salon Platform (Pvt) Ltd",
    account_number: "1000-8472-9102-001",
    branch_name: "Colombo City Centre / Digital Banking",
  };

  const [amount, setAmount] = useState(
    String(
      Math.max(
        1,
        Math.round(
          (subscription.total_price_minor || subscription.price_minor || 0) /
            100,
        ),
      ),
    ),
  );
  const [paymentSettings, setPaymentSettings] =
    useState<PlatformPaymentSettings>(defaultBankDetails);
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipDataUrl, setSlipDataUrl] = useState<string>("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    void api<PlatformPaymentSettings>("admin/payment-settings")
      .then((settings) => {
        if (active && settings) {
          setPaymentSettings({
            ...defaultBankDetails,
            ...settings,
          });
        }
      })
      .catch(() => {
        // Fallback to the default static configuration when the admin settings
        // endpoint is unavailable.
      });

    return () => {
      active = false;
    };
  }, []);

  // Handle file selection (Slip image or PDF)
  function handleFile(file: File) {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setError(
        language === "si"
          ? "ගොනු ප්‍රමාණය 8MB ට වඩා අඩු විය යුතුය."
          : "Slip file size must be under 8MB.",
      );
      return;
    }

    setSlipFile(file);
    setError("");

    // Read as Data URL for preview and persistent submission
    const reader = new FileReader();
    reader.onload = (e) => {
      setSlipDataUrl((e.target?.result as string) || "");
    };
    reader.readAsDataURL(file);
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }

  function removeSlip() {
    setSlipFile(null);
    setSlipDataUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const amountMinor = Math.round(Number(amount || 0) * 100);
      if (!Number.isFinite(amountMinor) || amountMinor <= 0) {
        throw new Error(
          language === "si"
            ? "වලංගු මුදලක් ඇතුළත් කරන්න."
            : "Enter a valid renewal amount.",
        );
      }
      if (!reference.trim()) {
        throw new Error(
          language === "si"
            ? "ගෙවීම් රිසිට්පත් අංකය හෝ විමර්ශන කේතය ඇතුළත් කරන්න."
            : "Payment reference or transaction number is required.",
        );
      }

      // Structure notes to include slip attachment fallback if needed
      const compositeNotes = slipDataUrl
        ? notes.trim()
          ? `${notes.trim()}\n\n[SLIP_ATTACHMENT]: ${slipDataUrl}`
          : `[SLIP_ATTACHMENT]: ${slipDataUrl}`
        : notes.trim();

      await api("subscription/renewal", {
        tenant: tenant.slug,
        method: "POST",
        body: {
          payment_method: "bank_transfer",
          amount_minor: amountMinor,
          reference: reference.trim(),
          notes: compositeNotes,
          proof_url: slipDataUrl || undefined,
          type: subscription.status === "active" ? "early" : "late",
        },
      });

      // Send real-time platform admin notification
      const formattedAmount = money(amountMinor, subscription.currency);

      void fetch("/api/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `New Renewal Payment Slip: ${tenant.name}`,
          message: `${tenant.name} submitted a payment slip for ${formattedAmount} (${subscription.plan_name}). Ref: ${reference.trim()}.`,
          priority: "urgent",
          category: "renewal_submitted",
          targetAudience: "platform_admin",
          targetView: "subscriptions",
          sentBy: tenant.name,
        }),
      }).catch(() => {
        // Broadcast silent catch
      });

      // Also dispatch to local BroadcastChannel for open platform tabs
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        try {
          const ch = new BroadcastChannel("salon_platform_push");
          ch.postMessage({
            title: `New Payment Slip Submitted: ${tenant.name}`,
            message: `${tenant.name} uploaded a payment slip for ${formattedAmount}. Reference: ${reference.trim()}.`,
            sentBy: tenant.name,
            sentAt: new Date().toISOString(),
            priority: "urgent",
          });
          ch.close();
        } catch {
          // Channel fallback
        }
      }

      setSuccess(
        language === "si"
          ? "ඔබගේ ගෙවීම් පත්‍රිකාව සහ ඉල්ලීම පරිපාලක සමාලෝචනය සඳහා සාර්ථකව යවන ලදී. පරිපාලක අනුමැතියෙන් පසු පැකේජය ස්වයංක්‍රීයව අලුත් වේ."
          : "Your payment slip has been submitted successfully. Platform admin has received the notification. Once approved, your subscription will be auto-renewed immediately.",
      );

      setReference("");
      setNotes("");
      removeSlip();
      onSubmitted?.();
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel renewal-submission-panel">
      <div className="section-heading">
        <div>
          <h2>
            {language === "si"
              ? "දායකත්වය නැවත අලුත් කිරීම සහ ගෙවීම් පත්‍රිකාව ඉදිරිපත් කිරීම"
              : "Renew Subscription & Submit Payment Slip"}
          </h2>
          <p>
            {language === "si"
              ? "බැංකු තැන්පතු පත්‍රිකාව හෝ ඔන්ලයින් ගෙවීම් screenshot එක මෙහිදී ඉදිරිපත් කරන්න. පද්ධති පරිපාලක විසින් එය පරීක්ෂා කර අනුමත කළ වහාම ඔබගේ පැකේජය ස්වයංක්‍රීයව සක්‍රිය වේ."
              : "Upload your bank deposit slip or online transfer receipt. The platform administrator will verify it and auto-renew your package to restore full access."}
          </p>
        </div>
      </div>

      {/* Official Bank Account Details Box */}
      <div className="bank-account-card">
        <div className="bank-account-header">
          <Building size={18} />
          <strong>
            {language === "si"
              ? "ගෙවීම් කළ යුතු නිල බැංකු ගිණුම් විස්තර"
              : "Official Platform Bank Account Details"}
          </strong>
        </div>
        <div className="bank-account-grid">
          <div>
            <span className="cell-sub">
              {language === "si" ? "බැංකුව" : "Bank"}
            </span>
            <strong>{paymentSettings.bank_name || defaultBankDetails.bank_name}</strong>
          </div>
          <div>
            <span className="cell-sub">
              {language === "si" ? "ගිණුම් නම" : "Account Name"}
            </span>
            <strong>{paymentSettings.account_name || defaultBankDetails.account_name}</strong>
          </div>
          <div>
            <span className="cell-sub">
              {language === "si" ? "ගිණුම් අංකය" : "Account Number"}
            </span>
            <strong className="account-number-mono">
              {paymentSettings.account_number || defaultBankDetails.account_number}
            </strong>
          </div>
          <div>
            <span className="cell-sub">
              {language === "si" ? "ශාඛාව" : "Branch"}
            </span>
            <strong>{paymentSettings.branch_name || defaultBankDetails.branch_name}</strong>
          </div>
        </div>
        <div className="bank-account-footer">
          <Info size={14} />
          <span>
            {language === "si"
              ? `* කරුණාකර transfer reference හෝ slip remark ලෙස ඔබගේ සැලුන් කේතය ("${tenant.slug}") යොදන්න.`
              : `* Please include your salon slug ("${tenant.slug}") in the transfer remarks or deposit slip.`}
          </span>
        </div>
      </div>

      <form className="admin-form-stack" onSubmit={submit}>
        {error && (
          <div className="error-box" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="success-box" role="status">
            <CheckCircle2 size={16} />
            <span>{success}</span>
          </div>
        )}

        <div className="form-grid">
          <label>
            {language === "si" ? "ගෙවූ මුදල" : "Renewal Amount"} (
            {subscription.currency})
            <input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </label>

          <label>
            {language === "si"
              ? "ගෙවීම් විමර්ශන අංකය (Slip / Ref No)"
              : "Payment Slip Reference / Transaction ID *"}
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. TXN-9283019 or Slip #40192"
              required
            />
          </label>
        </div>

        {/* Payment Slip Upload Area */}
        <div className="form-field">
          <label>
            {language === "si"
              ? "ගෙවීම් පත්‍රිකාවේ ඡායාරූපය / PDF ගොනුව (Slip Upload)"
              : "Upload Payment Slip / Transfer Screenshot"}
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            style={{ display: "none" }}
            onChange={handleFileInputChange}
          />

          {!slipFile ? (
            <div
              className={`slip-dropzone ${dragActive ? "is-dragover" : ""}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud size={32} />
              <p>
                <strong>
                  {language === "si"
                    ? "ගෙවීම් පත්‍රිකාව (Slip) මෙතැනට Drag & Drop කරන්න හෝ ක්ලික් කරන්න"
                    : "Click to browse or drag & drop payment slip here"}
                </strong>
              </p>
              <span className="file-format-hint">
                JPG, PNG, WEBP, or PDF (Max 8MB)
              </span>
            </div>
          ) : (
            <div className="slip-attached-card">
              <div className="slip-file-info">
                {slipDataUrl.startsWith("data:image") ? (
                  <div
                    className="slip-thumb"
                    onClick={() => setPreviewOpen(true)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={slipDataUrl} alt="Payment Slip Preview" />
                  </div>
                ) : (
                  <div className="slip-thumb-icon">
                    <FileImage size={24} />
                  </div>
                )}
                <div className="slip-meta">
                  <strong className="slip-filename">{slipFile.name}</strong>
                  <span className="cell-sub">
                    {(slipFile.size / 1024).toFixed(1)} KB · Ready to submit
                  </span>
                </div>
              </div>

              <div className="slip-actions">
                {slipDataUrl.startsWith("data:image") && (
                  <button
                    type="button"
                    className="button secondary small-button"
                    onClick={() => setPreviewOpen(true)}
                  >
                    <Eye size={14} />
                    <span>{language === "si" ? "විශාල කරන්න" : "Preview"}</span>
                  </button>
                )}
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Remove slip"
                  onClick={removeSlip}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        <label>
          {language === "si"
            ? "අමතර සටහන් (විකල්ප)"
            : "Optional Note for Platform Admin"}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              language === "si"
                ? "පරිපාලක සඳහා අමතර සටහනක් ඇත්නම් මෙහි ලියන්න..."
                : "Additional deposit details, bank branch name, or timing note..."
            }
            rows={3}
          />
        </label>

        {/* Plan Summary Card */}
        <div className="subscription-status-card">
          <div className="status-grid">
            <div>
              <span className="cell-sub">Package</span>
              <strong>{subscription.plan_name || "Salon Plan"}</strong>
            </div>
            <div>
              <span className="cell-sub">Billing Interval</span>
              <strong>
                {subscription.billing_interval === "year"
                  ? "Yearly (12 Months)"
                  : "Monthly (30 Days)"}
              </strong>
            </div>
            <div>
              <span className="cell-sub">Access After Approval</span>
              <strong className="text-success">+1 Period Access Restored</strong>
            </div>
          </div>
        </div>

        <div className="dialog-actions">
          <span className="pos-checkout-total">
            <ReceiptText size={14} /> Payment slip verification
          </span>
          <button
            type="submit"
            className="button primary"
            disabled={busy || !reference.trim()}
          >
            {busy
              ? language === "si"
                ? "යවමින් පවතී…"
                : "Submitting Slip…"
              : language === "si"
                ? "ගෙවීම් පත්‍රිකාව යොමු කරන්න"
                : "Send Payment Slip For Review"}
          </button>
        </div>
      </form>

      {/* Slip Modal Preview */}
      {previewOpen && slipDataUrl && (
        <div
          className="admin-dialog-backdrop"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="slip-preview-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="slip-modal-header">
              <h3>Payment Slip Preview</h3>
              <button
                type="button"
                className="icon-button"
                onClick={() => setPreviewOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="slip-modal-body">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={slipDataUrl} alt="Attached payment slip" />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
