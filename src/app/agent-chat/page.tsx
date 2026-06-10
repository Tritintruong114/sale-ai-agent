import { AgentChatContent } from "@/components/shell/AgentChatContent";

// Route độc lập của chat "Talk to Agent" — render đúng AgentChatContent toàn màn, không có app shell.
// Dùng làm src cho iframe khi người dùng "tách màn" chat ra cửa sổ nổi (xem AgentChatPopout).
export default function AgentChatStandalonePage() {
  return (
    <div className="h-screen w-screen bg-card text-foreground">
      <AgentChatContent />
    </div>
  );
}
