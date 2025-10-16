import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Calendar, Users, Clock, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface ReportStats {
  totalEmployees: number;
  totalAttendanceToday: number;
  avgAttendanceRate: number;
  totalLeaveRequests: number;
  pendingRequests: number;
  approvedRequests: number;
}

const Reports = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<ReportStats>({
    totalEmployees: 0,
    totalAttendanceToday: 0,
    avgAttendanceRate: 0,
    totalLeaveRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportStats();
  }, []);

  const fetchReportStats = async () => {
    try {
      setLoading(true);

      // Get total employees
      const { count: totalEmployees } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true });

      // Get today's attendance
      const today = new Date().toISOString().split("T")[0];
      const { count: totalAttendanceToday } = await supabase
        .from("attendance_records")
        .select("*", { count: "exact", head: true })
        .gte("check_in", `${today}T00:00:00`)
        .lte("check_in", `${today}T23:59:59`);

      // Get leave requests stats
      const { count: totalLeaveRequests } = await supabase
        .from("leave_requests")
        .select("*", { count: "exact", head: true });

      const { count: pendingRequests } = await supabase
        .from("leave_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      const { count: approvedRequests } = await supabase
        .from("leave_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "approved");

      const avgAttendanceRate =
        totalEmployees && totalAttendanceToday
          ? Math.round((totalAttendanceToday / totalEmployees) * 100)
          : 0;

      setStats({
        totalEmployees: totalEmployees || 0,
        totalAttendanceToday: totalAttendanceToday || 0,
        avgAttendanceRate,
        totalLeaveRequests: totalLeaveRequests || 0,
        pendingRequests: pendingRequests || 0,
        approvedRequests: approvedRequests || 0,
      });
    } catch (error: any) {
      console.error("Error fetching stats:", error);
      toast.error("خطأ في تحميل الإحصائيات");
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async (reportType: string) => {
    try {
      toast.info(`جاري تصدير تقرير ${reportType}...`);

      let data: any[] = [];
      let filename = "";
      let headers: string[] = [];

      switch (reportType) {
        case "الحضور والانصراف":
          filename = `attendance_report_${new Date().toISOString().split("T")[0]}.csv`;
          const { data: attendanceData, error: attendanceError } = await supabase
            .from("attendance_records")
            .select(`
              id,
              check_in,
              check_out,
              method_used,
              status,
              users (
                username,
                full_name
              )
            `)
            .order("check_in", { ascending: false })
            .limit(1000);

          if (attendanceError) throw attendanceError;

          headers = ["اسم المستخدم", "الاسم الكامل", "تاريخ الحضور", "وقت الحضور", "وقت الانصراف", "الطريقة", "الحالة"];
          data = (attendanceData || []).map((record: any) => ({
            username: record.users?.username || "-",
            full_name: record.users?.full_name || "-",
            date: new Date(record.check_in).toLocaleDateString("ar-SA"),
            check_in: new Date(record.check_in).toLocaleTimeString("ar-SA"),
            check_out: record.check_out ? new Date(record.check_out).toLocaleTimeString("ar-SA") : "-",
            method: record.method_used,
            status: record.status,
          }));
          break;

        case "الإجازات":
          filename = `leave_requests_report_${new Date().toISOString().split("T")[0]}.csv`;
          const { data: leaveData, error: leaveError } = await supabase
            .from("leave_requests")
            .select(`
              id,
              start_date,
              end_date,
              reason,
              status,
              created_at,
              users (
                username,
                full_name
              )
            `)
            .order("created_at", { ascending: false })
            .limit(1000);

          if (leaveError) throw leaveError;

          headers = ["اسم المستخدم", "الاسم الكامل", "تاريخ البداية", "تاريخ النهاية", "السبب", "الحالة", "تاريخ الطلب"];
          data = (leaveData || []).map((record: any) => ({
            username: record.users?.username || "-",
            full_name: record.users?.full_name || "-",
            start_date: new Date(record.start_date).toLocaleDateString("ar-SA"),
            end_date: new Date(record.end_date).toLocaleDateString("ar-SA"),
            reason: record.reason || "-",
            status: record.status,
            created_at: new Date(record.created_at).toLocaleDateString("ar-SA"),
          }));
          break;

        case "الأداء":
          filename = `performance_report_${new Date().toISOString().split("T")[0]}.csv`;
          // Get users with their attendance count
          const { data: usersData, error: usersError } = await supabase
            .from("users")
            .select("id, username, full_name, role")
            .eq("role", "employee");

          if (usersError) throw usersError;

          const performanceData = await Promise.all(
            (usersData || []).map(async (user: any) => {
              const { count: attendanceCount } = await supabase
                .from("attendance_records")
                .select("*", { count: "exact", head: true })
                .eq("user_id", user.id);

              return {
                username: user.username,
                full_name: user.full_name || "-",
                attendance_count: attendanceCount || 0,
              };
            })
          );

          headers = ["اسم المستخدم", "الاسم الكامل", "عدد أيام الحضور"];
          data = performanceData;
          break;

        case "الأقسام":
          filename = `departments_report_${new Date().toISOString().split("T")[0]}.csv`;
          const { data: deptData, error: deptError } = await supabase
            .from("users")
            .select("role")
            .neq("role", "super_admin");

          if (deptError) throw deptError;

          const roleCounts: Record<string, number> = {};
          (deptData || []).forEach((user: any) => {
            roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
          });

          headers = ["الدور", "عدد الموظفين"];
          data = Object.entries(roleCounts).map(([role, count]) => ({
            role,
            count,
          }));
          break;

        case "جميع التقارير":
          toast.info("سيتم تصدير جميع التقارير في ملفات منفصلة");
          await handleExportReport("الحضور والانصراف");
          setTimeout(() => handleExportReport("الإجازات"), 500);
          setTimeout(() => handleExportReport("الأداء"), 1000);
          setTimeout(() => handleExportReport("الأقسام"), 1500);
          return;
      }

      // Create CSV content
      const csvContent = [
        headers.join(","),
        ...data.map((row) => Object.values(row).join(",")),
      ].join("\n");

      // Add BOM for proper Arabic encoding
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`تم تصدير تقرير ${reportType} بنجاح`);
    } catch (error: any) {
      console.error("Error exporting report:", error);
      toast.error(`خطأ في تصدير تقرير ${reportType}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6" dir="rtl">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate("/hr/dashboard")}
            variant="outline"
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة
          </Button>
          <h1 className="text-4xl font-bold text-gray-800">التقارير والإحصائيات</h1>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="max-w-7xl mx-auto mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">نظرة عامة</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-12 h-12 text-blue-600" />
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">إجمالي الموظفين</p>
            <p className="text-3xl font-bold text-gray-800">
              {loading ? "..." : stats.totalEmployees}
            </p>
          </Card>

          <Card className="p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-12 h-12 text-green-600" />
              <div className="text-sm text-green-600 font-semibold">
                {stats.avgAttendanceRate}%
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">الحضور اليوم</p>
            <p className="text-3xl font-bold text-gray-800">
              {loading ? "..." : stats.totalAttendanceToday}
            </p>
          </Card>

          <Card className="p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-12 h-12 text-orange-600" />
              <div className="text-sm text-orange-600 font-semibold">
                {stats.pendingRequests} معلق
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">طلبات الإجازات</p>
            <p className="text-3xl font-bold text-gray-800">
              {loading ? "..." : stats.totalLeaveRequests}
            </p>
          </Card>
        </div>
      </div>

      {/* Report Types */}
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">أنواع التقارير</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Attendance Report */}
          <Card className="p-6 bg-white hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Clock className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">تقرير الحضور والانصراف</h3>
                  <p className="text-sm text-gray-600">تقرير شامل لحضور الموظفين</p>
                </div>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <p className="text-sm text-gray-600">• تقرير يومي للحضور والانصراف</p>
              <p className="text-sm text-gray-600">• إحصائيات التأخير والغياب</p>
              <p className="text-sm text-gray-600">• معدلات الحضور الشهرية</p>
            </div>
            <Button
              className="w-full gap-2"
              onClick={() => handleExportReport("الحضور والانصراف")}
            >
              <Download className="w-4 h-4" />
              تصدير التقرير
            </Button>
          </Card>

          {/* Leave Requests Report */}
          <Card className="p-6 bg-white hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Calendar className="w-8 h-8 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">تقرير الإجازات</h3>
                  <p className="text-sm text-gray-600">ملخص طلبات الإجازات</p>
                </div>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <p className="text-sm text-gray-600">• إجمالي الطلبات المعلقة والمعتمدة</p>
              <p className="text-sm text-gray-600">• تصنيف حسب نوع الإجازة</p>
              <p className="text-sm text-gray-600">• الرصيد المتبقي للموظفين</p>
            </div>
            <Button
              className="w-full gap-2"
              onClick={() => handleExportReport("الإجازات")}
            >
              <Download className="w-4 h-4" />
              تصدير التقرير
            </Button>
          </Card>

          {/* Employee Performance Report */}
          <Card className="p-6 bg-white hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">تقرير الأداء</h3>
                  <p className="text-sm text-gray-600">تقييم أداء الموظفين</p>
                </div>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <p className="text-sm text-gray-600">• معدلات الحضور والالتزام</p>
              <p className="text-sm text-gray-600">• عدد ساعات العمل الإضافي</p>
              <p className="text-sm text-gray-600">• التقييم الشامل للأداء</p>
            </div>
            <Button
              className="w-full gap-2"
              onClick={() => handleExportReport("الأداء")}
            >
              <Download className="w-4 h-4" />
              تصدير التقرير
            </Button>
          </Card>

          {/* Department Report */}
          <Card className="p-6 bg-white hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">تقرير الأقسام</h3>
                  <p className="text-sm text-gray-600">إحصائيات حسب القسم</p>
                </div>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <p className="text-sm text-gray-600">• عدد الموظفين في كل قسم</p>
              <p className="text-sm text-gray-600">• معدلات الحضور حسب القسم</p>
              <p className="text-sm text-gray-600">• مقارنة الأداء بين الأقسام</p>
            </div>
            <Button
              className="w-full gap-2"
              onClick={() => handleExportReport("الأقسام")}
            >
              <Download className="w-4 h-4" />
              تصدير التقرير
            </Button>
          </Card>
        </div>
      </div>

      {/* Export All */}
      <div className="max-w-7xl mx-auto mt-8">
        <Card className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">تصدير جميع التقارير</h3>
              <p className="text-blue-100">
                احصل على ملف شامل يحتوي على جميع التقارير والإحصائيات
              </p>
            </div>
            <Button
              variant="secondary"
              className="gap-2"
              onClick={() => handleExportReport("جميع التقارير")}
            >
              <Download className="w-4 h-4" />
              تصدير الكل
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
