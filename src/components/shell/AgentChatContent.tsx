"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AgentAvatar } from "@/components/shared/AgentAvatar";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { ChatWindow } from "@/components/shared/chat/ChatWindow";
import type { ChatMessage } from "@/components/shared/chat/MessageBubble";
import { cn } from "@/lib/utils";
import { useUiStore, type AgentChatScenario } from "@/store/uiStore";
import { useAgentConfig } from "@/store/agentConfigStore";
import { buildRetrainFlow, RETRAIN_TRIGGER, retrainCtaLabel, type RetrainTurn } from "@/data/retrainFlow";
import { buildPaymentTestFlow, PAYMENT_TEST_MESSAGE } from "@/data/paymentTestFlow";
import { buildCrmTestFlow } from "@/data/crmTestFlow";
import { buildSuggestFlow } from "@/data/suggestFlow";
import type { ApplyAction } from "@/components/shared/chat/types";
import type { ComposerModel } from "@/components/shared/chat/Composer";

// Model trả lời (mock prototype) — hiển thị ở thanh công cụ ô nhập để chọn nhanh.
const CHAT_MODELS: ComposerModel[] = [
  { id: "gpt-5.4-mini", label: "GPT-5.4 mini · nhanh" },
  { id: "gpt-5.4", label: "GPT-5.4 · trả lời sâu hơn" },
  { id: "claude-haiku-4.5", label: "Claude Haiku 4.5 · tiết kiệm" },
];

// Nội dung chat "Talk to Agent" — tách riêng khỏi khung trượt (AgentChatPanel) để tái dùng:
// vừa render trong side panel, vừa render độc lập ở route /agent-chat (load qua iframe khi tách màn).
// Toàn bộ state + logic hội thoại nằm ở đây; phần header nhận các nút điều khiển (đóng/tách) qua props.

let seq = 0;
const nextId = () => `ac-${seq++}`;
const TYPING_ID = "ac-typing";
const STEP_DELAY = 650; // nhịp phát từng bước trong kịch bản re-train (tất định).

// Trả lời mẫu xoay vòng — copilot hỗ trợ chủ shop (không phải khách). Tất định, không random.
const CANNED_REPLIES = [
  "Dạ hôm nay có 1 thanh toán đang chờ anh/chị duyệt ở mục Thanh toán. Em mở giúp nhé?",
  "Doanh thu hôm nay đang nhỉnh hơn hôm qua. Em có thể tổng hợp chi tiết theo sản phẩm nếu anh/chị cần ạ.",
  "Em đã soạn sẵn mẫu tin chốt đơn: \"Dạ em xác nhận đơn của mình gồm… , tổng thanh toán… ạ\". Anh/chị muốn chỉnh gì không?",
  "Em ghi nhận rồi ạ. Em sẽ áp dụng cho các hội thoại tương tự và báo lại anh/chị khi cần duyệt.",
];

type AgentChatContentProps = {
  // Các nút điều khiển hiển thị ở góc phải header (vd nút Đóng, nút Tách màn). Tùy ngữ cảnh render.
  headerActions?: ReactNode;
};

export function AgentChatContent({ headerActions }: AgentChatContentProps) {
  const draft = useUiStore((s) => s.agentChatDraft);
  const scenario = useUiStore((s) => s.agentChatScenario);
  const { name: agentName, pronoun, avatar, tone, bannedWords, greeting: identityGreeting } = useAgentConfig((s) => s.config.identity);
  const shopName = useAgentConfig((s) => s.config.shopName);
  const shopType = useAgentConfig((s) => s.config.shopType);
  const shopAddress = useAgentConfig((s) => s.config.shopAddress);
  const shopPhone = useAgentConfig((s) => s.config.shopPhone);
  const businessProfile = useAgentConfig((s) => s.config.businessProfile);
  const agentEnabled = useAgentConfig((s) => s.config.agentEnabled);
  // Ghi câu mẫu gợi ý vào tình huống bàn giao khi bấm Apply (nguồn sự thật chung với màn Cấu hình Agent).
  const setConfig = useAgentConfig((s) => s.setConfig);
  const handoffRules = useAgentConfig((s) => s.config.handoffRules);

  // Chọn agent đang trò chuyện — mặc định Manager Agent (điều phối), kèm trợ lý của cửa hàng.
  // Nhãn trợ lý là "Agent [Tên]" để khớp luồng test sau re-train (đổi agent trên header).
  const AGENTS = [
    { id: "manager", name: "Manager Agent", avatar: undefined as string | undefined },
    { id: "assistant", name: `Agent ${agentName}`, subtitle: agentEnabled ? "Trợ lý tư vấn của bạn · đang trực" : "Trợ lý của bạn · đang tắt", avatar },
  ] as const;
  const [agentId, setAgentId] = useState<string>("manager");
  const active = AGENTS.find((a) => a.id === agentId) ?? AGENTS[0];
  const [modelId, setModelId] = useState(CHAT_MODELS[0].id);

  // Có lần đẩy draft mới (vd "Train with Manager" từ M6) → chuyển về Manager Agent. Chỉnh state khi prop đổi, không effect.
  const [seenDraftNonce, setSeenDraftNonce] = useState(0);
  if (draft && draft.nonce !== seenDraftNonce) {
    setSeenDraftNonce(draft.nonce);
    setAgentId("manager");
  }

  // Lời chào theo agent: Manager = copilot của chủ shop; trợ lý = lời chào khách (để test).
  const greetingFor = (id: string) =>
    id === "manager"
      ? `Dạ ${pronoun || "em"} chào anh/chị, ${pronoun || "em"} là ${agentName} — trợ lý của cửa hàng. Anh/chị cần ${pronoun || "em"} hỗ trợ gì ạ?`
      : identityGreeting || `Dạ ${pronoun || "em"} chào anh/chị, ${pronoun || "em"} có thể tư vấn gì cho mình ạ?`;

  const suggestions = [
    "Hôm nay có việc gì cần mình xử lý?",
    "Doanh thu hôm nay thế nào?",
    "Soạn giúp tin nhắn chốt đơn",
  ];

  const [messages, setMessages] = useState<ChatMessage[]>([{ id: nextId(), role: "agent", text: greetingFor("manager") }]);
  const [step, setStep] = useState(0);
  const [typing, setTyping] = useState(false);
  // Trạng thái kịch bản re-train: danh sách lượt, lượt hiện tại, có đang chờ user trả lời không, chip trả lời nhanh.
  const [retrainTurns, setRetrainTurns] = useState<RetrainTurn[] | null>(null);
  const [retrainIndex, setRetrainIndex] = useState(0);
  const [awaitingAnswer, setAwaitingAnswer] = useState(false);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  // Kịch bản tự chạy: chờ chuyển agent xong mới chạy (tránh đua với reset khi đổi agent).
  const [seenScenarioNonce, setSeenScenarioNonce] = useState(0);
  const [pendingScenario, setPendingScenario] = useState<AgentChatScenario | null>(null);

  // Đổi agent (qua dropdown hoặc CTA test) → reset hội thoại về lời chào agent đó, xoá trạng thái re-train.
  // Chỉnh state khi prop/đầu vào đổi ngay trong render (React pattern), không dùng effect.
  const [prevAgentId, setPrevAgentId] = useState(agentId);
  if (agentId !== prevAgentId) {
    setPrevAgentId(agentId);
    setMessages([{ id: nextId(), role: "agent", text: greetingFor(agentId) }]);
    setStep(0);
    setTyping(false);
    setRetrainTurns(null);
    setRetrainIndex(0);
    setAwaitingAnswer(false);
    setQuickReplies([]);
  }

  // Nhận tín hiệu kịch bản tự chạy: chuyển sang agent phù hợp (payment → trợ lý; gợi ý bàn giao → Manager)
  // + tự nhận prevAgentId để render-sync không reset đè, rồi đánh dấu chờ chạy. Việc chạy (có timer) để effect.
  if (scenario && scenario.nonce !== seenScenarioNonce) {
    setSeenScenarioNonce(scenario.nonce);
    // payment → trợ lý (đóng vai khách chốt đơn); crm & gợi ý bàn giao → Manager (việc điều phối/tích hợp).
    const target = scenario.kind === "payment" ? "assistant" : "manager";
    setAgentId(target);
    setPrevAgentId(target);
    setPendingScenario(scenario);
  }

  // Phát tuần tự các emission của một lượt kịch bản (typing → tin; tool: running → done), rồi mở câu hỏi/CTA.
  const playTurn = (turn: RetrainTurn, isLast: boolean) => {
    setTyping(true);
    setQuickReplies([]);
    let i = 0;
    const run = () => {
      if (i >= turn.emissions.length) {
        setTyping(false);
        if (turn.quickReplies && turn.quickReplies.length > 0) {
          setQuickReplies(turn.quickReplies);
          setAwaitingAnswer(!isLast); // lượt giữa = câu hỏi (chờ trả lời); lượt cuối = CTA test.
        } else {
          setAwaitingAnswer(false);
        }
        // Xong lượt cuối → kết thúc kịch bản (giữ chip CTA), cho phép /re-train lại lần sau.
        if (isLast) setRetrainTurns(null);
        return;
      }
      const e = turn.emissions[i];
      i += 1;
      if (e.kind === "tool") {
        const id = nextId();
        setMessages((m) => [
          ...m,
          { id, role: "tool", text: e.label, tool: { label: e.label, target: e.target, status: "running" } },
        ]);
        setTimeout(() => {
          setMessages((m) =>
            m.map((x) => (x.id === id && x.tool ? { ...x, tool: { ...x.tool, status: "done" } } : x)),
          );
          run();
        }, STEP_DELAY);
      } else if (e.kind === "payment") {
        // Thẻ mã QR — hiện hiệu ứng "đang gõ" rồi đẩy thẻ thanh toán (như tin agent gửi).
        setMessages((m) => [...m, { id: TYPING_ID, role: "typing", text: "" }]);
        setTimeout(() => {
          setMessages((m) => [...m.filter((x) => x.id !== TYPING_ID), { id: nextId(), role: "agent", text: "", payment: e.payment }]);
          run();
        }, STEP_DELAY);
      } else {
        setMessages((m) => [...m, { id: TYPING_ID, role: "typing", text: "" }]);
        setTimeout(() => {
          setMessages((m) => {
            const base = m.filter((x) => x.id !== TYPING_ID);
            return e.kind === "reasoning"
              ? [...base, { id: nextId(), role: "reasoning", text: e.text, steps: e.steps }]
              : [...base, { id: nextId(), role: "agent", text: e.text, apply: e.apply }];
          });
          run();
        }, STEP_DELAY);
      }
    };
    run();
  };

  // Chạy kịch bản "Kiểm tra với Agent": reset hội thoại về lời chào trợ lý + tin khách chốt đơn, rồi phát lượt 0.
  const startPaymentTest = () => {
    const turns = buildPaymentTestFlow(agentName, pronoun);
    setRetrainTurns(turns);
    setRetrainIndex(0);
    setAwaitingAnswer(false);
    setStep(0);
    setMessages([
      { id: nextId(), role: "agent", text: greetingFor("assistant") },
      { id: nextId(), role: "customer", text: PAYMENT_TEST_MESSAGE },
    ]);
    playTurn(turns[0], turns.length === 1);
  };

  // Chạy kịch bản "Kiểm tra với Agent" cho CRM: Manager nhận yêu cầu rồi gọi tools đại diện + trả dữ liệu mẫu.
  const startCrmTest = (crmName: string) => {
    const turns = buildCrmTestFlow(crmName, pronoun);
    setRetrainTurns(turns);
    setRetrainIndex(0);
    setAwaitingAnswer(false);
    setStep(0);
    setMessages([
      { id: nextId(), role: "agent", text: greetingFor("manager") },
      { id: nextId(), role: "customer", text: `Kiểm tra kết nối ${crmName} giúp mình với.` },
    ]);
    playTurn(turns[0], turns.length === 1);
  };

  // Chạy kịch bản "Gợi ý câu khách nói": Manager nhận yêu cầu rồi đề xuất câu mẫu kèm nút Apply cho tình huống đó.
  const runHandoffSuggest = (sc: Extract<AgentChatScenario, { kind: "suggestHandoff" }>) => {
    const turns = buildSuggestFlow({ ruleKey: sc.ruleKey, label: sc.label, description: sc.description, agentName });
    setRetrainTurns(turns);
    setRetrainIndex(0);
    setAwaitingAnswer(false);
    setStep(0);
    setMessages([
      { id: nextId(), role: "agent", text: greetingFor("manager") },
      { id: nextId(), role: "customer", text: `Gợi ý giúp mình vài ví dụ câu khách thường nói cho tình huống bàn giao "${sc.label}".` },
    ]);
    playTurn(turns[0], turns.length === 1);
  };

  // Chờ một nhịp cho việc đổi agent ổn định rồi mới chạy kịch bản (timer nằm ngoài thân effect — không reset đồng bộ).
  useEffect(() => {
    if (!pendingScenario) return;
    const sc = pendingScenario;
    const t = setTimeout(() => {
      setPendingScenario(null);
      if (sc.kind === "payment") startPaymentTest();
      else if (sc.kind === "crm") startCrmTest(sc.crmName);
      else runHandoffSuggest(sc);
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingScenario]);

  const handleSend = async (text: string) => {
    setQuickReplies([]);

    // Đang trong re-train và chờ user trả lời → ghi câu trả lời rồi sang lượt sau.
    if (retrainTurns && awaitingAnswer) {
      setMessages((m) => [...m, { id: nextId(), role: "customer", text }]);
      setAwaitingAnswer(false);
      const next = retrainIndex + 1;
      setRetrainIndex(next);
      playTurn(retrainTurns[next], next === retrainTurns.length - 1);
      return;
    }

    // Bắt đầu kịch bản re-train (chỉ với Manager Agent) khi gặp lệnh /re-train.
    if (!retrainTurns && agentId === "manager" && RETRAIN_TRIGGER.test(text)) {
      setMessages((m) => [...m, { id: nextId(), role: "customer", text }]);
      const turns = buildRetrainFlow(agentName);
      setRetrainTurns(turns);
      setRetrainIndex(0);
      playTurn(turns[0], turns.length === 1);
      return;
    }

    // Mặc định: gọi model trả lời (dự phòng câu mẫu nếu API lỗi).
    // Lịch sử hội thoại gửi cho model — bỏ greeting/typing/kịch bản, map sang role chuẩn.
    const history = messages
      .filter((m) => m.id !== TYPING_ID && (m.role === "agent" || m.role === "customer"))
      .map((m) => ({ role: m.role === "agent" ? ("assistant" as const) : ("user" as const), text: m.text }));

    setTyping(true);
    setMessages((m) => [
      ...m,
      { id: nextId(), role: "customer", text },
      { id: TYPING_ID, role: "typing", text: "" },
    ]);

    // Model có thể tách câu trả lời thành nhiều tin ngắn bằng dấu [NEXT] (xem SPLIT_RULE ở route).
    // Phát từng tin tuần tự, kèm hiệu ứng "đang gõ" giữa các tin cho tự nhiên như nhắn tay.
    const pushReply = (reply: string) => {
      setStep((s) => s + 1);
      const chunks = reply.split(/\n*\s*\[NEXT\]\s*\n*/i).map((c) => c.trim()).filter(Boolean);
      const playChunk = (i: number) => {
        if (i >= chunks.length) {
          setTyping(false);
          setMessages((m) => m.filter((x) => x.id !== TYPING_ID));
          return;
        }
        setTyping(true);
        setMessages((m) => (m.some((x) => x.id === TYPING_ID) ? m : [...m, { id: TYPING_ID, role: "typing", text: "" }]));
        // Nhịp gõ theo độ dài tin (tối thiểu ~450ms, tối đa ~1300ms) — đỡ giật mà vẫn tự nhiên.
        const delay = Math.min(1300, 450 + chunks[i].length * 10);
        setTimeout(() => {
          setMessages((m) => [...m.filter((x) => x.id !== TYPING_ID), { id: nextId(), role: "agent", text: chunks[i] }]);
          playChunk(i + 1);
        }, delay);
      };
      playChunk(0);
    };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...history.map((h) => ({ role: h.role, content: h.text })), { role: "user", content: text }],
          // persona quyết định system prompt: Manager = copilot chủ shop; assistant = tư vấn viên đọc hồ sơ định nghĩa.
          agent: {
            name: agentName,
            pronoun,
            tone,
            shopName,
            shopType,
            shopAddress,
            shopPhone,
            bannedWords,
            businessProfile,
            persona: agentId === "assistant" ? "assistant" : "manager",
          },
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

  // Bấm chip trả lời nhanh: CTA "Chat thử…" → chuyển sang trợ lý để test; còn lại = trả lời câu hỏi.
  const handleQuickReply = (text: string) => {
    if (text === retrainCtaLabel(agentName)) {
      setQuickReplies([]);
      setAgentId("assistant");
      return;
    }
    void handleSend(text);
  };

  // Bấm Apply dưới tin agent: ghi câu mẫu gợi ý vào tình huống bàn giao (có thì gộp, chưa có thì tạo mới),
  // rồi đánh dấu tin đã áp (đổi nút sang "Đã áp dụng"). Nguồn sự thật = agentConfigStore (đồng bộ màn Cấu hình).
  const handleApply = (messageId: string, action: ApplyAction) => {
    if (action.kind === "handoffPhrases") {
      const existing = handoffRules.find((r) => r.key === action.ruleKey);
      if (existing) {
        const merged = [...existing.triggerPhrases];
        for (const p of action.phrases) if (!merged.includes(p)) merged.push(p);
        setConfig({ handoffRules: handoffRules.map((r) => (r.key === action.ruleKey ? { ...r, triggerPhrases: merged } : r)) });
      } else {
        setConfig({
          handoffRules: [
            ...handoffRules,
            {
              key: action.ruleKey,
              label: action.label,
              description: action.description || "Tình huống do bạn thêm.",
              triggerPhrases: action.phrases,
              enabled: true,
              custom: true,
            },
          ],
        });
      }
    }
    setMessages((m) => m.map((x) => (x.id === messageId && x.apply ? { ...x, apply: { ...x.apply, applied: true } } : x)));
  };

  const showSuggestions = agentId === "manager" && messages.length <= 1 && quickReplies.length === 0 && !typing;

  return (
    <div className="flex h-full w-full flex-col">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
        <span className="relative shrink-0">
          <AgentAvatar name={active.name} src={active.avatar} size={36} className="ring-1 ring-foreground/10" />
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-card",
              // Manager luôn hoạt động (xanh); Trợ Lý theo trạng thái trực kênh (agentEnabled).
              active.id === "manager" || agentEnabled ? "bg-emerald-500" : "bg-muted-foreground",
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
          {"subtitle" in active && active.subtitle ? (
            <p className="truncate text-xs text-muted-foreground">{active.subtitle}</p>
          ) : null}
        </div>
        {headerActions ? <div className="flex shrink-0 items-center gap-0.5">{headerActions}</div> : null}
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
          quickReplies={showSuggestions ? suggestions : quickReplies}
          onQuickReply={handleQuickReply}
          onApply={handleApply}
          composer={{
            enableAttachments: true,
            enableVoice: true,
            models: CHAT_MODELS,
            modelId,
            onModelChange: setModelId,
          }}
        />
      </div>
    </div>
  );
}
