import type { Metadata } from "next";
import "./globals.css";
import "@/styles/tour.css";
import "@/styles/pos.css";
import "@/styles/subscriptions.css";

export const metadata: Metadata = {
  title: "Salon / Daily workspace",
  description: "Appointments, your team, and payroll in one salon workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
