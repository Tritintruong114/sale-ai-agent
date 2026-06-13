"use client";

import { useState } from "react";
import { FlaskConical, GraduationCap, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { AgentAvatar } from "@/components/shared/AgentAvatar";
import { cn } from "@/lib/utils";
import { useHydrated } from "@/lib/useHydrated";
import { useAgentConfig } from "@/store/agentConfigStore";
import { useTrainingStore, type TrainingEntry, type TrainingMethod } from "@/store/trainingStore";
import trainingData from "@/data/training.json";

// M6 — tab Đào tạo: nhật ký mỗi lần định nghĩa agent được cập nhật.
// Nguồn: log tĩnh (mock) + entries người dùng thêm lúc chạy (vd "Đào tạo Agent bằng hội thoại" ở Inbox — useTrainingStore).
// Bảng theo style chung của prototype (§4.4 surface): wrapper ring + overflow-x, header muted, divide-y.

const METHOD_META: Record<TrainingMethod, { label: string; icon: typeof GraduationCap; className: string }> = {
  playground: { label: "Đào tạo thủ công", icon: FlaskConical, className: "border-violet-200 bg-violet-100 text-violet-700" },
  daily: { label: "Tự học hằng ngày", icon: Sparkles, className: "border-sky-200 bg-sky-100 text-sky-700" },
  inbox: { label: "Từ hội thoại", icon: GraduationCap, className: "border-indigo-200 bg-indigo-100 text-indigo-700" },
};

const staticLog = trainingData.log as TrainingEntry[];

export function TrainingLog() {
  // Tên + ảnh agent lấy từ nguồn sự thật chung (chọn lúc onboarding hoặc cập nhật ở tab Danh tính).
  const identity = useAgentConfig((s) => s.config.identity);
  // Entries thêm lúc chạy (mới nhất) đứng trên log tĩnh. Persist localStorage nên chỉ ghép sau khi
  // hydrate (server/lần đầu render rỗng) để tránh lệch hydration.
  const hydrated = useHydrated();
  const added = useTrainingStore((s) => s.added);
  const log = [...(hydrated ? added : []), ...staticLog];

  // Phân trang (controlled) — theo Pagination dùng chung như các bảng khác (Sản phẩm, Đơn, Thanh toán).
  // Reset về trang 1 khi tập log đổi (thêm entry / đổi cỡ trang), kẹp khi vượt biên — pattern chỉnh-state-lúc-render.
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const pageCount = Math.max(1, Math.ceil(log.length / pageSize));
  const sig = `${log.length}|${pageSize}`;
  const [prevSig, setPrevSig] = useState(sig);
  if (sig !== prevSig) {
    setPrevSig(sig);
    setPage(1);
  }
  const safePage = Math.min(page, pageCount);
  const paged = log.slice((safePage - 1) * pageSize, safePage * pageSize);

  if (log.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-foreground/15 px-4 py-10 text-center">
        <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <GraduationCap className="size-5" />
        </span>
        <p className="text-sm font-medium">Chưa có lần đào tạo nào</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          Mỗi lần bạn Train with Manager hoặc agent tự học, lần đào tạo sẽ được ghi lại ở đây.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-7rem)] min-h-[34rem] flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      {/* Thân bảng — cuộn dọc/ngang, header dính đỉnh khi cuộn. */}
      <div className="scrollbar-hide min-h-0 flex-1 overflow-auto">
      <table className="w-full min-w-[51rem] border-collapse text-left">
        <caption className="sr-only">Nhật ký các lần đào tạo agent — agent, thời gian, hình thức và nội dung.</caption>
        <thead>
          <tr className="sticky top-0 z-10 border-b bg-muted [&_th]:h-9 [&_th]:px-3 [&_th]:align-middle [&_th]:text-[11px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-muted-foreground">
            <th scope="col" className="w-52">Agent</th>
            <th scope="col" className="w-36">Thời gian</th>
            <th scope="col" className="w-44">Hình thức</th>
            <th scope="col" className="w-72">Nội dung đào tạo</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {paged.map((e) => {
            const meta = METHOD_META[e.method];
            const MethodIcon = meta.icon;
            return (
              <tr key={e.id} className="align-top [&_td]:px-3 [&_td]:py-2.5">
                <td>
                  <div className="flex items-center gap-2">
                    <AgentAvatar name={identity.name} src={identity.avatar} size={28} className="shrink-0 ring-1 ring-foreground/10" />
                    <span className="text-sm font-medium">{identity.name}</span>
                  </div>
                </td>
                <td className="whitespace-nowrap text-xs text-muted-foreground tabular-nums">{formatAt(e.at)}</td>
                <td>
                  <Badge variant="outline" className={cn("gap-1", meta.className)}>
                    <MethodIcon className="size-3" aria-hidden />
                    {meta.label}
                  </Badge>
                </td>
                <td>
                  <p className="text-sm">{e.summary}</p>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
      {/* Footer phân trang — dính đáy card (không cuộn mất), như các bảng khác. */}
      <div className="shrink-0 border-t bg-card px-4 py-2.5">
        <Pagination
          page={safePage}
          pageSize={pageSize}
          total={log.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          unitLabel="lần đào tạo"
        />
      </div>
    </div>
  );
}

// Định dạng thời gian gọn kiểu Việt: "09:24 · 10/06/2026". Tất định (không phụ thuộc locale runtime).
function formatAt(iso: string) {
  const [date, time] = iso.split("T");
  const [y, m, d] = date.split("-");
  const hm = (time ?? "").slice(0, 5);
  return `${hm} · ${d}/${m}/${y}`;
}
