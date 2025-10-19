import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, FileText, CheckCircle, XCircle, MessageSquare, User } from "lucide-react";
import { toast } from "sonner";
import { getSession } from "@/lib/auth";

interface CustomRequest {
  id: string;
  employee_id: string;
  title: string;
  description: string;
  attachment_url: string | null;
  status: "pending" | "approved" | "rejected";
  response: string | null;
  reviewed_at: string | null;
  created_at: string;
  employees: {
    employee_number: string;
    user_id: string;
    users: {
      full_name: string;
      phone: string | null;
    };
  };
}

type FilterStatus = "all" | "pending" | "approved" | "rejected";

const CustomRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<CustomRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<CustomRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [selectedRequest, setSelectedRequest] = useState<CustomRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    if (filter === "all") {
      setFilteredRequests(requests);
    } else {
      setFilteredRequests(requests.filter((req) => req.status === filter));
    }
  }, [filter, requests]);

  const fetchRequests = async () => {
    const session = getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("custom_requests")
        .select(`
          *,
          employees!inner (
            employee_number,
            user_id,
            users!inner (
              full_name,
              phone
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.error("خطأ في تحميل الطلبات");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (request: CustomRequest, action: "approve" | "reject") => {
    setSelectedRequest(request);
    setResponseText("");
    setIsDialogOpen(true);
  };

  const handleSubmitReview = async (action: "approve" | "reject") => {
    if (!selectedRequest) return;

    if (!responseText.trim()) {
      toast.error("يرجى كتابة رد على الطلب");
      return;
    }

    const session = getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("custom_requests")
        .update({
          status: action === "approve" ? "approved" : "rejected",
          response: responseText.trim(),
          reviewed_by: session.userId,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", selectedRequest.id);

      if (error) throw error;

      toast.success(
        action === "approve"
          ? "تمت الموافقة على الطلب بنجاح"
          : "تم رفض الطلب بنجاح"
      );
      setIsDialogOpen(false);
      setSelectedRequest(null);
      setResponseText("");
      fetchRequests();
    } catch (error) {
      console.error("Error reviewing request:", error);
      toast.error("خطأ في معالجة الطلب");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      pending: { label: "قيد المراجعة", className: "bg-yellow-100 text-yellow-800" },
      approved: { label: "مقبول", className: "bg-green-100 text-green-800" },
      rejected: { label: "مرفوض", className: "bg-red-100 text-red-800" },
    };

    const config = variants[status] || variants.pending;
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusCount = (status: FilterStatus) => {
    if (status === "all") return requests.length;
    return requests.filter((req) => req.status === status).length;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/hr/dashboard")}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">الطلبات الخاصة</h1>
            <p className="text-sm text-gray-600">
              استقبال ومراجعة طلبات الموظفين الخاصة
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            className="gap-2"
          >
            الكل ({getStatusCount("all")})
          </Button>
          <Button
            variant={filter === "pending" ? "default" : "outline"}
            onClick={() => setFilter("pending")}
            className="gap-2"
          >
            قيد المراجعة ({getStatusCount("pending")})
          </Button>
          <Button
            variant={filter === "approved" ? "default" : "outline"}
            onClick={() => setFilter("approved")}
            className="gap-2"
          >
            مقبول ({getStatusCount("approved")})
          </Button>
          <Button
            variant={filter === "rejected" ? "default" : "outline"}
            onClick={() => setFilter("rejected")}
            className="gap-2"
          >
            مرفوض ({getStatusCount("rejected")})
          </Button>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                جارٍ التحميل...
              </CardContent>
            </Card>
          ) : filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">لا توجد طلبات</p>
              </CardContent>
            </Card>
          ) : (
            filteredRequests.map((request) => (
              <Card key={request.id} className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <User className="h-5 w-5 text-purple-600" />
                        <div>
                          <p className="font-semibold text-gray-900">
                            {request.employees.users.full_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            #{request.employees.employee_number}
                          </p>
                        </div>
                      </div>
                      <CardTitle className="text-lg">{request.title}</CardTitle>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {request.description}
                      </p>
                    </div>

                    <div className="text-xs text-gray-500">
                      تاريخ الطلب: {formatDate(request.created_at)}
                    </div>

                    {request.response && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900">
                            الرد المُرسل:
                          </span>
                        </div>
                        <p className="text-sm text-blue-800 whitespace-pre-wrap">
                          {request.response}
                        </p>
                        {request.reviewed_at && (
                          <p className="text-xs text-blue-600 mt-2">
                            {formatDate(request.reviewed_at)}
                          </p>
                        )}
                      </div>
                    )}

                    {request.status === "pending" && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => handleOpenDialog(request, "approve")}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 ml-2" />
                          قبول
                        </Button>
                        <Button
                          onClick={() => handleOpenDialog(request, "reject")}
                          variant="destructive"
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 ml-2" />
                          رفض
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Response Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {selectedRequest?.status === "pending" ? "الرد على الطلب" : "تعديل الرد"}
              </DialogTitle>
              <DialogDescription>
                اكتب ردك على طلب {selectedRequest?.employees.users.full_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">
                  {selectedRequest?.title}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedRequest?.description}
                </p>
              </div>
              <Textarea
                placeholder="اكتب ردك هنا..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                إلغاء
              </Button>
              <Button
                onClick={() => handleSubmitReview("approve")}
                disabled={isSubmitting || !responseText.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 ml-2" />
                قبول وإرسال
              </Button>
              <Button
                onClick={() => handleSubmitReview("reject")}
                disabled={isSubmitting || !responseText.trim()}
                variant="destructive"
              >
                <XCircle className="h-4 w-4 ml-2" />
                رفض وإرسال
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CustomRequests;
