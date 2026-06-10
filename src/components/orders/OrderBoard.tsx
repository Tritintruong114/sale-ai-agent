import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { OrderCard } from "./OrderCard";
import { ORDER_STATUS, ORDER_STATUS_ORDER, type Order } from "./meta";

// Board Kanban — 3 cột theo trục trạng thái. Từ md: mỗi cột cao bằng vùng làm việc và
// cuộn riêng (header cột cố định). Mobile: cả board cuộn chung do vùng cha. Cột rỗng → §6.6.

export function OrderBoard({
  orders,
  selectedId,
  onOpen,
  onAdvance,
}: {
  orders: Order[];
  selectedId: string | null;
  onOpen: (id: string) => void;
  onAdvance: (id: string) => void;
}) {
  return (
    <div className="grid gap-3 md:h-full md:grid-cols-3 md:items-stretch">
      {ORDER_STATUS_ORDER.map((key) => {
        const meta = ORDER_STATUS[key];
        const colOrders = orders.filter((o) => o.status === key);
        return (
          // Mỗi cột là 1 lane cao tự nhiên; cả trang cuộn chung.
          <section
            key={key}
            className="flex flex-col rounded-lg bg-muted/40 md:min-h-0"
            aria-labelledby={`col-${key}`}
          >
            <div className="flex shrink-0 items-center gap-2 px-3 pb-1.5 pt-3">
              <span className={cn("size-2 rounded-full", meta.dot)} aria-hidden />
              <h3 id={`col-${key}`} className="text-sm font-semibold">
                {meta.label}
              </h3>
              <span className="ml-auto rounded-full bg-background px-1.5 text-xs tabular-nums text-muted-foreground ring-1 ring-foreground/10">
                {colOrders.length}
              </span>
            </div>
            <div className="space-y-3 px-3 pb-3 pt-1 md:min-h-0 md:flex-1 md:overflow-y-auto">
              {colOrders.map((o) => (
                <OrderCard key={o.id} order={o} selected={o.id === selectedId} onOpen={onOpen} onAdvance={onAdvance} />
              ))}
              {colOrders.length === 0 ? (
                <div className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed py-8 text-center">
                  <Inbox className="size-5 text-muted-foreground" aria-hidden />
                  <p className="text-xs text-muted-foreground">Chưa có đơn</p>
                </div>
              ) : null}
            </div>
          </section>
        );
      })}
    </div>
  );
}
