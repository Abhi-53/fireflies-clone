"use client";

import React, { useState } from "react";
import { ArrowRight, X } from "lucide-react";

export function PromoBanner() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="promo-banner" role="banner">
      <div className="promo-banner__content">
        <span>You are eligible for 7 days business plan free trial.</span>
        <a href="#trial" className="promo-banner__link" onClick={(e) => e.preventDefault()}>
          Start free trial <ArrowRight size={14} />
        </a>
      </div>
      <button
        type="button"
        className="promo-banner__close"
        aria-label="Dismiss banner"
        onClick={() => setVisible(false)}
      >
        <X size={15} />
      </button>
    </div>
  );
}
