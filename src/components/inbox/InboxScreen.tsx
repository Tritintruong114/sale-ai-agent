"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpDown,
  Bot,
  ChevronLeft,
  Flag,
  Headset,
  Inbox,
  PanelRightOpen,
  Search,
  Share2,
  X,
} from "lucide-react";
import { ChatWindow } from "@/components/shared/chat/ChatWindow";
import { CustomerPanel, type CustomerProfile } from "@/components/inbox/CustomerPanel";
import { FacebookIcon, ZaloIcon } from "@/components/icons/channel";
import type { ChatMessage } from "@/components/shared/chat/MessageBubble";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// M1 Inbox — list + chat + hand-off (G3 ★) + dải "agent đang tư vấn N khách" (M1.2).
// Nhận hội thoại + hồ sơ từ InboxStateController (theo trạng thái nguyên mẫu). Thao tác của
// người dùng (gửi tin, bật/tắt agent, nhận việc, đã đọc) lưu ở lớp "localEdits" rồi phủ lên
// feed — nhờ vậy nhịp realtime đổ dữ liệu mới mà không xoá thao tác đang có.

type Status = "new" | "exploring" | "quoted" | "awaiting_payment" | "closed";
type ChannelFilter = "all" | "facebook" | "zalo";
type SortKey = "recent" | "unread" | "attention";

export type Conversation = {
  id: string;
  customerName: string;
  channel: string;
  status: Status;
  agentActive: boolean;
  handoff: { key: string; reason: string; acknowledged: boolean } | null;
  unread: number;
  lastMessageAt: string;
  orderId: string | null;
  messages: ChatMessage[];
};

// Thao tác cục bộ phủ lên một hội thoại của feed (giữ qua các nhịp realtime).
type LocalEdit = {
  sent?: ChatMessage[]; // tin agent/system người dùng thêm vào, nối sau tin của feed
  agentActive?: boolean;
  acknowledged?: boolean; // đã "nhận việc" handoff
  read?: boolean; // đã mở → unread = 0
};

// Phủ localEdits lên hội thoại feed để ra hội thoại hiển thị.
function applyEdits(c: Conversation, e?: LocalEdit): Conversation {
  if (!e) return c;
  return {
    ...c,
    agentActive: e.agentActive ?? c.agentActive,
    handoff: c.handoff ? { ...c.handoff, acknowledged: e.acknowledged ?? c.handoff.acknowledged } : c.handoff,
    unread: e.read ? 0 : c.unread,
    messages: e.sent?.length ? [...c.messages, ...e.sent] : c.messages,
  };
}

// Nhấp nháy nhẹ khi giá trị đổi — chỉ bật ở chế độ thời gian thực (khuôn FlashOnChange Dashboard).
function useFlash(value: string | number, active: boolean) {
  const [flash, setFlash] = useState(false);
  const prev = useRef(value);
  useEffect(() => {
    if (!active || prev.current === value) {
      prev.current = value;
      return;
    }
    prev.current = value;
    setFlash(true);
    const id = setTimeout(() => setFlash(false), 600);
    return () => clearTimeout(id);
  }, [value, active]);
  return flash;
}

// Badge LIVE ở header danh sách khi đang chạy thời gian thực (đồng bộ Dashboard).
function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
      <span className="size-1.5 rounded-full bg-emerald-500 motion-safe:animate-pulse" aria-hidden />
      LIVE
    </span>
  );
}

// Một dòng hội thoại trong danh sách. Nháy nhẹ khi có tin/đếm chưa đọc đổi (chỉ ở realtime).
function ConversationButton({
  c,
  selected,
  live,
  onSelect,
}: {
  c: Conversation;
  selected: boolean;
  live: boolean;
  onSelect: (id: string) => void;
}) {
  const human = needsHuman(c);
  const last = c.messages[c.messages.length - 1];
  const lastText =
    last?.role === "typing" ? "Agent đang soạn trả lời…" : last?.image ? "[Hình sản phẩm]" : last?.text;
  const flash = useFlash(`${c.messages.length}:${c.unread}`, live);
  return (
    <button
      type="button"
      onClick={() => onSelect(c.id)}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "mb-1 flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors duration-700 cursor-pointer",
        selected ? "bg-muted" : flash ? "bg-emerald-50" : "hover:bg-muted/60",
      )}
    >
      {/* Avatar chữ cái */}
      <span
        aria-hidden
        className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground ring-1 ring-foreground/10"
      >
        {initials(c.customerName)}
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-center gap-2">
          <span className={cn("truncate text-sm", c.unread > 0 ? "font-semibold" : "font-medium")}>
            {c.customerName}
          </span>
          <span className="ml-auto shrink-0 text-[11px] tabular-nums text-muted-foreground">
            {hhmm(c.lastMessageAt)}
          </span>
        </span>

        <span className="flex items-center gap-1.5">
          <span className="truncate text-xs text-muted-foreground">{lastText}</span>
          {c.unread > 0 ? (
            <span className="ml-auto flex size-4 shrink-0 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-white tabular-nums">
              {c.unread}
            </span>
          ) : null}
        </span>

        {/* Chỉ giữ chỉ báo cần xử lý — bỏ chip kênh & trạng thái (nhãn) cho danh sách gọn. */}
        {human ? (
          <span className="flex w-fit items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
            <Flag className="size-2.5" aria-hidden />
            Cần bạn trả lời
          </span>
        ) : c.agentActive ? (
          <span className="flex w-fit items-center gap-1 text-[10px] text-violet-600">
            <Bot className="size-2.5" aria-hidden />
            Agent đang trả lời
          </span>
        ) : null}
      </span>
    </button>
  );
}

// tint = nền + viền cho trigger lọc khi đang chọn trạng thái này (cùng hệ màu với dot).
const STATUS_META: Record<Status, { label: string; cls: string; dot: string; tint: string }> = {
  new: { label: "Mới", cls: "bg-sky-100 text-sky-700", dot: "bg-sky-500", tint: "border-sky-500/30 bg-sky-500/10" },
  exploring: { label: "Tìm hiểu", cls: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-500", tint: "border-indigo-500/30 bg-indigo-500/10" },
  quoted: { label: "Đã báo giá", cls: "bg-amber-100 text-amber-700", dot: "bg-amber-500", tint: "border-amber-500/30 bg-amber-500/10" },
  awaiting_payment: { label: "Chờ thanh toán", cls: "bg-orange-100 text-orange-700", dot: "bg-orange-500", tint: "border-orange-500/30 bg-orange-500/10" },
  closed: { label: "Đã chốt", cls: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", tint: "border-emerald-500/30 bg-emerald-500/10" },
};

// Lọc theo trạng thái xử lý của hội thoại (M1.2 cũ, nay là filter):
// handoff = cần người tiếp nhận; agent = agent đang tự trả lời (và không chờ người).
type AttentionFilter = "all" | "handoff" | "agent";

const ATTENTION_OPTIONS: { key: AttentionFilter; label: string }[] = [
  { key: "all", label: "Mọi hội thoại" },
  { key: "handoff", label: "Cần bạn trả lời" },
  { key: "agent", label: "Agent đang trả lời" },
];

const ATTENTION_LABELS = Object.fromEntries(
  ATTENTION_OPTIONS.map((a) => [a.key, a.label]),
) as Record<AttentionFilter, string>;

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "recent", label: "Mới nhất" },
  { key: "unread", label: "Chưa đọc trước" },
  { key: "attention", label: "Cần xử lý trước" },
];

const CHANNEL_LABELS: Record<ChannelFilter, string> = {
  all: "Mọi kênh",
  facebook: "Facebook",
  zalo: "Zalo",
};

const SORT_LABELS: Record<SortKey, string> = Object.fromEntries(
  SORT_OPTIONS.map((s) => [s.key, s.label]),
) as Record<SortKey, string>;

// Giờ HH:mm lấy thẳng từ ISO (+07) — tất định, không phụ thuộc "now", tránh lệch hydrate.
const hhmm = (iso: string) => iso.slice(11, 16);

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

const channelLabel = (channel: string) => (channel === "facebook" ? "FB" : "Zalo");
const needsHuman = (c: Conversation) => Boolean(c.handoff && !c.handoff.acknowledged);

// Trigger lọc dạng icon: chevron mảnh & nhạt; nền tô nhẹ khi bộ lọc khác mặc định.
const FILTER_TRIGGER = "gap-1 px-2 [&>svg:last-child]:size-3 [&>svg:last-child]:text-muted-foreground/60";

export function InboxScreen({
  initialId,
  conversations: feed,
  profiles: initialProfiles,
  live = false,
}: {
  initialId?: string;
  conversations: Conversation[];
  profiles: Record<string, CustomerProfile>;
  live?: boolean;
}) {
  const router = useRouter();
  const [localEdits, setLocalEdits] = useState<Record<string, LocalEdit>>({});
  const [profiles, setProfiles] = useState<Record<string, CustomerProfile>>(initialProfiles);
  const [filter, setFilter] = useState<Status | "all">("all");
  const [attention, setAttention] = useState<AttentionFilter>("all");
  const [channel, setChannel] = useState<ChannelFilter>("all");
  const [sort, setSort] = useState<SortKey>("recent");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    initialId && feed.some((c) => c.id === initialId) ? initialId : feed[0]?.id ?? null,
  );

  // Hội thoại hiển thị = feed (theo trạng thái nguyên mẫu) phủ thao tác cục bộ.
  const conversations = useMemo(
    () => feed.map((c) => applyEdits(c, localEdits[c.id])),
    [feed, localEdits],
  );

  // Cập nhật/gộp một localEdit theo id hội thoại.
  const patchEdit = (id: string, fn: (e: LocalEdit) => LocalEdit) =>
    setLocalEdits((prev) => ({ ...prev, [id]: fn(prev[id] ?? {}) }));
  // Master-detail trên mobile: false = đang xem danh sách, true = đang mở hội thoại.
  const [chatOpenMobile, setChatOpenMobile] = useState(false);
  // Panel hồ sơ khách: cố định ở cột phải từ xl trở lên; dưới xl mở dạng overlay.
  const [panelOpen, setPanelOpen] = useState(false); // overlay hồ sơ khách (dưới lg)
  const [infoCollapsed, setInfoCollapsed] = useState(false); // thu gọn cột hồ sơ khách (lg+)
  const attentionCounts = useMemo<Record<AttentionFilter, number>>(
    () => ({
      all: conversations.length,
      handoff: conversations.filter(needsHuman).length,
      agent: conversations.filter((c) => c.agentActive && !needsHuman(c)).length,
    }),
    [conversations],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = conversations.filter((c) => {
      if (filter !== "all" && c.status !== filter) return false;
      if (attention === "handoff" && !needsHuman(c)) return false;
      if (attention === "agent" && !(c.agentActive && !needsHuman(c))) return false;
      if (channel !== "all" && c.channel !== channel) return false;
      if (!q) return true;
      const last = c.messages[c.messages.length - 1]?.text ?? "";
      return c.customerName.toLowerCase().includes(q) || last.toLowerCase().includes(q);
    });
    return [...matched].sort((a, b) => {
      if (sort === "unread" && b.unread !== a.unread) return b.unread - a.unread;
      if (sort === "attention" && needsHuman(b) !== needsHuman(a)) return Number(needsHuman(b)) - Number(needsHuman(a));
      return b.lastMessageAt.localeCompare(a.lastMessageAt); // ISO cùng định dạng → so sánh chuỗi = theo thời gian
    });
  }, [conversations, filter, attention, channel, query, sort]);

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  const select = (id: string) => {
    setSelectedId(id);
    setChatOpenMobile(true);
    patchEdit(id, (e) => ({ ...e, read: true }));
  };

  const resetFilters = () => {
    setFilter("all");
    setAttention("all");
    setChannel("all");
    setQuery("");
  };

  const sendMessage = (text: string) => {
    if (!selectedId) return;
    patchEdit(selectedId, (e) => ({
      ...e,
      sent: [...(e.sent ?? []), { id: `local-${selectedId}-${e.sent?.length ?? 0}`, role: "agent", text }],
    }));
  };

  const toggleAgent = (on: boolean) => {
    if (!selectedId) return;
    patchEdit(selectedId, (e) => ({
      ...e,
      agentActive: on,
      sent: [
        ...(e.sent ?? []),
        {
          id: `local-${selectedId}-${e.sent?.length ?? 0}`,
          role: "system",
          text: on
            ? "Đã bật agent — agent tiếp tục tự trả lời khách"
            : "Đã tắt agent — bạn trả lời khách trực tiếp",
        },
      ],
    }));
  };

  const saveProfile = (id: string, next: Omit<CustomerProfile, "firstSeenAt">) => {
    setProfiles((prev) => {
      const existing = prev[id];
      return {
        ...prev,
        [id]: {
          ...next,
          firstSeenAt: existing?.firstSeenAt ?? selected?.lastMessageAt ?? "",
        },
      };
    });
  };

  const takeOver = () => {
    if (!selectedId) return;
    patchEdit(selectedId, (e) => ({
      ...e,
      agentActive: false,
      acknowledged: true,
      sent: [
        ...(e.sent ?? []),
        {
          id: `local-${selectedId}-${e.sent?.length ?? 0}`,
          role: "system",
          text: "Bạn đã nhận bàn giao — agent tạm dừng để bạn xử lý",
        },
      ],
    }));
  };

  return (
    <div className="flex h-[calc(100dvh-5.5rem)] flex-col gap-4 md:h-[calc(100dvh-6.5rem)]">
      {/* Một khối liền: 3 cột dán sát trong cùng một thẻ, ngăn nhau bằng đường kẻ dọc (không gap, không thẻ rời). */}
      <div
        className={cn(
          "grid min-h-0 flex-1 overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 md:grid-cols-[20rem_1fr]",
          // Thu gọn → bỏ cột hồ sơ, khung chat giãn rộng (lg+). Mặc định 3 cột.
          infoCollapsed
            ? "lg:grid-cols-[17rem_1fr] xl:grid-cols-[20rem_1fr]"
            : "lg:grid-cols-[17rem_1fr_19rem] xl:grid-cols-[20rem_1fr_21rem]",
        )}
      >
        {/* Danh sách hội thoại — cột trái, kẻ dọc ngăn với khung chat */}
        <div
          className={cn(
            "min-h-0 flex-col md:border-r",
            chatOpenMobile ? "hidden md:flex" : "flex",
          )}
        >
          {/* Dải LIVE — chỉ hiện ở chế độ thời gian thực */}
          {live ? (
            <div className="flex items-center justify-between border-b px-3 py-1.5">
              <span className="text-xs font-medium text-muted-foreground">Hộp thư trực tiếp</span>
              <LiveBadge />
            </div>
          ) : null}

          {/* Tìm kiếm */}
          <div className="border-b p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm khách hoặc nội dung…"
                aria-label="Tìm hội thoại"
                className="h-9 w-full rounded-md border bg-background pl-8 pr-8 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Xoá tìm kiếm"
                  className="absolute right-1.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              ) : null}
            </div>
          </div>

          {/* Bộ lọc dạng icon — nhãn đầy đủ hiện trong menu; icon đổi theo lựa chọn */}
          <div className="flex items-center justify-between border-b p-2">
            {/* Nhóm trái: kênh + sắp xếp */}
            <div className="flex items-center gap-1">
            {/* Kênh */}
            <Select value={channel} onValueChange={(v) => setChannel(v as ChannelFilter)}>
              <SelectTrigger
                size="sm"
                className={cn(
                  FILTER_TRIGGER,
                  channel === "facebook" && "border-[#1877F2]/30 bg-[#1877F2]/10",
                  channel === "zalo" && "border-[#0068FF]/30 bg-[#0068FF]/10",
                )}
                aria-label="Lọc theo kênh"
                title={`Kênh: ${CHANNEL_LABELS[channel]}`}
              >
                {channel === "facebook" ? (
                  <FacebookIcon className="size-4" />
                ) : channel === "zalo" ? (
                  <ZaloIcon className="size-4 rounded-[5px]" />
                ) : (
                  <Share2 className="size-4 text-muted-foreground" aria-hidden />
                )}
              </SelectTrigger>
              <SelectContent className="min-w-44">
                <div className="px-1.5 pb-1 pt-0.5 text-[11px] font-medium text-muted-foreground">Kênh</div>
                <SelectItem value="all">
                  <Share2 className="size-4 text-muted-foreground" aria-hidden />
                  Mọi kênh
                </SelectItem>
                <SelectItem value="facebook">
                  <FacebookIcon className="size-4" />
                  Facebook
                </SelectItem>
                <SelectItem value="zalo">
                  <ZaloIcon className="size-4 rounded-[5px]" />
                  Zalo
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Sắp xếp */}
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger
                size="sm"
                className={cn(FILTER_TRIGGER, sort !== "recent" && "border-foreground/25 bg-foreground/5")}
                aria-label="Sắp xếp hội thoại"
                title={`Sắp xếp: ${SORT_LABELS[sort]}`}
              >
                <ArrowUpDown className={cn("size-4", sort === "recent" ? "text-muted-foreground" : "text-foreground")} aria-hidden />
              </SelectTrigger>
              <SelectContent className="min-w-44">
                <div className="px-1.5 pb-1 pt-0.5 text-[11px] font-medium text-muted-foreground">Sắp xếp theo</div>
                {SORT_OPTIONS.map((s) => (
                  <SelectItem key={s.key} value={s.key}>
                    <ArrowUpDown className="size-4 text-muted-foreground" aria-hidden />
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            </div>

            {/* Nhóm phải: trạng thái + trạng thái xử lý */}
            <div className="flex items-center gap-1">
            {/* Trạng thái xử lý */}
            <Select value={attention} onValueChange={(v) => setAttention(v as AttentionFilter)}>
              <SelectTrigger
                size="sm"
                className={cn(
                  FILTER_TRIGGER,
                  attention === "handoff" && "border-amber-500/30 bg-amber-500/10",
                  attention === "agent" && "border-violet-500/30 bg-violet-500/10",
                )}
                aria-label="Lọc theo trạng thái xử lý"
                title={`Xử lý: ${ATTENTION_LABELS[attention]}`}
              >
                {attention === "handoff" ? (
                  <Flag className="size-4 text-amber-600" aria-hidden />
                ) : attention === "agent" ? (
                  <Bot className="size-4 text-violet-600" aria-hidden />
                ) : (
                  <Headset className="size-4 text-muted-foreground" aria-hidden />
                )}
              </SelectTrigger>
              <SelectContent className="min-w-52">
                <div className="px-1.5 pb-1 pt-0.5 text-[11px] font-medium text-muted-foreground">Trạng thái xử lý</div>
                {ATTENTION_OPTIONS.map((a) => {
                  const n = attentionCounts[a.key];
                  return (
                    <SelectItem key={a.key} value={a.key}>
                      {a.key === "handoff" ? (
                        <Flag className="size-4 text-amber-600" aria-hidden />
                      ) : a.key === "agent" ? (
                        <Bot className="size-4 text-violet-600" aria-hidden />
                      ) : (
                        <Headset className="size-4 text-muted-foreground" aria-hidden />
                      )}
                      {a.label}
                      {n > 0 ? <span className="ml-auto tabular-nums text-xs text-muted-foreground">{n}</span> : null}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            </div>
          </div>

          {/* Danh sách */}
          <div className="min-h-0 flex-1 overflow-auto p-1.5 scrollbar-hide">
            {conversations.length === 0 ? (
              // Chưa có hội thoại nào (trạng thái "Chưa có dữ liệu", hoặc realtime chưa khởi động)
              <div className="flex h-full flex-col items-center justify-center gap-1.5 px-4 text-center">
                <Inbox className="size-7 text-muted-foreground/60" aria-hidden />
                <p className="text-sm font-medium">Chưa có hội thoại nào</p>
                <p className="max-w-[15rem] text-xs text-muted-foreground">
                  {live ? "Đang chờ khách nhắn tới — hội thoại sẽ hiện ở đây." : "Khi khách nhắn tới, hội thoại sẽ hiện ở đây."}
                </p>
              </div>
            ) : visible.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
                <p className="text-sm text-muted-foreground">
                  {query ? "Không tìm thấy hội thoại phù hợp." : "Chưa có hội thoại ở trạng thái này."}
                </p>
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  Xoá lọc
                </Button>
              </div>
            ) : (
              visible.map((c) => (
                <ConversationButton key={c.id} c={c} selected={c.id === selectedId} live={live} onSelect={select} />
              ))
            )}
          </div>
        </div>

        {/* Khung chat — cột giữa; kẻ dọc ngăn với cột hồ sơ khi cột này còn hiện (lg+, chưa thu gọn) */}
        <div
          className={cn(
            "min-h-0 flex-col",
            !infoCollapsed && "lg:border-r",
            chatOpenMobile ? "flex" : "hidden md:flex",
          )}
        >
          {selected ? (
            <ChatWindow
              messages={selected.messages}
              onSend={sendMessage}
              ownRole="agent"
              placeholder="Trả lời khách…"
              header={
                <div className="space-y-2 border-b p-3">
                  <div className="flex items-center gap-2">
                    {/* Quay lại danh sách trên mobile */}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="-ml-1 md:hidden"
                      onClick={() => setChatOpenMobile(false)}
                      aria-label="Quay lại danh sách hội thoại"
                    >
                      <ChevronLeft />
                    </Button>
                    <span
                      aria-hidden
                      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground ring-1 ring-foreground/10"
                    >
                      {initials(selected.customerName)}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-semibold leading-tight">{selected.customerName}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {channelLabel(selected.channel)} · {hhmm(selected.lastMessageAt)}
                      </span>
                    </span>
                    <span className={cn("ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium", STATUS_META[selected.status].cls)}>
                      {STATUS_META[selected.status].label}
                    </span>
                    {/* Mở hồ sơ khách — dưới lg panel không cố định nên hiện nút mở overlay */}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="ml-auto lg:hidden"
                      onClick={() => setPanelOpen(true)}
                      aria-label="Mở thông tin khách"
                    >
                      <PanelRightOpen />
                    </Button>
                    {/* lg+: khi đã thu gọn cột hồ sơ → nút mở lại */}
                    {infoCollapsed ? (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="ml-auto hidden lg:inline-flex"
                        onClick={() => setInfoCollapsed(false)}
                        aria-label="Mở thông tin khách"
                        title="Mở thông tin khách"
                      >
                        <PanelRightOpen />
                      </Button>
                    ) : null}
                  </div>

                  {/* Thẻ điều khiển Agent cho riêng hội thoại — tô tím khi agent đang trực (highlight trạng thái chính). */}
                  <div
                    className={cn(
                      "overflow-hidden rounded-lg ring-1 transition-colors",
                      selected.agentActive ? "bg-violet-50 ring-violet-200" : "bg-muted/50 ring-foreground/10",
                    )}
                  >
                    {/* Bật / tắt agent tự trả lời */}
                    <label className="flex cursor-pointer items-center justify-between gap-2 px-2.5 py-2">
                      <span className="flex items-center gap-1.5 text-xs font-medium">
                        <span
                          className={cn(
                            "flex size-5 shrink-0 items-center justify-center rounded-full",
                            selected.agentActive ? "bg-violet-600 text-white" : "bg-muted-foreground/15 text-muted-foreground",
                          )}
                        >
                          <Bot className="size-3" aria-hidden />
                        </span>
                        Agent tự động tư vấn
                      </span>
                      <span className="flex items-center gap-2">
                        <span className={cn("text-xs font-medium", selected.agentActive ? "text-violet-700" : "text-muted-foreground")}>
                          {selected.agentActive ? "Đang bật" : "Đang tắt"}
                        </span>
                        <Switch
                          checked={selected.agentActive}
                          onCheckedChange={(v) => toggleAgent(Boolean(v))}
                          aria-label="Bật hoặc tắt agent tự trả lời cho hội thoại này"
                        />
                      </span>
                    </label>
                  </div>

                  {selected.handoff && !selected.handoff.acknowledged ? (
                    <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm ring-1 ring-amber-200">
                      <Flag className="size-4 shrink-0 text-amber-600" aria-hidden />
                      <span className="text-amber-800">
                        Cần bạn trả lời: <span className="font-medium">{selected.handoff.reason}</span>
                      </span>
                      <Button size="sm" className="ml-auto" onClick={takeOver}>
                        Nhận bàn giao
                      </Button>
                    </div>
                  ) : selected.handoff?.acknowledged ? (
                    <Badge variant="secondary" className="gap-1">
                      <Flag className="size-3" aria-hidden />
                      Bạn đã nhận bàn giao
                    </Badge>
                  ) : null}
                </div>
              }
            />
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Chọn một hội thoại để xem và trả lời
            </div>
          )}
        </div>

        {/* Panel hồ sơ khách — cột phải cố định từ lg (ẩn khi thu gọn) */}
        <div className={cn("hidden min-h-0 lg:flex", infoCollapsed && "lg:hidden")}>
          {selected ? (
            <CustomerPanel
              conversation={selected}
              profile={profiles[selected.id] ?? null}
              onSaveProfile={(next) => saveProfile(selected.id, next)}
              onOpenOrder={(orderId) => router.push(`/orders?o=${orderId}`)}
              onCollapse={() => setInfoCollapsed(true)}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center px-4 text-center text-sm text-muted-foreground">
              Chọn hội thoại để xem hồ sơ khách
            </div>
          )}
        </div>
      </div>

      {/* Panel hồ sơ khách — overlay dưới lg */}
      {panelOpen && selected ? (
        <div className="fixed inset-0 z-40 flex justify-end lg:hidden" role="dialog" aria-modal="true" aria-label="Thông tin khách">
          <button
            type="button"
            aria-label="Đóng thông tin khách"
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setPanelOpen(false)}
          />
          <div className="relative ml-auto flex h-full w-full max-w-sm flex-col bg-card shadow-xl">
            <CustomerPanel
              conversation={selected}
              profile={profiles[selected.id] ?? null}
              onSaveProfile={(next) => saveProfile(selected.id, next)}
              onOpenOrder={(orderId) => {
                setPanelOpen(false);
                router.push(`/orders?o=${orderId}`);
              }}
              onClose={() => setPanelOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
