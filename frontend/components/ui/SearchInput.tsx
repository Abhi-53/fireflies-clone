"use client";

import React from "react";
import { Search } from "lucide-react";
import { cx } from "@/lib/format";

export function SearchInput({
  value,
  onChange,
  placeholder,
  shortcut,
  compact,
  onFocus,
  autoFocus,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  shortcut?: string;
  compact?: boolean;
  onFocus?: () => void;
  autoFocus?: boolean;
  className?: string;
}) {
  return (
    <div className={cx("mf-search", className)}>
      <span className="mf-search__icon">
        <Search size={16} />
      </span>
      <input
        className={cx("mf-input", "mf-search__input", compact && "mf-input--compact")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={onFocus}
        autoFocus={autoFocus}
      />
      {shortcut ? <span className="mf-search__kbd">{shortcut}</span> : null}
    </div>
  );
}
