"use client";

import { useRef, useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import { useUiStore } from "@/store/uiStore";

// Cửa sổ nổi chứa chat "Talk to Agent" dạng iframe (src = route /agent-chat).
// Bật khi người dùng bấm nút "tách màn" trên header panel. Kéo thả qua thanh tiêu đề.
// Cùng origin nên iframe dùng chung localStorage → đọc đúng cấu hình agent của shop.

const W = 320; // gọn — hẹp hơn side panel (24rem).
const H = 480;

export function AgentChatPopout() {
  const popped = useUiStore((s) => s.agentChatPopped);
  const setPopped = useUiStore((s) => s.setAgentChatPopped);
  const setOpen = useUiStore((s) => s.setAgentChatOpen);

  const winRef = useRef<HTMLDivElement>(null);
  // Vị trí cửa sổ — null = dùng vị trí mặc định (góc phải dưới) cho tới khi kéo lần đầu.
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [maximized, setMaximized] = useState(false);
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  if (!popped) return null;

  // Vàng — thu về side panel.
  const dockBack = () => {
    setPopped(false);
    setOpen(true);
  };
  // Đỏ — đóng hẳn.
  const close = () => {
    setPopped(false);
    setOpen(false);
  };

  // Kéo thả (vô hiệu khi phóng to). Chỉ gắn trên vùng grip — KHÔNG bao cụm nút.
  const onPointerDown = (e: React.PointerEvent) => {
    if (maximized) return;
    const rect = winRef.current?.getBoundingClientRect();
    if (!rect) return;
    drag.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const x = Math.max(8, Math.min(window.innerWidth - W - 8, e.clientX - drag.current.dx));
    const y = Math.max(8, Math.min(window.innerHeight - H - 8, e.clientY - drag.current.dy));
    setPos({ x, y });
  };
  const onPointerUp = (e: React.PointerEvent) => {
    drag.current = null;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  };

  return (
    <div
      ref={winRef}
      role="dialog"
      aria-label="Cửa sổ trò chuyện với Agent"
      className="fixed z-50 flex flex-col overflow-hidden rounded-xl border bg-card shadow-2xl"
      style={
        maximized
          ? { left: 16, top: 16, right: 16, bottom: 16 }
          : { width: W, height: H, ...(pos ? { left: pos.x, top: pos.y } : { right: 24, bottom: 24 }) }
      }
    >
      {/* Thanh tiêu đề kiểu macOS — cụm "traffic lights" bên trái */}
      <div className="relative flex h-9 shrink-0 items-center border-b bg-muted/40 px-3">
        {/* Cụm 3 nút: đỏ = đóng, vàng = thu về panel, xanh = phóng to/thu nhỏ. Hover hiện ký hiệu. */}
        <div className="group/tl flex items-center gap-2">
          <button
            type="button"
            onClick={close}
            aria-label="Đóng"
            className="flex size-3 items-center justify-center rounded-full bg-[#ff5f57] ring-1 ring-black/10 transition-transform hover:scale-105"
          >
            <X className="size-2 text-black/60 opacity-0 transition-opacity group-hover/tl:opacity-100" strokeWidth={3} />
          </button>
          <button
            type="button"
            onClick={dockBack}
            aria-label="Thu về panel"
            className="flex size-3 items-center justify-center rounded-full bg-[#febc2e] ring-1 ring-black/10 transition-transform hover:scale-105"
          >
            <Minus className="size-2 text-black/60 opacity-0 transition-opacity group-hover/tl:opacity-100" strokeWidth={3} />
          </button>
          <button
            type="button"
            onClick={() => setMaximized((v) => !v)}
            aria-label={maximized ? "Thu nhỏ" : "Phóng to"}
            className="flex size-3 items-center justify-center rounded-full bg-[#28c840] ring-1 ring-black/10 transition-transform hover:scale-105"
          >
            <Plus className="size-2 text-black/60 opacity-0 transition-opacity group-hover/tl:opacity-100" strokeWidth={3} />
          </button>
        </div>

        {/* Tiêu đề canh giữa + vùng kéo thả phủ phần còn lại của thanh */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="absolute inset-y-0 left-20 right-0 flex touch-none select-none items-center justify-center pr-20 text-xs font-medium text-muted-foreground"
          style={{ cursor: maximized ? "default" : "grab" }}
        >
          Talk with Agent
        </div>
      </div>
      {/* Nội dung chat — mount độc lập qua iframe */}
      <iframe src="/agent-chat" title="Talk with Agent" className="min-h-0 flex-1 border-0" />
    </div>
  );
}
