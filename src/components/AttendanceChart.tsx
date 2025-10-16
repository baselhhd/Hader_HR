import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface AttendanceData {
  date: string;
  present: number;
  absent: number;
}

interface StatusData {
  name: string;
  value: number;
}

const COLORS = {
  present: "#10b981",
  absent: "#ef4444",
  pending: "#f59e0b",
  approved: "#3b82f6",
  rejected: "#dc2626",
};

export const AttendanceChart = () => {
  const [weeklyData, setWeeklyData] = useState<AttendanceData[]>([]);
  const [statusData, setStatusData] = useState<StatusData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    try {
      setLoading(true);

      // Get last 7 days data
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split("T")[0];
      });

      // Get total employees
      const { count: totalEmployees } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true });

      // Get attendance data for each day
      const weeklyAttendance = await Promise.all(
        last7Days.map(async (date) => {
          const { count: presentCount } = await supabase
            .from("attendance_records")
            .select("*", { count: "exact", head: true })
            .gte("check_in", `${date}T00:00:00`)
            .lte("check_in", `${date}T23:59:59`);

          return {
            date: new Date(date).toLocaleDateString("ar-SA", {
              weekday: "short",
              month: "numeric",
              day: "numeric",
            }),
            present: presentCount || 0,
            absent: (totalEmployees || 0) - (presentCount || 0),
          };
        })
      );

      setWeeklyData(weeklyAttendance);

      // Get status distribution
      const [
        { count: pendingCount },
        { count: approvedCount },
        { count: rejectedCount },
      ] = await Promise.all([
        supabase
          .from("attendance_records")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("attendance_records")
          .select("*", { count: "exact", head: true })
          .eq("status", "approved"),
        supabase
          .from("attendance_records")
          .select("*", { count: "exact", head: true })
          .eq("status", "rejected"),
      ]);

      setStatusData([
        { name: "معلق", value: pendingCount || 0 },
        { name: "موافق عليه", value: approvedCount || 0 },
        { name: "مرفوض", value: rejectedCount || 0 },
      ]);
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
      {/* Weekly Attendance Bar Chart */}
      <Card className="p-6 bg-white">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          إحصائيات الحضور - آخر 7 أيام
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="present" fill={COLORS.present} name="حاضر" />
            <Bar dataKey="absent" fill={COLORS.absent} name="غائب" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Status Distribution Pie Chart */}
      <Card className="p-6 bg-white">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          توزيع حالات الحضور
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {statusData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    index === 0
                      ? COLORS.pending
                      : index === 1
                      ? COLORS.approved
                      : COLORS.rejected
                  }
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};
