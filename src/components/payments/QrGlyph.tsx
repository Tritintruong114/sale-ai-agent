import { cn } from "@/lib/utils";
import { qrCells } from "./meta";

// Ô định vị QR (finder pattern) — khai báo ngoài render để không tạo component mỗi lần vẽ.
function QrFinder({ className }: { className: string }) {
  return (
    <span className={cn("absolute size-[28%] rounded-[3px] border-[5px] border-foreground bg-background", className)}>
      <span className="absolute inset-[3px] rounded-[1px] bg-foreground" />
    </span>
  );
}

// Mã QR mock — lưới ô tất định (qrCells) + 3 ô định vị 4 góc cho ra dáng QR thật. Chỉ trang trí, không quét được.
// Dùng chung cho panel chi tiết khoản thu và màn thử nhận tiền (Cài đặt).
export function QrGlyph({ seed, className }: { seed: string; className?: string }) {
  const n = 21;
  const cells = qrCells(seed, n);
  return (
    <div className={cn("relative aspect-square w-40 rounded-lg bg-background p-2 ring-1 ring-foreground/15", className)}>
      <div className="grid size-full gap-px" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }} aria-hidden>
        {cells.map((on, i) => (
          <span key={i} className={cn("rounded-[1px]", on ? "bg-foreground" : "bg-transparent")} />
        ))}
      </div>
      {/* Ô định vị che 3 góc */}
      <QrFinder className="left-2 top-2" />
      <QrFinder className="right-2 top-2" />
      <QrFinder className="bottom-2 left-2" />
    </div>
  );
}
