import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChartContainer } from "@/components/ui/chart"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  CartesianGrid,
} from "recharts"

const salesData = [
  { name: "Jan", value: 180000 },
  { name: "Feb", value: 200000 },
  { name: "Mar", value: 220000 },
  { name: "Apr", value: 190000 },
  { name: "May", value: 240000 },
  { name: "Jun", value: 210000 },
  { name: "Jul", value: 230000 },
  { name: "Aug", value: 250000 },
  { name: "Sep", value: 220000 },
  { name: "Oct", value: 240000 },
  { name: "Nov", value: 260000 },
  { name: "Dec", value: 250000 },
]

const pieData = [
  { name: "Industry-Specific", value: 32.7 },
  { name: "Pricing & Est.", value: 21.5 },
  { name: "Safety & Compliance", value: 22.8 },
  { name: "Custom Formulations", value: 13 },
]

const barData = [
  { month: "Jan", m1: 30, m2: 20, m3: 10 },
  { month: "Feb", m1: 40, m2: 25, m3: 20 },
  { month: "Mar", m1: 35, m2: 30, m3: 25 },
  { month: "Apr", m1: 45, m2: 35, m3: 30 },
  { month: "May", m1: 50, m2: 40, m3: 35 },
  { month: "Jun", m1: 55, m2: 45, m3: 40 },
  { month: "Jul", m1: 60, m2: 50, m3: 45 },
  { month: "Aug", m1: 65, m2: 55, m3: 50 },
  { month: "Sep", m1: 70, m2: 60, m3: 55 },
  { month: "Oct", m1: 75, m2: 65, m3: 60 },
  { month: "Nov", m1: 80, m2: 70, m3: 65 },
  { month: "Dec", m1: 85, m2: 75, m3: 70 },
]

// Updated COLORS array with gradient reference for first color
const COLORS = ["url(#primaryGradient)", "#0D52F2", "#FFDD00", "#FF6B6B"]

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-6 py-6">
 
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-600">Analyze sales, consultations, and material demand trends.</p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Sales Reports</CardTitle>
                <CardDescription>Last 12 Months +15%</CardDescription>
              </div>
              <div className="text-right">
                <div className="text-xl font-semibold text-blue-600">$250K</div>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer
                id="sales-line"
                config={{ series: { color: "#021031" } }}
                className="h-48"
              >
                <LineChart data={salesData}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Consultation Reports</CardTitle>
                <CardDescription>Last 3 Months +10%</CardDescription>
              </div>
              <div className="text-right">
                <div className="text-xl font-semibold text-green-600">120</div>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer id="consultation-pie" config={{ pie: { color: "#10B981" } }} className="h-48">
                <PieChart>
                  {/* SVG Gradient Definition */}
                  <defs>
                    <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#021031" />
                      <stop offset="100%" stopColor="#0D52F2" />
                      <stop offset="100%" stopColor="#C2DBFF" />
                    </linearGradient>
                  </defs>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={30}>
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Material Demand Trends (full width) */}
        <Card className="shadow-md mb-6">
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <div>
                <CardTitle className="text-lg">Material Demand Trends</CardTitle>
                <CardDescription>Demand Counter | Last 6 Months -5%</CardDescription>
              </div>
              <div className="inline-flex rounded-md bg-gray-100 p-1">
                <button className="px-3 py-1 rounded-md text-sm text-gray-600 hover:bg-gray-200">Day</button>
                <button className="px-3 py-1 rounded-md text-sm text-gray-600 hover:bg-gray-200">Week</button>
                <button className="px-3 py-1 rounded-md text-sm bg-blue-100 text-blue-700 font-medium">Month</button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer id="material-bar" config={{ m1: { color: "#3B82F6" }, m2: { color: "#60A5FA" }, m3: { color: "#93C5FD" } }} className="h-56 w-full">
              <ResponsiveContainer>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="m1" stackId="a" fill="#021031" />
                  <Bar dataKey="m2" stackId="a" fill="#60A5FA" />
                  <Bar dataKey="m3" stackId="a" fill="#93C5FD" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Export & integration */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex gap-2">
            <Button className="bg-green-600 hover:bg-green-700 text-white">Export as Excel</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white">Export as PDF</Button>
          </div>
          <div className="text-sm text-gray-500">
            Traffic Insights (Google Analytics Integration) – Integration in progress.
          </div>
        </div>
      </div>
    </div>
  )
}