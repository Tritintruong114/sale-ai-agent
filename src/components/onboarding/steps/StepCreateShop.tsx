"use client";

import { Globe, Store } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { StepProps } from "../types";

const TYPES = [
  { key: "online", label: "Bán online", icon: Globe },
  { key: "store", label: "Có cửa hàng", icon: Store },
] as const;

export function StepCreateShop({ draft, update }: StepProps) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Thông tin shop để agent giới thiệu với khách. Có thể đổi sau ở Cấu hình.
      </p>

      <label className="block space-y-2 text-sm">
        <span className="font-medium">Tên shop</span>
        <Input
          value={draft.shopName}
          onChange={(e) => update({ shopName: e.target.value })}
          placeholder="vd: Shop Mỹ Phẩm An An"
          autoFocus
        />
      </label>

      <div className="space-y-2 text-sm">
        <span className="font-medium">
          Loại hình <span className="font-normal text-muted-foreground">· chọn một hoặc cả hai</span>
        </span>
        <div className="grid grid-cols-2 gap-2">
          {TYPES.map((t) => {
            const Icon = t.icon;
            const active = draft.shopType.includes(t.key);
            return (
              <button
                key={t.key}
                type="button"
                onClick={() =>
                  update({
                    shopType: active
                      ? draft.shopType.filter((x) => x !== t.key)
                      : [...draft.shopType, t.key],
                  })
                }
                aria-pressed={active}
                className={cn(
                  "flex items-center gap-2 rounded-xl border p-3 text-left transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  active ? "border-primary bg-primary/5" : "hover:bg-muted",
                )}
              >
                <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                <span className="font-medium">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {draft.shopType.includes("store") && (
        <div className="space-y-5 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1">
          <label className="block space-y-2 text-sm">
            <span className="font-medium">Địa chỉ cửa hàng</span>
            <Input
              value={draft.shopAddress}
              onChange={(e) => update({ shopAddress: e.target.value })}
              placeholder="vd: 12 Nguyễn Huệ, Quận 1, TP.HCM"
            />
          </label>
          <label className="block space-y-2 text-sm">
            <span className="font-medium">Điện thoại liên hệ</span>
            <Input
              type="tel"
              value={draft.shopPhone}
              onChange={(e) => update({ shopPhone: e.target.value })}
              placeholder="vd: 0901 234 567"
            />
          </label>
        </div>
      )}
    </div>
  );
}
