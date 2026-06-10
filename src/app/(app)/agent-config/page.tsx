import { AgentConfigScreen } from "@/components/agent-config/AgentConfigScreen";

export default async function AgentConfigPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  return <AgentConfigScreen initialTab={tab} />;
}
