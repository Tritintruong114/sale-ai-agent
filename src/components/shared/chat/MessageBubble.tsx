import { Fragment, type ReactNode } from "react";
import { Check, CheckCircle2, Flag, Loader2, QrCode, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatVND } from "@/lib/format";
import { QrGlyph } from "@/components/payments/QrGlyph";
import type { ApplyAction, ChatMessage, PaymentCard } from "./types";

// Re-export để không vỡ các import cũ `import { type ChatMessage } from ".../MessageBubble"`.
export type { ChatMessage } from "./types";

// Render nhẹ cho reply từ LLM: giữ xuống dòng, đậm **...**, ảnh ![alt](url), bỏ đường kẻ ---.
// Không kéo thư viện markdown — chat bubble chỉ cần bấy nhiêu.
const IMG_RE = /!\[([^\]]*)\]\(([^)\s]+)\)/g;

// Tách phần chữ thành **đậm** và chữ thường.
function renderBold(text: string, keyBase: string): ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={`${keyBase}-b${j}`}>{part.slice(2, -2)}</strong>
    ) : (
      <Fragment key={`${keyBase}-t${j}`}>{part}</Fragment>
    ),
  );
}

// Một dòng: tách ảnh ra render <img>, phần còn lại render chữ/đậm.
function renderLine(line: string, keyBase: string): ReactNode {
  const nodes: ReactNode[] = [];
  let last = 0;
  let idx = 0;
  IMG_RE.lastIndex = 0;
  for (let m = IMG_RE.exec(line); m !== null; m = IMG_RE.exec(line)) {
    if (m.index > last) nodes.push(renderBold(line.slice(last, m.index), `${keyBase}-${idx}`));
    nodes.push(
      // eslint-disable-next-line @next/next/no-img-element
      <img
        key={`${keyBase}-img${idx}`}
        src={m[2]}
        alt={m[1] || "Ảnh sản phẩm"}
        loading="lazy"
        referrerPolicy="no-referrer"
        className="mt-1 block max-h-52 w-auto rounded-lg border border-foreground/10"
      />,
    );
    last = m.index + m[0].length;
    idx += 1;
  }
  if (last < line.length) nodes.push(renderBold(line.slice(last), `${keyBase}-${idx}`));
  return nodes;
}

function renderRichText(text: string): ReactNode {
  const lines = text.replace(/^\s*-{3,}\s*$/gm, "").split("\n");
  return lines.map((line, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {renderLine(line, `l${i}`)}
    </Fragment>
  ));
}

export function MessageBubble({
  message,
  ownRole = "customer",
  onApply,
}: {
  message: ChatMessage;
  // Phía "mình" — tin của vai này nằm bên phải, màu primary.
  // Inbox: "agent" (bạn là chủ shop). Chat thử: "customer" (bạn đóng vai khách).
  ownRole?: "customer" | "agent";
  // Bấm nút "Apply" gắn dưới tin agent (vd áp câu mẫu gợi ý vào tình huống bàn giao).
  onApply?: (messageId: string, action: ApplyAction) => void;
}) {
  if (message.role === "typing") {
    return (
      <div className="flex justify-start">
        <div
          className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-muted px-3 py-3"
          role="status"
          aria-label="Trợ lý đang soạn tin"
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 motion-reduce:animate-none"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (message.role === "reasoning") {
    return <ReasoningBlock message={message} />;
  }

  if (message.role === "tool") {
    return <ToolCallCard message={message} />;
  }

  if (message.role === "system") {
    return (
      <div className="my-1 flex justify-center">
        <span className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
          <Flag className="size-3.5" aria-hidden />
          {message.text}
        </span>
      </div>
    );
  }

  // Thẻ thanh toán (QR chốt đơn) — luôn ở phía agent (trái).
  if (message.payment) {
    return <PaymentCardBubble payment={message.payment} />;
  }

  const isOwn = message.role === ownRole;

  // Tin ảnh gửi riêng — render ảnh độc lập (không bọc bubble chữ), canh theo phía gửi.
  if (message.image) {
    return (
      <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={message.image.url}
          alt={message.image.alt || "Ảnh sản phẩm"}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="max-h-60 w-auto max-w-[70%] rounded-2xl border border-foreground/10 object-cover shadow-sm"
        />
      </div>
    );
  }

  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div className={cn("flex max-w-[80%] flex-col gap-1.5", isOwn ? "items-end" : "items-start")}>
        <div
          className={cn(
            "whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm",
            isOwn
              ? "rounded-br-sm bg-primary text-primary-foreground"
              : "rounded-bl-sm bg-muted text-foreground",
          )}
        >
          {renderRichText(message.text)}
        </div>
        {message.apply ? <ApplyButton message={message} onApply={onApply} /> : null}
      </div>
    </div>
  );
}

// Nút hành động gắn dưới tin agent — vd "Apply" câu mẫu gợi ý vào tình huống bàn giao.
// Đã áp dụng thì khoá lại + đổi nhãn "Đã áp dụng" (emerald) để chủ shop biết đã ghi.
function ApplyButton({
  message,
  onApply,
}: {
  message: ChatMessage;
  onApply?: (messageId: string, action: ApplyAction) => void;
}) {
  const action = message.apply;
  if (!action) return null;
  const applied = action.applied;
  return (
    <button
      type="button"
      disabled={applied || !onApply}
      onClick={() => onApply?.(message.id, action)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        applied
          ? "cursor-default border-emerald-200 bg-emerald-50 text-emerald-700"
          : "cursor-pointer border-foreground/15 bg-background text-foreground hover:bg-muted",
      )}
    >
      {applied ? (
        <>
          <Check className="size-3.5" aria-hidden />
          Đã áp dụng
        </>
      ) : (
        <>
          <Sparkles className="size-3.5 text-violet-500" aria-hidden />
          Apply
        </>
      )}
    </button>
  );
}

// Khối "đang suy nghĩ" — tông trung tính (không amber như system), chữ muted/italic.
// `text` = câu tóm tắt; `steps` = các dòng chi tiết liệt kê bên dưới.
function ReasoningBlock({ message }: { message: ChatMessage }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-dashed border-foreground/15 bg-muted/40 px-3 py-2">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Sparkles className="size-3.5 text-violet-500" aria-hidden />
          {message.text}
        </p>
        {message.steps && message.steps.length > 0 ? (
          <ul className="mt-1.5 space-y-1 pl-5">
            {message.steps.map((s, i) => (
              <li key={i} className="list-disc text-xs italic text-muted-foreground/80">
                {s}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

// Thẻ mã QR chốt đơn agent gửi khách — QR mock + thông tin chuyển khoản. Đổi viền/nhãn khi đã nhận tiền.
function PaymentCardBubble({ payment }: { payment: PaymentCard }) {
  const paid = payment.status === "paid";
  return (
    <div className="flex justify-start">
      <div className="w-[80%] max-w-xs overflow-hidden rounded-2xl rounded-bl-sm border border-foreground/10 bg-card">
        <div className="flex items-center gap-1.5 border-b bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">
          <QrCode className="size-3.5" aria-hidden />
          Mã QR thanh toán
        </div>
        <div className="flex flex-col items-center gap-3 p-3">
          <QrGlyph seed={payment.seed} className="w-32" />
          <div className="w-full space-y-1 border-t pt-2.5">
            <PayRow label="Đơn" value={payment.items} />
            <PayRow label="Ngân hàng" value={payment.bank} />
            <PayRow label="Số tài khoản" value={payment.accountNo} />
            <PayRow label="Chủ tài khoản" value={payment.holder} />
            <PayRow label="Số tiền" value={formatVND(payment.amount)} />
            <PayRow label="Nội dung CK" value={payment.memo} />
          </div>
          <span
            className={cn(
              "inline-flex w-full items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium",
              paid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800",
            )}
          >
            {paid ? <CheckCircle2 className="size-3.5" aria-hidden /> : <Loader2 className="size-3.5" aria-hidden />}
            {paid ? "Đã nhận thanh toán" : "Chờ khách chuyển khoản"}
          </span>
        </div>
      </div>
    </div>
  );
}

function PayRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-right font-medium tabular-nums">{value}</span>
    </div>
  );
}

// Thẻ gọi công cụ — spinner khi đang chạy, dấu check (emerald) khi xong; kèm file đích.
function ToolCallCard({ message }: { message: ChatMessage }) {
  const tool = message.tool;
  const done = tool?.status === "done";
  return (
    <div className="flex justify-start">
      <div className="flex max-w-[85%] items-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs ring-1 ring-foreground/5">
        {done ? (
          <Check className="size-3.5 shrink-0 text-emerald-600" aria-hidden />
        ) : (
          <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground motion-reduce:animate-none" aria-hidden />
        )}
        <span className="font-medium text-foreground">{tool?.label ?? message.text}</span>
        {tool?.target ? (
          <code className="rounded bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">{tool.target}</code>
        ) : null}
      </div>
    </div>
  );
}
