"use client";

import { useUiStore } from "@/store/uiStore";

// Lớp nền tối phía sau drawer trên mobile — chạm để đóng.
export function MobileScrim() {
  const mobileOpen = useUiStore((s) => s.mobileOpen);
  const setMobileOpen = useUiStore((s) => s.setMobileOpen);

  if (!mobileOpen) return null;

  return (
    <div
      aria-hidden
      onClick={() => setMobileOpen(false)}
      className="fixed inset-0 z-40 bg-black/50 md:hidden"
    />
  );
}
