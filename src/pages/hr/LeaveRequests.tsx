import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Check, X, Clock, FileText } from "lucide-react";
import { toast } from "sonner";

interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  employees: {
    employee_number: string;
    users: {
      username: string;
      full_name: string;
    };
  };
}

const LeaveRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("leave_requests")
        .select(`
          id,
          employee_id,
          leave_type,
          start_date,
          end_date,
          reason,
          status,
          created_at,
          employees (
            employee_number,
            users (
              username,
              full_name
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching leave requests:", error);
        toast.error("خطأ في تحميل طلبات الإجازات");
        return;
      }

      setRequests(data || []);
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("leave_requests")
        .update({ status: "approved" })
        .eq("id", requestId);

      if (error) {
        console.error("Error approving request:", error);
        toast.error("خطأ في الموافقة على الطلب");
        return;
      }

      toast.success("تم الموافقة على الطلب بنجاح");
      fetchLeaveRequests();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("خطأ غير متوقع");
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("leave_requests")
        .update({ status: "rejected" })
        .eq("id", requestId);

      if (error) {
        console.error("Error rejecting request:", error);
        toast.error("خطأ في رفض الطلب");
        return;
      }

      toast.success("تم رفض الطلب");
      fetchLeaveRequests();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("خطأ غير متوقع");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-orange-500">معلق</Badge>;
      case "approved":
        return <Badge className="bg-green-500">موافق عليه</Badge>;
      case "rejected":
        return <Badge className="bg-red-500">مرفوض</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getLeaveTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      annual: "إجازة سنوية",
      sick: "إجازة مرضية",
      emergency: "إجازة طارئة",
      unpaid: "إجازة بدون راتب",
    };
    return types[type] || type;
  };

  const filteredRequests = requests.filter((req) => {
    if (filter === "all") return true;
    return req.status === filter;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6" dir="rtl">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button
            onClick={() => navigate("/hr/dashboard")}
            variant="outline"
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة
          </Button>
          <h1 className="text-4xl font-bold text-gray-800">إدارة طلبات الإجازات</h1>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            الكل ({stats.total})
          </Button>
          <Button
            variant={filter === "pending" ? "default" : "outline"}
            onClick={() => setFilter("pending")}
            className={filter === "pending" ? "" : "border-orange-500 text-orange-600"}
          >
            معلق ({stats.pending})
          </Button>
          <Button
            variant={filter === "approved" ? "default" : "outline"}
            onClick={() => setFilter("approved")}
            className={filter === "approved" ? "" : "border-green-500 text-green-600"}
          >
            موافق عليه ({stats.approved})
          </Button>
          <Button
            variant={filter === "rejected" ? "default" : "outline"}
            onClick={() => setFilter("rejected")}
            className={filter === "rejected" ? "" : "border-red-500 text-red-600"}
          >
            مرفوض ({stats.rejected})
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-white">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">إجمالي الطلبات</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-white border-orange-200">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">معلق</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-white border-green-200">
            <div className="flex items-center gap-3">
              <Check className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">موافق عليه</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-white border-red-200">
            <div className="flex items-center gap-3">
              <X className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">مرفوض</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Requests Table */}
      <div className="max-w-7xl mx-auto">
        <Card className="p-6 bg-white">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">جاري التحميل...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">لا توجد طلبات</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">رقم الموظف</TableHead>
                    <TableHead className="text-right">الاسم</TableHead>
                    <TableHead className="text-right">نوع الإجازة</TableHead>
                    <TableHead className="text-right">من</TableHead>
                    <TableHead className="text-right">إلى</TableHead>
                    <TableHead className="text-right">السبب</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">
                        {request.employees.employee_number}
                      </TableCell>
                      <TableCell>
                        {request.employees.users.full_name || request.employees.users.username}
                      </TableCell>
                      <TableCell>{getLeaveTypeLabel(request.leave_type)}</TableCell>
                      <TableCell>
                        {new Date(request.start_date).toLocaleDateString("ar-SA")}
                      </TableCell>
                      <TableCell>
                        {new Date(request.end_date).toLocaleDateString("ar-SA")}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{request.reason}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        {request.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => handleApprove(request.id)}
                            >
                              <Check className="w-4 h-4 ml-1" />
                              موافقة
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() => handleReject(request.id)}
                            >
                              <X className="w-4 h-4 ml-1" />
                              رفض
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default LeaveRequests;
