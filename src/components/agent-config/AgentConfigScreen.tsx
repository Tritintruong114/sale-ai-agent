"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, Clock, Download, Eye, FileText, GraduationCap, Hand, MessageSquare, MoreVertical, Pencil, Plus, Sparkles, Trash2, Upload, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AgentAvatar } from "@/components/shared/AgentAvatar";
import { cn } from "@/lib/utils";
import { useAgentConfig } from "@/store/agentConfigStore";
import { type HandoffRule, type DayHours, type WeekdayKey, WEEKDAYS } from "@/data/config";
import { useUiStore } from "@/store/uiStore";
import { AGENT_CONFIG_SECTIONS, type AgentConfigTab } from "./sections";
import { TrainingLog } from "./TrainingLog";
import { NotifyChannelDialog, NotifyChannelRow, type NotifyChannelKey } from "./NotifyChannelDialog";
import { BYOK_PROVIDERS } from "@/data/onboarding";
import { AGENT_FILES, type AgentFile } from "@/data/agentFiles";
import learningData from "@/data/learning.json";
import trainingData from "@/data/training.json";

// M6 Cấu hình Agent — hub các nhóm, đọc/ghi agentConfigStore (nguồn sự thật chung với Onboarding).
// Điều hướng nhóm = segmented tabs trên TopBar (§6.11); panel theo useUiStore.agentConfigTab.
// Bám design.md: lede tóm tắt theo nhóm (§6.2), surface chuẩn (§4.4), HITL banner amber/emerald (§5/§6.7),
// empty state (§6.6), URL reflect hai chiều (§6.11/§10). Nhóm config form đọc dễ ở max-w-3xl (line-length).
// Nhóm Học hằng ngày: config (enabled/runAt/sources) từ store; nhật ký + Manager update từ learning.json (mock).

// Daily learn (§6.1) — tóm tắt mỗi ngày agent học được gì + học từ đâu (read-only, chỉ để xem).
// Mỗi ngày gồm các "điều học được" theo nguồn: bàn giao / chủ shop tư vấn / tình huống đặc biệt.
type LearnCaseType = "handoff" | "owner" | "special";
type LearnCase = { id: string; type: LearnCaseType; insight: string; from: string };
type LearnDay = { id: string; date: string; summary: string; cases: LearnCase[] };

// Nhãn + màu cho từng nguồn agent học được (§5 chip — màu phân biệt nguồn, không phải mức độ).
const LEARN_CASE_META: Record<LearnCaseType, { label: string; icon: typeof Hand; className: string }> = {
  handoff: { label: "Bàn giao", icon: Hand, className: "border-indigo-200 bg-indigo-50 text-indigo-700" },
  owner: { label: "Bạn tư vấn khách", icon: MessageSquare, className: "border-violet-200 bg-violet-50 text-violet-700" },
  special: { label: "Tình huống đặc biệt", icon: Sparkles, className: "border-rose-200 bg-rose-50 text-rose-700" },
};

// Danh sách "Agent học từ đâu" (nguồn) tạm ẩn ở UI — giữ dữ liệu trong learning.json. Đặt true để hiện lại.
const LEARNING_SOURCES_LIST_ENABLED = false;

// Giờ trực của agent tạm ẩn ở UI (chưa có logic thực thi runtime). Đặt true để hiện lại.
const ACTIVE_HOURS_ENABLED = false;

// Giờ trực mặc định khi chủ shop bật lần đầu (config cũ trong localStorage chưa có activeHours).
const DEFAULT_ACTIVE_WEEKLY: Record<WeekdayKey, DayHours> = {
  mon: { closed: false, open: "08:00", close: "22:00" },
  tue: { closed: false, open: "08:00", close: "22:00" },
  wed: { closed: false, open: "08:00", close: "22:00" },
  thu: { closed: false, open: "08:00", close: "22:00" },
  fri: { closed: false, open: "08:00", close: "22:00" },
  sat: { closed: false, open: "08:00", close: "22:00" },
  sun: { closed: false, open: "08:00", close: "22:00" },
};

const NOTIFY_EVENTS = [
  { key: "handoff", label: "Khi Agent bàn giao", hint: "Khi agent dừng" }];

// Sinh key duy nhất cho tình huống chủ shop tự thêm (bỏ dấu, gạch dưới, tránh trùng).
function makeHandoffKey(label: string, taken: string[]): string {
  const base =
    label
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/đ/gi, "d")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "tinh_huong";
  let key = `custom_${base}`;
  let i = 2;
  while (taken.includes(key)) key = `custom_${base}_${i++}`;
  return key;
}

export function AgentConfigScreen({ initialTab }: { initialTab?: string }) {
  const router = useRouter();
  const config = useAgentConfig((s) => s.config);
  const setConfig = useAgentConfig((s) => s.setConfig);
  const tab = useUiStore((s) => s.agentConfigTab);
  const setTab = useUiStore((s) => s.setAgentConfigTab);
  const setAgentChatOpen = useUiStore((s) => s.setAgentChatOpen);
  const pushAgentChatDraft = useUiStore((s) => s.pushAgentChatDraft);
  const startHandoffSuggest = useUiStore((s) => s.startHandoffSuggest);
  const learnDays = learningData.dailyLearn as LearnDay[]; // read-only summarize — chỉ để xem
  const avatarInput = useRef<HTMLInputElement>(null);
  const fileImport = useRef<HTMLInputElement>(null);

  const [addingHandoff, setAddingHandoff] = useState(false); // mở dialog thêm tình huống bàn giao

  // Sửa một tình huống bàn giao theo key (bật/tắt, ngưỡng, câu mẫu).
  const updateHandoffRule = (key: string, patch: Partial<HandoffRule>) =>
    setConfig({ handoffRules: config.handoffRules.map((r) => (r.key === key ? { ...r, ...patch } : r)) });
  const removeHandoffRule = (key: string) =>
    setConfig({ handoffRules: config.handoffRules.filter((r) => r.key !== key) });

  // Hồ sơ định nghĩa agent — CRUD client (prototype): seed từ AGENT_FILES, đổi là state (§10 mock-driven).
  const [files, setFiles] = useState<AgentFile[]>(AGENT_FILES);
  const [preview, setPreview] = useState<AgentFile | null>(null); // đang xem
  const [editing, setEditing] = useState<AgentFile | null>(null); // đang sửa
  const [deleting, setDeleting] = useState<AgentFile | null>(null); // chờ xác nhận xoá
  const [notifyDialog, setNotifyDialog] = useState<NotifyChannelKey | null>(null); // modal kết nối kênh thông báo

  // Nối kênh thông báo: lưu cờ đã nối + token bot dùng để gửi tin.
  const connectNotify = (channel: NotifyChannelKey, value: string) => {
    setConfig({
      notifyChannels: {
        ...config.notifyChannels,
        [channel]: true,
        ...(channel === "telegram" ? { telegramToken: value } : { zaloToken: value }),
      },
    });
    setNotifyDialog(null);
  };
  const disconnectNotify = (channel: NotifyChannelKey) =>
    setConfig({
      notifyChannels: {
        ...config.notifyChannels,
        [channel]: false,
        ...(channel === "telegram" ? { telegramToken: undefined } : { zaloToken: undefined }),
      },
    });

  // Đổi ảnh đại diện agent — prototype: tạo URL tạm, không upload thật (giống Onboarding bước tạo agent).
  const onPickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setConfig({ identity: { ...config.identity, avatar: URL.createObjectURL(file) } });
  };

  // Giờ trực của agent — bật/tắt cả khối hoặc sửa lịch theo từng ngày. Fallback lịch mặc định cho config cũ.
  const activeHours = config.identity.activeHours ?? { enabled: false, weekly: DEFAULT_ACTIVE_WEEKLY };
  const setActiveHours = (patch: Partial<{ enabled: boolean; weekly: Record<WeekdayKey, DayHours> }>) =>
    setConfig({ identity: { ...config.identity, activeHours: { ...activeHours, ...patch } } });
  const setActiveDay = (key: WeekdayKey, patch: Partial<DayHours>) =>
    setActiveHours({ weekly: { ...activeHours.weekly, [key]: { ...activeHours.weekly[key], ...patch } } });

  // Thêm file = tải file .md lên: đọc nội dung, lấy tên file làm tiêu đề tạm — chỉnh lại sau bằng nút Sửa.
  const onImportFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = ""; // cho phép chọn lại cùng một file
    if (picked.length === 0) return;
    const added = await Promise.all(
      picked.map(async (file, i) => {
        const name = file.name.toLowerCase().endsWith(".md") ? file.name : `${file.name}.md`;
        return {
          key: `file-${Date.now()}-${i}`,
          file: name,
          title: file.name.replace(/\.[^.]+$/, ""),
          description: "",
          content: await file.text(),
        } satisfies AgentFile;
      }),
    );
    setFiles((prev) => [...prev, ...added]);
  };

  // Tải một file .md xuống máy (Blob + anchor — không cần backend).
  const downloadFile = (f: AgentFile) => triggerDownload(f.file, f.content);
  // Tải tất cả: gộp các file thành một .md (chưa có lib zip), mỗi file là một mục có tiêu đề.
  const downloadAll = () => {
    const bundle = files.map((f) => `<!-- ${f.file} -->\n\n${f.content}`).join("\n\n---\n\n");
    triggerDownload(`agent-${slugify(config.identity.name)}.md`, bundle);
  };

  const saveFile = (draft: AgentFile) => setFiles((prev) => prev.map((x) => (x.key === draft.key ? draft : x)));
  const removeFile = (key: string) => setFiles((prev) => prev.filter((x) => x.key !== key));

  // Train với Manager: mở panel chat (góc phải) + điền sẵn prompt re-train vào ô nhập, chờ chủ shop gửi.
  const trainWithManager = (f: AgentFile) => {
    setAgentChatOpen(true);
    pushAgentChatDraft(`Tiến hành skills /re-train file ${f.file} của agent ${config.identity.name}`);
  };
  // Train cả agent (không gắn file cụ thể) — từ cụm nút của nhóm.
  const trainAgent = () => {
    setAgentChatOpen(true);
    pushAgentChatDraft(`Tiến hành skills /re-train toàn bộ định nghĩa của agent ${config.identity.name}`);
  };

  // Gợi ý câu mẫu với Manager: mở panel chat + điền sẵn prompt nhờ agent gợi ý ví dụ khách nói cho tình huống bàn giao.
  // Chủ shop chỉnh prompt rồi gửi; câu agent gợi ý có thể thêm lại vào danh sách "Ví dụ khách nói".
  const suggestPhrases = (ruleKey: string, label: string, description?: string) =>
    startHandoffSuggest({ ruleKey, label: label.trim() || "Tình huống mới", description: description?.trim() || undefined });

  // Deep-link ?tab= từ route → đồng bộ vào composite list trên TopBar khi vào màn (§6.11).
  useEffect(() => {
    if (initialTab && AGENT_CONFIG_SECTIONS.some((s) => s.key === initialTab)) {
      setTab(initialTab as AgentConfigTab);
    }
  }, [initialTab, setTab]);

  // …và đổi nhóm thì ghi ngược lên thanh địa chỉ (replace, không nhảy cuộn) — link chia sẻ + back đúng nhóm.
  // Đọc tab SỐNG từ store (getState), KHÔNG dùng biến closure: lúc mount deep-link vừa set store theo ?tab=,
  // nên reflect không ghi đè ngược về tab mặc định → không bounce. An toàn cả khi Strict Mode gọi effect 2 lần.
  useEffect(() => {
    const liveTab = useUiStore.getState().agentConfigTab;
    const current = new URLSearchParams(window.location.search).get("tab");
    if (current !== liveTab) router.replace(`/agent-config?tab=${liveTab}`, { scroll: false });
  }, [tab, router]);

  // Tóm tắt nhật ký đào tạo cho lede tab Đào tạo — log đã xếp mới→cũ nên phần tử đầu là gần nhất.
  const lastTrainedAt = trainingData.log[0] ? formatTrainedAt(trainingData.log[0].at) : "—";

  // Daily learn chỉ để xem (read-only summarize) — không có duyệt/bỏ. Tổng số điều học gần đây cho lede.
  const learnedCount = learnDays.reduce((n, d) => n + d.cases.length, 0);
  const handoffOn = config.handoffRules.filter((r) => r.enabled).length;
  const notifyChannelsOn = [config.notifyChannels.telegram, config.notifyChannels.zalo].filter(Boolean).length;

  return (
    // Màn config = trang cuộn (§6.1); form đọc dễ ở bề rộng vừa phải (line-length-control).
    // Tab Đào tạo là bảng nhật ký → full width để xem thoải mái; các nhóm form còn lại giữ max-w-3xl.
    <div className={cn("mx-auto pb-4", tab === "training" ? "max-w-none" : "max-w-3xl")}>
      <Tabs value={tab} onValueChange={(v) => setTab(v as AgentConfigTab)}>
        {/* M6.1 — Học hằng ngày (G2) */}
        <TabsContent value="learning" className="space-y-5">
          <GroupHeader context="Mỗi ngày agent tự động học và tối ưu bản thân">
            {config.dailyLearning.enabled ? (
              learnedCount > 0 ? (
                <>
                Agent sẽ tự động học và tự động cải thiện
                </>
              ) : (
                <span className="text-muted-foreground">Agent sẽ tự động học và cải thiện mỗi ngày.</span>
              )
            ) : (
              <span className="text-muted-foreground">Agent sẽ tự động học và cải thiện mỗi ngày.</span>
            )}
          </GroupHeader>

          <Card size="sm">
            <CardContent className="space-y-4">
              <SwitchRow
                checked={config.dailyLearning.enabled}
                onCheckedChange={(v) => setConfig({ dailyLearning: { ...config.dailyLearning, enabled: v } })}
                label="Bật tự học hằng ngày"
                // hint="Agent tổng hợp điều học được mỗi ngày thành bản tóm tắt"
              />
              {config.dailyLearning.enabled ? (
                <>
                  <Row label="Chạy mỗi ngày lúc">
                    <Input
                      type="time"
                      className="w-32"
                      value={config.dailyLearning.runAt}
                      onChange={(e) => setConfig({ dailyLearning: { ...config.dailyLearning, runAt: e.target.value } })}
                    />
                  </Row>
                  {/* Danh sách "Agent học từ đâu" tạm ẩn (xem LEARNING_SOURCES_LIST_ENABLED). */}
                  {LEARNING_SOURCES_LIST_ENABLED ? (
                    <div className="space-y-2">
                      <SubHead>Agent học từ đâu</SubHead>
                      {config.dailyLearning.sources.map((s, i) => (
                        <SwitchRow
                          key={s.key}
                          checked={s.enabled}
                          onCheckedChange={(v) => {
                            const sources = config.dailyLearning.sources.map((x, j) => (j === i ? { ...x, enabled: v } : x));
                            setConfig({ dailyLearning: { ...config.dailyLearning, sources } });
                          }}
                          label={s.label}
                          right={<Badge variant="secondary" className="tabular-nums">{s.count}</Badge>}
                        />
                      ))}
                    </div>
                  ) : null}
                </>
              ) : null}
            </CardContent>
          </Card>

          {/* Daily learn — tóm tắt theo ngày (read-only): mỗi ngày agent học được gì, học từ đâu
              (bàn giao / chủ shop tư vấn / tình huống đặc biệt). Chỉ để xem, không có duyệt/bỏ. */}
          {config.dailyLearning.enabled ? (
            <section className="space-y-3" aria-label="Daily learn — tóm tắt học theo ngày">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <GraduationCap className="size-4 shrink-0 text-violet-600" aria-hidden />
                <h2 className="text-sm font-semibold">Daily learn</h2>
                {/* <span className="text-xs text-muted-foreground">tóm tắt mỗi ngày agent học được gì và học từ đâu</span> */}
              </div>
              {learnDays.length === 0 ? (
                <EmptyState
                  icon={Sparkles}
                  title="Chưa có ngày học nào"
                  description="Mỗi tối agent tổng hợp điều rút ra từ hội thoại trong ngày và ghi tóm tắt vào đây."
                />
              ) : (
                learnDays.map((day) => <DailyLearnCard key={day.id} day={day} />)
              )}
            </section>
          ) : null}
        </TabsContent>

        {/* M6.2 — Đào tạo: nhật ký mỗi lần định nghĩa agent được cập nhật (re-train / tự học / sửa tay). */}
        <TabsContent value="training" className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <GroupHeader context="Theo dõi mỗi lần agent được đào tạo và những gì đã thay đổi.">
              Đào tạo gần nhất <span className="text-foreground">{lastTrainedAt}</span>.
            </GroupHeader>
            <Button size="sm" onClick={trainAgent}>
              <GraduationCap className="size-4" aria-hidden />
              Train with Manager
            </Button>
          </div>
          <TrainingLog />
        </TabsContent>

        {/* M6.3 — Hand-off */}
        <TabsContent value="handoff" className="space-y-5">
          <GroupHeader context="Chọn lúc agent nên dừng lại và bàn giao cho bạn xử lý.">
            {handoffOn > 0 ? (
              <>
                Đang bật <span className="text-foreground">{handoffOn}/{config.handoffRules.length}</span> tình huống bàn giao cho bạn.
              </>
            ) : (
              <span className="text-amber-600">Chưa bật tình huống nào — agent sẽ tự trả lời mọi trường hợp.</span>
            )}
          </GroupHeader>

          {/* Giải thích cơ chế bàn giao (HITL) + nối sang tab Thông báo. */}
          <div className="flex gap-3 rounded-xl bg-muted/40 p-3.5 ring-1 ring-foreground/10">
            <Hand className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Bàn giao</span> là khi agent tự dừng trả lời và chuyển hội thoại cho bạn. Lúc đó bạn nhận thông báo rồi tiếp nhận trao đổi với khách —{" "}
              <button
                type="button"
                onClick={() => setTab("notify")}
                className="font-medium text-foreground underline decoration-foreground/30 underline-offset-2 hover:decoration-foreground"
              >
                chọn nơi nhận thông báo
              </button>
              .
            </p>
          </div>

          {/* Danh sách phẳng — mỗi tình huống có mô tả + ví dụ câu khách nói sửa được. */}
          <Card size="sm">
            <CardContent className="space-y-2">
              {config.handoffRules.map((r) => (
                <HandoffRuleRow
                  key={r.key}
                  rule={r}
                  onToggle={(v) => updateHandoffRule(r.key, { enabled: v })}
                  onThreshold={(n) => updateHandoffRule(r.key, { threshold: n })}
                  onPhrasesChange={(phrases) => updateHandoffRule(r.key, { triggerPhrases: phrases })}
                  onSuggest={() => suggestPhrases(r.key, r.label, r.description)}
                  onRemove={() => removeHandoffRule(r.key)}
                />
              ))}
            </CardContent>
          </Card>

          <Button
            type="button"
            variant="outline"
            onClick={() => setAddingHandoff(true)}
            className="w-full border-dashed text-muted-foreground hover:text-foreground"
          >
            <Plus className="size-4" aria-hidden />
            Thêm tình huống bàn giao
          </Button>

          <AddHandoffDialog
            open={addingHandoff}
            onOpenChange={setAddingHandoff}
            existingKeys={config.handoffRules.map((r) => r.key)}
            onAdd={(rule) => setConfig({ handoffRules: [...config.handoffRules, rule] })}
            onSuggest={(label, description) =>
              suggestPhrases(
                makeHandoffKey(label || "tinh huong moi", config.handoffRules.map((r) => r.key)),
                label,
                description,
              )
            }
          />
        </TabsContent>

        {/* M6.4 — Danh tính */}
        <TabsContent value="identity" className="space-y-5">
          <GroupHeader context="Tính cách và giọng điệu của agent khi tư vấn cho khách.">
            <span className="text-foreground">{config.identity.name}</span>
          </GroupHeader>

          <Card size="sm">
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {/* Ảnh đại diện — có ảnh thì hiện ảnh, chưa có thì agent dùng hình tạo theo tên (AgentAvatar). */}
              <div className="flex items-center gap-4 sm:col-span-2">
                <AgentAvatar name={config.identity.name} src={config.identity.avatar} size={56} className="ring-1 ring-foreground/10" />
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap gap-1.5">
                    <Button variant="outline" size="xs" onClick={() => avatarInput.current?.click()}>
                      <Upload className="size-3.5" aria-hidden />
                      Đổi ảnh
                    </Button>
                    {config.identity.avatar ? (
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => setConfig({ identity: { ...config.identity, avatar: undefined } })}
                      >
                        Gỡ ảnh
                      </Button>
                    ) : null}
                  </div>
                  {/* <p className="text-xs text-muted-foreground">Chưa có ảnh thì agent dùng ảnh tạo từ tên.</p> */}
                  <input ref={avatarInput} type="file" accept="image/*" className="hidden" onChange={onPickAvatar} />
                </div>
              </div>
              <Field label="Tên agent">
                <Input value={config.identity.name} onChange={(e) => setConfig({ identity: { ...config.identity, name: e.target.value } })} />
              </Field>
              <Field label="Xưng hô">
                <Input value={config.identity.pronoun} onChange={(e) => setConfig({ identity: { ...config.identity, pronoun: e.target.value } })} />
              </Field>
              <Field label="Lời chào" className="sm:col-span-2">
                <Textarea rows={2} value={config.identity.greeting} onChange={(e) => setConfig({ identity: { ...config.identity, greeting: e.target.value } })} />
              </Field>
            </CardContent>
          </Card>

          {/* Giờ trực — bật/tắt; bật thì agent chỉ tự trả lời trong khung giờ đặt, ngoài giờ tự Tạm ngưng (§4.4). */}
          {ACTIVE_HOURS_ENABLED ? (
          <Card size="sm">
            <CardContent className="space-y-4">
              <SwitchRow
                checked={activeHours.enabled}
                onCheckedChange={(v) => setActiveHours({ enabled: v })}
                label="Chỉ trực trong giờ hoạt động"
                hint="Ngoài khung giờ đã đặt, agent tự Tạm ngưng trả lời khách"
              />
              {activeHours.enabled ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="size-3.5" aria-hidden />
                    <SubHead>Khung giờ trực</SubHead>
                  </div>
                  {WEEKDAYS.map(({ key, label }) => {
                    const day = activeHours.weekly[key];
                    return (
                      <div key={key} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg px-3 py-2 ring-1 ring-foreground/10">
                        <span className="w-20 shrink-0 text-sm font-medium">{label}</span>
                        <label className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Switch checked={!day.closed} onCheckedChange={(v) => setActiveDay(key, { closed: !v })} />
                          {day.closed ? "Nghỉ" : "Trực"}
                        </label>
                        <div className={cn("ml-auto flex items-center gap-2", day.closed && "pointer-events-none opacity-40")}>
                          <Input
                            type="time"
                            className="w-28"
                            value={day.open}
                            disabled={day.closed}
                            aria-label={`Bắt đầu trực ${label}`}
                            onChange={(e) => setActiveDay(key, { open: e.target.value })}
                          />
                          <span className="text-muted-foreground">–</span>
                          <Input
                            type="time"
                            className="w-28"
                            value={day.close}
                            disabled={day.closed}
                            aria-label={`Ngưng trực ${label}`}
                            onChange={(e) => setActiveDay(key, { close: e.target.value })}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </CardContent>
          </Card>
          ) : null}

          {/* Hồ sơ định nghĩa agent — CRUD + tải về: xem/sửa/xoá mỗi file, thêm file mới (§4.4 item surface). */}
          <Card size="sm">
            <CardContent className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <SubHead>Hồ sơ định nghĩa agent</SubHead>
                  {/* <p className="text-xs text-muted-foreground">
                    Các file định hình cách agent trả lời — tải lên, sửa hoặc tải xuống.
                  </p> */}
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                  <Button variant="outline" size="xs" onClick={downloadAll} disabled={files.length === 0}>
                    <Download className="size-3.5" aria-hidden />
                    Tải tất cả
                  </Button>
                  <Button variant="outline" size="xs" onClick={() => fileImport.current?.click()}>
                    <Upload className="size-3.5" aria-hidden />
                    Tải lên
                  </Button>
                  {/* Nút "Train with Manager" tạm ẩn — bỏ comment để hiện lại. */}
                  {/* <Button size="xs" onClick={trainAgent}>
                    <GraduationCap className="size-3.5" aria-hidden />
                    Train with Manager
                  </Button> */}
                  <input
                    ref={fileImport}
                    type="file"
                    accept=".md,.markdown,.txt,text/markdown,text/plain"
                    multiple
                    className="hidden"
                    onChange={onImportFiles}
                  />
                </div>
              </div>

              {files.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="Chưa có file định nghĩa nào"
                  description="Tải file .md lên để mô tả tính cách, kỹ năng hoặc nguyên tắc cho agent."
                />
              ) : (
                files.map((f) => (
                  <div key={f.key} className="flex items-center gap-3 rounded-lg px-3 py-2 ring-1 ring-foreground/10">
                    <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-1.5 text-sm">
                        {f.title}
                        <code className="rounded bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">{f.file}</code>
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{f.description}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <Button variant="ghost" size="icon-sm" aria-label={`Xem ${f.title}`} title="Xem nội dung" onClick={() => setPreview(f)}>
                        <Eye className="size-4" aria-hidden />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Tuỳ chọn ${f.title}`} title="Tuỳ chọn" />}>
                          <MoreVertical className="size-4" aria-hidden />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => trainWithManager(f)}>
                            <GraduationCap aria-hidden />
                            Train with Manager
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => downloadFile(f)}>
                            <Download aria-hidden />
                            Tải xuống
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditing(f)}>
                            <Pencil aria-hidden />
                            Sửa
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive data-highlighted:text-destructive"
                            onClick={() => setDeleting(f)}
                          >
                            <Trash2 aria-hidden />
                            Xoá
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* M6.5 — Khoá AI / BYOK (G1) */}
        <TabsContent value="byok" className="space-y-5">
          <GroupHeader context="Chọn chạy bằng khoá API nền tảng hay khoá API riêng của bạn.">
            {config.byok.mode === "platform" ? (
              <>Đang dùng <span className="text-foreground">khoá API nền tảng</span> — chạy ngay, không cần cấu hình.</>
            ) : (
              <>
                Đang dùng <span className="text-foreground">khoá API riêng</span> của bạn
                {config.byok.providers.length > 0 ? <> · {config.byok.providers.length} nhà cung cấp</> : null}.
              </>
            )}
          </GroupHeader>

          <Card size="sm">
            <CardContent className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <ModeCard
                  active={config.byok.mode === "platform"}
                  title="Khoá API nền tảng"
                  desc="Mặc định — chạy ngay, không cần cấu hình"
                  onClick={() => setConfig({ byok: { ...config.byok, mode: "platform" } })}
                />
                <ModeCard
                  active={config.byok.mode === "own"}
                  title="Khoá API riêng"
                  desc="Dùng khoá API riêng của bạn, tự kiểm soát chi phí"
                  onClick={() => setConfig({ byok: { ...config.byok, mode: "own" } })}
                />
              </div>
              {config.byok.mode === "own" ? (
                <div className="space-y-2">
                  <SubHead>Chọn nhà cung cấp</SubHead>
                  {BYOK_PROVIDERS.map((p) => {
                    const on = config.byok.providers.includes(p);
                    return (
                      <SwitchRow
                        key={p}
                        checked={on}
                        onCheckedChange={(v) => {
                          const providers = v ? [...config.byok.providers, p] : config.byok.providers.filter((x) => x !== p);
                          setConfig({ byok: { ...config.byok, providers } });
                        }}
                        label={p}
                      />
                    );
                  })}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        {/* M6.6 — Thông báo & kênh báo chủ shop */}
        <TabsContent value="notify" className="space-y-5">
          <GroupHeader context="Nhận thông báo khi agent bàn giao.">
            Kênh nhận thông báo
          </GroupHeader>

          <Card size="sm">
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <NotifyChannelRow
                  channel="telegram"
                  connected={config.notifyChannels.telegram}
                  onConnect={() => setNotifyDialog("telegram")}
                  onDisconnect={() => disconnectNotify("telegram")}
                />
                <NotifyChannelRow
                  channel="zalo"
                  connected={config.notifyChannels.zalo}
                  onConnect={() => setNotifyDialog("zalo")}
                  onDisconnect={() => disconnectNotify("zalo")}
                />
              </div>
              <div className="space-y-2">
                <SubHead>Thông báo khi nào</SubHead>
                {NOTIFY_EVENTS.map((ev) => {
                  const on = config.notifyChannels.events.includes(ev.key);
                  // Dòng bàn giao phản chiếu số tình huống đang bật + link sang tab Bàn giao (đối xứng link ngược lại).
                  const hint =
                    ev.key === "handoff" ? (
                      <>
                        {ev.hint} · theo{" "}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault(); // đừng để click link làm bật/tắt công tắc cùng <label>
                            e.stopPropagation();
                            setTab("handoff");
                          }}
                          className="font-medium text-foreground underline decoration-foreground/30 underline-offset-2 hover:decoration-foreground"
                        >
                          {handoffOn} tình huống đã bật ở Bàn giao
                        </button>
                      </>
                    ) : (
                      ev.hint
                    );
                  return (
                    <SwitchRow
                      key={ev.key}
                      checked={on}
                      onCheckedChange={(v) => {
                        const events = v
                          ? [...config.notifyChannels.events, ev.key]
                          : config.notifyChannels.events.filter((x) => x !== ev.key);
                        setConfig({ notifyChannels: { ...config.notifyChannels, events } });
                      }}
                      label={ev.label}
                      hint={hint}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal kết nối kênh thông báo (Telegram/Zalo) — định danh người nhận + kiểm tra kết nối. */}
      <NotifyChannelDialog
        channel={notifyDialog}
        initialValue={
          notifyDialog === "telegram"
            ? config.notifyChannels.telegramToken
            : notifyDialog === "zalo"
              ? config.notifyChannels.zaloToken
              : undefined
        }
        onClose={() => setNotifyDialog(null)}
        onConnect={connectNotify}
      />

      {/* Xem nội dung file định nghĩa — đóng để quay lại (§6.6/§9 escape-route). */}
      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              {preview?.title}
              <code className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-normal text-muted-foreground">{preview?.file}</code>
            </DialogTitle>
            <DialogDescription>{preview?.description}</DialogDescription>
          </DialogHeader>
          <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-lg bg-muted/50 p-3 font-mono text-xs leading-relaxed text-foreground">
            {preview?.content}
          </pre>
        </DialogContent>
      </Dialog>

      {/* Sửa file — keyed theo file để reset draft mỗi lần mở (§8 forms). */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
          {editing ? (
            <FileEditorForm
              key={editing.key}
              initial={editing}
              onSave={(f) => {
                saveFile(f);
                setEditing(null);
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Xác nhận xoá — hành động phá huỷ, không hoàn tác (§8 confirmation-dialogs). */}
      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Xoá file định nghĩa?</DialogTitle>
            <DialogDescription>
              Xoá <span className="font-medium text-foreground">{deleting?.title}</span> ({deleting?.file}). Agent sẽ không còn dựa vào file này — không hoàn tác được.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Huỷ</DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleting) removeFile(deleting.key);
                setDeleting(null);
              }}
            >
              <Trash2 aria-hidden />
              Xoá
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Tạo và bấm thẻ <a download> tạm để tải nội dung xuống dạng file (prototype, không cần backend).
function triggerDownload(filename: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/markdown;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Ngày học cho Daily learn: "Thứ Tư, 11/06/2026". Dùng UTC để tất định, không lệ thuộc múi giờ/locale runtime.
const WEEKDAYS_VI = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
function formatDay(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const wd = WEEKDAYS_VI[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${wd}, ${pad(d)}/${pad(m)}/${y}`;
}

// Thời gian đào tạo gần nhất, gọn cho lede: "09:24 · 10/06/2026" (tất định, không phụ thuộc locale).
function formatTrainedAt(iso: string) {
  const [date, time] = iso.split("T");
  const [y, m, d] = date.split("-");
  return `${(time ?? "").slice(0, 5)} · ${d}/${m}/${y}`;
}

// Tên file an toàn từ tên agent (bỏ dấu tiếng Việt) cho gói "Tải tất cả".
function slugify(s: string) {
  return (
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/gi, "d")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "agent"
  );
}

// Form sửa file định nghĩa — giữ draft cục bộ, tự bù đuôi .md, chặn lưu khi thiếu tiêu đề/tên file.
function FileEditorForm({ initial, onSave }: { initial: AgentFile; onSave: (f: AgentFile) => void }) {
  // Chỉ sửa nội dung — tiêu đề/tên file/mô tả giữ nguyên, hiện read-only ở header để biết đang sửa file nào.
  const [content, setContent] = useState(initial.content);
  const valid = content.trim() !== "";
  const submit = () => {
    if (!valid) return;
    onSave({ ...initial, content });
  };
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex flex-wrap items-center gap-2">
          {initial.title}
          <code className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-normal text-muted-foreground">{initial.file}</code>
        </DialogTitle>
        <DialogDescription>{initial.description || "Sửa nội dung định nghĩa cho agent."}</DialogDescription>
      </DialogHeader>
      <Field label="Nội dung">
        <Textarea
          autoFocus
          rows={16}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="font-mono text-xs"
          placeholder={"# Tiêu đề\n\nNội dung định nghĩa…"}
        />
      </Field>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Huỷ</DialogClose>
        <Button onClick={submit} disabled={!valid}>
          Lưu
        </Button>
      </DialogFooter>
    </>
  );
}

// Lede theo nhóm (§6.2): dòng ngữ cảnh muted + câu tóm tắt nhấn số liệu (amber = cần xử lý, emerald = xong).
function GroupHeader({ context, children }: { context: string; children: React.ReactNode }) {
  return (
    <header className="space-y-1">
      <p className="text-sm text-muted-foreground">{context}</p>
      <h1 className="text-pretty text-lg font-semibold sm:text-xl">{children}</h1>
    </header>
  );
}

// Nhãn nhóm con trong panel (§6.3).
function SubHead({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{children}</h3>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm">{label}</span>
      {children}
    </div>
  );
}

function Field({ label, hint, children, className }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block space-y-1", className)}>
      <span className="block text-xs font-medium text-muted-foreground">{label}</span>
      {hint ? <span className="block text-[11px] text-muted-foreground/80">{hint}</span> : null}
      {children}
    </label>
  );
}

// Hàng bật/tắt chuẩn (§4.4 item surface) — Switch + nhãn (+ hint) + slot phải (badge/input).
function SwitchRow({
  checked,
  onCheckedChange,
  label,
  hint,
  right,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label: React.ReactNode;
  hint?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <label className="flex flex-wrap items-center gap-3 rounded-lg px-3 py-2.5 ring-1 ring-foreground/10 transition-colors hover:bg-muted/50">
      <Switch checked={checked} onCheckedChange={(v) => onCheckedChange(Boolean(v))} />
      <span className="min-w-0 flex-1">
        <span className="block text-sm">{label}</span>
        {hint ? <span className="block text-xs text-muted-foreground">{hint}</span> : null}
      </span>
      {right ? <span className="shrink-0">{right}</span> : null}
    </label>
  );
}

// Empty state trong khối (§6.6) — viền nét đứt + icon muted + giải thích.
function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-foreground/15 px-4 py-8 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <p className="text-sm font-medium">{title}</p>
      <p className="max-w-xs text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

// Tóm tắt một ngày học (Daily learn) — read-only: tiêu đề ngày + headline, rồi danh sách điều học được
// kèm chip nguồn (bàn giao / chủ shop tư vấn / tình huống đặc biệt). Chỉ để xem, không có duyệt/bỏ.
function DailyLearnCard({ day }: { day: LearnDay }) {
  return (
    <Card size="sm">
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <h3 className="text-sm font-semibold tabular-nums">{formatDay(day.date)}</h3>
          {/* <Badge variant="secondary" className="tabular-nums">{day.cases.length} điều</Badge> */}
          <span className="w-full text-xs text-muted-foreground sm:w-auto sm:flex-1">{day.summary}</span>
        </div>
        <ul className="space-y-1.5">
          {day.cases.map((c) => {
            const meta = LEARN_CASE_META[c.type];
            const CaseIcon = meta.icon;
            return (
              <li key={c.id} className="rounded-lg px-3 py-2.5 ring-1 ring-foreground/10">
                <Badge variant="outline" className={cn("gap-1", meta.className)}>
                  <CaseIcon className="size-3" aria-hidden />
                  {meta.label}
                </Badge>
                <p className="mt-1.5 text-sm">{c.insight}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{c.from}</p>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

// Một tình huống bàn giao: header (switch + mô tả + ngưỡng) và phần ví dụ câu khách nói bung ra để sửa.
function HandoffRuleRow({
  rule,
  onToggle,
  onThreshold,
  onPhrasesChange,
  onSuggest,
  onRemove,
}: {
  rule: HandoffRule;
  onToggle: (v: boolean) => void;
  onThreshold: (n: number) => void;
  onPhrasesChange: (phrases: string[]) => void;
  onSuggest: () => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg ring-1 ring-foreground/10 transition-colors hover:bg-muted/30">
      <div className="flex flex-wrap items-center gap-3 px-3 py-2.5">
        <Switch checked={rule.enabled} onCheckedChange={(v) => onToggle(Boolean(v))} />
        <span className="min-w-0 flex-1">
          <span className="block text-sm">{rule.label}</span>
          <span className="block text-xs text-muted-foreground">{rule.description}</span>
        </span>
        {rule.threshold !== undefined ? (
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              className="w-24"
              value={rule.threshold}
              onChange={(e) => onThreshold(Number(e.target.value))}
            />
            <span className="text-xs text-muted-foreground">{rule.thresholdUnit ?? "đ"}</span>
          </div>
        ) : null}
        {rule.custom ? (
          <Button variant="ghost" size="icon-sm" onClick={onRemove} title="Xoá tình huống này" aria-label="Xoá tình huống này">
            <Trash2 className="size-4" aria-hidden />
          </Button>
        ) : null}
      </div>
      <div className="px-3 pb-2.5">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex cursor-pointer items-center gap-1 rounded text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            aria-expanded={open}
          >
            <ChevronRight className={cn("size-3.5 transition-transform", open && "rotate-90")} aria-hidden />
            Ví dụ khách nói ({rule.triggerPhrases.length})
          </button>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={onSuggest}
            className="text-muted-foreground hover:text-foreground"
            title="Nhờ agent gợi ý ví dụ câu khách nói cho tình huống này"
          >
            <Sparkles className="size-3.5" aria-hidden />
            Gợi ý
          </Button>
        </div>
        {open ? <PhraseEditor phrases={rule.triggerPhrases} onChange={onPhrasesChange} /> : null}
      </div>
    </div>
  );
}

// Sửa danh sách câu mẫu nhận diện tình huống — chip xoá được + ô thêm (Enter hoặc nút Thêm).
function PhraseEditor({ phrases, onChange }: { phrases: string[]; onChange: (next: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    setDraft("");
    if (!v || phrases.includes(v)) return;
    onChange([...phrases, v]);
  };
  return (
    <div className="mt-2 space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {phrases.length > 0 ? (
          phrases.map((p) => (
            <span key={p} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {p}
              <button
                type="button"
                onClick={() => onChange(phrases.filter((x) => x !== p))}
                className="-mr-0.5 cursor-pointer rounded-sm p-0.5 text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                aria-label={`Xoá câu mẫu ${p}`}
              >
                <X className="size-3" aria-hidden />
              </button>
            </span>
          ))
        ) : (
          <span className="text-xs text-muted-foreground/70">Chưa có câu mẫu nào — thêm để agent nhận ra tình huống này chính xác hơn.</span>
        )}
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Thêm câu khách thường nói…"
          className="h-8 flex-1"
        />
        <Button type="button" variant="outline" size="sm" onClick={add} disabled={!draft.trim()}>
          Thêm
        </Button>
      </div>
    </div>
  );
}

// Dialog thêm tình huống bàn giao do chủ shop tự định nghĩa.
function AddHandoffDialog({
  open,
  onOpenChange,
  existingKeys,
  onAdd,
  onSuggest,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  existingKeys: string[];
  onAdd: (rule: HandoffRule) => void;
  onSuggest: (label: string, description: string) => void;
}) {
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const reset = () => {
    setLabel("");
    setDescription("");
  };
  const submit = () => {
    const name = label.trim();
    if (!name) return;
    onAdd({
      key: makeHandoffKey(name, existingKeys),
      label: name,
      description: description.trim() || "Tình huống do bạn thêm.",
      triggerPhrases: [],
      enabled: true,
      custom: true,
    });
    reset();
    onOpenChange(false);
  };
  // Nhờ agent gợi ý ví dụ khách nói: đóng dialog rồi mở panel chat (để dùng được), prompt bám tên/mô tả đang gõ.
  const suggest = () => {
    if (!label.trim() && !description.trim()) return;
    onSuggest(label, description);
    onOpenChange(false);
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Thêm tình huống bàn giao</DialogTitle>
          <DialogDescription>Mô tả lúc nào agent nên bàn giao cho bạn</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Tên tình huống">
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="VD: Khách hỏi bảo hành" />
          </Field>
          <Field label="Khi nào agent nên bàn giao cho bạn" hint="Mô tả tình huống hoặc keywords cần bàn giao">
            <Textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="VD: Anh muốn bảo hành, chị muốn đổi sản phẩm, ..."
            />
          </Field>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Huỷ</DialogClose>
          <Button
            type="button"
            variant="ghost"
            onClick={suggest}
            disabled={!label.trim() && !description.trim()}
            className="text-muted-foreground hover:text-foreground"
            title="Nhờ agent gợi ý ví dụ câu khách nói cho tình huống này"
          >
            <Sparkles className="size-4" aria-hidden />
            Gợi ý
          </Button>
          <Button onClick={submit} disabled={!label.trim()}>
            Thêm tình huống
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ModeCard({ active, title, desc, onClick }: { active: boolean; title: string; desc: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex cursor-pointer items-start gap-2 rounded-lg p-3 text-left ring-1 transition-colors",
        active ? "bg-primary/5 ring-primary" : "ring-foreground/10 hover:bg-muted/40 hover:ring-foreground/20",
      )}
    >
      <span className={cn("mt-0.5 flex size-4 items-center justify-center rounded-full", active ? "bg-primary text-primary-foreground" : "ring-1 ring-foreground/20")}>
        {active ? <Check className="size-2.5" aria-hidden /> : null}
      </span>
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">{desc}</span>
      </span>
    </button>
  );
}
