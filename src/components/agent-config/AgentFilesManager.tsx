"use client";

import { useRef, useState } from "react";
import { Download, FileText, GraduationCap, MoreVertical, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAgentConfig } from "@/store/agentConfigStore";
import { useUiStore } from "@/store/uiStore";
import { type AgentFile } from "@/data/agentFiles";

// Hồ sơ định nghĩa agent — bản Playground: mỗi file render thành textarea, chủ shop sửa trực tiếp.
// Controlled: state files do parent (PlaygroundPanel) giữ để gộp chung vào nút "Lưu & đồng bộ".
// Train with Manager mở panel chat (góc phải) + điền sẵn prompt re-train, chờ chủ shop gửi.
export function AgentFilesManager({
  files,
  onChange,
  className,
}: {
  files: AgentFile[];
  onChange: (next: AgentFile[]) => void;
  className?: string;
}) {
  const config = useAgentConfig((s) => s.config);
  const setAgentChatOpen = useUiStore((s) => s.setAgentChatOpen);
  const pushAgentChatDraft = useUiStore((s) => s.pushAgentChatDraft);
  const fileImport = useRef<HTMLInputElement>(null);

  const [deleting, setDeleting] = useState<AgentFile | null>(null); // chờ xác nhận xoá

  // Thêm file = tải file .md lên: đọc nội dung, lấy tên file làm tiêu đề tạm.
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
    onChange([...files, ...added]);
  };

  const downloadFile = (f: AgentFile) => triggerDownload(f.file, f.content);
  // Tải tất cả: gộp các file thành một .md (chưa có lib zip), mỗi file là một mục có tiêu đề.
  const downloadAll = () => {
    const bundle = files.map((f) => `<!-- ${f.file} -->\n\n${f.content}`).join("\n\n---\n\n");
    triggerDownload(`agent-${slugify(config.identity.name)}.md`, bundle);
  };
  // Sửa trực tiếp nội dung file ngay trên textarea.
  const updateContent = (key: string, content: string) =>
    onChange(files.map((x) => (x.key === key ? { ...x, content } : x)));
  const removeFile = (key: string) => onChange(files.filter((x) => x.key !== key));

  const trainWithManager = (f: AgentFile) => {
    setAgentChatOpen(true);
    pushAgentChatDraft(`Tiến hành skills /re-train file ${f.file} của agent ${config.identity.name}`);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-start justify-between gap-3">
        <SubHead>Hồ sơ định nghĩa agent</SubHead>
        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
          <Button variant="outline" size="xs" onClick={downloadAll} disabled={files.length === 0}>
            <Download className="size-3.5" aria-hidden />
            Tải tất cả
          </Button>
          <Button variant="outline" size="xs" onClick={() => fileImport.current?.click()}>
            <Upload className="size-3.5" aria-hidden />
            Tải lên
          </Button>
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
          <div key={f.key} className="space-y-1.5 rounded-lg p-2.5 ring-1 ring-foreground/10">
            <div className="flex items-center gap-2">
              <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
                  {f.title}
                  <code className="rounded bg-muted px-1 py-0.5 text-[10px] font-normal text-muted-foreground">{f.file}</code>
                </p>
                {f.description ? <p className="truncate text-xs text-muted-foreground">{f.description}</p> : null}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Tuỳ chọn ${f.title}`} title="Tuỳ chọn" />}>
                  <MoreVertical className="size-4" aria-hidden />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => trainWithManager(f)}>
                    <GraduationCap aria-hidden />
                    Train with Manager
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => downloadFile(f)}>
                    <Download aria-hidden />
                    Tải xuống
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
            <Textarea
              rows={8}
              value={f.content}
              onChange={(e) => updateContent(f.key, e.target.value)}
              className="font-mono text-xs"
              aria-label={`Nội dung ${f.title}`}
              placeholder={"# Tiêu đề\n\nNội dung định nghĩa…"}
            />
          </div>
        ))
      )}

      {/* Xác nhận xoá — hành động phá huỷ, không hoàn tác. */}
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

// Tên file an toàn từ tên agent (bỏ dấu tiếng Việt) cho gói "Tải tất cả".
function slugify(s: string) {
  return (
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/đ/gi, "d")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "agent"
  );
}

function SubHead({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{children}</h3>;
}

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
