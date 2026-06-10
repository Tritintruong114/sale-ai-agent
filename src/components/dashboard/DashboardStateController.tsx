"use client";

import { DashboardScreen, type DashboardData } from "@/components/dashboard/DashboardScreen";
import { useRealtimeDashboard } from "@/lib/realtimeDashboard";
import { useHydrated } from "@/lib/useHydrated";
import { usePrototypeStore } from "@/store/prototypeStore";
import staticData from "@/data/dashboard.json";
import emptyData from "@/data/dashboard.empty.json";

// Chọn nguồn dữ liệu Dashboard theo trạng thái nguyên mẫu.
// Công cụ chuyển trạng thái nay nằm ở SideNav (PrototypeSwitcher); lệnh "chạy lại" realtime
// đọc qua restartNonce trong prototypeStore để điều khiển được từ ngoài Dashboard.
export function DashboardStateController() {
  const storeMode = usePrototypeStore((s) => s.mode);
  const restartNonce = usePrototypeStore((s) => s.restartNonce);
  const hydrated = useHydrated();

  // SSR + lần render đầu dùng "static" để khớp markup server; sau hydrate mới theo store (persist).
  const mode = hydrated ? storeMode : "static";

  const realtime = useRealtimeDashboard(mode === "realtime", restartNonce);
  const data: DashboardData =
    mode === "empty" ? (emptyData as unknown as DashboardData) : mode === "realtime" ? realtime : staticData;

  return <DashboardScreen data={data} live={mode === "realtime"} />;
}
