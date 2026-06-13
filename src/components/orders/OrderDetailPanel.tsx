import {
  CalendarClock,
  Check,
  MapPin,
  MessageSquare,
  QrCode,
  RefreshCw,
  ShieldQuestion,
  StickyNote,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSetupStore } from "@/store/setupStore";
import { useHydrated } from "@/lib/useHydrated";
import { CRM_BY_KEY, crmOrderCode, type CrmKey } from "@/components/crm/meta";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatVND } from "@/lib/format";
import { ApprovalChip, StatusChip, channelTitle } from "./bits";
import {
  TONE_RING,
  dateTime,
  timelineIcon,
  type Approval,
  type Order,
  type Tone,
} from "./meta";
import {
  PAY_STATE_META,
  SHOP_BANK,
  payMemo,
  payState,
  paymentTimeline,
  shiftIso,
  type Payment,
} from "@/components/payments/meta";
import { QrGlyph } from "@/components/payments/QrGlyph";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2.5">
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      {children}
    </section>
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

// Panel chi tiết đơn — docked bên phải (không overlay). Thu tiền đã gộp vào đây (màn Giao dịch cũ scope out):
// chip + duyệt-gửi-QR / đánh dấu đã nhận tiền sống ngay đây; nội dung QR xem qua modal; diễn biến QR
// hợp nhất vào mục "Hoạt động" (một dòng thời gian kể đủ Agent đã làm gì).

export function OrderDetailPanel({
  order,
  payment,
  onClose,
  onDecide,
  onViewConversation,
  onApprovePayment,
  onRejectPayment,
  onMarkPaid,
}: {
  order: Order;
  payment: Payment | null;
  onClose: () => void;
  onDecide: (id: string, approval: Approval) => void;
  onViewConversation: (conversationId: string) => void;
  onApprovePayment: (orderId: string) => void;
  onRejectPayment: (orderId: string) => void;
  onMarkPaid: (orderId: string) => void;
}) {
  // CRM đã nối (persist) — đơn đã thu tiền sẽ được đẩy sang đây, mỗi hệ cấp một mã đơn riêng.
  // useHydrated: store rehydrate ở client, hoãn đọc tới sau mount để tránh lệch SSR ↔ client render đầu (§nguyên tắc 4).
  const crms = useSetupStore((s) => s.crms);
  const hydrated = useHydrated();
  const connectedCrms = hydrated ? (Object.keys(crms) as CrmKey[]).filter((k) => crms[k]) : [];

  const pay = payment ? payState(payment) : null;
  const payMeta = pay ? PAY_STATE_META[pay] : null;
  const showQr = pay === "sent" || pay === "paid";

  // Dòng thời gian MVP — chỉ hành trình "bộ não" Agent + thu tiền, kết bằng đồng bộ sang CRM đã nối. Cắt nghiệp vụ
  // kho vận (đóng gói/giao hàng → để CRM lo). Dedupe: mốc tạo & duyệt lấy từ timeline đơn, thu tiền
  // chỉ giữ gửi QR + khách đã thanh toán (qua SePay) để khỏi kể trùng với mốc đơn cùng thời điểm.
  const activity: { at: string; label: string; tone: Tone; Icon: LucideIcon; ref?: string }[] = [];
  for (const e of order.timeline) {
    const l = e.label.toLowerCase();
    if (l.includes("thanh toán") || l.includes("đóng gói") || l.includes("giao")) continue; // logistics + dup thu tiền
    activity.push({ at: e.at, label: e.label, tone: e.tone, Icon: timelineIcon(e.label) });
  }
  if (payment) {
    for (const e of paymentTimeline(payment)) {
      if (e.label.includes("QR")) activity.push({ at: e.at, label: e.label, tone: e.tone, Icon: QrCode });
      else if (e.label.includes("Khách"))
        activity.push({ at: e.at, label: "Khách đã thanh toán (qua SePay)", tone: e.tone, Icon: Check });
    }
  }
  // Kết nối CRM: Agent tạo đơn → đẩy sang CRM đã nối ngay, mỗi hệ cấp một mã đơn riêng (hiện kèm dòng hoạt động).
  // Đẩy từ lúc tạo đơn (không chờ duyệt/thu tiền) — CRM tạo đơn trước, cập nhật duyệt/thanh toán/kho vận sau.
  // Chỉ đơn bị từ chối là không đẩy. Chưa nối CRM nào: giữ mốc đồng bộ chung khi đã thu tiền.
  const pushedToCrm = order.approval !== "rejected";
  if (connectedCrms.length > 0 && pushedToCrm) {
    const syncAt = shiftIso(order.createdAt, 2); // CRM tạo đơn ngay sau khi Agent tạo đơn
    connectedCrms.forEach((key, idx) => {
      activity.push({
        at: shiftIso(syncAt, idx), // lệch 1 phút mỗi hệ để không trùng mốc
        label: `Đã tạo đơn trên ${CRM_BY_KEY[key].name}`,
        ref: crmOrderCode(key, order.id),
        tone: "indigo",
        Icon: RefreshCw,
      });
    });
  } else if (connectedCrms.length === 0 && pay === "paid" && pushedToCrm) {
    const paidAt = payment ? paymentTimeline(payment).find((e) => e.label.includes("Khách"))?.at : undefined;
    activity.push({
      at: paidAt ? shiftIso(paidAt, 3) : order.createdAt,
      label: "Đã đồng bộ sang phần mềm quản lý",
      tone: "indigo",
      Icon: RefreshCw,
    });
  }
  const merged = activity.sort((a, b) => b.at.localeCompare(a.at));

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
        {/* Duyệt đơn (HITL) */}
        {order.approval === "pending" ? (
          <div className="space-y-2 rounded-lg bg-amber-50 px-3 py-2.5 ring-1 ring-amber-200">
            <p className="text-xs text-amber-800">Đơn cần bạn duyệt trước khi xử lý.</p>
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

        {/* Giá trị đơn hàng — gộp từ màn Giao dịch cũ: số tiền + trạng thái thu + xem QR đã gửi (modal) + duyệt gửi QR (HITL). */}
        {payment && payMeta ? (
          <Section title="Giá trị đơn hàng">
            <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2.5">
              <div className="min-w-0">
                <span className="block text-sm font-medium tabular-nums">{formatVND(payment.amount)}</span>
                <span className={cn("mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", payMeta.chip)}>
                  <payMeta.icon className="size-3" aria-hidden />
                  {payMeta.label}
                </span>
              </div>
              {showQr ? (
                <Dialog>
                  <DialogTrigger render={<Button variant="outline" size="sm" className="shrink-0" />}>
                    <QrCode className="size-3.5" aria-hidden />
                    Xem QR đã gửi
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                      <DialogTitle>Mã QR chuyển khoản đã gửi</DialogTitle>
                      <DialogDescription>
                        Agent đã gửi mã này cho {payment.customerName} qua {channelTitle(payment.channel)}.
                      </DialogDescription>
                    </DialogHeader>
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
                  </DialogContent>
                </Dialog>
              ) : null}
            </div>

            {/* Duyệt gửi QR (HITL) — khi khoản đang chờ bạn duyệt. */}
            {pay === "pending" ? (
              <div className="space-y-2 rounded-lg bg-amber-50 px-3 py-2.5 ring-1 ring-amber-200">
                <p className="flex items-start gap-2 text-xs text-amber-800">
                  <ShieldQuestion className="mt-0.5 size-3.5 shrink-0 text-amber-600" aria-hidden />
                  {payment.reason ?? "Khoản này cần bạn duyệt trước khi agent gửi QR cho khách."}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => onApprovePayment(order.id)}>
                    <Check className="size-3.5" aria-hidden />
                    Duyệt, gửi QR
                  </Button>
                  <Button size="sm" variant="destructive" className="flex-1" onClick={() => onRejectPayment(order.id)}>
                    <X className="size-3.5" aria-hidden />
                    Từ chối
                  </Button>
                </div>
              </div>
            ) : null}
          </Section>
        ) : null}

        {/* Hoạt động — dòng thời gian hợp nhất vòng đời đơn + thu tiền (Agent đã làm gì). */}
        <Section title="Hoạt động">
          <ol className="relative space-y-3.5 before:absolute before:bottom-2 before:left-[15px] before:top-2 before:w-px before:bg-border">
            {merged.map((ev, i) => {
              const Icon = ev.Icon;
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
                    {ev.ref ? (
                      <p className="mt-1 inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                        Mã đơn: {ev.ref}
                      </p>
                    ) : null}
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
        {pay === "sent" ? (
          <Button className="w-full" onClick={() => onMarkPaid(order.id)}>
            <Check className="size-4" aria-hidden />
            Đã nhận tiền
          </Button>
        ) : null}
        <Button variant="outline" className="w-full" onClick={() => onViewConversation(order.conversationId)}>
          <MessageSquare className="size-4" aria-hidden />
          Xem hội thoại
        </Button>
      </div>
    </div>
  );
}
