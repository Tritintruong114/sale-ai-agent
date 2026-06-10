import { DashboardScreen } from "@/components/dashboard/DashboardScreen";
import emptyData from "@/data/dashboard.empty.json";

// Biến thể "shop mới" của Dashboard — chưa có hoạt động nào. Cùng component DashboardScreen
// nhưng truyền dữ liệu rỗng (dashboard.empty.json) để minh hoạ empty state từng card.
export default function DashboardNewUserStatePage() {
  return <DashboardScreen data={emptyData} />;
}
