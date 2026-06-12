"use client";

import { Input } from "@/components/ui/input";
import type { StepProps } from "../types";

export function StepCreateAgent({ draft, update }: StepProps) {
  const { identity } = draft;
  const set = (patch: Partial<typeof identity>) => update({ identity: { ...identity, ...patch } });

  return (
    <div className="flex flex-col gap-4">
     

      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium">Tên agent</span>
        <Input
          value={identity.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="vd: Trợ lý An An"
          autoFocus
        />
      </label>
    </div>
  );
}
