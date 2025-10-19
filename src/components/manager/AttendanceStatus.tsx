import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, Clock, XCircle, Users } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface EmployeeWithAttendance {
  user_id: string;
  employee_number: string;
  department: string | null;
  position: string | null;
  users: {
    full_name: string;
    avatar_url: string | null;
  };
  shifts: {
    name: string;
    start_time: string;
    end_time: string;
  } | null;
  todayStatus: {
    status: string;
    checkIn: string;
    lateMinutes: number | null;
    methodUsed: string;
  } | null;
}

interface AttendanceStatusProps {
  locationId: string;
}

export default function AttendanceStatus({ locationId }: AttendanceStatusProps) {
  const [employees, setEmployees] = useState<EmployeeWithAttendance[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<EmployeeWithAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "present" | "late" | "absent">("all");
  const [sortBy, setSortBy] = useState<"status" | "name" | "checkIn" | "late">("status");

  // إحصائيات
  const [stats, setStats] = useState({
    present: 0,
    late: 0,
    absent: 0,
    total: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. جلب موظفين الموقع
      const { data: employeesData, error: empError } = await supabase
        .from("employees")
        .select(`
          user_id,
          employee_number,
          department,
          position,
          users!inner (
            full_name,
            avatar_url
          ),
          shifts (
            name,
            start_time,
            end_time
          )
        `)
        .eq("location_id", locationId);

      if (empError) throw empError;

      // 2. جلب حضور اليوم
      const today = new Date().toISOString().split("T")[0];
      const { data: attendanceData, error: attError } = await supabase
        .from("attendance_records")
        .select("employee_id, check_in, check_out, status, late_minutes, method_used")
        .gte("check_in", `${today}T00:00:00`)
        .lte("check_in", `${today}T23:59:59`);

      if (attError) throw attError;

      // 3. دمج البيانات
      const employeesWithStatus: EmployeeWithAttendance[] = (employeesData || []).map((emp) => {
        const attendance = attendanceData?.find((a) => a.employee_id === emp.user_id);

        let status = "absent";
        if (attendance) {
          if (attendance.late_minutes && attendance.late_minutes > 0) {
            status = "late";
          } else {
            status = "present";
          }
        }

        return {
          ...emp,
          todayStatus: attendance
            ? {
                status,
                checkIn: attendance.check_in,
                lateMinutes: attendance.late_minutes,
                methodUsed: attendance.method_used || "unknown",
              }
            : null,
        };
      });

      setEmployees(employeesWithStatus);
      setFilteredEmployees(employeesWithStatus);

      // حساب الإحصائيات
      const present = employeesWithStatus.filter(
        (e) => e.todayStatus?.status === "present"
      ).length;
      const late = employeesWithStatus.filter(
        (e) => e.todayStatus?.status === "late"
      ).length;
      const absent = employeesWithStatus.filter(
        (e) => !e.todayStatus || e.todayStatus.status === "absent"
      ).length;

      setStats({
        present,
        late,
        absent,
        total: employeesWithStatus.length,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (locationId) {
      fetchData();
      // تحديث تلقائي كل دقيقة
      const interval = setInterval(fetchData, 60000);
      return () => clearInterval(interval);
    }
  }, [locationId]);

  // تطبيق الفلترة
  useEffect(() => {
    let filtered = [...employees];

    // فلترة حسب الحالة
    if (filter === "present") {
      filtered = filtered.filter((e) => e.todayStatus?.status === "present");
    } else if (filter === "late") {
      filtered = filtered.filter((e) => e.todayStatus?.status === "late");
    } else if (filter === "absent") {
      filtered = filtered.filter((e) => !e.todayStatus || e.todayStatus.status === "absent");
    }

    // ترتيب
    if (sortBy === "status") {
      filtered.sort((a, b) => {
        const statusOrder = { present: 0, late: 1, absent: 2 };
        const aStatus = a.todayStatus?.status || "absent";
        const bStatus = b.todayStatus?.status || "absent";
        return (
          statusOrder[aStatus as keyof typeof statusOrder] -
          statusOrder[bStatus as keyof typeof statusOrder]
        );
      });
    } else if (sortBy === "name") {
      filtered.sort((a, b) =>
        a.users.full_name.localeCompare(b.users.full_name, "ar")
      );
    } else if (sortBy === "checkIn") {
      filtered.sort((a, b) => {
        if (!a.todayStatus?.checkIn) return 1;
        if (!b.todayStatus?.checkIn) return -1;
        return new Date(b.todayStatus.checkIn).getTime() - new Date(a.todayStatus.checkIn).getTime();
      });
    } else if (sortBy === "late") {
      filtered.sort((a, b) => {
        const aLate = a.todayStatus?.lateMinutes || 0;
        const bLate = b.todayStatus?.lateMinutes || 0;
        return bLate - aLate;
      });
    }

    setFilteredEmployees(filtered);
  }, [filter, sortBy, employees]);

  const getStatusColor = (status: string | null | undefined) => {
    if (status === "present") return "bg-green-50 text-green-900 border-green-200";
    if (status === "late") return "bg-orange-50 text-orange-900 border-orange-200";
    return "bg-red-50 text-red-900 border-red-200";
  };

  const getStatusIcon = (status: string | null | undefined) => {
    if (status === "present") return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (status === "late") return <Clock className="w-5 h-5 text-orange-600" />;
    return <XCircle className="w-5 h-5 text-red-600" />;
  };

  const getStatusText = (status: string | null | undefined) => {
    if (status === "present") return "حاضر";
    if (status === "late") return "متأخر";
    return "غائب";
  };

  const getMethodText = (method: string) => {
    if (method === "qr") return "QR";
    if (method === "color") return "Color";
    if (method === "numeric") return "Numeric";
    return "غير محدد";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            حالة الحضور
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">جاري التحميل...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          حالة الحضور - {stats.total} موظف
        </CardTitle>

        {/* إحصائيات سريعة */}
        <div className="flex gap-4 mt-4 flex-wrap">
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-900">{stats.present} حاضر</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-lg border border-orange-200">
            <Clock className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-900">{stats.late} متأخر</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-lg border border-red-200">
            <XCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-red-900">{stats.absent} غائب</span>
          </div>
        </div>

        {/* الفلترة والترتيب */}
        <div className="flex gap-3 mt-4 flex-wrap">
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              الكل ({stats.total})
            </Button>
            <Button
              variant={filter === "present" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("present")}
            >
              حاضر ({stats.present})
            </Button>
            <Button
              variant={filter === "late" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("late")}
            >
              متأخر ({stats.late})
            </Button>
            <Button
              variant={filter === "absent" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("absent")}
            >
              غائب ({stats.absent})
            </Button>
          </div>

          <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="ترتيب حسب" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="status">حسب الحالة</SelectItem>
              <SelectItem value="name">حسب الاسم</SelectItem>
              <SelectItem value="checkIn">حسب وقت الدخول</SelectItem>
              <SelectItem value="late">حسب التأخير</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {filteredEmployees.length === 0 ? (
          <div className="text-center py-8 text-gray-500">لا يوجد موظفين</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees.map((employee) => (
              <Card
                key={employee.user_id}
                className={`border-2 ${getStatusColor(employee.todayStatus?.status)}`}
              >
                <CardContent className="pt-4">
                  {/* الاسم ورقم الموظف */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{employee.users.full_name}</h3>
                      <p className="text-sm text-gray-600">#{employee.employee_number}</p>
                    </div>
                    {getStatusIcon(employee.todayStatus?.status)}
                  </div>

                  {/* القسم والمنصب */}
                  {(employee.department || employee.position) && (
                    <p className="text-sm text-gray-700 mb-3">
                      {employee.department || "غير محدد"} - {employee.position || "غير محدد"}
                    </p>
                  )}

                  {/* الحالة */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">
                      {getStatusText(employee.todayStatus?.status)}
                    </span>
                    {employee.todayStatus?.checkIn && (
                      <>
                        <span className="text-gray-400">|</span>
                        <span className="text-sm">
                          {format(new Date(employee.todayStatus.checkIn), "hh:mm a", {
                            locale: ar,
                          })}
                        </span>
                        <span className="text-gray-400">|</span>
                        <span className="text-sm">{getMethodText(employee.todayStatus.methodUsed)}</span>
                      </>
                    )}
                  </div>

                  {/* التأخير */}
                  {employee.todayStatus?.lateMinutes && employee.todayStatus.lateMinutes > 0 && (
                    <div className="text-sm text-orange-700 mb-2">
                      تأخر {employee.todayStatus.lateMinutes} دقيقة
                    </div>
                  )}

                  {/* الوردية */}
                  {employee.shifts && (
                    <div className="text-xs text-gray-600 mt-2 pt-2 border-t">
                      <span className="font-medium">{employee.shifts.name}</span>
                      <span className="text-gray-400"> • </span>
                      <span>
                        {format(
                          new Date(`2000-01-01T${employee.shifts.start_time}`),
                          "hh:mm a",
                          { locale: ar }
                        )}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
