import Avatar from "boring-avatars";
import { cn } from "@/lib/utils";

// Ảnh đại diện agent — nguồn sự thật là config.identity (đặt ở Onboarding bước 2 / M6).
// Có ảnh upload thì hiện ảnh; chưa có thì rơi về boring-avatars (variant "beam") sinh theo tên,
// đúng như preview ở bước tạo agent → đổi tên là đổi hình, đồng nhất toàn app.
export const AGENT_AVATAR_COLORS = ["#ffffff", "#fffaeb", "#f0f0d8", "#cfcfcf", "#967c52"];

export function AgentAvatar({
  name,
  src,
  size = 48,
  className,
}: {
  name: string;
  src?: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-flex shrink-0 overflow-hidden rounded-xl", className)}
      style={{ width: size, height: size }}
      aria-label={`Ảnh đại diện ${name}`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <Avatar name={name || "Trợ lý"} variant="beam" colors={AGENT_AVATAR_COLORS} size={size} />
      )}
    </span>
  );
}
