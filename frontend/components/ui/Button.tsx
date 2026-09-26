"use client";

import React from "react";
import { cx } from "@/lib/format";

type Variant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "icon"
  | "destructive"
  | "destructive-ghost";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
}

export function Button({ variant = "primary", size = "md", className, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cx("mf-btn", `mf-btn--${variant}`, size !== "md" && `mf-btn--${size}`, className)}
      {...props}
    />
  );
}
