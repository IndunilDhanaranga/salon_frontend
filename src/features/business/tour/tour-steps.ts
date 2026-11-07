import { canView, type View } from "@/features/business/config/navigation";
import type { Tenant } from "@/lib/types";

export interface TourStep {
  view: View;
  title: string;
  description: string;
  tips: string[];
}

const steps: TourStep[] = [
  {
    view: "overview",
    title: "Your day, at a glance.",
    description:
      "Start here to see today’s appointments, completed services, and your team.",
    tips: [
      "Check the day’s schedule in one place.",
      "Use the business menu to move between sections.",
    ],
  },
  {
    view: "appointments",
    title: "Keep every booking in order.",
    description:
      "The appointment book brings together clients, services, times, and team members.",
    tips: [
      "Booking times follow your salon’s time zone.",
      "Your role determines which booking actions are available.",
    ],
  },
  {
    view: "team",
    title: "Look after your people.",
    description:
      "Keep staff contact details, monthly base pay, and commission rates together.",
    tips: [
      "Active team members can receive appointments.",
      "Staff records and login accounts are managed separately.",
    ],
  },
  {
    view: "catalog",
    title: "Everything you offer, clearly priced.",
    description: "Build your salon’s price list with services and products.",
    tips: [
      "Set each item’s price and availability.",
      "Available items appear in the POS when creating a bill.",
    ],
  },
  {
    view: "billing",
    title: "From a visit to a customer bill.",
    description:
      "Use New bill to open the POS, select items, adjust quantities, and create an itemized bill.",
    tips: [
      "View a bill to open or print its receipt.",
      "Users with billing permission can record payments received.",
    ],
  },
  {
    view: "payroll",
    title: "Prepare for payday.",
    description:
      "Review monthly payroll drafts with base salary and completed-service commissions.",
    tips: [
      "Each draft keeps a snapshot of its calculation.",
      "Review required deductions before paying your team.",
    ],
  },
  {
    view: "access",
    title: "Give everyone the right access.",
    description:
      "Create roles, select permissions, and assign login accounts to your salon.",
    tips: [
      "Menus and actions follow each person’s permissions.",
      "Your owner role is protected from accidental changes.",
    ],
  },
  {
    view: "workspace",
    title: "Make yourself at home.",
    description:
      "Your workspace details show the salon, currency, time zone, and your role.",
    tips: [
      "Switch between salons you have access to.",
      "Replay this tour anytime using Take a tour.",
    ],
  },
];

export function tourStepsFor(tenant: Tenant) {
  return steps.filter((step) => canView(step.view, tenant));
}
