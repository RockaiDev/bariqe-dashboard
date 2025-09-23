import Title from "@/components/shared/Title";
import { useIntl } from "react-intl";
import DashCard from "./DashCard";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { TableRow, TableCell, TableHead } from "@/components/ui/table";
import DataTable from "@/components/shared/tabel/tabel";
import { 
  MessageCircleMore, 
  Package, 
  UserPlus2Icon, 
  Loader2, 
  RefreshCw, 
  Wifi, 
  WifiOff 
} from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import LoadingComponent from "@/components/shared/LoadingComponent";

// بيانات احتياطية
const fallbackDisplayData = {
  summary: {
    orders: "1,234",
    consultationRequests: "2,250", 
    newCustomers: "1,234",
    ordersChange: "+12%",
    consultationsChange: "+15%",
    customersChange: "+20%",
  },
  orderTrends: [
    { name: "Jan", value: 30 },
    { name: "Feb", value: 45 },
    { name: "Mar", value: 40 },
    { name: "Apr", value: 60 },
    { name: "May", value: 75 },
    { name: "Jun", value: 70 },
  ],
  popularCategories: [
    { name: "Electronics", value: 80, color: "#3b82f6" },
    { name: "Fashion", value: 65, color: "#f59e0b" },
    { name: "Home & Garden", value: 50, color: "#10b981" },
  ],
  recentOrders: [
    { _id: "ORD1234", customer: { name: "Sample Customer" }, date: "2024-01-26", status: "shipped" },
    { _id: "ORD1235", customer: { name: "Another Customer" }, date: "2024-01-24", status: "pending" },
  ],
  recentRequests: [
    { _id: "REQ5678", customer: { name: "Sample Customer" }, date: "2024-01-26", status: "open" },
    { _id: "REQ5679", customer: { name: "Another Customer" }, date: "2024-01-25", status: "closed" },
  ],
};

// Helper functions
const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "shipped":
    case "delivered":
    case "completed":
      return "bg-blue-100 text-blue-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "canceled":
    case "cancelled":
      return "bg-red-100 text-red-800";
    case "processing":
      return "bg-purple-100 text-purple-800";
    case "open":
      return "bg-green-100 text-green-800";
    case "closed":
      return "bg-gray-200 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Loading component
const LoadingSpinner = ({ message }: { message?: string }) => {
  const intl = useIntl();
  const defaultMessage = message || intl.formatMessage({ id: "common.loading" });
  
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      <span className="ml-2 text-gray-600">{defaultMessage}</span>
    </div>
  );
};

// Connection status component
const ConnectionStatus = ({ 
  isOnline, 
  hasErrors, 
  onRefresh 
}: { 
  isOnline: boolean; 
  hasErrors: boolean; 
  onRefresh: () => void;
}) => {
  const intl = useIntl();
  
  return (
    <div className={`mb-4 p-4 rounded-lg border ${hasErrors ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {isOnline ? (
            <Wifi className="h-5 w-5 text-green-600 mr-2" />
          ) : (
            <WifiOff className="h-5 w-5 text-red-600 mr-2" />
          )}
          <span className={hasErrors ? "text-red-800" : "text-yellow-800"}>
            {hasErrors 
              ? intl.formatMessage({ id: "Failed to load live data. Showing sample data." })
              : intl.formatMessage({ id: "Using cached data." })
            }
          </span>
        </div>
        <button
          onClick={onRefresh}
          className={`flex items-center px-3 py-1 text-white rounded text-sm transition-colors ${
            hasErrors ? "bg-red-600 hover:bg-red-700" : "bg-yellow-600 hover:bg-yellow-700"
          }`}
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          {intl.formatMessage({ id: "Refresh" })}
        </button>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const intl = useIntl();
  const isRTL = intl.locale === "ar";
  
  // محاولة جلب البيانات الكاملة من نقطة واحدة `/dashboard`
  const { list } = useDashboard();
  const dashboardData = list.data;
  const isDashboardLoading = list.isLoading;
  const isDashboardError = Boolean(list.isError || list.error);
  const refetchDashboard = list.refetch;
  // دالة لإعادة جلب البيانات من الـ endpoint الوحيد
  console.log("Dashboard data:", dashboardData);
  const handleRefreshAll = () => {
    refetchDashboard();
  };

  // تحديد البيانات المراد عرضها
  let displayData;
  const hasErrors = Boolean(isDashboardError);

  let isUsingFallback = false;

  if (dashboardData) {
    // استخدام البيانات الكاملة من الـ endpoint الموحد
    displayData = dashboardData;
  } else {
    // استخدام البيانات الاحتياطية
    displayData = fallbackDisplayData;
    isUsingFallback = true;
  }

  if (isDashboardLoading) {
    return (
      <div className={`p-6 bg-gray-50 min-h-screen !font-tajawal ${isRTL ? "rtl" : "ltr"}`}>
        <Title title={intl.formatMessage({ id: "dashboard_title" })} />
        <LoadingComponent/>
      </div>
    );
  }

  return (
    <div className={`p-6 bg-gray-50 min-h-screen !font-tajawal ${isRTL ? "rtl" : "ltr"}`}>
      <Title title={intl.formatMessage({ id: "dashboard_title" })} />
      
      {/* Connection Status */}
      {(hasErrors || isUsingFallback) && (
        <ConnectionStatus 
          isOnline={!hasErrors}
          hasErrors={hasErrors}
          onRefresh={handleRefreshAll}
        />
      )}

      {/* Overview Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{intl.formatMessage({ id: "Overview" })}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <DashCard
            title={intl.formatMessage({ id: "Orders" })}
            value={displayData.summary.orders}
            icon={Package}
            change={displayData.summary.ordersChange}
            period={intl.formatMessage({ id: "from last month" })}
            changeColor="text-green-500"
            bgIcon="bg-[#021031]"
          />
          <DashCard
            title={intl.formatMessage({ id: "Consultation Requests" })}
            value={displayData.summary.consultationRequests}
            change={displayData.summary.consultationsChange}
            period={intl.formatMessage({ id: "from last month" })}
            changeColor="text-green-500"
            bgIcon="bg-[#0D52F2]"
            icon={MessageCircleMore}
          />
          <DashCard
            title={intl.formatMessage({ id: "New Customers" })}
            value={displayData.summary.newCustomers}
            change={displayData.summary.customersChange}
            period={intl.formatMessage({ id: "from last month" })}
            changeColor="text-green-500"
            bgIcon="bg-[#FFDD00]"
            icon={UserPlus2Icon}
          />
        </div>
      </div>

      {/* Trends Section */}
      <div 
        className="mb-6 p-6 rounded-lg shadow-sm h-auto"
        style={{ background: "radial-gradient(50% 50% at 50% 50%, #063197 77.4%, #021031 100%)" }}
      >
        <h2 className="text-xl font-semibold text-gray-200 mb-4">{intl.formatMessage({ id: "Trends" })}</h2>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* Order Trends Chart */}
          <div className="lg:col-span-3 card p-6 shadow-sm rounded-lg bg-white">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h5 className="font-semibold text-gray-700">{intl.formatMessage({ id: "Order Trends" })}</h5>
                <p className="text-sm text-gray-400">{intl.formatMessage({ id: "from last month" })}</p>
              </div>
              <span className="text-sm font-bold text-green-600 bg-green-100 px-2 py-1 rounded-md">
                {displayData.summary.ordersChange}
              </span>
            </div>

            {displayData.orderTrends && displayData.orderTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={displayData.orderTrends} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid stroke="#e0e0e0" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#6b7280" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b7280" }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#038C8C" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                {intl.formatMessage({ id: "No trend data available" })}
              </div>
            )}
          </div>

          {/* Popular Categories */}
          <div className="lg:col-span-2 card p-6 shadow-sm rounded-lg bg-white">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h5 className="font-semibold text-gray-700">{intl.formatMessage({ id: "Popular Categories" })}</h5>
                <p className="text-sm text-gray-400">{intl.formatMessage({ id: "from last month" })}</p>
              </div>
              <span className="text-sm font-bold text-green-600 bg-green-100 px-2 py-1 rounded-md">+8%</span>
            </div>
            
            {displayData.popularCategories && displayData.popularCategories.length > 0 ? (
              <div className="space-y-4 mt-6">
                {displayData.popularCategories.map((category, index) => (
                  <div key={index}>
                    <p className="text-sm font-medium text-gray-600 mb-1">{category.name}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="h-2.5 rounded-full" 
                        style={{ 
                          width: `${category.value}%`, 
                          backgroundColor: category.color || "#3b82f6" 
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-500">
                {intl.formatMessage({ id: "No category data available" })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{intl.formatMessage({ id: "Recent Activity" })}</h2>
        <div className="space-y-8">
          
          {/* Recent Orders Table */}
          <div>
            <DataTable
              title={intl.formatMessage({ id: "Recent Orders" })}
               filterAble={false}
               searchAble={false}
              linkApply={true}
              linkText="/orders"
              RenderHead={() => (
                <>
                  <TableHead>{intl.formatMessage({ id: "Order ID" })}</TableHead>
                  <TableHead>{intl.formatMessage({ id: "Customer" })}</TableHead>
                  <TableHead>{intl.formatMessage({ id: "Date" })}</TableHead>
                  <TableHead>{intl.formatMessage({ id: "Status" })}</TableHead>
                </>
              )}
              RenderBody={() => (
                <>
                  {displayData.recentOrders && displayData.recentOrders.length > 0 ? (
                    displayData.recentOrders.map((order, index) => (
                      <TableRow key={order._id || index} className="hover:bg-gray-50 !text-center">
                        <TableCell className="font-medium text-gray-800 text-center">
                          {order._id && order._id.length > 8 ? order._id.slice(-8) : order._id || `ORD${index + 1}`}
                        </TableCell>
                        <TableCell className="text-center">{order.customer?.name || "N/A"}</TableCell>
                        <TableCell className="text-center">{formatDate(order.date)}</TableCell>
                        <TableCell className="text-center">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                        {intl.formatMessage({ id: "No recent orders available" })}
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )}
            />
          </div>
          
          {/* Recent Requests Table */}
          <div>
            
            <DataTable
            filterAble={false}
              searchAble={false}
              linkApply={true}
              linkText="/consultations"
              title={intl.formatMessage({ id: "Recent Consultation Requests" })}
              RenderHead={() => (
                <>
                  <TableHead>{intl.formatMessage({ id: "Request ID" })}</TableHead>
                  <TableHead>{intl.formatMessage({ id: "Customer" })}</TableHead>
                  <TableHead>{intl.formatMessage({ id: "Date" })}</TableHead>
                  <TableHead>{intl.formatMessage({ id: "Status" })}</TableHead>
                </>
              )}
              RenderBody={() => (
                <>
                  {displayData.recentRequests && displayData.recentRequests.length > 0 ? (
                    displayData.recentRequests.map((request, index) => (
                      <TableRow key={request._id || index} className="hover:bg-gray-50 !text-center">
                        <TableCell className="font-medium text-gray-800 text-center">
                          {request._id && request._id.length > 8 ? request._id.slice(-8) : request._id || `REQ${index + 1}`}
                        </TableCell>
                        <TableCell className="text-center">{request.customer?.name || "N/A"}</TableCell>
                        <TableCell className="text-center">{formatDate(request.date)}</TableCell>
                        <TableCell className="text-center">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                        {intl.formatMessage({ id: "No recent requests available" })}
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )}

            />

          </div>
        </div>
      </div>
    </div>
  );
}
