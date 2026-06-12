"use client";

import { CheckCircle2, FileText, GraduationCap, Loader2, MessageSquare, Pencil, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AgentAvatar } from "@/components/shared/AgentAvatar";
import { cn } from "@/lib/utils";
import { useAgentConfig } from "@/store/agentConfigStore";
import { useTrainingStore, type TrainingEntry, type TrainingMethod } from "@/store/trainingStore";
import trainingData from "@/data/training.json";

// M6 — tab Đào tạo: nhật ký mỗi lần định nghĩa agent được cập nhật.
// Nguồn: log tĩnh (mock) + entries người dùng thêm lúc chạy (vd "Dạy Agent từ hội thoại" ở Inbox — useTrainingStore).
// Bảng theo style chung của prototype (§4.4 surface): wrapper ring + overflow-x, header muted, divide-y.

const METHOD_META: Record<TrainingMethod, { label: string; icon: typeof GraduationCap; className: string }> = {
  manager: { label: "Train with Manager", icon: GraduationCap, className: "border-violet-200 bg-violet-100 text-violet-700" },
  daily: { label: "Tự học hằng ngày", icon: Sparkles, className: "border-sky-200 bg-sky-100 text-sky-700" },
  manual: { label: "Sửa thủ công", icon: Pencil, className: "border-foreground/15 bg-muted text-muted-foreground" },
  conversation: { label: "Từ hội thoại", icon: MessageSquare, className: "border-indigo-200 bg-indigo-100 text-indigo-700" },
};

const staticLog = trainingData.log as TrainingEntry[];

export function TrainingLog() {
  // Tên + ảnh agent lấy từ nguồn sự thật chung (chọn lúc onboarding hoặc cập nhật ở tab Danh tính).
  const identity = useAgentConfig((s) => s.config.identity);
  // Entries thêm lúc chạy (mới nhất) đứng trên log tĩnh.
  const added = useTrainingStore((s) => s.added);
  const log = [...added, ...staticLog];

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
    <div className="scrollbar-hide overflow-x-auto rounded-lg ring-1 ring-foreground/10">
      <table className="w-full min-w-[78rem] border-collapse text-left">
        <caption className="sr-only">Nhật ký các lần đào tạo agent — agent, thời gian, hình thức, phạm vi, kết quả và trạng thái.</caption>
        <thead>
          <tr className="border-b bg-muted/40 [&_th]:h-9 [&_th]:px-3 [&_th]:align-middle [&_th]:text-[11px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-muted-foreground">
            <th scope="col" className="w-52">Đào tạo agent</th>
            <th scope="col" className="w-36">Thời gian</th>
            <th scope="col" className="w-44">Hình thức</th>
            <th scope="col" className="w-72">Nội dung</th>
            <th scope="col" className="w-80">File cập nhật</th>
            <th scope="col" className="w-28">Trạng thái</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {log.map((e) => {
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
                  <p className="mt-1 text-[11px] text-muted-foreground">{e.by}</p>
                </td>
                <td>
                  <p className="text-sm">{e.summary}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Phạm vi: {e.scope}</p>
                </td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {e.files.map((f) => (
                      <code key={f} className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        <FileText className="size-3" aria-hidden />
                        {f}
                      </code>
                    ))}
                  </div>
                </td>
                <td>
                  {e.status === "done" ? (
                    <Badge className="gap-1 border-emerald-200 bg-emerald-100 text-emerald-700">
                      <CheckCircle2 className="size-3" aria-hidden />
                      Hoàn tất
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 text-amber-600">
                      <Loader2 className="size-3 animate-spin" aria-hidden />
                      Đang đào tạo
                    </Badge>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
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
