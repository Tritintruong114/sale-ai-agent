import { Check, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { compactVND } from "@/lib/format";
import { KPI_ICON, payState, type Payment } from "./meta";

// Dải KPI §6.5 — phễu thu tiền: Cần duyệt → Chờ thu → Đã TT → Tiền đã thu. Số liệu suy từ queue (tất định).

type Kpi = { key: string; label: string; value: string; icon: LucideIcon; chip: string; accent?: boolean };

export function PaymentKpis({ queue }: { queue: Payment[] }) {
  const states = queue.map(payState);
  const pending = states.filter((s) => s === "pending").length;
  const awaiting = states.filter((s) => s === "sent").length;
  const paidList = queue.filter((p) => payState(p) === "paid");
  const collected = paidList.reduce((s, p) => s + p.amount, 0);

  const kpis: Kpi[] = [
    { key: "approval", label: "Cần bạn duyệt", value: String(pending), icon: KPI_ICON.approval, chip: "bg-amber-100 text-amber-700", accent: pending > 0 },
    { key: "awaiting", label: "Chờ thanh toán", value: String(awaiting), icon: KPI_ICON.awaiting, chip: "bg-orange-100 text-orange-700" },
    { key: "paid", label: "Đã thanh toán", value: String(paidList.length), icon: Check, chip: "bg-emerald-100 text-emerald-700" },
    { key: "collected", label: "Tiền đã nhận", value: compactVND(collected), icon: KPI_ICON.collected, chip: "bg-emerald-100 text-emerald-700" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {kpis.map((k) => (
        <div
          key={k.key}
          className={cn(
            "flex items-center gap-2.5 rounded-xl bg-card px-3 py-2 ring-1",
            k.accent ? "ring-amber-300/70" : "ring-foreground/10",
          )}
        >
          <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", k.chip)} aria-hidden>
            <k.icon className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs text-muted-foreground">{k.label}</p>
            <p className={cn("truncate text-lg font-semibold leading-tight tabular-nums lg:text-xl", k.accent && "text-amber-600")}>
              {k.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
