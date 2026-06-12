"use client";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAgentConfig } from "@/store/agentConfigStore";

// Toggle trạng thái trực KÊNH của Agent Trợ Lý ở header Dashboard — pill bấm-được (role=switch), xanh khi đang trực.
// Bật: Trợ Lý tự trả lời khách trên kênh. Tắt: ngưng trực kênh, khách chờ chủ shop.
// CHỈ điều khiển Agent Trợ Lý (config.agentEnabled) — KHÔNG ảnh hưởng chat với Manager (panel chạy bằng agentChatOpen).
export function AgentStatusToggle() {
  const on = useAgentConfig((s) => s.config.agentEnabled);
  const setConfig = useAgentConfig((s) => s.setConfig);

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-label={on ? "Trợ Lý đang trực kênh — bấm để Tạm ngưng" : "Trợ Lý đang Tạm ngưng — bấm để trực kênh lại"}
            onClick={() => setConfig({ agentEnabled: !on })}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-full py-1.5 pl-2.5 pr-1.5 ring-1 transition-colors duration-200 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              on ? "bg-emerald-50 ring-emerald-200 hover:bg-emerald-100" : "bg-muted ring-foreground/10 hover:bg-muted/70",
            )}
          />
        }
      >
        <span
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            on ? "bg-emerald-500 motion-safe:animate-pulse" : "bg-muted-foreground/40",
          )}
          aria-hidden
        />
        <span className={cn("text-xs font-medium", on ? "text-emerald-700" : "text-muted-foreground")}>
          {on ? "Đang trực" : "Tạm ngưng"}
        </span>
        {/* Track + thumb — thuần thị giác, transform/colors (không reflow) */}
        <span
          className={cn(
            "relative h-4 w-7 shrink-0 rounded-full transition-colors duration-200",
            on ? "bg-emerald-500" : "bg-foreground/20",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 size-3 rounded-full bg-white shadow-sm transition-all duration-200 motion-reduce:transition-none",
              on ? "left-3.5" : "left-0.5",
            )}
          />
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[15rem]">
        {on
          ? "Trợ Lý đang trả lời khách trên kênh"
          : "Trợ Lý Tạm ngưng trả lời khách trên kênh"}
      </TooltipContent>
    </Tooltip>
  );
}
