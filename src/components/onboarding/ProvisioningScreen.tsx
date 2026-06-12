"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Màn "đang dựng" — các dòng trạng thái lần lượt hiện ra rồi hoàn tất.
export function ProvisioningScreen({
  lines,
  onComplete,
}: {
  lines: string[];
  onComplete: () => void;
}) {
  const [current, setCurrent] = useState(0);
  const fired = useRef(false);

  useEffect(() => {
    if (current >= lines.length) {
      if (fired.current) return;
      fired.current = true;
      const t = setTimeout(onComplete, 1400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCurrent((c) => c + 1), 1800);
    return () => clearTimeout(t);
  }, [current, lines.length, onComplete]);

  return (
    <div className="mx-auto w-fit max-w-md space-y-3 py-10">
      {/* dùng div thường, không Card — tránh border/shadow */}
        {lines.map((line, i) => {
          if (i > current) return null;
          const done = i < current;
          return (
            <div
              key={line}
              className="flex items-center gap-2.5 text-sm motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-700 motion-safe:ease-out"
            >
              {done ? (
                <Check className="size-4 shrink-0 text-emerald-500" aria-hidden />
              ) : (
                <Loader2 className="size-4 shrink-0 motion-safe:animate-spin" aria-hidden />
              )}
              <span className={cn(done ? "text-muted-foreground" : "font-medium")}>{line}</span>
            </div>
          );
        })}
    </div>
  );
}
