"use client";

import { useState } from "react";
import {
  Bot,
  Boxes,
  CheckCircle2,
  Database,
  Link2Off,
  Loader2,
  Plus,
  RefreshCw,
  Users,
  ShoppingCart,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useSetupStore } from "@/store/setupStore";
import { useUiStore } from "@/store/uiStore";
import { CRMS, type Crm, type CrmKey } from "./meta";
import { CrmConnectDialog } from "./CrmConnectDialog";

// Màn Hệ thống CRM (§Kết nối) — tái dùng khuôn UI Cổng thanh toán:
//   • Tự động đẩy đơn sang CRM — app tự đồng bộ đơn đã chốt sang phần mềm quản lý bán hàng (mặc định bật).
//   • Chọn hệ thống CRM — tile chọn nền tảng; bấm Kết nối mở modal phân hóa theo cơ chế Open API (xem CrmConnectDialog).
//   • Đồng bộ thử + Kiểm tra với Agent — kéo dữ liệu / nhờ Manager Agent test kết nối.
// Đây là các "ông lớn" omnichannel SME tại VN, đều mở Open API cho app bên thứ 3 nối dữ liệu.
// Trạng thái nối sống ở setupStore (persist) đồng bộ cách cổng thanh toán làm.

function CrmTile({
  crm,
  selected,
  connected,
  onSelect,
}: {
  crm: Crm;
  selected: boolean;
  connected: boolean;
  onSelect: () => void;
}) {
  const { name, hint, icon: Icon } = crm;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "group relative flex cursor-pointer flex-col gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/40",
        selected ? "border-primary ring-1 ring-primary" : "border-foreground/10",
      )}
    >
      {/* Góc phải: tick khi đang chọn. */}
      {selected ? (
        <span className="absolute right-3 top-3 inline-flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <CheckCircle2 className="size-3.5" aria-hidden />
        </span>
      ) : null}

      <Icon className="size-11" />

      <div className="min-w-0">
        <p className="font-semibold">{name}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>
      </div>

      {connected ? (
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
          <CheckCircle2 className="size-3" aria-hidden />
          Đã kết nối
        </span>
      ) : (
        <span className="inline-flex w-fit items-center gap-1 text-[11px] font-medium text-muted-foreground">
          <Plus className="size-3" aria-hidden />
          Chưa kết nối
        </span>
      )}
    </button>
  );
}

// Các nhóm dữ liệu app kéo về / đẩy đi qua Open API của CRM — số lượng mock (trùng crmTestFlow.ts) để minh hoạ.
type SyncEntity = { key: string; label: string; icon: LucideIcon; count: number };
const SYNC_ENTITIES: SyncEntity[] = [
  { key: "products", label: "Sản phẩm", icon: Boxes, count: 128 },
  { key: "customers", label: "Khách hàng", icon: Users, count: 1240 },
  { key: "orders", label: "Đơn hàng", icon: ShoppingCart, count: 356 },
];

function SyncEntityRow({ entity, state }: { entity: SyncEntity; state: "idle" | "syncing" | "done" }) {
  const Icon = entity.icon;
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-foreground/10 bg-card px-3 py-2.5">
      <span className="flex min-w-0 items-center gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="size-4" aria-hidden />
        </span>
        <span className="truncate text-sm font-medium">{entity.label}</span>
      </span>
      {state === "syncing" ? (
        <Loader2 className="size-4 shrink-0 text-muted-foreground motion-safe:animate-spin" aria-hidden />
      ) : state === "done" ? (
        <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium tabular-nums text-emerald-700">
          <CheckCircle2 className="size-3.5" aria-hidden />
          {entity.count.toLocaleString("vi-VN")}
        </span>
      ) : (
        <span className="shrink-0 text-sm text-muted-foreground">Chưa đồng bộ</span>
      )}
    </div>
  );
}

// Đồng bộ thử + kiểm tra với Agent — chỉ chạy khi hệ thống đang chọn đã nối. Trạng thái mock, sống tại màn (prototype).
function SyncSection({ crmName, connected }: { crmName: string; connected: boolean }) {
  const startCrmTest = useUiStore((s) => s.startCrmTest);
  const [phase, setPhase] = useState<"idle" | "syncing" | "done">("idle");

  const sync = () => {
    setPhase("syncing");
    setTimeout(() => setPhase("done"), 1200);
  };

  return (
    <section className="space-y-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Database className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="font-medium">Đồng bộ dữ liệu</p>
        </div>
      </div>

      {!connected ? (
        <p className="rounded-lg border border-dashed border-foreground/15 px-3 py-6 text-center text-sm text-muted-foreground">
          Kết nối {crmName} trước để đồng bộ Sản phẩm, Khách hàng và Đơn hàng.
        </p>
      ) : (
        <div className="space-y-4">
          {/* Webhook real-time: CRM bắn tín hiệu về app khi có thay đổi (đơn mới, tồn kho…). */}
          <div className="flex items-start gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-800">
            <Zap className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p>
              Webhook real-time đang bật — {crmName} tự bắn tín hiệu về app khi có đơn mới hoặc đổi tồn kho.
            </p>
          </div>

          <div className="space-y-2">
            {SYNC_ENTITIES.map((e) => (
              <SyncEntityRow key={e.key} entity={e} state={phase} />
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={sync} disabled={phase === "syncing"}>
                {phase === "syncing" ? (
                  <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden />
                ) : (
                  <RefreshCw className="size-4" aria-hidden />
                )}
                {phase === "syncing" ? "Đang đồng bộ…" : phase === "done" ? "Đồng bộ lại" : "Đồng bộ ngay"}
              </Button>
              {/* Nhờ Manager Agent kiểm tra kết nối: mở chat, gọi tools đại diện rồi trả dữ liệu mẫu. */}
              <Button variant="outline" size="sm" onClick={() => startCrmTest(crmName)}>
                <Bot className="size-4" aria-hidden />
                Kiểm tra với Agent
              </Button>
            </div>
            {phase === "done" ? (
              <p className="text-sm text-muted-foreground">
                Đã kéo dữ liệu từ {crmName} về. Đây là lần đồng bộ thử.
              </p>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}

export function CrmSettings() {
  const [autoSync, setAutoSync] = useState(true);
  const [selected, setSelected] = useState<CrmKey>("kiotviet");
  // Trạng thái nối CRM sống ở setupStore (persist) — đồng bộ cách PaymentSettings làm với cổng.
  const connected = useSetupStore((s) => s.crms);
  const setCrm = useSetupStore((s) => s.setCrm);
  // Hệ thống đang mở modal kết nối (null = đóng). Việc nối thật xảy ra trong modal (phân hóa theo nền tảng).
  const [dialogKey, setDialogKey] = useState<CrmKey | null>(null);

  const active = CRMS.find((c) => c.key === selected)!;
  const isActiveConnected = connected[selected];

  const disconnect = () => setCrm(selected, false);

  return (
    <div className="space-y-6">
      <header className="min-w-0">
        <p className="text-xs text-muted-foreground sm:text-sm">
          Nối phần mềm quản lý bán hàng để đồng bộ sản phẩm, khách hàng và đơn hàng hai chiều.
        </p>
        <h1 className="text-pretty text-base font-semibold sm:text-lg">Hệ thống CRM</h1>
      </header>

      {/* Tự động đẩy đơn sang CRM */}
      <div className="flex items-center justify-between gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600">
            <RefreshCw className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-medium">Tự động đẩy đơn sang CRM</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              App tự đồng bộ đơn đã chốt sang phần mềm quản lý để lo kho vận, giao hàng
            </p>
          </div>
        </div>
        <Switch
          checked={autoSync}
          onCheckedChange={setAutoSync}
          aria-label="Tự động đẩy đơn sang CRM"
          className="shrink-0"
        />
      </div>

      {/* Chọn hệ thống CRM */}
      <section className="space-y-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Database className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-medium">Chọn hệ thống CRM</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CRMS.map((c) => (
            <CrmTile
              key={c.key}
              crm={c}
              selected={selected === c.key}
              connected={!!connected[c.key]}
              onSelect={() => setSelected(c.key)}
            />
          ))}
        </div>

        {/* Hành động nối / ngắt tài khoản cho hệ thống đang chọn. */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <p className="text-sm text-muted-foreground">
            Hệ thống đang chọn: <span className="font-medium text-foreground">{active.name}</span>
          </p>
          {isActiveConnected ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={disconnect}
              className="text-muted-foreground hover:text-destructive"
            >
              <Link2Off className="size-4" aria-hidden />
              Ngắt kết nối
            </Button>
          ) : (
            <Button size="sm" onClick={() => setDialogKey(selected)}>
              <Plus className="size-4" aria-hidden />
              Kết nối {active.name}
            </Button>
          )}
        </div>
      </section>

      {/* Đồng bộ thử — remount theo hệ thống đang chọn để reset trạng thái khi đổi CRM. */}
      <SyncSection key={selected} crmName={active.name} connected={isActiveConnected} />

      {/* Modal kết nối — nội dung phân hóa theo cơ chế Open API của từng nền tảng. */}
      <CrmConnectDialog
        crmKey={dialogKey}
        onClose={() => setDialogKey(null)}
        onConnect={(key) => {
          setCrm(key, true);
          setDialogKey(null);
        }}
      />
    </div>
  );
}
