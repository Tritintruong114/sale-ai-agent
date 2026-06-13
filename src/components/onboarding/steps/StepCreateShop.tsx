"use client";

import { Input } from "@/components/ui/input";
import type { StepProps } from "../types";

export function StepCreateShop({ draft, update }: StepProps) {
  return (
    <div className="space-y-5">
      <label className="block space-y-2 text-sm">
        <span className="font-medium">Tên cửa hàng</span>
        <Input
          value={draft.shopName}
          onChange={(e) => update({ shopName: e.target.value })}
          placeholder="vd: Shop Trái Cây An An"
          autoFocus
        />
      </label>
    </div>
  );
}
