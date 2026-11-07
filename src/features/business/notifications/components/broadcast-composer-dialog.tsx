"use client";

import React, { useState } from "react";
import {
  Megaphone,
  X,
  Send,
  AlertTriangle,
  Sparkles,
  Users,
  Compass,
} from "lucide-react";
import { useNotifications } from "../context/notification-context";
import { useTranslation } from "@/lib/i18n";
import type { InAppNotification, NotificationType } from "../types";

export function BroadcastComposerDialog() {
  const { isComposeOpen, setIsComposeOpen, broadcastMessage } =
    useNotifications();
  const { t } = useTranslation();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState("all");
  const [category, setCategory] = useState<NotificationType>("system");
  const [priority, setPriority] = useState<"normal" | "urgent">("normal");
  const [targetView, setTargetView] = useState<
    InAppNotification["targetView"] | ""
  >("");
  const [submitting, setSubmitting] = useState(false);

  if (!isComposeOpen) return null;

  const handleApplyTemplate = (
    type: "briefing" | "meeting" | "promo" | "rush",
  ) => {
    switch (type) {
      case "briefing":
        setTitle("Morning Team Briefing");
        setMessage(
          "Good morning team! Please review today's booked appointments and client roster. Have a wonderful and productive day!",
        );
        setCategory("system");
        setPriority("normal");
        setTargetView("appointments");
        break;
      case "meeting":
        setTitle("Team Sync Today at 4:30 PM");
        setMessage(
          "Quick 15-minute salon team sync scheduled this afternoon to review upcoming bookings and new package options.",
        );
        setCategory("system");
        setPriority("normal");
        setTargetView("");
        break;
      case "promo":
        setTitle("Special Client Promotion Active");
        setMessage(
          "New promotional discount is now live for haircuts and treatments. Please review pricing and item options in the catalog.",
        );
        setCategory("billing");
        setPriority("normal");
        setTargetView("catalog");
        break;
      case "rush":
        setTitle("High Walk-in Volume Alert");
        setMessage(
          "High customer footfall expected this afternoon. All styling stations and front desk please coordinate readiness.",
        );
        setCategory("system");
        setPriority("urgent");
        setTargetView("appointments");
        break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setSubmitting(true);
    broadcastMessage({
      title: title.trim(),
      message: message.trim(),
      type: category,
      priority,
      audience,
      targetView: targetView
        ? (targetView as InAppNotification["targetView"])
        : undefined,
    });

    setTitle("");
    setMessage("");
    setSubmitting(false);
  };

  return (
    <div
      className="broadcast-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="broadcast-modal-title"
    >
      <div className="broadcast-modal-container">
        {/* Header */}
        <div className="broadcast-modal-header">
          <div className="broadcast-header-title">
            <div className="broadcast-icon-wrap">
              <Megaphone size={18} />
            </div>
            <div>
              <h3 id="broadcast-modal-title">
                {t.notifications.broadcastTitle}
              </h3>
              <p className="broadcast-header-desc">
                {t.notifications.broadcastDesc}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="broadcast-close-btn"
            onClick={() => setIsComposeOpen(false)}
            aria-label={t.common.close}
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Templates */}
        <div className="broadcast-templates-section">
          <span className="templates-label">
            <Sparkles size={13} />
            <span>{t.notifications.quickTemplates}:</span>
          </span>
          <div className="template-chips-wrap">
            <button
              type="button"
              className="template-chip"
              onClick={() => handleApplyTemplate("briefing")}
            >
              {t.notifications.templateBriefing}
            </button>
            <button
              type="button"
              className="template-chip"
              onClick={() => handleApplyTemplate("meeting")}
            >
              {t.notifications.templateMeeting}
            </button>
            <button
              type="button"
              className="template-chip"
              onClick={() => handleApplyTemplate("promo")}
            >
              {t.notifications.templatePromo}
            </button>
            <button
              type="button"
              className="template-chip urgent-chip"
              onClick={() => handleApplyTemplate("rush")}
            >
              <AlertTriangle size={12} />
              {t.notifications.templateRush}
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="broadcast-modal-form">
          {/* Title */}
          <div className="broadcast-form-field">
            <label htmlFor="notice-title">
              {t.notifications.noticeTitle} *
            </label>
            <input
              id="notice-title"
              type="text"
              required
              className="broadcast-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.notifications.noticeTitlePlaceholder}
              autoFocus
            />
          </div>

          {/* Row: Target Audience & Priority */}
          <div className="broadcast-form-row">
            <div className="broadcast-form-field half">
              <label htmlFor="notice-audience">
                <Users size={13} />
                <span>{t.notifications.targetAudience}</span>
              </label>
              <select
                id="notice-audience"
                className="broadcast-select"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              >
                <option value="all">{t.notifications.allUsers}</option>
                <option value="stylists">{t.notifications.stylists}</option>
                <option value="cashiers">{t.notifications.cashiers}</option>
                <option value="managers">{t.notifications.management}</option>
              </select>
            </div>

            <div className="broadcast-form-field half">
              <label htmlFor="notice-priority">
                {t.notifications.priority}
              </label>
              <div className="priority-toggle-group">
                <button
                  type="button"
                  className={`priority-toggle-btn ${priority === "normal" ? "active" : ""}`}
                  onClick={() => setPriority("normal")}
                >
                  {t.notifications.priorityNormal}
                </button>
                <button
                  type="button"
                  className={`priority-toggle-btn urgent ${priority === "urgent" ? "active" : ""}`}
                  onClick={() => setPriority("urgent")}
                >
                  <span className="urgent-dot" />
                  {t.notifications.priorityUrgent}
                </button>
              </div>
            </div>
          </div>

          {/* Row: Category & Direct Shortcut */}
          <div className="broadcast-form-row">
            <div className="broadcast-form-field half">
              <label htmlFor="notice-category">
                {t.notifications.category}
              </label>
              <select
                id="notice-category"
                className="broadcast-select"
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as NotificationType)
                }
              >
                <option value="system">
                  {t.notifications.categoryAnnouncement}
                </option>
                <option value="appointment">
                  {t.notifications.categoryAppointment}
                </option>
                <option value="billing">
                  {t.notifications.categoryBilling}
                </option>
              </select>
            </div>

            <div className="broadcast-form-field half">
              <label htmlFor="notice-shortcut">
                <Compass size={13} />
                <span>{t.notifications.actionShortcut}</span>
              </label>
              <select
                id="notice-shortcut"
                className="broadcast-select"
                value={targetView}
                onChange={(e) =>
                  setTargetView(
                    e.target.value as InAppNotification["targetView"],
                  )
                }
              >
                <option value="">{t.notifications.noShortcut}</option>
                <option value="appointments">{t.nav.appointments}</option>
                <option value="billing">{t.nav.billing}</option>
                <option value="catalog">{t.nav.catalog}</option>
                <option value="team">{t.nav.team}</option>
                <option value="payroll">{t.nav.payroll}</option>
              </select>
            </div>
          </div>

          {/* Message Content */}
          <div className="broadcast-form-field">
            <label htmlFor="notice-message">
              {t.notifications.noticeMessage} *
            </label>
            <textarea
              id="notice-message"
              required
              rows={4}
              className="broadcast-textarea"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t.notifications.noticeMessagePlaceholder}
            />
          </div>

          {/* Footer Actions */}
          <div className="broadcast-modal-footer">
            <button
              type="button"
              className="button secondary"
              onClick={() => setIsComposeOpen(false)}
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim() || !message.trim()}
              className="button primary broadcast-send-btn"
            >
              <Send size={15} />
              <span>
                {submitting
                  ? t.notifications.sending
                  : t.notifications.sendButton}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
