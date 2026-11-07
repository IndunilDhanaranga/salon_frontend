import React from "react";

export default function BusinessRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="business-route-container">{children}</div>;
}
