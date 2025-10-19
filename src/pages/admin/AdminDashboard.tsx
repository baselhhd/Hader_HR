import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building2,
  MapPin,
  Users,
  Clock,
  Settings,
  BarChart3,
  LogOut,
  Shield,
  GitBranch,
  UserCog,
} from "lucide-react";
import { toast } from "sonner";
import { AdminCharts } from "@/components/AdminCharts";
import { useUserLocationInfo } from "@/hooks/useUserLocationInfo";
import { UserLocationDisplay } from "@/components/UserLocationDisplay";
import { getSession } from "@/lib/auth";
import { getCurrentUserCompanyId } from "@/utils/dataIsolation";

interface SystemStats {
  totalCompanies: number;
  totalBranches: number;
  totalLocations: number;
  totalUsers: number;
  totalEmployees: number;
  totalShifts: number;
  activeUsers: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<SystemStats>({
    totalCompanies: 0,
    totalBranches: 0,
    totalLocations: 0,
    totalUsers: 0,
    totalEmployees: 0,
    totalShifts: 0,
    activeUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");

  // Get user location info (company)
  const locationInfo = useUserLocationInfo(userId, userRole);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchSystemStats();
    }
  }, [userId]);

  const fetchUserInfo = async () => {
    // Check for local session first
    const session = getSession();

    if (session) {
      // Check if user is super_admin
      if (session.role !== "super_admin") {
        toast.error("غير مصرح لك بالدخول لهذه الصفحة");
        navigate("/login");
        return;
      }
      // Check if user is super_admin
      if (session.role !== "admin") {
        toast.error("غير مصرح لك بالدخول لهذه الصفحة");
        navigate("/login");
        return;
      }
      setUserId(session.userId);
      setUserRole(session.role);
      setUserName(session.fullName || session.username);
    } else {
      navigate("/login");
    }
  };

  const fetchSystemStats = async () => {
    try {
      setLoading(true);

      // Get user's company_id for data isolation
      const userCompanyId = await getCurrentUserCompanyId(userId);

      if (!userCompanyId) {
        toast.error("لم يتم العثور على معلومات الشركة");
        setLoading(false);
        return;
      }

      // Get counts for company-specific entities
      const [
        { count: totalCompanies },
        { count: totalBranches },
        { count: totalLocations },
        { count: totalUsers },
        { count: totalEmployees },
        { count: totalShifts },
      ] = await Promise.all([
        // Company: يرى شركته فقط
        supabase.from("companies").select("*", { count: "exact", head: true })
          .eq('id', userCompanyId),
        // Branches: فروع شركته فقط
        supabase.from("branches").select("*", { count: "exact", head: true })
          .eq('company_id', userCompanyId),
        // Locations: مواقع شركته فقط
        supabase.from("locations").select("*", { count: "exact", head: true })
          .eq('company_id', userCompanyId),
        // Users: مستخدمي شركته فقط
        supabase.from("users").select("*", { count: "exact", head: true })
          .eq('company_id', userCompanyId),
        // Employees: موظفي شركته فقط (عبر users)
        supabase.from("employees").select("*, users!inner(company_id)", { count: "exact", head: true })
          .eq('users.company_id', userCompanyId),
        // Shifts: ورديات شركته فقط (عبر locations)
        supabase.from("shifts").select("*, locations!inner(company_id)", { count: "exact", head: true })
          .eq('locations.company_id', userCompanyId),
      ]);

      // Get active users (logged in today) - من شركته فقط
      const today = new Date().toISOString().split("T")[0];
      const { count: activeUsers } = await supabase
        .from("attendance_records")
        .select("id", { count: "exact", head: true })
        .eq('company_id', userCompanyId)
        .gte("check_in", `${today}T00:00:00`)
        .lte("check_in", `${today}T23:59:59`);

      setStats({
        totalCompanies: totalCompanies || 0,
        totalBranches: totalBranches || 0,
        totalLocations: totalLocations || 0,
        totalUsers: totalUsers || 0,
        totalEmployees: totalEmployees || 0,
        totalShifts: totalShifts || 0,
        activeUsers: activeUsers || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("خطأ في تحميل إحصائيات النظام");
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-6" dir="rtl">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-600 rounded-full">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-800">
                لوحة تحكم المدير العام
              </h1>
              <p className="text-gray-600">مرحباً، {userName}</p>
              {locationInfo.company && (
                <p className="text-gray-500 text-sm mt-1">
                  🏢 {locationInfo.company.name}
                </p>
              )}
            </div>
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
        {/* System Statistics */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">إحصائيات النظام</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 bg-white hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">الشركات</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {loading ? "..." : stats.totalCompanies}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Building2 className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">الفروع</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {loading ? "..." : stats.totalBranches}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <GitBranch className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">المواقع</p>
                  <p className="text-3xl font-bold text-green-600">
                    {loading ? "..." : stats.totalLocations}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <MapPin className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">إجمالي المستخدمين</p>
                  <p className="text-3xl font-bold text-indigo-600">
                    {loading ? "..." : stats.totalUsers}
                  </p>
                </div>
                <div className="p-3 bg-indigo-100 rounded-full">
                  <Users className="w-8 h-8 text-indigo-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">الموظفين</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {loading ? "..." : stats.totalEmployees}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <UserCog className="w-8 h-8 text-orange-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">الورديات</p>
                  <p className="text-3xl font-bold text-teal-600">
                    {loading ? "..." : stats.totalShifts}
                  </p>
                </div>
                <div className="p-3 bg-teal-100 rounded-full">
                  <Clock className="w-8 h-8 text-teal-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">المستخدمين النشطين اليوم</p>
                  <p className="text-3xl font-bold text-green-600">
                    {loading ? "..." : stats.activeUsers}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <BarChart3 className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-purple-600 to-pink-600 text-white hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-100 mb-1">حالة النظام</p>
                  <p className="text-2xl font-bold">نشط ✓</p>
                </div>
                <div className="p-3 bg-white/20 rounded-full">
                  <Settings className="w-8 h-8 text-white" />
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Management Actions */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">إدارة النظام</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card
              className="p-6 text-center hover:shadow-lg transition-all cursor-pointer hover:scale-105 border-2 border-purple-200"
              onClick={() => navigate("/admin/companies")}
            >
              <Building2 className="w-16 h-16 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">إدارة الشركات</h3>
              <p className="text-sm text-gray-600">إضافة وتعديل وحذف الشركات</p>
            </Card>

            <Card
              className="p-6 text-center hover:shadow-lg transition-all cursor-pointer hover:scale-105 border-2 border-blue-200"
              onClick={() => navigate("/admin/branches")}
            >
              <GitBranch className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">إدارة الفروع</h3>
              <p className="text-sm text-gray-600">إدارة فروع الشركات</p>
            </Card>

            <Card
              className="p-6 text-center hover:shadow-lg transition-all cursor-pointer hover:scale-105 border-2 border-green-200"
              onClick={() => navigate("/admin/locations")}
            >
              <MapPin className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">إدارة المواقع</h3>
              <p className="text-sm text-gray-600">تحديد المواقع الجغرافية والأنصبة</p>
            </Card>

            <Card
              className="p-6 text-center hover:shadow-lg transition-all cursor-pointer hover:scale-105 border-2 border-teal-200"
              onClick={() => navigate("/admin/shifts")}
            >
              <Clock className="w-16 h-16 text-teal-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">إدارة الورديات</h3>
              <p className="text-sm text-gray-600">تحديد أوقات العمل والورديات</p>
            </Card>

            <Card
              className="p-6 text-center hover:shadow-lg transition-all cursor-pointer hover:scale-105 border-2 border-indigo-200"
              onClick={() => navigate("/admin/users")}
            >
              <Users className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">إدارة المستخدمين</h3>
              <p className="text-sm text-gray-600">إدارة المستخدمين والصلاحيات</p>
            </Card>

            <Card
              className="p-6 text-center hover:shadow-lg transition-all cursor-pointer hover:scale-105 border-2 border-orange-200"
              onClick={() => navigate("/admin/settings")}
            >
              <Settings className="w-16 h-16 text-orange-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">إعدادات النظام</h3>
              <p className="text-sm text-gray-600">تخصيص إعدادات النظام العامة</p>
            </Card>
          </div>
        </div>

        {/* Charts Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">التحليلات والرسوم البيانية</h2>
          <AdminCharts />
        </div>

        {/* Quick Stats Summary */}
        <Card className="p-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2">ملخص سريع</h3>
              <p className="text-purple-100">
                النظام يدير {stats.totalCompanies} شركة بإجمالي {stats.totalEmployees} موظف
                عبر {stats.totalLocations} موقع
              </p>
            </div>
            <BarChart3 className="w-16 h-16 text-white/80" />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
