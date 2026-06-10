import { InboxStateController } from "@/components/inbox/InboxStateController";

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;
  return <InboxStateController initialId={c} />;
}
