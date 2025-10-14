import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowRight, CheckCircle, XCircle, AlertTriangle, MapPin, Clock, User } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface VerificationRequest {
  id: string;
  suspicious_score: number;
  suspicious_reasons: any;
  status: string;
  expires_at: string;
  created_at: string;
  attendance_record_id: string;
  employee_id: string;
  attendance_records?: {
    check_in: string;
    gps_lat: number;
    gps_lng: number;
    gps_distance: number;
    selfie_url: string;
    method_used: string;
    location_id: string;
  };
  users?: {
    full_name: string;
    avatar_url: string;
  };
  employee?: {
    employee_number: string;
    department: string;
    position: string;
  };
}

const VerificationRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);

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

    if (userData?.role !== "loc_manager") {
      toast.error("غير مصرح لك بالدخول");
      navigate("/login");
      return;
    }

    await loadRequests(session.user.id);
  };

  const loadRequests = async (userId: string) => {
    try {
      setLoading(true);

      // Get manager's location
      const { data: managerData } = await supabase
        .from("location_managers")
        .select("location_id")
        .eq("user_id", userId)
        .single();

      if (!managerData) {
        toast.error("لم يتم العثور على الموقع المخصص لك");
        return;
      }

      // Get pending verification requests for this location
      const { data, error } = await supabase
        .from("verification_requests")
        .select(`
          *,
          attendance_records (
            check_in,
            gps_lat,
            gps_lng,
            gps_distance,
            selfie_url,
            method_used,
            location_id
          ),
          users!verification_requests_employee_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq("status", "pending")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get location IDs for filtering
      const locationIds = [managerData.location_id];
      
      // Filter by location
      const filteredData = (data || []).filter((req: any) => {
        return locationIds.includes(req.attendance_records?.location_id);
      });

      // Get employee details for filtered requests
      const employeeIds = filteredData.map((req: any) => req.employee_id);
      
      const { data: employeeData } = await supabase
        .from("employees")
        .select("user_id, employee_number, department, position")
        .in("user_id", employeeIds);

      // Merge employee data
      const enrichedData = filteredData.map((req: any) => ({
        ...req,
        employee: employeeData?.find((emp: any) => emp.user_id === req.employee_id)
      }));

      setRequests(enrichedData);
    } catch (error) {
      console.error("Error loading requests:", error);
      toast.error("حدث خطأ في تحميل الطلبات");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedRequest || !actionType) return;

    setProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Update verification request
      const { error: vrError } = await supabase
        .from("verification_requests")
        .update({
          status: actionType === "approve" ? "approved" : "rejected",
          resolved_at: new Date().toISOString(),
          resolution_notes: notes || null,
          manager_id: session.user.id,
        })
        .eq("id", selectedRequest.id);

      if (vrError) throw vrError;

      if (actionType === "approve") {
        // Update attendance record to approved
        const { error: arError } = await supabase
          .from("attendance_records")
          .update({
            status: "approved",
            verified_by: session.user.id,
            verified_at: new Date().toISOString(),
            notes: notes || null,
          })
          .eq("id", selectedRequest.attendance_record_id);

        if (arError) throw arError;

        toast.success("تم تأكيد الحضور بنجاح");
      } else {
        // Delete attendance record if rejected
        const { error: deleteError } = await supabase
          .from("attendance_records")
          .delete()
          .eq("id", selectedRequest.attendance_record_id);

        if (deleteError) throw deleteError;

        toast.success("تم رفض الحضور");
      }

      // Reload requests
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession) {
        await loadRequests(currentSession.user.id);
      }

      // Close dialog
      setSelectedRequest(null);
      setActionType(null);
      setNotes("");
    } catch (error) {
      console.error("Error processing request:", error);
      toast.error("حدث خطأ أثناء معالجة الطلب");
    } finally {
      setProcessing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "bg-red-100 text-red-700 border-red-500";
    if (score >= 50) return "bg-amber-100 text-amber-700 border-amber-500";
    return "bg-yellow-100 text-yellow-700 border-yellow-500";
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
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-warning p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/manager/dashboard")}
            className="text-white hover:bg-white/10"
          >
            <ArrowRight className="ml-2" />
            رجوع
          </Button>
          <h1 className="text-2xl font-bold text-white">طلبات التحقق</h1>
        </div>

        {requests.length === 0 ? (
          <Card className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">لا توجد طلبات تحقق معلقة</p>
            <p className="text-gray-500 text-sm mt-2">جميع الطلبات تمت معالجتها</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <Card key={request.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-warning flex items-center justify-center text-white font-bold text-xl">
                      {request.users?.full_name?.charAt(0) || "؟"}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {request.users?.full_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {request.employee?.employee_number} - {request.employee?.position}
                      </p>
                      <p className="text-xs text-gray-500">
                        {request.employee?.department}
                      </p>
                    </div>
                  </div>
                  <Badge className={`${getScoreColor(request.suspicious_score)} border px-3 py-1`}>
                    <AlertTriangle className="w-4 h-4 ml-1" />
                    {request.suspicious_score} نقطة
                  </Badge>
                </div>

                {/* Attendance Details */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Clock className="w-4 h-4" />
                    <span>
                      {request.attendance_records?.check_in
                        ? format(new Date(request.attendance_records.check_in), "dd MMMM yyyy • hh:mm a", { locale: ar })
                        : "غير محدد"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <MapPin className="w-4 h-4" />
                    <span>
                      المسافة: {request.attendance_records?.gps_distance || 0}م
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <User className="w-4 h-4" />
                    <span>
                      الطريقة: {request.attendance_records?.method_used === "qr" ? "QR" : 
                                 request.attendance_records?.method_used === "color" ? "اللون" : "الكود"}
                    </span>
                  </div>
                </div>

                {/* Suspicious Reasons */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">أسباب الشك:</h4>
                  <div className="space-y-1">
                    {Array.isArray(request.suspicious_reasons) && request.suspicious_reasons.map((reason: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-amber-500">•</span>
                        <span>{reason.text} ({reason.points} نقطة)</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setSelectedRequest(request);
                      setActionType("approve");
                    }}
                    className="flex-1 bg-green-500 hover:bg-green-600"
                  >
                    <CheckCircle className="ml-2 w-4 h-4" />
                    موافقة
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedRequest(request);
                      setActionType("reject");
                    }}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="ml-2 w-4 h-4" />
                    رفض
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={!!selectedRequest && !!actionType} onOpenChange={() => {
        setSelectedRequest(null);
        setActionType(null);
        setNotes("");
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "تأكيد الحضور" : "رفض الحضور"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              {actionType === "approve"
                ? "هل أنت متأكد من تأكيد حضور الموظف؟"
                : "هل أنت متأكد من رفض حضور الموظف؟ سيتم حذف سجل الحضور."}
            </p>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                ملاحظات (اختياري)
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أضف ملاحظاتك هنا..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedRequest(null);
                setActionType(null);
                setNotes("");
              }}
              disabled={processing}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleAction}
              disabled={processing}
              className={actionType === "approve" ? "bg-green-500 hover:bg-green-600" : ""}
              variant={actionType === "reject" ? "destructive" : "default"}
            >
              {processing ? "جاري المعالجة..." : actionType === "approve" ? "تأكيد" : "رفض"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VerificationRequests;
