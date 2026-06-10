import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stepper({
  steps,
  current,
  onStepClick,
}: {
  steps: { code: string; title: string }[];
  current: number;
  onStepClick?: (code: string) => void;
}) {
  return (
    <ol className="flex items-center gap-1">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        const clickable = done && Boolean(onStepClick);
        return (
          <li key={s.code} className="flex flex-1 items-center gap-1">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStepClick?.(s.code)}
              aria-current={active ? "step" : undefined}
              aria-label={`Bước ${i + 1}: ${s.title}${done ? " (đã xong)" : ""}`}
              className={cn(
                "flex items-center gap-2 rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                clickable ? "cursor-pointer" : "cursor-default",
              )}
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                  active && "bg-primary text-primary-foreground",
                  done && "bg-emerald-500 text-white",
                  !active && !done && "bg-muted text-muted-foreground",
                )}
              >
                {done ? <Check className="size-4" aria-hidden /> : i + 1}
              </span>
              <span
                className={cn(
                  "text-sm",
                  active ? "font-medium text-foreground" : "text-muted-foreground",
                  // Luôn hiện nhãn bước hiện tại; các bước khác ẩn trên màn nhỏ.
                  active ? "inline" : "hidden sm:inline",
                )}
              >
                {s.title}
              </span>
            </button>
            {i < steps.length - 1 && <div className="h-px flex-1 bg-border" />}
          </li>
        );
      })}
    </ol>
  );
}
