"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// Slot banner dưới TopBar (§6.7) — màn đẩy banner vào đây qua portal để nó dán sát mép dưới topbar,
// tràn full-width, trong khi state/handler vẫn thuộc về màn đó. TopBar render phần tử đích #topbar-banner-slot.

export const TOPBAR_BANNER_SLOT_ID = "topbar-banner-slot";

export function TopbarBannerSlot({ children }: { children: React.ReactNode }) {
  const [node, setNode] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setNode(document.getElementById(TOPBAR_BANNER_SLOT_ID));
  }, []);
  return node ? createPortal(children, node) : null;
}
