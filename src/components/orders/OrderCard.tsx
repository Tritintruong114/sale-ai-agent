import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatVND } from "@/lib/format";
import { ApprovalChip, ChannelMark, DeliveryChip, PaymentChip } from "./bits";
import { ADVANCE_LABEL, NEXT_STATUS, hhmm, itemCount, type Order } from "./meta";

// Card đơn trong Board. Bấm thân card → mở panel chi tiết; nút hành động riêng (stopPropagation).

export function OrderCard({
  order,
  selected,
  onOpen,
  onAdvance,
}: {
  order: Order;
  selected: boolean;
  onOpen: (id: string) => void;
  onAdvance: (id: string) => void;
}) {
  const next = NEXT_STATUS[order.status];
  const canAdvance = next && order.approval !== "pending" && order.approval !== "rejected";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(order.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(order.id);
        }
      }}
      aria-label={`Đơn ${order.id} của ${order.customerName}`}
      className={cn(
        "group space-y-2.5 rounded-xl bg-card p-3 text-left ring-1 transition-colors cursor-pointer outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        selected ? "ring-2 ring-primary" : "ring-foreground/10 hover:bg-muted/50",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <ChannelMark channel={order.channel} className="mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{order.customerName}</p>
            <p className="font-mono text-[11px] text-muted-foreground">
              {order.id} · {hhmm(order.createdAt)}
            </p>
          </div>
        </div>
        <ApprovalChip approval={order.approval} />
      </div>

      <p className="line-clamp-2 text-xs text-muted-foreground">
        {order.items.map((it) => `${it.name} ×${it.qty}`).join(", ")}
      </p>

      <div className="flex items-center justify-between gap-2 border-t pt-2">
        <span className="text-xs text-muted-foreground">{itemCount(order)} sản phẩm</span>
        <span className="text-sm font-semibold tabular-nums">{formatVND(order.total)}</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <PaymentChip status={order.paymentStatus} />
        <DeliveryChip status={order.deliveryStatus} />
      </div>

      {canAdvance ? (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            onAdvance(order.id);
          }}
        >
          {ADVANCE_LABEL[order.status]}
          <ArrowRight className="size-3.5" aria-hidden />
        </Button>
      ) : null}
    </div>
  );
}
