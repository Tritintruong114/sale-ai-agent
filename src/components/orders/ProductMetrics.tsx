"use client";

import { useMemo } from "react";
import { Banknote, Boxes, Package, TrendingUp, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { compactVND, formatVND } from "@/lib/format";
import type { Order } from "./meta";

// M2 Chỉ số — Hiệu quả sản phẩm. Gộp line-item của các đơn (loại đơn đã từ chối) thành chỉ số
// theo từng sản phẩm: số lượng bán, doanh thu, số đơn. Dải tóm tắt + 2 chart cạnh nhau
// (Doanh thu · Số lượng) để xem cả 2 trục cùng lúc. Tất định (§ nguyên tắc 4), bám hệ màu §5 + §6.

type Metric = "revenue" | "units";

type ProductStat = {
  productId: string;
  name: string;
  units: number;
  revenue: number;
  orders: number;
};

// Trục xếp hạng — emerald = doanh thu (đã chốt/đã thu, §5), indigo = số lượng (khối lượng bán).
const METRIC_META: Record<Metric, { title: string; icon: LucideIcon; bar: string }> = {
  revenue: { title: "Doanh thu theo sản phẩm", icon: Banknote, bar: "bg-emerald-500" },
  units: { title: "Số lượng bán theo sản phẩm", icon: Package, bar: "bg-indigo-500" },
};

export function ProductMetrics({ orders }: { orders: Order[] }) {
  // Đơn đã từ chối không tính là đã bán.
  const stats = useMemo<ProductStat[]>(() => {
    const map = new Map<string, ProductStat>();
    for (const o of orders) {
      if (o.approval === "rejected") continue;
      for (const it of o.items) {
        const cur =
          map.get(it.productId) ??
          { productId: it.productId, name: it.name, units: 0, revenue: 0, orders: 0 };
        cur.units += it.qty;
        cur.revenue += it.qty * it.price;
        cur.orders += 1; // mỗi sản phẩm xuất hiện tối đa 1 dòng/đơn → đếm số đơn chứa sản phẩm
        map.set(it.productId, cur);
      }
    }
    return [...map.values()];
  }, [orders]);

  const totalRevenue = stats.reduce((s, p) => s + p.revenue, 0);
  const totalUnits = stats.reduce((s, p) => s + p.units, 0);

  const summary = [
    { key: "revenue", label: "Doanh thu sản phẩm", value: compactVND(totalRevenue), icon: Banknote },
    { key: "units", label: "Sản phẩm đã bán", value: `${totalUnits}`, icon: Package },
    { key: "sku", label: "Mặt hàng đã bán", value: `${stats.length}`, icon: Boxes },
  ];

  return (
    <section className="space-y-3" aria-labelledby="product-metrics-h">
      <h2 id="product-metrics-h" className="text-lg font-semibold">
        Hiệu quả sản phẩm
      </h2>

      {stats.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl bg-card py-10 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
          <TrendingUp className="size-5" aria-hidden />
          <p>Chưa có sản phẩm nào được bán.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Dải tóm tắt */}
          <div className="grid grid-cols-3 divide-x divide-foreground/10 rounded-xl bg-card ring-1 ring-foreground/10">
            {summary.map((s) => (
              <div key={s.key} className="flex items-center gap-2.5 px-3 py-2.5">
                <span
                  className="hidden size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground sm:flex"
                  aria-hidden
                >
                  <s.icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[11px] text-muted-foreground">{s.label}</p>
                  <p className="truncate text-base font-semibold leading-tight tabular-nums">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 2 chart cạnh nhau — mỗi trục một thẻ, xếp theo chính nó */}
          <div className="grid gap-4 lg:grid-cols-2">
            <RankChart metric="revenue" stats={stats} total={totalRevenue} />
            <RankChart metric="units" stats={stats} total={totalUnits} />
          </div>
        </div>
      )}
    </section>
  );
}

function RankChart({
  metric,
  stats,
  total,
}: {
  metric: Metric;
  stats: ProductStat[];
  total: number;
}) {
  const meta = METRIC_META[metric];
  const ranked = useMemo(() => [...stats].sort((a, b) => b[metric] - a[metric]), [stats, metric]);
  const max = ranked.length ? ranked[0][metric] : 0;

  return (
    <div className="rounded-xl bg-card ring-1 ring-foreground/10">
      <div className="flex items-center gap-2 border-b px-3 py-2.5">
        <meta.icon className="size-4 text-muted-foreground" aria-hidden />
        <h3 className="text-sm font-semibold">{meta.title}</h3>
      </div>
      <ol className="divide-y divide-foreground/5">
        {ranked.map((p, i) => {
          const value = p[metric];
          const barPct = max > 0 ? Math.round((value / max) * 100) : 0;
          const sharePct = total > 0 ? Math.round((value / total) * 100) : 0;
          return (
            <li key={p.productId} className="flex items-center gap-3 px-3 py-3">
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold tabular-nums",
                  i === 0 ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground",
                )}
                aria-hidden
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="shrink-0 text-sm font-semibold tabular-nums">
                    {metric === "revenue" ? formatVND(p.revenue) : `${p.units} sp`}
                  </p>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div
                    className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-valuenow={sharePct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Tỉ trọng của ${p.name}`}
                  >
                    <div
                      className={cn("h-full rounded-full transition-[width] duration-300", meta.bar)}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                  <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
                    {sharePct}%
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {metric === "revenue"
                    ? `${p.units} đã bán · ${p.orders} đơn`
                    : `${compactVND(p.revenue)} · ${p.orders} đơn`}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
