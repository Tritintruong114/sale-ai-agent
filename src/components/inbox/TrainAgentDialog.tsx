"use client";

import { useState } from "react";
import { GraduationCap, Loader2, ThumbsUp, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// Dùng cả đoạn hội thoại làm dữ liệu đào tạo cho Sale agent (M1 Inbox → Đào tạo Agent).
// Prototype: submit giả lập độ trễ rồi báo về parent (ghi lại + đóng modal), không gọi backend.

export type TrainExampleKind = "good" | "fix";

const KINDS: {
  key: TrainExampleKind;
  label: string;
  icon: typeof ThumbsUp;
  active: string;
  iconCls: string;
}[] = [
  { key: "good", label: "Trả lời tốt", icon: ThumbsUp, active: "border-emerald-500/40 bg-emerald-50", iconCls: "text-emerald-600" },
  { key: "fix", label: "Cần chỉnh", icon: Wrench, active: "border-amber-500/40 bg-amber-50", iconCls: "text-amber-600" },
];

function DialogBody({ onSubmit }: { onSubmit: (kind: TrainExampleKind, note: string) => void }) {
  const [kind, setKind] = useState<TrainExampleKind>("good");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = () => {
    if (submitting) return;
    setSubmitting(true);
    // Mock: giả lập gửi hội thoại sang Đào tạo Agent rồi báo về parent.
    setTimeout(() => onSubmit(kind, note.trim()), 900);
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Dạy lại agent</DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {KINDS.map((k) => {
            const Icon = k.icon;
            const on = kind === k.key;
            return (
              <button
                key={k.key}
                type="button"
                onClick={() => setKind(k.key)}
                aria-pressed={on}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer",
                  on ? k.active : "border-border hover:bg-muted/60",
                )}
              >
                <Icon className={cn("size-4", on ? k.iconCls : "text-muted-foreground")} aria-hidden />
                {k.label}
              </button>
            );
          })}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="train-note" className="text-xs font-medium text-foreground">
            Ghi chú
          </label>
          <Textarea
            id="train-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ghi chú cho agent…"
          />
        </div>
      </div>

      <DialogFooter>
        <Button onClick={submit} disabled={submitting}>
          {submitting ? (
            <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden />
          ) : (
            <GraduationCap className="size-4" aria-hidden />
          )}
          Gửi vào đào tạo
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

export function TrainAgentDialog({
  open,
  conversationId,
  onClose,
  onSubmit,
}: {
  open: boolean;
  conversationId: string | null;
  onClose: () => void;
  onSubmit: (kind: TrainExampleKind, note: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      {open && conversationId ? <DialogBody key={conversationId} onSubmit={onSubmit} /> : null}
    </Dialog>
  );
}
