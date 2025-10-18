import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Clock,
  FileText,
  TrendingUp,
  UserCheck,
  UserX,
  Calendar,
  BarChart3,
  LogOut
} from "lucide-react";
import { toast } from "sonner";
import { AttendanceChart } from "@/components/AttendanceChart";
import { useUserLocationInfo } from "@/hooks/useUserLocationInfo";
import { UserLocationDisplay } from "@/components/UserLocationDisplay";
import { getSession } from "@/lib/auth";
import { getCurrentUserCompanyId } from "@/utils/dataIsolation";

interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  pendingRequests: number;
  onLeaveToday: number;
}

const HRDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    pendingRequests: 0,
    onLeaveToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");

  // Get user location info (company, branch)
  const locationInfo = useUserLocationInfo(userId, userRole);

  useEffect(() => {
    fetchUserInfo();
    fetchDashboardStats();
  }, []);

  const fetchUserInfo = async () => {
    // Check for local session first
    const session = getSession();

    if (session) {
      setUserId(session.userId);
      setUserRole(session.role);
      setUserName(session.fullName || session.username);
      return;
    }

    // Fallback to Supabase Auth
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: userData } = await supabase
        .from("users")
        .select("username, full_name, role")
        .eq("id", user.id)
        .single();

      if (userData) {
        setUserId(user.id);
        setUserRole(userData.role || "");
        setUserName(userData.full_name || userData.username);
      }
    }
  };

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);

      // Get HR user's company_id for data isolation
      const session = getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      const userCompanyId = await getCurrentUserCompanyId(session.userId);
      if (!userCompanyId) {
        toast.error("لم يتم العثور على معلومات الشركة");
        setLoading(false);
        return;
      }

      // Get total employees for this company (via users table)
      const { count: totalEmployees } = await supabase
        .from("employees")
        .select("*, users!inner(company_id)", { count: "exact", head: true })
        .eq("users.company_id", userCompanyId);

      // Get today's attendance (present) for this company
      const today = new Date().toISOString().split("T")[0];
      const { count: presentToday } = await supabase
        .from("attendance_records")
        .select("*", { count: "exact", head: true })
        .eq("company_id", userCompanyId)
        .gte("check_in", `${today}T00:00:00`)
        .lte("check_in", `${today}T23:59:59`);

      // Get pending leave requests for this company (via employees -> users)
      const { count: pendingRequests } = await supabase
        .from("leave_requests")
        .select("*, employees!inner(users!inner(company_id))", { count: "exact", head: true })
        .eq("status", "pending")
        .eq("employees.users.company_id", userCompanyId);

      setStats({
        totalEmployees: totalEmployees || 0,
        presentToday: presentToday || 0,
        absentToday: (totalEmployees || 0) - (presentToday || 0),
        pendingRequests: pendingRequests || 0,
        onLeaveToday: 0, // TODO: Calculate based on leave requests
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("خطأ في تحميل الإحصائيات");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
    toast.success("تم تسجيل الخروج بنجاح");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6" dir="rtl">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              لوحة تحكم الموارد البشرية
            </h1>
            <p className="text-gray-600">مرحباً، {userName}</p>
            <p className="text-gray-500 text-sm mt-1">
              <UserLocationDisplay
                companyName={locationInfo.company?.name}
                branchName={locationInfo.branch?.name}
                variant="inline"
              />
            </p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 bg-white hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">إجمالي الموظفين</p>
                <p className="text-3xl font-bold text-gray-800">
                  {loading ? "..." : stats.totalEmployees}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">الحضور اليوم</p>
                <p className="text-3xl font-bold text-green-600">
                  {loading ? "..." : stats.presentToday}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <UserCheck className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">الغياب اليوم</p>
                <p className="text-3xl font-bold text-red-600">
                  {loading ? "..." : stats.absentToday}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <UserX className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">طلبات معلقة</p>
                <p className="text-3xl font-bold text-orange-600">
                  {loading ? "..." : stats.pendingRequests}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">الإجراءات السريعة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card
              className="p-6 text-center hover:shadow-lg transition-all cursor-pointer hover:scale-105"
              onClick={() => navigate("/hr/employees")}
            >
              <Users className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-800 mb-1">إدارة الموظفين</h3>
              <p className="text-sm text-gray-600">عرض وإدارة بيانات الموظفين</p>
            </Card>

            <Card
              className="p-6 text-center hover:shadow-lg transition-all cursor-pointer hover:scale-105"
              onClick={() => navigate("/hr/attendance")}
            >
              <Clock className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-800 mb-1">سجلات الحضور</h3>
              <p className="text-sm text-gray-600">مراجعة سجلات الحضور والانصراف</p>
            </Card>

            <Card
              className="p-6 text-center hover:shadow-lg transition-all cursor-pointer hover:scale-105"
              onClick={() => navigate("/hr/requests")}
            >
              <FileText className="w-12 h-12 text-orange-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-800 mb-1">طلبات الإجازات</h3>
              <p className="text-sm text-gray-600">مراجعة والموافقة على الطلبات</p>
            </Card>

            <Card
              className="p-6 text-center hover:shadow-lg transition-all cursor-pointer hover:scale-105"
              onClick={() => navigate("/hr/reports")}
            >
              <BarChart3 className="w-12 h-12 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-800 mb-1">التقارير</h3>
              <p className="text-sm text-gray-600">عرض التقارير والإحصائيات</p>
            </Card>
          </div>
        </div>

        {/* Charts Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">التحليلات والرسوم البيانية</h2>
          <AttendanceChart />
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">النشاطات الأخيرة</h2>
          <Card className="p-6 bg-white">
            <div className="text-center text-gray-500 py-8">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>لا توجد نشاطات حديثة</p>
              <p className="text-sm mt-2">سيتم عرض آخر التحديثات هنا</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;
