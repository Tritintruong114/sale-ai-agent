"use client";

import { CircleSlash, Database, Radio, RotateCcw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useHydrated } from "@/lib/useHydrated";
import { useUiStore } from "@/store/uiStore";
import { usePrototypeStore, type PrototypeMode } from "@/store/prototypeStore";

// Công cụ demo prototype — chuyển nhanh trạng thái dữ liệu (Dashboard). Trước nằm nổi góc trái-dưới,
// nay đưa lên SideNav dạng dropdown gọn: trigger hiện lựa chọn hiện tại, mở ra chọn trạng thái.

const OPTIONS: { mode: PrototypeMode; icon: typeof Database; label: string }[] = [
  { mode: "static", icon: Database, label: "Có dữ liệu" },
  { mode: "empty", icon: CircleSlash, label: "Chưa có dữ liệu" },
  { mode: "realtime", icon: Radio, label: "Thời gian thực" },
];

export function PrototypeSwitcher() {
  const mode = usePrototypeStore((s) => s.mode);
  const setMode = usePrototypeStore((s) => s.setMode);
  const restart = usePrototypeStore((s) => s.restart);
  const collapsed = useUiStore((s) => s.collapsed);
  const hydrated = useHydrated();

  // Trước hydrate, store persist chưa đọc được → coi như "static" để khớp markup server.
  const current = hydrated ? OPTIONS.find((o) => o.mode === mode) ?? OPTIONS[0] : OPTIONS[0];
  const Current = current.icon;
  const isRealtime = hydrated && mode === "realtime";

  return (
    <div className="space-y-1">
      <Select value={current.mode} onValueChange={(v) => setMode(v as PrototypeMode)}>
        <SelectTrigger
          size="sm"
          aria-label="Prototype — trạng thái dữ liệu"
          title={collapsed ? `Prototype: ${current.label}` : undefined}
          className={cn(
            "w-full gap-2 text-muted-foreground",
            collapsed && "justify-center px-0 [&>svg:last-child]:hidden",
          )}
        >
          <span className="relative shrink-0">
            <Current className={cn("size-4", isRealtime ? "text-emerald-600" : "text-muted-foreground")} aria-hidden />
            {collapsed && isRealtime ? (
              <span className="absolute -right-1.5 -top-1.5 size-2 rounded-full bg-emerald-500 ring-2 ring-card motion-safe:animate-pulse" />
            ) : null}
          </span>
          {!collapsed ? <span className="flex-1 truncate text-left text-foreground">{current.label}</span> : null}
        </SelectTrigger>
        <SelectContent className="min-w-52">
          <div className="px-1.5 pb-1 pt-0.5 text-[11px] font-medium text-muted-foreground">Trạng thái dữ liệu</div>
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <SelectItem key={opt.mode} value={opt.mode}>
                <Icon className="size-4 text-muted-foreground" aria-hidden />
                {opt.label}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {/* Chạy lại realtime — chỉ hiện khi đang chạy & sidebar mở rộng */}
      {isRealtime && !collapsed ? (
        <button
          type="button"
          onClick={() => restart()}
          className="flex w-full items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium text-emerald-700 outline-none transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <RotateCcw className="size-3" aria-hidden />
          Chạy lại từ rỗng
        </button>
      ) : null}
    </div>
  );
}
