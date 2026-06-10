import {
  Check,
  Clock,
  CreditCard,
  Package,
  PackageCheck,
  ShieldQuestion,
  ShoppingBag,
  Sparkles,
  Truck,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import conversationsRaw from "@/data/conversations.json";

// M2 — meta dùng chung cho màn Quản lý đơn. Bám hệ màu §5 design.md:
// chip = bg-{hue}-100 text-{hue}-700 · dot = bg-{hue}-500 · tint trigger = border-{hue}-500/30 bg-{hue}-500/10.

export type OrderStatus = "new" | "processing" | "done";
export type Approval = "auto" | "pending" | "confirmed" | "rejected";
export type DeliveryStatus = "pending" | "packing" | "delivered";
export type PaymentStatus = "awaiting" | "paid";
export type Channel = "facebook" | "zalo";
export type Tone = "sky" | "indigo" | "amber" | "emerald" | "orange" | "rose";

export type TimelineEvent = { at: string; label: string; tone: Tone };

export type OrderItem = { productId: string; name: string; qty: number; price: number };

export type Order = {
  id: string;
  conversationId: string;
  customerName: string;
  channel: Channel;
  status: OrderStatus;
  deliveryStatus: DeliveryStatus;
  paymentStatus: PaymentStatus;
  total: number;
  approval: Approval;
  address: string;
  note: string | null;
  items: OrderItem[];
  createdAt: string;
  timeline: TimelineEvent[];
};

// Trạng thái đơn (trục Kanban). icon + chip + dot + tint cho trigger lọc.
export const ORDER_STATUS: Record<
  OrderStatus,
  { label: string; icon: LucideIcon; cls: string; dot: string; tint: string }
> = {
  new: { label: "Mới", icon: Sparkles, cls: "bg-sky-100 text-sky-700", dot: "bg-sky-500", tint: "border-sky-500/30 bg-sky-500/10" },
  processing: { label: "Đang xử lý", icon: Package, cls: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-500", tint: "border-indigo-500/30 bg-indigo-500/10" },
  done: { label: "Hoàn tất", icon: Check, cls: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", tint: "border-emerald-500/30 bg-emerald-500/10" },
};

export const ORDER_STATUS_ORDER: OrderStatus[] = ["new", "processing", "done"];

// Trạng thái tư vấn = phễu hội thoại (Inbox §5.2), nguồn từ conversations.json join qua conversationId.
// Chỉ đọc (chip dot + nhãn) — quá trình agent tư vấn khách, khác trục đơn hàng (new/processing/done).
export type ConsultStatus = "new" | "exploring" | "quoted" | "awaiting_payment" | "closed";

export const CONSULT_STATUS: Record<ConsultStatus, { label: string; cls: string; dot: string }> = {
  new: { label: "Mới", cls: "bg-sky-100 text-sky-700", dot: "bg-sky-500" },
  exploring: { label: "Tìm hiểu", cls: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-500" },
  quoted: { label: "Đã báo giá", cls: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  awaiting_payment: { label: "Chờ thanh toán", cls: "bg-orange-100 text-orange-700", dot: "bg-orange-500" },
  closed: { label: "Đã chốt", cls: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
};

const CONSULT_BY_CONVERSATION: Record<string, ConsultStatus> = Object.fromEntries(
  (conversationsRaw.conversations as { id: string; status: ConsultStatus }[]).map((c) => [c.id, c.status]),
);

// null khi đơn chưa gắn hội thoại (hiển thị "—").
export const consultStatusOf = (conversationId: string): ConsultStatus | null =>
  CONSULT_BY_CONVERSATION[conversationId] ?? null;

// Chuyển trạng thái tiến tới (advance).
export const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  new: "processing",
  processing: "done",
  done: null,
};

// Nhãn CTA theo ý định hành động của chủ shop (không mô tả cơ chế "chuyển sang X").
export const ADVANCE_LABEL: Record<OrderStatus, string | null> = {
  new: "Bắt đầu xử lý",
  processing: "Đánh dấu hoàn tất",
  done: null,
};

// Duyệt (HITL) — giữ đúng quy ước cũ: auto=emerald, pending=amber, confirmed=sky, rejected=destructive.
export const APPROVAL_META: Record<Approval, { label: string; icon: LucideIcon; cls: string }> = {
  auto: { label: "Agent đã chốt", icon: Sparkles, cls: "bg-emerald-100 text-emerald-700" },
  pending: { label: "Chờ bạn duyệt", icon: ShieldQuestion, cls: "bg-amber-100 text-amber-800" },
  confirmed: { label: "Bạn đã duyệt", icon: Check, cls: "bg-sky-100 text-sky-700" },
  rejected: { label: "Đã từ chối", icon: XCircle, cls: "bg-destructive/10 text-destructive" },
};

export const APPROVAL_FILTERS: { key: Approval | "all"; label: string }[] = [
  { key: "all", label: "Mọi trạng thái duyệt" },
  { key: "pending", label: "Chờ bạn duyệt" },
  { key: "auto", label: "Agent đã chốt" },
  { key: "confirmed", label: "Bạn đã duyệt" },
  { key: "rejected", label: "Đã từ chối" },
];

// Vận chuyển — chip (cls) + dot + tint cho trigger dropdown đổi tình trạng ngay trong bảng.
export const DELIVERY_META: Record<
  DeliveryStatus,
  { label: string; icon: LucideIcon; cls: string; dot: string; tint: string }
> = {
  pending: { label: "Chờ lấy hàng", icon: Clock, cls: "bg-amber-100 text-amber-700", dot: "bg-amber-500", tint: "border-amber-500/30 bg-amber-500/10" },
  packing: { label: "Đang đóng gói", icon: Package, cls: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-500", tint: "border-indigo-500/30 bg-indigo-500/10" },
  delivered: { label: "Đã giao", icon: PackageCheck, cls: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", tint: "border-emerald-500/30 bg-emerald-500/10" },
};

export const DELIVERY_STATUS_ORDER: DeliveryStatus[] = ["pending", "packing", "delivered"];

// Thanh toán — awaiting=orange (đậm hơn amber), paid=emerald (§5.1).
export const PAYMENT_META: Record<PaymentStatus, { label: string; short: string; icon: LucideIcon; cls: string; text: string }> = {
  awaiting: { label: "Chờ thanh toán", short: "Chờ TT", icon: Clock, cls: "bg-orange-100 text-orange-700", text: "text-orange-600" },
  paid: { label: "Đã thanh toán", short: "Đã TT", icon: Check, cls: "bg-emerald-100 text-emerald-700", text: "text-emerald-600" },
};

// Chấm tròn timeline §6.8 — map tone → ring class (mở rộng từ CustomerPanel TONE_RING).
export const TONE_RING: Record<Tone, string> = {
  sky: "bg-sky-100 text-sky-700 ring-sky-200",
  indigo: "bg-indigo-100 text-indigo-700 ring-indigo-200",
  amber: "bg-amber-100 text-amber-700 ring-amber-200",
  emerald: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  orange: "bg-orange-100 text-orange-700 ring-orange-200",
  rose: "bg-rose-100 text-rose-700 ring-rose-200",
};

// Icon mốc timeline suy từ nhãn (tất định, không cần lưu icon trong data).
export function timelineIcon(label: string): LucideIcon {
  if (label.includes("thanh toán")) return CreditCard;
  if (label.includes("giao")) return Truck;
  if (label.includes("đóng gói")) return Package;
  if (label.includes("duyệt")) return Check;
  if (label.includes("từ chối")) return X;
  return ShoppingBag;
}

export const CHANNEL_LABEL: Record<Channel, string> = { facebook: "Facebook", zalo: "Zalo" };

// Thời gian cắt thẳng từ chuỗi ISO (+07) — tất định, tránh lệch hydrate (§ nguyên tắc 4).
export const hhmm = (iso: string) => iso.slice(11, 16);
export const dmy = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
export const dateTime = (iso: string) => `${dmy(iso)} · ${hhmm(iso)}`;

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export function itemCount(o: Order): number {
  return o.items.reduce((n, it) => n + it.qty, 0);
}
