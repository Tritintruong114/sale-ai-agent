"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentAvatar } from "@/components/shared/AgentAvatar";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { ChatWindow } from "@/components/shared/chat/ChatWindow";
import type { ChatMessage } from "@/components/shared/chat/MessageBubble";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/uiStore";
import { useAgentConfig } from "@/store/agentConfigStore";

// "Talk to Agent" — side panel trượt từ phải, chủ shop trò chuyện với trợ lý của mình (copilot).
// Overlay §6.4: scrim bg-foreground/40 + panel bg-card shadow-xl. Mock-driven, tất định (§nguyên tắc 4).

let seq = 0;
const nextId = () => `ac-${seq++}`;
const TYPING_ID = "ac-typing";

// Trả lời mẫu xoay vòng — copilot hỗ trợ chủ shop (không phải khách). Tất định, không random.
const CANNED_REPLIES = [
  "Dạ hôm nay có 1 thanh toán đơn lớn đang chờ anh/chị duyệt ở mục Thanh toán. Em mở giúp nhé?",
  "Doanh thu hôm nay đang nhỉnh hơn hôm qua. Em có thể tổng hợp chi tiết theo sản phẩm nếu anh/chị cần ạ.",
  "Em đã soạn sẵn mẫu tin chốt đơn: \"Dạ em xác nhận đơn của mình gồm… , tổng thanh toán… ạ\". Anh/chị muốn chỉnh gì không?",
  "Em ghi nhận rồi ạ. Em sẽ áp dụng cho các hội thoại tương tự và báo lại anh/chị khi cần duyệt.",
];

export function AgentChatPanel() {
  const open = useUiStore((s) => s.agentChatOpen);
  const setOpen = useUiStore((s) => s.setAgentChatOpen);
  const draft = useUiStore((s) => s.agentChatDraft);
  const { name: agentName, pronoun, avatar, tone, bannedWords } = useAgentConfig((s) => s.config.identity);
  const shopName = useAgentConfig((s) => s.config.shopName);
  const agentEnabled = useAgentConfig((s) => s.config.agentEnabled);

  // Chọn agent đang trò chuyện — mặc định Manager Agent (điều phối), kèm trợ lý của cửa hàng.
  const AGENTS = [
    { id: "manager", name: "Manager Agent", subtitle: "Điều phối các trợ lý của bạn", avatar: undefined as string | undefined },
    { id: "assistant", name: agentName, subtitle: agentEnabled ? "Trợ lý của bạn · đang trực" : "Trợ lý của bạn · đang tắt", avatar },
  ] as const;
  const [agentId, setAgentId] = useState<string>("manager");
  const active = AGENTS.find((a) => a.id === agentId) ?? AGENTS[0];

  // Có lần đẩy draft mới (vd "Train with Manager" từ M6) → chuyển về Manager Agent. Chỉnh state khi prop đổi, không effect.
  const [seenDraftNonce, setSeenDraftNonce] = useState(0);
  if (draft && draft.nonce !== seenDraftNonce) {
    setSeenDraftNonce(draft.nonce);
    setAgentId("manager");
  }

  const greeting = `Dạ ${pronoun || "em"} chào anh/chị, ${pronoun || "em"} là ${agentName} — trợ lý của cửa hàng. Anh/chị cần ${pronoun || "em"} hỗ trợ gì ạ?`;
  const suggestions = [
    "Hôm nay có việc gì cần mình xử lý?",
    "Doanh thu hôm nay thế nào?",
    "Soạn giúp tin nhắn chốt đơn",
  ];

  const [messages, setMessages] = useState<ChatMessage[]>([{ id: nextId(), role: "agent", text: greeting }]);
  const [step, setStep] = useState(0);
  const [typing, setTyping] = useState(false);

  // Đóng bằng phím Esc.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  const handleSend = async (text: string) => {
    // Lịch sử hội thoại gửi cho model — bỏ greeting/typing, map sang role của OpenAI.
    const history = messages
      .filter((m) => m.id !== TYPING_ID && (m.role === "agent" || m.role === "customer"))
      .map((m) => ({ role: m.role === "agent" ? ("assistant" as const) : ("user" as const), text: m.text }));

    setTyping(true);
    setMessages((m) => [
      ...m,
      { id: nextId(), role: "customer", text },
      { id: TYPING_ID, role: "typing", text: "" },
    ]);

    const pushReply = (reply: string) => {
      setTyping(false);
      setStep((s) => s + 1);
      setMessages((m) => [...m.filter((x) => x.id !== TYPING_ID), { id: nextId(), role: "agent", text: reply }]);
    };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...history.map((h) => ({ role: h.role, content: h.text })), { role: "user", content: text }],
          agent: { name: agentName, pronoun, tone, shopName, bannedWords },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.reply) throw new Error(data.error || "Lỗi gọi API");
      pushReply(data.reply);
    } catch {
      // Dự phòng: nếu API lỗi (chưa có key, hết quota…) thì dùng câu trả lời mẫu để luồng không gãy.
      pushReply(CANNED_REPLIES[step % CANNED_REPLIES.length]);
    }
  };

  return (
    /* Panel đẩy ngang — nằm trong luồng layout, mở ra thì dồn toàn bộ trang sang trái. */
    <aside
        role="dialog"
        aria-modal={false}
        aria-label={`Trò chuyện với ${active.name}`}
        aria-hidden={!open}
        className={cn(
          "h-full shrink-0 overflow-hidden border-l bg-card transition-[width] duration-200 ease-out motion-reduce:transition-none",
          open ? "w-full md:w-96" : "pointer-events-none w-0",
        )}
      >
        {/* Nội dung giữ chiều rộng cố định để không reflow trong lúc panel animate. */}
        <div className="flex h-full w-full flex-col md:w-96">
        {/* Header */}
        <div className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
          <span className="relative shrink-0">
            <AgentAvatar name={active.name} src={active.avatar} size={36} className="ring-1 ring-foreground/10" />
            <span
              className={cn(
                "absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-card",
                agentEnabled ? "bg-emerald-500" : "bg-muted-foreground",
              )}
              aria-hidden
            />
          </span>
          <div className="min-w-0 flex-1">
            {/* Dropdown chọn agent — đổi danh tính đang trò chuyện */}
            <Select value={agentId} onValueChange={(v) => setAgentId(v ?? "manager")}>
              <SelectTrigger
                aria-label="Chọn agent"
                className="h-auto gap-1 border-0 bg-transparent p-0 text-sm font-semibold leading-tight shadow-none hover:bg-transparent focus-visible:ring-0 dark:bg-transparent dark:hover:bg-transparent"
              >
                <span className="truncate">{active.name}</span>
              </SelectTrigger>
              <SelectContent align="start" className="min-w-48">
                {AGENTS.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="truncate text-xs text-muted-foreground">{active.subtitle}</p>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={() => setOpen(false)} aria-label="Đóng">
            <X />
          </Button>
        </div>

        {/* Chat */}
        <div className="min-h-0 flex-1">
          <ChatWindow
            messages={messages}
            onSend={handleSend}
            disabled={typing}
            ownRole="customer"
            placeholder={`Nhắn cho ${active.name}…`}
            draft={draft}
            header={
              step === 0 ? (
                <div className="flex flex-wrap gap-1.5 border-b bg-muted/40 px-3 py-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleSend(s)}
                      disabled={typing}
                      className="rounded-full border border-dashed px-2.5 py-1 text-xs text-muted-foreground/70 transition-colors hover:border-solid hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              ) : null
            }
          />
        </div>
        </div>
      </aside>
  );
}
