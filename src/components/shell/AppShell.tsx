import { AgentChatPanel } from "./AgentChatPanel";
import { AgentChatPopout } from "./AgentChatPopout";
import { MobileScrim } from "./MobileScrim";
import { SideNav } from "./SideNav";
import { TopBar } from "./TopBar";

// §2 design.md — AppShell = SideNav (trái) + cột phải (TopBar + main).
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <SideNav />
      <MobileScrim />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
      {/* Side panel chat — trượt từ phải, mở từ nút "Talk to Agent" trên TopBar */}
      <AgentChatPanel />
      {/* Cửa sổ nổi (iframe) khi tách màn chat ra khỏi panel */}
      <AgentChatPopout />
    </div>
  );
}
