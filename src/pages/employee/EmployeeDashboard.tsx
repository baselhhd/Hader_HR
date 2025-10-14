import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Clock,
  CalendarDays,
  FileText,
  BarChart3,
  CheckCircle,
  AlertCircle,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface UserProfile {
  full_name: string;
  avatar_url?: string;
}

interface EmployeeData {
  location_id: string;
  shift_id: string;
  vacation_balance: number;
  locations?: {
    name: string;
  };
  shifts?: {
    name: string;
    start_time: string;
    end_time: string;
  };
}

interface TodayAttendance {
  id: string;
  check_in: string;
  check_out?: string;
  status: string;
}

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendance | null>(null);
  const [monthStats, setMonthStats] = useState({ present: 0, late: 0, total: 20 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/login");
      return;
    }

    // TODO: Simple role check - will enhance before production
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (userData?.role !== "employee") {
      toast.error("غير مصرح لك بالدخول");
      navigate("/login");
      return;
    }

    setUser(session.user);
    await loadData(session.user.id);
  };

  const loadData = async (userId: string) => {
    setIsLoading(true);

    try {
      // Get user profile
      const { data: profileData } = await supabase
        .from("users")
        .select("full_name, avatar_url")
        .eq("id", userId)
        .single();

      setProfile(profileData);

      // Get employee data with location and shift
      const { data: empData } = await supabase
        .from("employees")
        .select(`
          location_id,
          shift_id,
          vacation_balance,
          locations:location_id (name),
          shifts:shift_id (name, start_time, end_time)
        `)
        .eq("user_id", userId)
        .single();

      setEmployeeData(empData);

      // Get today's attendance
      const today = new Date().toISOString().split("T")[0];
      const { data: attendanceData } = await supabase
        .from("attendance_records")
        .select("id, check_in, check_out, status")
        .eq("employee_id", userId)
        .gte("check_in", `${today}T00:00:00`)
        .lte("check_in", `${today}T23:59:59`)
        .order("check_in", { ascending: false })
        .limit(1)
        .maybeSingle();

      setTodayAttendance(attendanceData);

      // Get month stats
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { data: monthData } = await supabase
        .from("attendance_records")
        .select("id, late_minutes")
        .eq("employee_id", userId)
        .gte("check_in", startOfMonth);

      if (monthData) {
        const lateCount = monthData.filter(r => r.late_minutes > 0).length;
        setMonthStats({
          present: monthData.length,
          late: lateCount,
          total: 20,
        });
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("حدث خطأ أثناء تحميل البيانات");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
    toast.success("تم تسجيل الخروج بنجاح");
  };

  const getWorkDuration = () => {
    if (!todayAttendance) return null;
    
    const checkIn = new Date(todayAttendance.check_in);
    const now = new Date();
    const diff = now.getTime() - checkIn.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours} ساعة و ${minutes} دقيقة`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-header text-white p-6 pb-16 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">
              👋 مرحباً {profile?.full_name?.split(" ")[0]}
            </h1>
            <p className="text-white/90 text-sm">
              {format(new Date(), "EEEE، dd MMMM", { locale: ar })} • {format(new Date(), "hh:mm a")}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-white hover:bg-white/20"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-white/90 flex items-center gap-2">
          <span>📍</span> {employeeData?.locations?.name || "غير محدد"}
        </p>
      </div>

      <div className="px-4 -mt-12 space-y-4">
        {/* Status Card */}
        <Card className="p-6 card-elevated animate-slide-up">
          {!todayAttendance ? (
            <>
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-warning" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-center mb-2">
                ⏰ لم تسجل حضورك بعد
              </h3>
              <p className="text-center text-muted-foreground mb-4">
                ورديتك: {employeeData?.shifts?.name} (
                {employeeData?.shifts?.start_time} - {employeeData?.shifts?.end_time})
              </p>
              <Button
                onClick={() => navigate("/employee/check-in")}
                className="w-full h-14 text-lg font-bold bg-gradient-success hover:opacity-90"
              >
                ✅ سجل حضورك الآن
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-center mb-2 text-success">
                🟢 في العمل
              </h3>
              <p className="text-center text-muted-foreground mb-1">
                دخلت الساعة: {format(new Date(todayAttendance.check_in), "hh:mm a")}
              </p>
              <p className="text-center text-muted-foreground mb-4">
                مضى: {getWorkDuration()}
              </p>
              {!todayAttendance.check_out && (
                <Button
                  variant="outline"
                  className="w-full h-12 text-lg font-bold border-2"
                >
                  ⏱️ تسجيل خروج
                </Button>
              )}
            </>
          )}
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <Card
            className="p-4 text-center hover-scale cursor-pointer"
            onClick={() => navigate("/employee/leave-request")}
          >
            <CalendarDays className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium">طلب إجازة</p>
          </Card>
          <Card
            className="p-4 text-center hover-scale cursor-pointer"
            onClick={() => navigate("/employee/custom-request")}
          >
            <FileText className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium">طلب خاص</p>
          </Card>
          <Card
            className="p-4 text-center hover-scale cursor-pointer"
            onClick={() => navigate("/employee/attendance")}
          >
            <BarChart3 className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium">سجل الحضور</p>
          </Card>
        </div>

        {/* Month Stats */}
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">إحصائيات الشهر</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">أيام الحضور</span>
              <span className="font-bold text-lg">
                {monthStats.present}/{monthStats.total} ({Math.round((monthStats.present / monthStats.total) * 100)}%)
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-success"
                style={{ width: `${(monthStats.present / monthStats.total) * 100}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-sm text-muted-foreground">مرات التأخير</p>
                <p className="text-2xl font-bold text-warning">{monthStats.late}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">رصيد الإجازات</p>
                <p className="text-2xl font-bold text-primary">{employeeData?.vacation_balance || 0}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
