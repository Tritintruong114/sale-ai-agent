import {
  ArrowRight,
  CalendarClock,
  Check,
  CreditCard,
  MapPin,
  MessageSquare,
  StickyNote,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatVND } from "@/lib/format";
import { ApprovalChip, DeliveryChip, PaymentChip, StatusChip, channelTitle } from "./bits";
import {
  ADVANCE_LABEL,
  NEXT_STATUS,
  TONE_RING,
  dateTime,
  timelineIcon,
  type Approval,
  type Order,
} from "./meta";
import { paymentForOrder, paymentTimeline } from "@/lib/orderPayment";
import { PAY_STATE_META, payState, paymentTimelineIcon } from "@/components/payments/meta";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2.5">
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

// Panel chi tiết đơn — docked bên phải (không overlay). Timeline §6.8 + hàng + khách + TT + VC + hành động.

export function OrderDetailPanel({
  order,
  onClose,
  onDecide,
  onAdvance,
  onViewConversation,
  onViewPayment,
}: {
  order: Order;
  onClose: () => void;
  onDecide: (id: string, approval: Approval) => void;
  onAdvance: (id: string) => void;
  onViewConversation: (conversationId: string) => void;
  onViewPayment: (paymentId: string) => void;
}) {
  const next = NEXT_STATUS[order.status];
  const canAdvance = next && order.approval !== "pending" && order.approval !== "rejected";

  // Khoản thu liên kết (nguồn chung) — quyết định chip trạng thái + diễn biến thanh toán, khớp màn Thanh toán.
  const payment = paymentForOrder(order.id);
  const payMeta = payment ? PAY_STATE_META[payState(payment)] : null;
  // Diễn biến đơn = chỉ mốc vòng đời đơn; mốc thanh toán đẩy sang mục "Diễn biến thanh toán" để khỏi kể trùng/lệch.
  const events = [...order.timeline]
    .filter((e) => !e.label.toLowerCase().includes("thanh toán"))
    .sort((a, b) => b.at.localeCompare(a.at));
  const payEvents = payment ? [...paymentTimeline(payment)].sort((a, b) => b.at.localeCompare(a.at)) : [];

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="flex items-start gap-2 border-b p-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold leading-tight">{order.customerName}</p>
            <StatusChip status={order.status} />
          </div>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
            {order.id} · {channelTitle(order.channel)} · {dateTime(order.createdAt)}
          </p>
        </div>
        <Button variant="ghost" size="icon-sm" className="-mr-1 -mt-1" onClick={onClose} aria-label="Đóng chi tiết đơn">
          <X />
        </Button>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-auto p-4">
        {/* Duyệt (HITL) */}
        {order.approval === "pending" ? (
          <div className="space-y-2 rounded-lg bg-amber-50 px-3 py-2.5 ring-1 ring-amber-200">
            <p className="text-xs text-amber-800">
              Đơn cần bạn duyệt trước khi xử lý.
            </p>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" onClick={() => onDecide(order.id, "confirmed")}>
                <Check className="size-3.5" aria-hidden />
                Duyệt đơn
              </Button>
              <Button size="sm" variant="destructive" className="flex-1" onClick={() => onDecide(order.id, "rejected")}>
                <X className="size-3.5" aria-hidden />
                Từ chối
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5">
            <ApprovalChip approval={order.approval} />
            {/* Trạng thái thu tiền lấy từ khoản thu liên kết → cùng nhãn với màn Thanh toán
                (Chờ bạn duyệt · Đã gửi QR · Đã thanh toán · Đã từ chối). Fallback chip cũ nếu chưa có khoản thu. */}
            {payMeta ? (
              <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", payMeta.chip)}>
                <payMeta.icon className="size-3" aria-hidden />
                {payMeta.label}
              </span>
            ) : (
              <PaymentChip status={order.paymentStatus} />
            )}
            <DeliveryChip status={order.deliveryStatus} />
          </div>
        )}

        {/* Sản phẩm */}
        <Section title="Sản phẩm">
          <ul className="space-y-2">
            {order.items.map((it) => (
              <li key={it.productId} className="flex items-start justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{it.name}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formatVND(it.price)} × {it.qty}
                  </span>
                </span>
                <span className="shrink-0 font-medium tabular-nums">{formatVND(it.price * it.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t pt-2.5">
            <span className="text-sm text-muted-foreground">Tổng đơn</span>
            <span className="text-base font-semibold tabular-nums">{formatVND(order.total)}</span>
          </div>
        </Section>

        {/* Giao hàng */}
        <Section title="Giao hàng">
          <div className="flex items-start gap-2.5 text-sm">
            <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="text-foreground/90">{order.address}</span>
          </div>
          {order.note ? (
            <p className="flex items-start gap-2.5 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900 ring-1 ring-amber-100">
              <StickyNote className="mt-0.5 size-3.5 shrink-0 text-amber-600" aria-hidden />
              {order.note}
            </p>
          ) : null}
        </Section>

        {/* Timeline — vòng đời đơn (đã tách mốc thanh toán sang mục dưới) */}
        <Section title="Hoạt động">
          <ol className="relative space-y-3.5 before:absolute before:bottom-2 before:left-[15px] before:top-2 before:w-px before:bg-border">
            {events.map((ev, i) => {
              const Icon = timelineIcon(ev.label);
              return (
                <li key={`${ev.at}-${i}`} className="relative flex gap-3">
                  <span
                    aria-hidden
                    className={cn("z-10 flex size-8 shrink-0 items-center justify-center rounded-full ring-1", TONE_RING[ev.tone])}
                  >
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-sm font-medium leading-tight">{ev.label}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] tabular-nums text-muted-foreground/80">
                      <CalendarClock className="size-3" aria-hidden />
                      {dateTime(ev.at)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </Section>

        {/* Diễn biến thanh toán — CÙNG nguồn & cách hiển thị với panel Thanh toán (khớp tuyệt đối). */}
        {/* {payment ? (
          <Section title="Hoạt động">
            <ol className="relative space-y-3.5 before:absolute before:bottom-2 before:left-[15px] before:top-2 before:w-px before:bg-border">
              {payEvents.map((ev, i) => {
                const Icon = paymentTimelineIcon(ev.label);
                return (
                  <li key={`${ev.at}-${i}`} className="relative flex gap-3">
                    <span
                      aria-hidden
                      className={cn("z-10 flex size-8 shrink-0 items-center justify-center rounded-full ring-1", TONE_RING[ev.tone])}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="text-sm font-medium leading-tight">{ev.label}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] tabular-nums text-muted-foreground/80">
                        <CalendarClock className="size-3" aria-hidden />
                        {dateTime(ev.at)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Section>
        ) : null} */}
      </div>

      {/* Hành động */}
      <div className="space-y-2 border-t bg-muted/30 p-3">
        {canAdvance ? (
          <Button className="w-full" onClick={() => onAdvance(order.id)}>
            {ADVANCE_LABEL[order.status]}
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        ) : null}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => onViewConversation(order.conversationId)}>
            <MessageSquare className="size-4" aria-hidden />
            Xem hội thoại
          </Button>
          {payment ? (
            <Button variant="outline" className="flex-1" onClick={() => onViewPayment(payment.id)}>
              <CreditCard className="size-4" aria-hidden />
              Xem giao dịch
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
