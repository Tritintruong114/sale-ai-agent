"use client";

import { useEffect } from "react";
import { PictureInPicture2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentChatContent } from "./AgentChatContent";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/uiStore";

// "Talk to Agent" — side panel trượt từ phải, chủ shop trò chuyện với trợ lý của mình (copilot).
// Khung trượt mỏng: bao AgentChatContent (logic hội thoại dùng chung với route /agent-chat).
// Khi "tách màn" (agentChatPopped) thì panel ẩn đi, AgentChatPopout render cửa sổ nổi iframe thay thế.

export function AgentChatPanel() {
  const open = useUiStore((s) => s.agentChatOpen);
  const setOpen = useUiStore((s) => s.setAgentChatOpen);
  const popped = useUiStore((s) => s.agentChatPopped);
  const setPopped = useUiStore((s) => s.setAgentChatPopped);

  // Đóng bằng phím Esc (chỉ khi panel đang mở, chưa tách màn).
  useEffect(() => {
    if (!open || popped) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, popped, setOpen]);

  // Tách màn → đóng panel trượt, bật cửa sổ nổi iframe.
  const handlePopOut = () => {
    setPopped(true);
    setOpen(false);
  };

  const visible = open && !popped;

  return (
    /* Panel đẩy ngang — nằm trong luồng layout, mở ra thì dồn toàn bộ trang sang trái. */
    <aside
      role="dialog"
      aria-modal={false}
      aria-label="Trò chuyện với Agent"
      aria-hidden={!visible}
      className={cn(
        "h-full shrink-0 overflow-hidden border-l bg-card transition-[width] duration-200 ease-out motion-reduce:transition-none",
        visible ? "w-full md:w-96" : "pointer-events-none w-0",
      )}
    >
      {/* Nội dung giữ chiều rộng cố định để không reflow trong lúc panel animate. */}
      <div className="h-full w-full md:w-96">
        <AgentChatContent
          headerActions={
            <>
              <Button variant="ghost" size="icon-sm" onClick={handlePopOut} aria-label="Tách thành cửa sổ riêng">
                <PictureInPicture2 />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => setOpen(false)} aria-label="Đóng">
                <X />
              </Button>
            </>
          }
        />
      </div>
    </aside>
  );
}
