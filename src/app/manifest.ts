import type { MetadataRoute } from "next";

/**
 * PWA Web App Manifest
 * Required for:
 * - iOS 16.4+ push notifications (must be installed to Home Screen)
 * - Android home screen install prompt
 * - Desktop PWA install in Chrome/Edge
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Salon Platform",
    short_name: "Salon",
    description: "Professional Salon Management Platform",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#6d28d9",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    categories: ["business", "productivity"],
  };
}
