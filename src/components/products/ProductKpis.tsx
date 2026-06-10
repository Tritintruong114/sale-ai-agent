import { Boxes, Coins, TriangleAlert, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatVND } from "@/lib/format";
import { catalogTotals } from "./productStats";
import { type CatalogItem } from "./meta";

// KPI tổng quan danh mục — pattern §6.5 (icon chip tint theo hue). Số canh cột tabular-nums.

function Kpi({
  label,
  value,
  icon: Icon,
  chip,
  accent,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  chip: string;
  accent?: string;
}) {
  return (
    <Card size="sm">
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className={cn("flex size-7 items-center justify-center rounded-lg", chip)}>
            <Icon className="size-4" aria-hidden />
          </span>
        </div>
        <p className={cn("text-xl font-semibold tabular-nums", accent)}>{value}</p>
      </CardContent>
    </Card>
  );
}

export function ProductKpis({ catalog }: { catalog: CatalogItem[] }) {
  const { total, lowStock, revenueFromProducts } = catalogTotals(catalog);
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Kpi label="Tổng sản phẩm" value={`${total}`} icon={Boxes} chip="bg-slate-100 text-slate-700" />
      <Kpi
        label="Sắp / hết hàng"
        value={`${lowStock}`}
        icon={TriangleAlert}
        chip="bg-amber-100 text-amber-700"
        accent={lowStock > 0 ? "text-amber-600" : undefined}
      />
      <Kpi
        label="Doanh thu từ sản phẩm"
        value={formatVND(revenueFromProducts)}
        icon={Coins}
        chip="bg-emerald-100 text-emerald-700"
      />
    </div>
  );
}
