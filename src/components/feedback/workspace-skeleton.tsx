import React from "react";

export function WorkspaceSkeleton({
  label = "Loading...",
}: {
  label?: string;
}) {
  return (
    <div className="workspace-skeleton" aria-busy="true" aria-label={label}>
      <div />
      <div />
      <div />
      <div />
      <section />
    </div>
  );
}
