import React from "react";

export default function PlatformRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="platform-route-container">{children}</div>;
}
