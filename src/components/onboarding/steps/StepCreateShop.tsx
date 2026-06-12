"use client";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { StepProps } from "../types";

export function StepCreateShop({ draft, update }: StepProps) {
  const hasStore = draft.shopType.includes("store");

  const toggleStore = (on: boolean) =>
    update({ shopType: on ? ["store"] : draft.shopType.filter((x) => x !== "store") });

  return (
    <div className="space-y-5">
    

      <label className="block space-y-2 text-sm">
        <span className="font-medium">Tên shop</span>
        <Input
          value={draft.shopName}
          onChange={(e) => update({ shopName: e.target.value })}
          placeholder="vd: Shop Trái Cây An An"
          autoFocus
        />
      </label>

      <label className="flex items-center gap-3 rounded-lg px-3 py-2.5 ring-1 ring-foreground/10 transition-colors hover:bg-muted/50">
        <Switch checked={hasStore} onCheckedChange={(v) => toggleStore(Boolean(v))} />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">Có cửa hàng</span>
          {/* <span className="block text-xs text-muted-foreground">
            Bật nếu shop có địa chỉ để khách ghé hoặc nhận hàng.
          </span> */}
        </span>
      </label>

      {hasStore && (
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
