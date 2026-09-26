"use client";

import React from "react";
import { FolderInput, Trash2 } from "lucide-react";

export function BulkActionBar({
  count,
  onSelectAll,
  onClear,
  onMove,
  onDelete,
}: {
  count: number;
  onSelectAll: () => void;
  onClear: () => void;
  onMove?: () => void;
  onDelete: () => void;
}) {
  if (count === 0) return null;
  return (
    <div className="bulk-bar" role="toolbar">
      <strong>{count} meetings selected</strong>
      <button type="button" onClick={onSelectAll}>
        Select all
      </button>
      <button type="button" onClick={onClear}>
        Clear
      </button>
      <button type="button" onClick={onMove}>
        <FolderInput size={14} /> Move to Channel
      </button>
      <button type="button" className="danger" onClick={onDelete}>
        <Trash2 size={14} /> Delete selected
      </button>
    </div>
  );
}
