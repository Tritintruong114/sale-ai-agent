"use client";

import { useRef } from "react";
import { Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AgentAvatar } from "@/components/shared/AgentAvatar";
import type { StepProps } from "../types";

export function StepCreateAgent({ draft, update }: StepProps) {
  const { identity } = draft;
  const set = (patch: Partial<typeof identity>) => update({ identity: { ...identity, ...patch } });
  const fileInput = useRef<HTMLInputElement>(null);

  const onPickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Prototype: tạo URL tạm để xem trước (không upload thật).
    set({ avatar: URL.createObjectURL(file) });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Ảnh đại diện agent — boring-avatars theo tên, bấm nút nhỏ để đổi ảnh riêng */}
      <div className="flex flex-col items-start gap-2">
        <AgentAvatar name={identity.name} src={identity.avatar} size={64} className="border" />
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onPickAvatar}
        />
        <Button variant="outline" size="xs" onClick={() => fileInput.current?.click()}>
          <Upload className="size-3.5" aria-hidden />
          Đổi ảnh
        </Button>
      </div>

      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium">Tên agent</span>
        <Input
          value={identity.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="vd: Trợ lý An An"
          className="max-w-xs"
        />
      </label>
    </div>
  );
}
