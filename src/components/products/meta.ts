import { PackageCheck, PackageX, TriangleAlert, type LucideIcon } from "lucide-react";

// M3 Sản phẩm — meta dùng chung cho màn. Bám hệ màu §5 design.md:
// chip = bg-{hue}-100 text-{hue}-700 · dot = bg-{hue}-500 · tint trigger = border-{hue}-500/30 bg-{hue}-500/10.

export type Draft = {
  id: string;
  name: string;
  price: number;
  description: string;
  imageHint: string;
  imageUrl?: string | null; // ảnh thật (vd Google Drive thumbnail); fallback về imageHint khi thiếu
  images?: string[];
};

export type CatalogItem = Draft & { stock: number; lowStock: boolean; paused?: boolean };

export type StockState = "in_stock" | "low" | "out";

// Trạng thái tồn: còn hàng = emerald, sắp hết = amber (cần chú ý), hết hàng = rose (cảnh báo).
export const STOCK_META: Record<
  StockState,
  { label: string; icon: LucideIcon; cls: string; dot: string; tint: string }
> = {
  in_stock: {
    label: "Còn hàng",
    icon: PackageCheck,
    cls: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
    tint: "border-emerald-500/30 bg-emerald-500/10",
  },
  low: {
    label: "Sắp hết",
    icon: TriangleAlert,
    cls: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
    tint: "border-amber-500/30 bg-amber-500/10",
  },
  out: {
    label: "Hết hàng",
    icon: PackageX,
    cls: "bg-rose-100 text-rose-700",
    dot: "bg-rose-500",
    tint: "border-rose-500/30 bg-rose-500/10",
  },
};

// Tất định, suy từ stock/lowStock trong data (§ nguyên tắc 4).
export function stockState(item: { stock: number; lowStock: boolean }): StockState {
  if (item.stock <= 0) return "out";
  if (item.lowStock) return "low";
  return "in_stock";
}
