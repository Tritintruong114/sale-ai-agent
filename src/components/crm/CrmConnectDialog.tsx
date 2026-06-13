"use client";

import { useState } from "react";
import { Check, Eye, EyeOff, Link2, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CRM_BY_KEY, type Crm, type CrmKey } from "./meta";

// Modal kết nối CRM — nội dung phân hóa theo cơ chế Open API của từng nền tảng:
//   • apikey (KiotViet) — form nhập Client ID / Secret / Retailer + hướng dẫn lấy key.
//   • oauth  (Sapo, Haravan) — màn duyệt quyền: liệt kê quyền app xin, bấm "Cho phép & kết nối"
//     giả lập chuyển sang trang nền tảng rồi callback.
// "Kết nối" là mock (delay rồi báo thành công), không gọi backend thật.

// ── Luồng apikey: nhập key tự lấy từ trang quản trị CRM ─────────────────────
function ApiKeyBody({ crm, onConnect }: { crm: Crm; onConnect: () => void }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [showSecret, setShowSecret] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const auth = crm.auth;
  if (auth.type !== "apikey") return null;

  // Đủ điều kiện kết nối khi mọi ô đã có giá trị.
  const filled = auth.fields.every((f) => (values[f.key] ?? "").trim());

  const connect = () => {
    if (!filled || connecting) return;
    setConnecting(true);
    setTimeout(onConnect, 1100); // mock xác minh key + nối
  };

  return (
    <div className="space-y-4">
      <ol className="space-y-2 rounded-lg bg-muted/40 p-3">
        {auth.steps.map((s, i) => (
          <li key={i} className="flex items-center gap-2.5 text-sm">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold tabular-nums text-muted-foreground">
              {i + 1}
            </span>
            <span className="text-foreground/90">
              {s.before}
              {s.link ? (
                <a
                  href={s.link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  {s.link.label}
                </a>
              ) : null}
              {s.after}
            </span>
          </li>
        ))}
      </ol>

      <div className="space-y-3">
        {auth.fields.map((f) => (
          <div key={f.key}>
            <label htmlFor={`crm-${f.key}`} className="mb-1.5 block text-sm font-medium">
              {f.label}
            </label>
            <div className="relative">
              <Input
                id={`crm-${f.key}`}
                type={f.secret && !showSecret ? "password" : "text"}
                value={values[f.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className={f.secret ? "pr-9 font-mono" : "font-mono"}
              />
              {f.secret ? (
                <button
                  type="button"
                  onClick={() => setShowSecret((s) => !s)}
                  aria-label={showSecret ? "Ẩn Client Secret" : "Hiện Client Secret"}
                  className="absolute right-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  {showSecret ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <Button className="w-full" onClick={connect} disabled={!filled || connecting}>
        {connecting ? <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden /> : <Link2 className="size-4" aria-hidden />}
        {connecting ? "Đang xác minh…" : `Kết nối ${crm.name}`}
      </Button>
    </div>
  );
}

// ── Luồng oauth: duyệt quyền rồi giả lập redirect sang nền tảng ─────────────
function OAuthBody({ crm, onConnect }: { crm: Crm; onConnect: () => void }) {
  const [redirecting, setRedirecting] = useState(false);
  const auth = crm.auth;
  if (auth.type !== "oauth") return null;

  const allow = () => {
    if (redirecting) return;
    setRedirecting(true);
    setTimeout(onConnect, 1100); // mock: chuyển sang trang nền tảng → callback nhận token
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-foreground/10 bg-muted/40 p-3">
        <p className="text-sm font-medium">Sale AI Agent xin quyền truy cập:</p>
        <ul className="mt-2 space-y-1.5">
          {auth.scopes.map((s) => (
            <li key={s} className="flex items-center gap-2 text-sm text-foreground/90">
              <Check className="size-4 shrink-0 text-emerald-600" aria-hidden />
              {s}
            </li>
          ))}
        </ul>
      </div>

      <Button className="w-full" onClick={allow} disabled={redirecting}>
        {redirecting ? <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden /> : <ShieldCheck className="size-4" aria-hidden />}
        {redirecting ? `Đang chuyển tới ${crm.name}…` : "Cho phép & kết nối"}
      </Button>
    </div>
  );
}

function DialogBody({ crm, onConnect }: { crm: Crm; onConnect: () => void }) {
  const Icon = crm.icon;
  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Icon className="size-6" />
          Kết nối {crm.name}
        </DialogTitle>
        <DialogDescription>
          {crm.auth.type === "apikey"
            ? "Nhập khóa kết nối API lấy từ trang quản trị KiotViet."
            : `Duyệt quyền để ${crm.name} đồng bộ dữ liệu với Sale AI Agent.`}
        </DialogDescription>
      </DialogHeader>

      {crm.auth.type === "apikey" ? (
        <ApiKeyBody crm={crm} onConnect={onConnect} />
      ) : (
        <OAuthBody crm={crm} onConnect={onConnect} />
      )}
    </DialogContent>
  );
}

export function CrmConnectDialog({
  crmKey,
  onClose,
  onConnect,
}: {
  crmKey: CrmKey | null;
  onClose: () => void;
  onConnect: (key: CrmKey) => void;
}) {
  return (
    <Dialog open={!!crmKey} onOpenChange={(o) => !o && onClose()}>
      {crmKey ? (
        <DialogBody key={crmKey} crm={CRM_BY_KEY[crmKey]} onConnect={() => onConnect(crmKey)} />
      ) : null}
    </Dialog>
  );
}
