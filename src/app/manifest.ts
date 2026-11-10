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
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#6d28d9",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["business", "productivity"],
  };
}
