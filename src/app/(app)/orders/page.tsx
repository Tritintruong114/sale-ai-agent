import { OrdersScreen } from "@/components/orders/OrdersScreen";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ o?: string; tab?: string }>;
}) {
  const { o, tab } = await searchParams;
  return <OrdersScreen highlightId={o} initialTab={tab} />;
}
