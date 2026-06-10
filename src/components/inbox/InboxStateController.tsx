"use client";

import { InboxScreen, type Conversation } from "@/components/inbox/InboxScreen";
import type { CustomerProfile } from "@/components/inbox/CustomerPanel";
import type { ChatMessage } from "@/components/shared/chat/MessageBubble";
import { useRealtimeInbox } from "@/lib/realtimeInbox";
import { useHydrated } from "@/lib/useHydrated";
import { usePrototypeStore } from "@/store/prototypeStore";
import raw from "@/data/conversations.json";
import customersRaw from "@/data/customers.json";

// Chọn nguồn dữ liệu Inbox theo trạng thái nguyên mẫu (dùng chung prototypeStore với Dashboard).
// Công cụ chuyển trạng thái nằm ở SideNav (PrototypeSwitcher); lệnh "chạy lại" realtime đọc
// qua restartNonce. Khuôn theo DashboardStateController.

const STATIC: Conversation[] = (raw.conversations as Conversation[]).map((c) => ({
  ...c,
  messages: c.messages.map((m) => ({ ...m, role: m.role as ChatMessage["role"] })),
}));

const PROFILES = customersRaw.customers as Record<string, CustomerProfile>;

export function InboxStateController({ initialId }: { initialId?: string }) {
  const storeMode = usePrototypeStore((s) => s.mode);
  const restartNonce = usePrototypeStore((s) => s.restartNonce);
  const hydrated = useHydrated();

  // SSR + lần render đầu dùng "static" để khớp markup server; sau hydrate mới theo store (persist).
  const mode = hydrated ? storeMode : "static";

  const realtime = useRealtimeInbox(mode === "realtime", restartNonce);
  const conversations =
    mode === "empty" ? [] : mode === "realtime" ? realtime.conversations : STATIC;

  return (
    <InboxScreen
      // Remount khi đổi static/empty/realtime → reseed sạch state làm việc nội bộ.
      key={mode === "realtime" ? "rt" : mode}
      initialId={initialId}
      conversations={conversations}
      profiles={PROFILES}
      live={mode === "realtime"}
    />
  );
}
