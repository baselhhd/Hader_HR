import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface MonthlyData {
  month: string;
  users: number;
  attendance: number;
}

export const AdminCharts = () => {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    try {
      setLoading(true);

      // Get last 6 months data
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (5 - i));
        return {
          monthStart: new Date(date.getFullYear(), date.getMonth(), 1)
            .toISOString()
            .split("T")[0],
          monthEnd: new Date(date.getFullYear(), date.getMonth() + 1, 0)
            .toISOString()
            .split("T")[0],
          label: date.toLocaleDateString("ar-SA", {
            month: "short",
            year: "numeric",
          }),
        };
      });

      const monthlyStats = await Promise.all(
        last6Months.map(async ({ monthStart, monthEnd, label }) => {
          // Count users created in this month
          const { count: usersCount } = await supabase
            .from("users")
            .select("*", { count: "exact", head: true })
            .gte("created_at", `${monthStart}T00:00:00`)
            .lte("created_at", `${monthEnd}T23:59:59`);

          // Count attendance records in this month
          const { count: attendanceCount } = await supabase
            .from("attendance_records")
            .select("*", { count: "exact", head: true })
            .gte("check_in", `${monthStart}T00:00:00`)
            .lte("check_in", `${monthEnd}T23:59:59`);

          return {
            month: label,
            users: usersCount || 0,
            attendance: attendanceCount || 0,
          };
        })
      );

      setMonthlyData(monthlyStats);
    } catch (error) {
      console.error("Error fetching chart data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-white">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-100 rounded"></div>
          </div>
        </Card>
        <Card className="p-6 bg-white">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-100 rounded"></div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Users Growth Line Chart */}
      <Card className="p-6 bg-white">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          نمو المستخدمين - آخر 6 أشهر
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="users"
              stroke="#8b5cf6"
              strokeWidth={2}
              name="مستخدمين جدد"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Attendance Trend Area Chart */}
      <Card className="p-6 bg-white">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          اتجاه الحضور - آخر 6 أشهر
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="attendance"
              stroke="#ec4899"
              fill="#ec4899"
              fillOpacity={0.3}
              name="سجلات الحضور"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};
