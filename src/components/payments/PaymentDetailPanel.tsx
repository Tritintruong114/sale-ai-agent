import { ArrowRight, CalendarClock, Check, QrCode, ShieldQuestion, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatVND } from "@/lib/format";
import { ChannelMark, channelTitle } from "@/components/orders/bits";
import { dateTime, TONE_RING } from "@/components/orders/meta";
import {
  PAY_STATE_META,
  SHOP_BANK,
  payMemo,
  payState,
  paymentTimeline,
  paymentTimelineIcon,
  qrCells,
  type Payment,
} from "./meta";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2.5">
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

function StateChip({ p }: { p: Payment }) {
  const m = PAY_STATE_META[payState(p)];
  const Icon = m.icon;
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", m.chip)}>
      <Icon className="size-3" aria-hidden />
      {m.label}
    </span>
  );
}

// Ô định vị QR (finder pattern) — khai báo ngoài render để không tạo component mỗi lần vẽ.
function QrFinder({ className }: { className: string }) {
  return (
    <span className={cn("absolute size-[28%] rounded-[3px] border-[5px] border-foreground bg-background", className)}>
      <span className="absolute inset-[3px] rounded-[1px] bg-foreground" />
    </span>
  );
}

// Mã QR mock — lưới ô tất định (qrCells) + 3 ô định vị 4 góc cho ra dáng QR thật. Chỉ trang trí, không quét được.
function QrGlyph({ seed }: { seed: string }) {
  const n = 21;
  const cells = qrCells(seed, n);
  return (
    <div className="relative aspect-square w-40 rounded-lg bg-background p-2 ring-1 ring-foreground/15">
      <div className="grid size-full gap-px" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }} aria-hidden>
        {cells.map((on, i) => (
          <span key={i} className={cn("rounded-[1px]", on ? "bg-foreground" : "bg-transparent")} />
        ))}
      </div>
      {/* Ô định vị che 3 góc */}
      <QrFinder className="left-2 top-2" />
      <QrFinder className="right-2 top-2" />
      <QrFinder className="bottom-2 left-2" />
    </div>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-right font-medium">{value}</span>
    </div>
  );
}

// Panel chi tiết khoản thu — docked phải (không overlay), bám OrderDetailPanel. Duyệt HITL (khi pending) +
// nội dung QR (khi đã gửi / đã thu) + timeline log + hành động (đánh dấu đã nhận tiền · mở đơn).

export function PaymentDetailPanel({
  payment,
  onClose,
  onApprove,
  onReject,
  onMarkPaid,
  onOpenOrder,
}: {
  payment: Payment;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onMarkPaid: (id: string) => void;
  onOpenOrder: (orderId: string) => void;
}) {
  const state = payState(payment);
  const showQr = state === "sent" || state === "paid";
  // timeline mới nhất lên đầu (ISO cùng định dạng → so sánh chuỗi).
  const events = [...paymentTimeline(payment)].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="flex items-start gap-2 border-b p-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold leading-tight">{payment.customerName}</p>
            <StateChip p={payment} />
          </div>
          <p className="mt-0.5 flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
            <ChannelMark channel={payment.channel} className="size-3.5 shrink-0" />
            {payment.orderId} · {channelTitle(payment.channel)} · {dateTime(payment.createdAt)}
          </p>
        </div>
        <Button variant="ghost" size="icon-sm" className="-mr-1 -mt-1" onClick={onClose} aria-label="Đóng chi tiết khoản thanh toán">
          <X />
        </Button>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-auto p-4">
        {/* Số tiền */}
        <div className="flex items-baseline justify-between rounded-lg bg-muted/50 px-3 py-2.5">
          <span className="text-sm text-muted-foreground">Số tiền cần thanh toán</span>
          <span className="text-lg font-semibold tabular-nums">{formatVND(payment.amount)}</span>
        </div>

        {/* Duyệt (HITL) — khi đang chờ duyệt */}
        {state === "pending" ? (
          <div className="space-y-2 rounded-lg bg-amber-50 px-3 py-2.5 ring-1 ring-amber-200">
            <p className="flex items-start gap-2 text-xs text-amber-800">
              <ShieldQuestion className="mt-0.5 size-3.5 shrink-0 text-amber-600" aria-hidden />
              {payment.reason ?? "Khoản này cần bạn duyệt trước khi agent gửi QR cho khách."}
            </p>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" onClick={() => onApprove(payment.id)}>
                <Check className="size-3.5" aria-hidden />
                Duyệt, gửi QR
              </Button>
              <Button size="sm" variant="destructive" className="flex-1" onClick={() => onReject(payment.id)}>
                <X className="size-3.5" aria-hidden />
                Từ chối
              </Button>
            </div>
          </div>
        ) : null}

        {/* Nội dung QR — khi đã gửi (chờ khách trả) hoặc đã thu */}
        {showQr ? (
          <Section title="Mã QR chuyển khoản đã gửi">
            <div className="flex flex-col items-center gap-3 rounded-lg border border-foreground/10 bg-card p-3">
              <QrGlyph seed={`${payment.id}-${payment.orderId}-${payment.amount}`} />
              <div className="w-full space-y-1.5 border-t pt-3">
                <CopyRow label="Ngân hàng" value={SHOP_BANK.bank} />
                <CopyRow label="Số tài khoản" value={SHOP_BANK.accountNo} />
                <CopyRow label="Chủ tài khoản" value={SHOP_BANK.holder} />
                <CopyRow label="Số tiền" value={formatVND(payment.amount)} />
                <CopyRow label="Nội dung CK" value={payMemo(payment)} />
              </div>
            </div>
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <QrCode className="size-3 shrink-0" aria-hidden />
              {state === "paid"
                ? "Khách đã thanh toán theo mã này."
                : "Khách quét mã để chuyển khoản — hệ thống tự khớp theo nội dung CK."}
            </p>
          </Section>
        ) : null}

        {/* Timeline log */}
        <Section title="Diễn biến thanh toán">
          <ol className="relative space-y-3.5 before:absolute before:bottom-2 before:left-[15px] before:top-2 before:w-px before:bg-border">
            {events.map((ev, i) => {
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
      </div>

      {/* Hành động */}
      <div className="space-y-2 border-t bg-muted/30 p-3">
        {state === "sent" ? (
          <Button className="w-full" onClick={() => onMarkPaid(payment.id)}>
            <Check className="size-4" aria-hidden />
            Đã nhận tiền
          </Button>
        ) : null}
        <Button variant="outline" className="w-full" onClick={() => onOpenOrder(payment.orderId)}>
          Xem đơn {payment.orderId}
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
