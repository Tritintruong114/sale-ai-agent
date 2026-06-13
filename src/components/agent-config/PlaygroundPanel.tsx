"use client";

import { useRef, useState } from "react";
import { Bot, GraduationCap, SquarePen, Store } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChatWindow } from "@/components/shared/chat/ChatWindow";
import type { ChatMessage } from "@/components/shared/chat/types";
import { AgentAvatar } from "@/components/shared/AgentAvatar";
import { cn } from "@/lib/utils";
import { AgentFilesManager } from "./AgentFilesManager";
import { AGENT_FILES, type AgentFile } from "@/data/agentFiles";
import { ShopInfoForm } from "@/components/shop-info/ShopInfoForm";
import { useAgentConfig } from "@/store/agentConfigStore";
import { useUiStore } from "@/store/uiStore";
import { useTrainingStore } from "@/store/trainingStore";

let seq = 0;
const nextId = () => `pg-${seq++}`;
const TYPING_ID = "pg-typing";

// Tab Sản phẩm tạm ẩn — bật lại thì khôi phục import productsData + CatalogItem + formatVnd cùng TabsTrigger/Content.

// Câu dự phòng khi API lỗi (chưa có key / hết quota) — giữ bản thử không gãy.
const FALLBACK_REPLIES = [
  "Dạ em cảm ơn anh/chị đã quan tâm ạ. Anh/chị cho em xin nhu cầu cụ thể để em tư vấn kỹ hơn nhé ạ.",
  "Dạ bên em luôn ưu tiên hàng tươi mới về ạ. Anh/chị ở khu vực nào để em báo phí ship giúp ạ?",
];

// Playground (M6) — sân thử dạng workspace (bám lưới Inbox): trái = Bối cảnh agent đọc (theo tab),
// phải = khung chat mô phỏng Messenger (chủ shop đóng vai khách).
// Gõ tự do = chat thật qua /api/chat (persona tư vấn viên) theo đúng danh tính & hồ sơ shop đang dựng.
export function PlaygroundPanel() {
  const config = useAgentConfig((s) => s.config);
  const setConfig = useAgentConfig((s) => s.setConfig);
  const setAgentChatOpen = useUiStore((s) => s.setAgentChatOpen);
  const pushAgentChatDraft = useUiStore((s) => s.pushAgentChatDraft);
  const addTrainingEntry = useTrainingStore((s) => s.addEntry);

  // Cập nhật một field danh tính — agent đọc lại ngay ở khung chat bên phải.
  const setIdentity = (patch: Partial<typeof config.identity>) =>
    setConfig({ identity: { ...config.identity, ...patch } });

  // File định nghĩa agent (.md) — state nâng lên đây để gộp chung vào nút "Lưu & đồng bộ".
  const [files, setFiles] = useState<AgentFile[]>(AGENT_FILES);

  // Nút "Lưu & đồng bộ": chụp mốc config (Agent + Shop) + file định nghĩa lúc mở và sau mỗi lần lưu.
  // dirty = trạng thái hiện tại khác mốc → bật nút + hiện chấm đỏ; lưu xong re-chụp mốc → tắt nút.
  const snapshot = JSON.stringify({ config, files });
  const [savedSnapshot, setSavedSnapshot] = useState(() => snapshot);
  const dirty = snapshot !== savedSnapshot;
  const saveSync = () => setSavedSnapshot(snapshot);

  const agentName = config.identity.name;
  const pronoun = config.identity.pronoun || "em";
  const greeting =
    config.identity.greeting?.trim() ||
    `Dạ ${pronoun} chào anh/chị ạ, ${pronoun} là ${agentName}. Anh/chị cần ${pronoun} tư vấn gì ạ?`;

  const [messages, setMessages] = useState<ChatMessage[]>([{ id: nextId(), role: "agent", text: greeting }]);
  const [busy, setBusy] = useState(false);
  const fallbackStep = useRef(0);

  // Phát một reply (có thể tách [NEXT] thành nhiều tin) kèm hiệu ứng "đang gõ".
  const pushReply = (reply: string) => {
    const chunks = reply.split(/\n*\s*\[NEXT\]\s*\n*/i).map((c) => c.trim()).filter(Boolean);
    const play = (i: number) => {
      if (i >= chunks.length) {
        setBusy(false);
        setMessages((m) => m.filter((x) => x.id !== TYPING_ID));
        return;
      }
      setMessages((m) => (m.some((x) => x.id === TYPING_ID) ? m : [...m, { id: TYPING_ID, role: "typing", text: "" }]));
      const delay = Math.min(1300, 450 + chunks[i].length * 10);
      setTimeout(() => {
        setMessages((m) => [...m.filter((x) => x.id !== TYPING_ID), { id: nextId(), role: "agent", text: chunks[i] }]);
        play(i + 1);
      }, delay);
    };
    play(0);
  };

  // Gọi /api/chat thật (persona tư vấn viên), giống TestChatPanel ở Onboarding.
  const sendLive = async (text: string) => {
    const history = messages
      .filter((m) => m.role === "agent" || m.role === "customer")
      .map((m) => ({ role: m.role === "agent" ? ("assistant" as const) : ("user" as const), content: m.text }));

    setBusy(true);
    setMessages((m) => [
      ...m,
      { id: nextId(), role: "customer", text },
      { id: TYPING_ID, role: "typing", text: "" },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...history, { role: "user", content: text }],
          agent: {
            name: agentName,
            pronoun,
            tone: config.identity.tone,
            shopName: config.shopName,
            shopType: config.shopType,
            shopAddress: config.shopAddress,
            shopPhone: config.shopPhone,
            bannedWords: config.identity.bannedWords,
            businessProfile: config.businessProfile,
            persona: "assistant",
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.reply) throw new Error(data.error || "Lỗi gọi API");
      pushReply(data.reply);
    } catch {
      pushReply(FALLBACK_REPLIES[fallbackStep.current % FALLBACK_REPLIES.length]);
      fallbackStep.current += 1;
    }
  };

  // Có hội thoại thực sự (ít nhất một lượt khách) thì mới re-train được.
  const hasChat = messages.some((m) => m.role === "customer");

  // Hội thoại mới — xoá lịch sử, quay về lời chào mở đầu theo config hiện tại.
  const newConversation = () => {
    setBusy(false);
    fallbackStep.current = 0;
    setMessages([{ id: nextId(), role: "agent", text: greeting }]);
  };

  // Re-train hội thoại với Manager: mở panel chat (góc phải) + điền sẵn prompt /re-train kèm transcript hội thoại thử,
  // đồng thời ghi một dòng vào Nhật ký đào tạo (tab Lịch sử) — lưu thật vào trainingStore (persist localStorage).
  const retrainConversation = () => {
    const turns = messages.filter((m) => m.role === "customer").length;
    const transcript = messages
      .filter((m) => m.role === "agent" || m.role === "customer")
      .map((m) => `${m.role === "agent" ? agentName : "Khách"}: ${m.text}`)
      .join("\n");

    setAgentChatOpen(true);
    pushAgentChatDraft(
      `Hãy dùng /skill re-train cho agent ${agentName} dựa trên hội thoại thử dưới đây.\n\n` +
        `Phân tích theo cấu trúc:\n` +
        `1. Các điểm agent có thể cải thiện\n` +
        `2. Cách agent có thể tư vấn tốt hơn\n` +
        `3. Đề xuất chỉnh hồ sơ định nghĩa / kịch bản nếu cần\n\n` +
        `--- Hội thoại ---\n${transcript}`,
    );

    addTrainingEntry({
      id: `tr-pg-${Date.now()}`,
      at: localIso(),
      method: "playground",
      by: "Playground",
      scope: "Hội thoại thử ở Playground",
      summary: `Re-train từ hội thoại thử (${turns} lượt khách).`,
      files: [],
      status: "running",
    });
  };

  return (
    // Workspace 2 cột bằng width (bám lưới Inbox) — Bối cảnh & khung chat mỗi bên 1 cột (card riêng), cách nhau bằng gap.
    <div className="grid h-[calc(100dvh-7rem)] min-h-[34rem] grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Cột trái — Bối cảnh agent đọc, tách theo tab — card riêng. */}
      <aside className="hidden min-h-0 overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 lg:flex">
        <Tabs defaultValue="identity" className="flex min-h-0 flex-1 flex-col gap-0">
          <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
            <TabsList variant="line">
              <TabsTrigger value="identity" title="Agent" aria-label="Agent"><Bot /></TabsTrigger>
              <TabsTrigger value="shop" title="Shop" aria-label="Shop"><Store /></TabsTrigger>
              {/* Tạm ẩn — bỏ comment để bật lại tab Sản phẩm & Bàn giao.
              <TabsTrigger value="catalog" title="Products" aria-label="Products"><Package /></TabsTrigger>
              <TabsTrigger value="handoff" title="Bàn giao" aria-label="Bàn giao"><Hand /></TabsTrigger>
              */}
            </TabsList>
            <Button
              variant="outline"
              size="xs"
              disabled={!dirty}
              onClick={saveSync}
              title={dirty ? "Lưu thay đổi & đồng bộ cho agent" : "Chưa có thay đổi nào"}
              className={cn(
                "shrink-0",
                dirty
                  ? "border-transparent bg-blue-600 text-white hover:bg-blue-700 hover:text-white"
                  : "bg-white text-foreground",
              )}
            >
              {dirty ? <span className="size-2 shrink-0 rounded-full bg-white" aria-hidden /> : null}
              Lưu & đồng bộ
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-3 scrollbar-hide">
            {/* Danh tính & giọng — chỉnh trực tiếp, agent đọc lại ngay khi gửi tin kế tiếp. */}
            <TabsContent value="identity" className="space-y-4">
              <div>
                <FieldLabel>Tên agent</FieldLabel>
                <Input className="mt-1" value={config.identity.name} onChange={(e) => setIdentity({ name: e.target.value })} />
              </div>
              <div>
                <FieldLabel>Xưng hô</FieldLabel>
                <Input className="mt-1" value={config.identity.pronoun} onChange={(e) => setIdentity({ pronoun: e.target.value })} />
              </div>
              <div>
                <FieldLabel>Lời chào</FieldLabel>
                <Textarea className="mt-1" rows={2} value={config.identity.greeting} onChange={(e) => setIdentity({ greeting: e.target.value })} />
              </div>
              <div className="border-t pt-4">
                <AgentFilesManager files={files} onChange={setFiles} />
              </div>
            </TabsContent>

            {/* Thông tin shop — form chỉnh trực tiếp, dùng chung với màn Thông tin cửa hàng. */}
            <TabsContent value="shop">
              <ShopInfoForm />
            </TabsContent>

            {/* Sản phẩm — tạm ẩn (bỏ comment + bật lại TabsTrigger để dùng lại).
            <TabsContent value="catalog" className="space-y-2">
              <p className="text-[11px] text-muted-foreground">{catalog.length} sản phẩm trong danh mục</p>
              {catalog.map((p) => (
                <div key={p.id} className="flex items-start gap-3 rounded-lg px-2.5 py-2 ring-1 ring-foreground/10">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{p.name}</span>
                    {p.description ? (
                      <span className="line-clamp-1 text-xs text-muted-foreground">{p.description}</span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-sm font-semibold">{formatVnd(p.price)}</span>
                    {typeof p.stock === "number" ? (
                      <span className={p.stock === 0 ? "text-[11px] text-destructive" : p.lowStock ? "text-[11px] text-amber-600" : "text-[11px] text-muted-foreground"}>
                        {p.stock === 0 ? "Hết hàng" : `Còn ${p.stock}`}
                      </span>
                    ) : null}
                  </span>
                </div>
              ))}
            </TabsContent>

            Tình huống bàn giao
            <TabsContent value="handoff" className="space-y-2">
              {config.handoffRules.map((r) => (
                <div key={r.key} className="rounded-lg px-2.5 py-2 ring-1 ring-foreground/10">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{r.label}</span>
                    <span className={r.enabled ? "shrink-0 text-[11px] font-medium text-emerald-600" : "shrink-0 text-[11px] text-muted-foreground"}>
                      {r.enabled ? "Đang bật" : "Tắt"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{r.description}</p>
                  {typeof r.threshold === "number" ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Ngưỡng: {r.threshold}
                      {r.thresholdUnit ?? ""}
                    </p>
                  ) : null}
                </div>
              ))}
            </TabsContent>
            */}
          </div>
        </Tabs>
      </aside>

      {/* Cột phải — khung chat mô phỏng Messenger (panel riêng, bo tròn góc trên, đáy phẳng như chat sheet). */}
      <div className="flex min-h-0 flex-col overflow-hidden rounded-t-xl bg-card ring-1 ring-foreground/10">
        <div className="flex items-center gap-2.5 border-b bg-card px-3 py-2.5">
          <span className="relative shrink-0">
            <AgentAvatar name={agentName} src={config.identity.avatar} size={34} className="rounded-full ring-1 ring-foreground/10" />
            <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-card bg-emerald-400" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight">{agentName}</p>
            <p className="text-[11px] leading-tight text-muted-foreground">Đang hoạt động</p>
          </div>
          <Button
            variant="ghost"
            size="xs"
            onClick={newConversation}
            title="Hội thoại mới"
            className="shrink-0"
          >
            <SquarePen className="size-3.5" aria-hidden />
            Hội thoại mới
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={retrainConversation}
            disabled={!hasChat}
            title={hasChat ? undefined : "Cần ít nhất một lượt khách nhắn để re-train"}
            className="shrink-0"
          >
            <GraduationCap className="size-3.5" aria-hidden />
            Re-train hội thoại
          </Button>
        </div>
        <div className="min-h-0 flex-1">
          <ChatWindow
            messages={messages}
            onSend={(text) => void sendLive(text)}
            disabled={busy}
            ownRole="customer"
            placeholder=""
          />
        </div>
      </div>
    </div>
  );
}

// Thời điểm hiện tại dạng "ISO không offset" (giờ máy) — khớp định dạng at của TrainingEntry.
function localIso() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{children}</p>;
}
