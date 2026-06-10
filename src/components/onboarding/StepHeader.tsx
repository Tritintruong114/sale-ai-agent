import type { LucideIcon } from "lucide-react";

// Tiêu đề bước nhất quán: icon + tên + 1 dòng lợi ích ("làm bước này để được gì").
export function StepHeader({
  icon: Icon,
  title,
  benefit,
}: {
  icon: LucideIcon;
  title: string;
  benefit: string;
}) {
  return (
    <div className="flex items-center gap-3.5">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="size-6" aria-hidden />
      </span>
      <div className="space-y-0.5">
        <h2 className="text-lg font-semibold leading-tight">{title}</h2>
        {/* Tạm ẩn dòng mô tả (trùng với intro trong từng step). Bật lại khi cần:
        <p className="text-sm text-muted-foreground">{benefit}</p> */}
      </div>
    </div>
  );
}
