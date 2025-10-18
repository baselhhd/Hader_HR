import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Calendar as CalendarIcon, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { z } from "zod";

const leaveSchema = z.object({
  leave_type: z.enum(["annual", "sick", "personal", "emergency", "unpaid"], {
    required_error: "يجب اختيار نوع الإجازة",
  }),
  start_date: z.date({
    required_error: "يجب اختيار تاريخ البداية",
  }),
  end_date: z.date({
    required_error: "يجب اختيار تاريخ النهاية",
  }),
  reason: z.string()
    .trim()
    .min(10, { message: "السبب يجب أن يكون 10 أحرف على الأقل" })
    .max(500, { message: "السبب يجب أن لا يتجاوز 500 حرف" }),
}).refine((data) => data.end_date >= data.start_date, {
  message: "تاريخ النهاية يجب أن يكون بعد أو يساوي تاريخ البداية",
  path: ["end_date"],
});

interface LeaveRequest {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days: number;
  reason: string;
  status: string;
  created_at: string;
  rejection_reason: string | null;
}

interface EmployeeData {
  vacation_balance: number;
  sick_leave_balance: number;
}

const LeaveRequest = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [employee, setEmployee] = useState<EmployeeData | null>(null);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  
  // Form state
  const [leaveType, setLeaveType] = useState<string>("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    checkAuth();
  }, []);

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

    await loadData(session.user.id);
  };

  const loadData = async (userId: string) => {
    try {
      setLoading(true);

      // Get employee balance
      const { data: empData, error: empError } = await supabase
        .from("employees")
        .select("vacation_balance, sick_leave_balance")
        .eq("user_id", userId)
        .single();

      if (empError) throw empError;
      setEmployee(empData);

      // Get leave requests
      const { data: reqData, error: reqError } = await supabase
        .from("leave_requests")
        .select("*")
        .eq("employee_id", userId)
        .order("created_at", { ascending: false });

      if (reqError) throw reqError;
      setRequests(reqData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("حدث خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    return differenceInDays(endDate, startDate) + 1;
  };

  const handleSubmit = async () => {
    try {
      // Validate form
      const result = leaveSchema.safeParse({
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason: reason,
      });

      if (!result.success) {
        const formattedErrors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          const key = err.path[0] as string;
          formattedErrors[key] = err.message;
        });
        setErrors(formattedErrors);
        toast.error("يرجى تصحيح الأخطاء في النموذج");
        return;
      }

      setErrors({});
      setSubmitting(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const days = calculateDays();

      // Check balance
      if (leaveType === "annual" && employee && days > employee.vacation_balance) {
        toast.error(`رصيد الإجازات غير كافٍ. الرصيد المتاح: ${employee.vacation_balance} يوم`);
        setSubmitting(false);
        return;
      }

      if (leaveType === "sick" && employee && days > employee.sick_leave_balance) {
        toast.error(`رصيد الإجازات المرضية غير كافٍ. الرصيد المتاح: ${employee.sick_leave_balance} يوم`);
        setSubmitting(false);
        return;
      }

      // Submit request
      const { error } = await supabase.from("leave_requests").insert({
        employee_id: user.id,
        leave_type: leaveType as "annual" | "sick" | "personal" | "emergency" | "unpaid",
        start_date: format(startDate!, "yyyy-MM-dd"),
        end_date: format(endDate!, "yyyy-MM-dd"),
        days,
        reason: reason.trim(),
        status: "pending",
      });

      if (error) throw error;

      toast.success("تم إرسال طلب الإجازة بنجاح");
      
      // Reset form
      setLeaveType("");
      setStartDate(undefined);
      setEndDate(undefined);
      setReason("");

      // Reload data
      await loadData(user.id);
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("حدث خطأ أثناء إرسال الطلب");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-amber-100 text-amber-700 border-amber-500">
            <Clock className="w-3 h-3 ml-1" />
            قيد المراجعة
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-500">
            <CheckCircle className="w-3 h-3 ml-1" />
            موافق عليها
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-500">
            <XCircle className="w-3 h-3 ml-1" />
            مرفوضة
          </Badge>
        );
      default:
        return null;
    }
  };

  const getLeaveTypeName = (type: string) => {
    const types: Record<string, string> = {
      annual: "إجازة سنوية",
      sick: "إجازة مرضية",
      personal: "إجازة شخصية",
      emergency: "إجازة طارئة",
      unpaid: "إجازة بدون راتب",
    };
    return types[type] || type;
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
          <h1 className="text-2xl font-bold">طلب إجازة</h1>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 bg-white/10 border-white/20 backdrop-blur">
            <p className="text-sm text-white/80 mb-1">الإجازات السنوية</p>
            <p className="text-3xl font-bold text-white">{employee?.vacation_balance || 0}</p>
            <p className="text-xs text-white/70">يوم متبقي</p>
          </Card>
          <Card className="p-4 bg-white/10 border-white/20 backdrop-blur">
            <p className="text-sm text-white/80 mb-1">الإجازات المرضية</p>
            <p className="text-3xl font-bold text-white">{employee?.sick_leave_balance || 0}</p>
            <p className="text-xs text-white/70">يوم متبقي</p>
          </Card>
        </div>
      </div>

      <div className="p-4 space-y-4 -mt-4">
        {/* New Request Form */}
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">📝 طلب إجازة جديد</h3>
          
          <div className="space-y-4">
            {/* Leave Type */}
            <div>
              <Label>نوع الإجازة *</Label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger className={errors.leave_type ? "border-red-500" : ""}>
                  <SelectValue placeholder="اختر نوع الإجازة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">إجازة سنوية 🏖️</SelectItem>
                  <SelectItem value="sick">إجازة مرضية 🤒</SelectItem>
                  <SelectItem value="personal">إجازة شخصية 👤</SelectItem>
                  <SelectItem value="emergency">إجازة طارئة 🚨</SelectItem>
                  <SelectItem value="unpaid">إجازة بدون راتب 💼</SelectItem>
                </SelectContent>
              </Select>
              {errors.leave_type && (
                <p className="text-sm text-red-500 mt-1">{errors.leave_type}</p>
              )}
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>من تاريخ *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-right font-normal",
                        !startDate && "text-muted-foreground",
                        errors.start_date && "border-red-500"
                      )}
                    >
                      <CalendarIcon className="ml-2 h-4 w-4" />
                      {startDate ? format(startDate, "dd/MM/yyyy", { locale: ar }) : "اختر التاريخ"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                {errors.start_date && (
                  <p className="text-sm text-red-500 mt-1">{errors.start_date}</p>
                )}
              </div>

              <div>
                <Label>إلى تاريخ *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-right font-normal",
                        !endDate && "text-muted-foreground",
                        errors.end_date && "border-red-500"
                      )}
                    >
                      <CalendarIcon className="ml-2 h-4 w-4" />
                      {endDate ? format(endDate, "dd/MM/yyyy", { locale: ar }) : "اختر التاريخ"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) => 
                        date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                        (startDate ? date < startDate : false)
                      }
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                {errors.end_date && (
                  <p className="text-sm text-red-500 mt-1">{errors.end_date}</p>
                )}
              </div>
            </div>

            {startDate && endDate && (
              <div className="p-3 bg-primary/5 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">عدد الأيام</p>
                <p className="text-2xl font-bold text-primary">{calculateDays()} يوم</p>
              </div>
            )}

            {/* Reason */}
            <div>
              <Label>السبب *</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="اذكر سبب الإجازة (10-500 حرف)"
                rows={4}
                maxLength={500}
                className={errors.reason ? "border-red-500" : ""}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.reason && (
                  <p className="text-sm text-red-500">{errors.reason}</p>
                )}
                <p className="text-xs text-muted-foreground mr-auto">{reason.length}/500</p>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full h-12 text-lg font-bold"
            >
              {submitting ? (
                <>
                  <Loader2 className="ml-2 w-5 h-5 animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                "إرسال الطلب"
              )}
            </Button>
          </div>
        </Card>

        {/* Previous Requests */}
        <div>
          <h3 className="text-lg font-bold mb-3">📋 الطلبات السابقة</h3>
          {requests.length === 0 ? (
            <Card className="p-8 text-center">
              <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">لا توجد طلبات سابقة</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <Card key={request.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-bold">{getLeaveTypeName(request.leave_type)}</h4>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(request.start_date), "dd MMM", { locale: ar })} - {format(new Date(request.end_date), "dd MMM yyyy", { locale: ar })}
                      </p>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>

                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">عدد الأيام</span>
                      <span className="font-medium">{request.days} يوم</span>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">السبب:</p>
                      <p className="text-sm">{request.reason}</p>
                    </div>
                    {request.rejection_reason && (
                      <div className="p-2 bg-red-50 rounded border border-red-200">
                        <p className="text-xs text-red-600 font-medium mb-1">سبب الرفض:</p>
                        <p className="text-xs text-red-700">{request.rejection_reason}</p>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveRequest;
