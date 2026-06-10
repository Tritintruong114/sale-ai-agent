import { PaymentsScreen } from "@/components/payments/PaymentsScreen";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; p?: string }>;
}) {
  const { tab, p } = await searchParams;
  return <PaymentsScreen initialTab={tab} initialId={p} />;
}
