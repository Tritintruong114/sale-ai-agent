"use client";

import { useSyncExternalStore } from "react";

// Trả false khi render trên server / lần hydrate đầu, true sau khi client mount.
// Dùng để hoãn UI phụ thuộc localStorage (vd zustand persist) tránh lệch hydration —
// không setState trong effect nên không vướng react-hooks/set-state-in-effect.
const subscribe = () => () => {};

export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
