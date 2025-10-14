import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowRight, Calendar as CalendarIcon, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface AttendanceRecord {
  id: string;
  check_in: string;
  check_out: string | null;
  work_hours: number | null;
  late_minutes: number;
  status: string;
  method_used: string;
  gps_distance: number | null;
  suspicious_score: number;
  locations?: {
    name: string;
  };
}

interface MonthStats {
  totalDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  totalHours: number;
  avgHours: number;
}

const AttendanceHistory = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [stats, setStats] = useState<MonthStats>({
    totalDays: 0,
    presentDays: 0,
    lateDays: 0,
    absentDays: 0,
    totalHours: 0,
    avgHours: 0,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      loadAttendance();
    }
  }, [selectedMonth]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/login");
      return;
    }

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

    await loadAttendance();
  };

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const monthStart = startOfMonth(selectedMonth);
      const monthEnd = endOfMonth(selectedMonth);

      const { data, error } = await supabase
        .from("attendance_records")
        .select(`
          *,
          locations (name)
        `)
        .eq("employee_id", user.id)
        .gte("check_in", monthStart.toISOString())
        .lte("check_in", monthEnd.toISOString())
        .order("check_in", { ascending: false });

      if (error) throw error;

      setRecords(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error("Error loading attendance:", error);
      toast.error("حدث خطأ في تحميل السجلات");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: AttendanceRecord[]) => {
    const presentDays = data.length;
    const lateDays = data.filter(r => r.late_minutes > 0).length;
    const totalHours = data.reduce((sum, r) => sum + (r.work_hours || 0), 0);
    const avgHours = presentDays > 0 ? totalHours / presentDays : 0;

    // Calculate working days in month (assuming 5 days/week)
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    const totalDays = Math.ceil((monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24));
    const workingDays = Math.ceil(totalDays * 5 / 7); // Approximate
    const absentDays = Math.max(0, workingDays - presentDays);

    setStats({
      totalDays: workingDays,
      presentDays,
      lateDays,
      absentDays,
      totalHours,
      avgHours,
    });
  };

  const getStatusBadge = (record: AttendanceRecord) => {
    if (record.status === "suspicious" || record.status === "pending") {
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-500">
          <AlertTriangle className="w-3 h-3 ml-1" />
          معلق
        </Badge>
      );
    }
    if (record.status === "rejected") {
      return (
        <Badge className="bg-red-100 text-red-700 border-red-500">
          <XCircle className="w-3 h-3 ml-1" />
          مرفوض
        </Badge>
      );
    }
    if (record.late_minutes > 0) {
      return (
        <Badge className="bg-orange-100 text-orange-700 border-orange-500">
          <Clock className="w-3 h-3 ml-1" />
          متأخر
        </Badge>
      );
    }
    return (
      <Badge className="bg-green-100 text-green-700 border-green-500">
        <CheckCircle className="w-3 h-3 ml-1" />
        حاضر
      </Badge>
    );
  };

  const formatDuration = (hours: number | null) => {
    if (!hours) return "لم يسجل الخروج";
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}س ${m}د`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-warning flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-header text-white p-6 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/employee/dashboard")}
            className="text-white hover:bg-white/20"
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">سجل الحضور</h1>
        </div>

        {/* Month Selector */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-right font-normal bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
            >
              <CalendarIcon className="ml-2 h-4 w-4" />
              {format(selectedMonth, "MMMM yyyy", { locale: ar })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedMonth}
              onSelect={(date) => date && setSelectedMonth(date)}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="p-4 space-y-4 -mt-4">
        {/* Monthly Stats */}
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">📊 إحصائيات الشهر</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{stats.presentDays}</div>
              <div className="text-xs text-muted-foreground mt-1">أيام الحضور</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-500">{stats.lateDays}</div>
              <div className="text-xs text-muted-foreground mt-1">أيام التأخير</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500">{stats.absentDays}</div>
              <div className="text-xs text-muted-foreground mt-1">أيام الغياب</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-success">{stats.totalHours.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground mt-1">إجمالي الساعات</div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">متوسط ساعات العمل اليومي</span>
              <span className="font-bold text-primary">{stats.avgHours.toFixed(2)} ساعة</span>
            </div>
          </div>
        </Card>

        {/* Attendance Records */}
        {records.length === 0 ? (
          <Card className="p-8 text-center">
            <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">لا توجد سجلات حضور</p>
            <p className="text-gray-500 text-sm mt-2">
              لم يتم تسجيل أي حضور في {format(selectedMonth, "MMMM yyyy", { locale: ar })}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {records.map((record) => (
              <Card key={record.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-lg">
                      {format(new Date(record.check_in), "EEEE، dd MMMM", { locale: ar })}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {record.locations?.name || "موقع غير معروف"}
                    </p>
                  </div>
                  {getStatusBadge(record)}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="text-muted-foreground text-xs">الدخول</div>
                      <div className="font-medium">
                        {format(new Date(record.check_in), "hh:mm a", { locale: ar })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="text-muted-foreground text-xs">الخروج</div>
                      <div className="font-medium">
                        {record.check_out
                          ? format(new Date(record.check_out), "hh:mm a", { locale: ar })
                          : "لم يسجل"}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-muted-foreground text-xs">المدة</div>
                    <div className="font-medium">{formatDuration(record.work_hours)}</div>
                  </div>

                  <div>
                    <div className="text-muted-foreground text-xs">الطريقة</div>
                    <div className="font-medium">
                      {record.method_used === "qr" ? "QR" : 
                       record.method_used === "color" ? "اللون" : "الكود"}
                    </div>
                  </div>

                  {record.late_minutes > 0 && (
                    <div className="col-span-2">
                      <div className="text-amber-600 text-xs">تأخير: {record.late_minutes} دقيقة</div>
                    </div>
                  )}

                  {record.suspicious_score > 0 && (
                    <div className="col-span-2">
                      <div className="text-amber-600 text-xs">
                        نقاط الاشتباه: {record.suspicious_score}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceHistory;
