import type { Metadata, Viewport } from "next";
import "./globals.css";
import "@/styles/tour.css";
import "@/styles/pos.css";
import "@/styles/subscriptions.css";
import "@/styles/salon-theme.css";
import "@/styles/branch-setup.css";

export const metadata: Metadata = {
  title: "Salon / Daily workspace",
  description: "Appointments, your team, and payroll in one salon workspace.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Salon",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#6d28d9",
  width: "device-width",
  initialScale: 1,
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
