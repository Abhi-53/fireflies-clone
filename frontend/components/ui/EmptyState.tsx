import React from "react";

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mf-empty">
      <h3>{title}</h3>
      <p>{body}</p>
      {action}
    </div>
  );
}

export function Skeleton({ height = 16, width = "100%" }: { height?: number | string; width?: number | string }) {
  return <div className="mf-skel" style={{ height, width }} />;
}
