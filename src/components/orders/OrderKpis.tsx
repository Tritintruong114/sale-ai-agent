import { Banknote, Package, ShieldQuestion, Sparkles, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { compactVND } from "@/lib/format";
import type { Order } from "./meta";

// Dải KPI §6.5 — tóm tắt nhanh tình hình đơn. Số liệu suy từ orders (tất định).

type Kpi = { key: string; label: string; value: string; icon: LucideIcon; chip: string; accent?: boolean };

export function OrderKpis({ orders }: { orders: Order[] }) {
  const isNew = orders.filter((o) => o.status === "new").length;
  const processing = orders.filter((o) => o.status === "processing").length;
  const pending = orders.filter((o) => o.approval === "pending").length;
  const collected = orders.filter((o) => o.paymentStatus === "paid").reduce((s, o) => s + o.total, 0);

  const kpis: Kpi[] = [
    { key: "new", label: "Đơn mới", value: String(isNew), icon: Sparkles, chip: "bg-sky-100 text-sky-700" },
    { key: "processing", label: "Đang xử lý", value: String(processing), icon: Package, chip: "bg-indigo-100 text-indigo-700" },
    { key: "pending", label: "Chờ duyệt", value: String(pending), icon: ShieldQuestion, chip: "bg-amber-100 text-amber-700", accent: pending > 0 },
    { key: "collected", label: "Đã thu", value: compactVND(collected), icon: Banknote, chip: "bg-emerald-100 text-emerald-700" },
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
            <p className={cn("truncate text-lg font-semibold leading-tight tabular-nums lg:text-xl", k.accent && "text-amber-600")}>{k.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
