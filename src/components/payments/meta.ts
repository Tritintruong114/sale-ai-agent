import {
  Banknote,
  Check,
  CreditCard,
  QrCode,
  Sparkles,
  ShieldQuestion,
  Wallet,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { Channel, TimelineEvent } from "@/components/orders/meta";

// M5 Thanh toán (HITL) — meta dùng chung cho màn. Bám hệ màu §5 design.md:
// chip = bg-{hue}-100 text-{hue}-700 · dot = bg-{hue}-500 · tint = border-{hue}-500/30 bg-{hue}-500/10.
// pending=amber (cần duyệt) · sent=orange (đã gửi QR, chờ khách trả) · paid=emerald (đã thu) · rejected=destructive.

export type PayStatus = "awaiting" | "paid";
export type Gate = "pending" | "approved" | "rejected";

// Bản ghi gốc trong payments.json (channel/createdAt join từ orders.json).
export type PaymentSeed = {
  id: string;
  orderId: string;
  customerName: string;
  channel: Channel;
  amount: number;
  status: PayStatus;
  needsApproval: boolean;
  reason: string | null;
  createdAt: string;
};

// Bản ghi runtime: thêm gate (bước duyệt HITL).
export type Payment = PaymentSeed & {
  gate: Gate;
};

// Dựng queue runtime từ seed: cần duyệt thì gate=pending, còn lại approved sẵn (tất định, §nguyên tắc 4).
export function toPayment(p: PaymentSeed): Payment {
  return { ...p, gate: p.needsApproval ? "pending" : "approved" };
}

// Trạng thái hiển thị suy ra từ (status, gate) — tất định, một nguồn cho badge/row/funnel.
// Không có bước "tạo link": duyệt xong (hoặc không cần duyệt) → agent tự gửi QR → khách trả → đã thu.
export type PayState = "paid" | "rejected" | "pending" | "sent";

export function payState(p: Payment): PayState {
  if (p.status === "paid") return "paid";
  if (p.gate === "rejected") return "rejected";
  if (p.gate === "pending") return "pending";
  return "sent";
}

// Thứ tự phễu thu tiền (sắp xếp + breakdown): chờ duyệt → đã gửi QR → đã thu → từ chối.
export const PAY_STATE_ORDER: PayState[] = ["pending", "sent", "paid", "rejected"];

// Badge/row mỗi trạng thái — màu luôn kèm nhãn + icon (§nguyên tắc 2). dot dùng cho funnel bar + filter.
export const PAY_STATE_META: Record<
  PayState,
  { label: string; icon: LucideIcon; chip: string; dot: string; tint: string }
> = {
  pending: {
    label: "Chờ bạn duyệt",
    icon: ShieldQuestion,
    chip: "bg-amber-100 text-amber-800",
    dot: "bg-amber-500",
    tint: "border-amber-500/30 bg-amber-500/10",
  },
  sent: {
    label: "Đã gửi QR",
    icon: QrCode,
    chip: "bg-orange-100 text-orange-700",
    dot: "bg-orange-500",
    tint: "border-orange-500/30 bg-orange-500/10",
  },
  paid: {
    label: "Đã thanh toán",
    icon: Check,
    chip: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
    tint: "border-emerald-500/30 bg-emerald-500/10",
  },
  rejected: {
    label: "Đã từ chối",
    icon: XCircle,
    chip: "bg-destructive/10 text-destructive",
    dot: "bg-destructive",
    tint: "border-destructive/30 bg-destructive/10",
  },
};

// Icon cho dải KPI §6.5 (đồng bộ OrderKpis).
export const KPI_ICON = { approval: ShieldQuestion, awaiting: Wallet, paid: Banknote, collected: Banknote } as const;

// ── Chi tiết khoản thu (panel docked §6.13) ────────────────────────────────
// Cộng phút vào chuỗi ISO theo giờ-trên-đồng-hồ, giữ nguyên offset +07:00 (tất định, không lệ thuộc TZ
// máy chạy — coi wall-clock như UTC để cộng rồi format thủ công, §nguyên tắc 4 hydrate ổn định).
function shiftIso(iso: string, addMin: number): string {
  const t =
    Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10), +iso.slice(11, 13), +iso.slice(14, 16)) +
    addMin * 60_000;
  const d = new Date(t);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:00+07:00`;
}

// Diễn biến khoản thu — suy tất định từ (createdAt, needsApproval, gate, status). Mới nhất KHÔNG đảo ở đây;
// panel tự sắp khi render (đồng bộ OrderDetailPanel). Mốc giờ giả lập bằng offset cố định từ createdAt.
export function paymentTimeline(p: Payment): TimelineEvent[] {
  const events: TimelineEvent[] = [{ at: p.createdAt, label: "Agent tạo khoản thu", tone: "sky" }];
  const state = payState(p);

  if (p.needsApproval) {
    if (p.gate === "pending") {
      events.push({ at: shiftIso(p.createdAt, 1), label: "Chờ bạn duyệt (đơn lớn / hoàn tiền)", tone: "amber" });
    } else if (p.gate === "approved") {
      events.push({ at: shiftIso(p.createdAt, 6), label: "Bạn đã duyệt khoản thu", tone: "sky" });
    } else {
      events.push({ at: shiftIso(p.createdAt, 6), label: "Bạn đã từ chối khoản thu", tone: "rose" });
    }
  }
  if (state === "sent" || state === "paid") {
    events.push({ at: shiftIso(p.createdAt, p.needsApproval ? 8 : 2), label: "Agent gửi QR cho khách", tone: "orange" });
  }
  if (state === "paid") {
    events.push({ at: shiftIso(p.createdAt, p.needsApproval ? 20 : 14), label: "Khách đã thanh toán", tone: "emerald" });
  }
  return events;
}

// Icon mốc timeline khoản thu suy từ nhãn (tất định, không lưu icon trong data — như orders/timelineIcon).
export function paymentTimelineIcon(label: string): LucideIcon {
  if (label.includes("thanh toán")) return Check;
  if (label.includes("QR")) return QrCode;
  if (label.includes("duyệt")) return ShieldQuestion;
  if (label.includes("từ chối")) return X;
  if (label.includes("tạo")) return Sparkles;
  return CreditCard;
}

// Tài khoản nhận của shop (mock) — nội dung mà QR mã hoá để khách chuyển khoản.
export const SHOP_BANK = { bank: "Vietcombank", accountNo: "0071000812345", holder: "CONG TY TNHH ABC" } as const;

// Nội dung chuyển khoản (memo) gắn theo đơn — khách giữ nguyên để hệ thống tự khớp.
export const payMemo = (p: Payment) => `TT ${p.orderId.toUpperCase()}`;

// Lưới ô giả-QR tất định từ seed (FNV-1a + xorshift) — dựng hình QR có thật mà không cần thư viện sinh mã.
export function qrCells(seed: string, n = 21): boolean[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const out: boolean[] = [];
  for (let i = 0; i < n * n; i++) {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    out.push((h >>> 0) % 100 < 48);
  }
  return out;
}
