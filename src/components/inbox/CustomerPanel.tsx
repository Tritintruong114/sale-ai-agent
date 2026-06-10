"use client";

import { useMemo, useState } from "react";
import {
  Bot,
  Check,
  Clock,
  CreditCard,
  Flag,
  MapPin,
  MessageSquare,
  Package,
  Pencil,
  Phone,
  Plus,
  Share2,
  ShoppingBag,
  StickyNote,
  Tag,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FacebookIcon, ZaloIcon } from "@/components/icons/channel";
import { cn } from "@/lib/utils";
import { formatVND } from "@/lib/format";
import ordersRaw from "@/data/orders.json";
import paymentsRaw from "@/data/payments.json";

// Panel phải Inbox (prototype) — hồ sơ khách, chỉ số, đơn hàng & timeline.
// Hồ sơ (phone/address/tags/note) sửa được tại chỗ; state do InboxScreen giữ.
// Đơn hàng & thanh toán suy từ orders.json + payments.json, ghép theo customerName.

export type CustomerProfile = {
  phone: string;
  address: string;
  firstSeenAt: string;
  tags: string[];
  note: string;
};

type Order = {
  id: string;
  customerName: string;
  status: "new" | "processing" | "done";
  deliveryStatus: string;
  total: number;
  approval: "auto" | "pending" | "confirmed" | "rejected";
  items: { productId: string; name: string; qty: number; price: number }[];
  createdAt: string;
};

type Payment = { orderId: string; status: "awaiting" | "paid"; amount: number };

type PanelConversation = {
  id: string;
  customerName: string;
  channel: string;
  status: string;
  lastMessageAt: string;
  agentActive: boolean;
  handoff: { reason: string; acknowledged: boolean } | null;
};

const ORDERS = ordersRaw.orders as Order[];
const PAYMENTS = paymentsRaw.queue as Payment[];

const ORDER_STATUS: Record<Order["status"], { label: string; dot: string }> = {
  new: { label: "Mới", dot: "bg-sky-500" },
  processing: { label: "Đang xử lý", dot: "bg-indigo-500" },
  done: { label: "Hoàn tất", dot: "bg-emerald-500" },
};

const DELIVERY_LABEL: Record<string, string> = {
  pending: "Chờ lấy hàng",
  packing: "Đang đóng gói",
  delivered: "Đã giao",
};

const channelLabel = (channel: string) => (channel === "facebook" ? "Facebook" : "Zalo");

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

// Tất định từ ISO (+07), không phụ thuộc "now" → tránh lệch hydrate.
const dmy = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
const dmyy = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
const hhmm = (iso: string) => iso.slice(11, 16);

type TimelineTone = "default" | "violet" | "amber" | "emerald" | "sky";

type TimelineEvent = {
  key: string;
  iso: string;
  icon: typeof Clock;
  title: string;
  detail?: string;
  tone: TimelineTone;
};

const TONE_RING: Record<TimelineTone, string> = {
  default: "bg-muted text-muted-foreground ring-foreground/10",
  violet: "bg-violet-100 text-violet-700 ring-violet-200",
  amber: "bg-amber-100 text-amber-700 ring-amber-200",
  emerald: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  sky: "bg-sky-100 text-sky-700 ring-sky-200",
};

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

// Màu nhãn tất định theo loại khách (đồng bộ hệ màu với timeline & trạng thái).
const TAG_STYLE: Record<string, string> = {
  VIP: "bg-amber-100 text-amber-700 ring-amber-200",
  "Khách quen": "bg-emerald-100 text-emerald-700 ring-emerald-200",
  "Khách mới": "bg-sky-100 text-sky-700 ring-sky-200",
  Combo: "bg-violet-100 text-violet-700 ring-violet-200",
};
const DEFAULT_TAG = "bg-secondary text-secondary-foreground ring-foreground/10";

function TagChip({ label }: { label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1",
        TAG_STYLE[label] ?? DEFAULT_TAG,
      )}
    >
      {label}
    </span>
  );
}

// Một dòng thông tin: icon + nhãn (mờ, nhỏ) cùng hàng; giá trị xuống dưới.
function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <span className="flex size-3.5 shrink-0 items-center justify-center" aria-hidden>
          {icon}
        </span>
        {label}
      </div>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  );
}

const EMPTY_PROFILE: Omit<CustomerProfile, "firstSeenAt"> = {
  phone: "",
  address: "",
  tags: [],
  note: "",
};

// Form sửa hồ sơ ngay trong panel (inline). Chỉ mount khi bật sửa nên draft luôn
// khởi tạo lại từ profile — không cần effect đồng bộ. firstSeenAt là dữ kiện nên không sửa.
function ContactEditor({
  profile,
  onSave,
  onCancel,
}: {
  profile: CustomerProfile | null;
  onSave: (next: Omit<CustomerProfile, "firstSeenAt">) => void;
  onCancel: () => void;
}) {
  const base = profile ?? EMPTY_PROFILE;
  const [phone, setPhone] = useState(base.phone);
  const [address, setAddress] = useState(base.address);
  const [tags, setTags] = useState<string[]>(base.tags);
  const [note, setNote] = useState(base.note);
  const [tagInput, setTagInput] = useState("");

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
  };

  const save = () => {
    onSave({ phone: phone.trim(), address: address.trim(), tags, note: note.trim() });
    onCancel();
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label htmlFor="cust-phone" className="text-xs font-medium text-foreground">
          Số điện thoại
        </label>
        <Input
          id="cust-phone"
          type="tel"
          inputMode="tel"
          autoFocus
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="VD: 0901 234 567"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="cust-address" className="text-xs font-medium text-foreground">
          Địa chỉ
        </label>
        <Input
          id="cust-address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="VD: Q. Tân Bình, TP. Hồ Chí Minh"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="cust-tag" className="text-xs font-medium text-foreground">
          Nhãn
        </label>
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span
                key={t}
                className={cn(
                  "flex items-center gap-1 rounded-full py-0.5 pl-2 pr-1 text-[11px] font-medium ring-1",
                  TAG_STYLE[t] ?? DEFAULT_TAG,
                )}
              >
                {t}
                <button
                  type="button"
                  onClick={() => setTags((prev) => prev.filter((x) => x !== t))}
                  aria-label={`Bỏ nhãn ${t}`}
                  className="flex size-4 items-center justify-center rounded-full opacity-60 transition-opacity hover:bg-foreground/10 hover:opacity-100 cursor-pointer"
                >
                  <X className="size-2.5" aria-hidden />
                </button>
              </span>
            ))}
          </div>
        ) : null}
        <div className="flex gap-1.5">
          <Input
            id="cust-tag"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Thêm nhãn rồi nhấn Enter"
          />
          <Button type="button" variant="outline" size="icon" onClick={addTag} aria-label="Thêm nhãn">
            <Plus />
          </Button>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="cust-note" className="text-xs font-medium text-foreground">
          Ghi chú
        </label>
        <Textarea
          id="cust-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Sở thích, lưu ý khi tư vấn, ưu tiên giao hàng…"
        />
      </div>

      <div className="flex justify-end gap-2 pt-0.5">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Huỷ
        </Button>
        <Button size="sm" onClick={save}>
          Lưu
        </Button>
      </div>
    </div>
  );
}

export function CustomerPanel({
  conversation,
  profile,
  onSaveProfile,
  onOpenOrder,
  onClose,
}: {
  conversation: PanelConversation;
  profile: CustomerProfile | null;
  onSaveProfile: (next: Omit<CustomerProfile, "firstSeenAt">) => void;
  onOpenOrder: (orderId: string) => void;
  onClose?: () => void;
}) {
  const [editing, setEditing] = useState(false);

  const orders = useMemo(
    () =>
      ORDERS.filter((o) => o.customerName === conversation.customerName).sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      ),
    [conversation.customerName],
  );

  const paymentByOrder = useMemo(() => {
    const m = new Map<string, Payment>();
    for (const p of PAYMENTS) m.set(p.orderId, p);
    return m;
  }, []);

  const totalSpent = useMemo(
    () =>
      orders.reduce((sum, o) => {
        const pay = paymentByOrder.get(o.id);
        return pay?.status === "paid" || o.status === "done" ? sum + o.total : sum;
      }, 0),
    [orders, paymentByOrder],
  );

  const timeline = useMemo<TimelineEvent[]>(() => {
    const events: TimelineEvent[] = [];

    if (profile) {
      events.push({
        key: "first-seen",
        iso: profile.firstSeenAt,
        icon: MessageSquare,
        title: "Lần đầu liên hệ",
        detail: `Qua ${channelLabel(conversation.channel)}`,
        tone: "sky",
      });
    }

    for (const o of orders) {
      const pay = paymentByOrder.get(o.id);
      events.push({
        key: `order-${o.id}`,
        iso: o.createdAt,
        icon: ShoppingBag,
        title: `Tạo đơn ${o.id}`,
        detail: formatVND(o.total),
        tone: "violet",
      });
      if (pay?.status === "paid") {
        events.push({
          key: `pay-${o.id}`,
          iso: o.createdAt,
          icon: CreditCard,
          title: "Đã thanh toán",
          detail: `Đơn ${o.id} · ${formatVND(pay.amount)}`,
          tone: "emerald",
        });
      }
    }

    if (conversation.handoff && !conversation.handoff.acknowledged) {
      events.push({
        key: "handoff",
        iso: conversation.lastMessageAt,
        icon: Flag,
        title: "Cần người xử lý",
        detail: conversation.handoff.reason,
        tone: "amber",
      });
    }

    events.push({
      key: "last-msg",
      iso: conversation.lastMessageAt,
      icon: conversation.agentActive ? Bot : MessageSquare,
      title: "Tin nhắn gần nhất",
      detail: conversation.agentActive ? "Agent đang trả lời" : undefined,
      tone: conversation.agentActive ? "violet" : "default",
    });

    return events.sort((a, b) => b.iso.localeCompare(a.iso));
  }, [profile, orders, paymentByOrder, conversation]);

  // Gom sự kiện theo ngày (timeline đã sort giảm dần) → mỗi ngày một tiêu đề, mỗi dòng chỉ còn giờ.
  const timelineDays = useMemo(() => {
    const days: { day: string; label: string; events: TimelineEvent[] }[] = [];
    for (const ev of timeline) {
      const day = ev.iso.slice(0, 10);
      const last = days[days.length - 1];
      if (last && last.day === day) last.events.push(ev);
      else days.push({ day, label: dmyy(ev.iso), events: [ev] });
    }
    return days;
  }, [timeline]);

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      {/* Header hồ sơ */}
      <div className="flex items-start gap-3 border-b p-4">
        <span
          aria-hidden
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground ring-1 ring-foreground/10"
        >
          {initials(conversation.customerName)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight">{conversation.customerName}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            {conversation.channel === "facebook" ? (
              <FacebookIcon className="size-3.5" />
            ) : (
              <ZaloIcon className="size-3.5 rounded-[3px]" />
            )}
            <span>{profile ? `Khách từ ${dmy(profile.firstSeenAt)}` : channelLabel(conversation.channel)}</span>
          </p>
        </div>
        {onClose ? (
          <Button variant="ghost" size="icon-sm" className="-mr-1 -mt-1 lg:hidden" onClick={onClose} aria-label="Đóng thông tin khách">
            <X />
          </Button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-auto p-4">
        {/* Chỉ số nhanh */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-muted/50 px-3 py-2.5 ring-1 ring-foreground/5">
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <ShoppingBag className="size-3.5" aria-hidden />
              Đơn đã mua
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums leading-none">{orders.length}</p>
          </div>
          <div className="rounded-lg bg-muted/50 px-3 py-2.5 ring-1 ring-foreground/5">
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <CreditCard className="size-3.5" aria-hidden />
              Đã chi tiêu
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums leading-none">{formatVND(totalSpent)}</p>
          </div>
        </div>

        {/* Liên hệ */}
        <Section
          title="Thông tin liên hệ"
          action={
            !editing && profile && (profile.phone || profile.address || profile.note || profile.tags.length) ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline cursor-pointer"
              >
                <Pencil className="size-3" aria-hidden />
                Sửa
              </button>
            ) : null
          }
        >
          {editing ? (
            <ContactEditor profile={profile} onSave={onSaveProfile} onCancel={() => setEditing(false)} />
          ) : (
            <div className="space-y-3">
              {/* Nguồn — suy từ kênh khách nhắn tới, luôn hiển thị */}
              <InfoRow icon={<Share2 className="size-3.5" />} label="Nguồn">
                <span className="inline-flex items-center gap-1.5">
                  {conversation.channel === "facebook" ? (
                    <FacebookIcon className="size-4" />
                  ) : (
                    <ZaloIcon className="size-4 rounded-[3px]" />
                  )}
                  {channelLabel(conversation.channel)}
                </span>
              </InfoRow>

              {profile?.phone ? (
                <InfoRow icon={<Phone className="size-3.5" />} label="Điện thoại">
                  <a
                    href={`tel:${profile.phone.replace(/\s+/g, "")}`}
                    className="tabular-nums underline-offset-2 transition-colors hover:text-primary hover:underline"
                  >
                    {profile.phone}
                  </a>
                </InfoRow>
              ) : null}

              {profile?.address ? (
                <InfoRow icon={<MapPin className="size-3.5" />} label="Địa chỉ">
                  <span className="text-foreground/90">{profile.address}</span>
                </InfoRow>
              ) : null}

              {profile && profile.tags.length > 0 ? (
                <InfoRow icon={<Tag className="size-3.5" />} label="Nhãn">
                  <div className="flex flex-wrap gap-1.5">
                    {profile.tags.map((t) => (
                      <TagChip key={t} label={t} />
                    ))}
                  </div>
                </InfoRow>
              ) : null}

              {profile?.note ? (
                <p className="flex gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900 ring-1 ring-amber-100">
                  <StickyNote className="mt-0.5 size-3.5 shrink-0 text-amber-500" aria-hidden />
                  {profile.note}
                </p>
              ) : null}

              {!profile || (!profile.phone && !profile.address && !profile.note && profile.tags.length === 0) ? (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed py-3.5 text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground cursor-pointer"
                >
                  <Plus className="size-3.5" aria-hidden />
                  Thêm thông tin liên hệ
                </button>
              ) : null}
            </div>
          )}
        </Section>

        {/* Đơn hàng */}
        <Section title={`Đơn hàng${orders.length ? ` · ${orders.length}` : ""}`}>
          {orders.length === 0 ? (
            <div className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed py-6 text-center">
              <Package className="size-5 text-muted-foreground" aria-hidden />
              <p className="text-xs text-muted-foreground">Khách chưa có đơn nào</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {orders.map((o) => {
                const pay = paymentByOrder.get(o.id);
                const paid = pay?.status === "paid";
                const itemCount = o.items.reduce((n, it) => n + it.qty, 0);
                const st = ORDER_STATUS[o.status];
                return (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() => onOpenOrder(o.id)}
                      className="w-full rounded-lg px-3 py-2.5 text-left ring-1 ring-foreground/10 transition-colors hover:bg-muted/60 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className={cn("size-1.5 shrink-0 rounded-full", st.dot)} aria-hidden />
                        <span className="text-sm font-medium tabular-nums">{o.id}</span>
                        <span className="text-xs text-muted-foreground">{st.label}</span>
                        <span className="ml-auto text-sm font-semibold tabular-nums">{formatVND(o.total)}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="tabular-nums">{itemCount} sản phẩm</span>
                        <span aria-hidden>·</span>
                        <span className="truncate">{DELIVERY_LABEL[o.deliveryStatus] ?? o.deliveryStatus}</span>
                        <span
                          className={cn(
                            "ml-auto flex shrink-0 items-center gap-0.5 font-medium",
                            paid ? "text-emerald-600" : "text-amber-600",
                          )}
                        >
                          {paid ? <Check className="size-3" aria-hidden /> : <Clock className="size-3" aria-hidden />}
                          {paid ? "Đã thanh toán" : "Chờ thanh toán"}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        {/* Timeline */}
        <Section title="Hoạt động gần đây">
          <div className="space-y-4">
            {timelineDays.map((group) => (
              <div key={group.day}>
                <p className="mb-2 text-[11px] font-medium tabular-nums text-muted-foreground/80">{group.label}</p>
                <ol className="relative space-y-3 before:absolute before:bottom-3 before:left-[13.5px] before:top-3 before:w-px before:bg-border">
                  {group.events.map((ev) => {
                    const Icon = ev.icon;
                    return (
                      <li key={ev.key} className="relative flex gap-2.5">
                        <span
                          aria-hidden
                          className={cn(
                            "z-10 mt-px flex size-7 shrink-0 items-center justify-center rounded-full ring-1",
                            TONE_RING[ev.tone],
                          )}
                        >
                          <Icon className="size-3.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="truncate text-sm font-medium leading-tight">{ev.title}</p>
                            <time className="shrink-0 text-[11px] tabular-nums text-muted-foreground/70">{hhmm(ev.iso)}</time>
                          </div>
                          {ev.detail ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{ev.detail}</p> : null}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
