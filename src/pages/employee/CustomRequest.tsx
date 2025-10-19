import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Send, Paperclip, X, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { getSession } from "@/lib/auth";

interface CustomRequest {
  id: string;
  title: string;
  description: string;
  attachment_url: string | null;
  status: "pending" | "approved" | "rejected";
  response: string | null;
  reviewed_at: string | null;
  created_at: string;
}

const CustomRequest = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requests, setRequests] = useState<CustomRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const session = getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("custom_requests")
        .select("*")
        .eq("employee_id", session.userId)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    const session = getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("custom_requests").insert({
        employee_id: session.userId,
        title: title.trim(),
        description: description.trim(),
        status: "pending",
      });

      if (error) throw error;

      toast.success("تم إرسال الطلب بنجاح");
      setTitle("");
      setDescription("");
      fetchRequests();
    } catch (error) {
      console.error("Error submitting request:", error);
      toast.error("خطأ في إرسال الطلب");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "قيد المراجعة", variant: "secondary" },
      approved: { label: "مقبول", variant: "default" },
      rejected: { label: "مرفوض", variant: "destructive" },
    };

    const config = variants[status] || variants.pending;
    return (
      <Badge variant={config.variant} className="text-xs">
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/employee/dashboard")}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">طلب خاص</h1>
            <p className="text-sm text-gray-600">
              استخدم هذا النموذج لأي طلب خاص (شهادة راتب، تقرير، استفسار، إلخ)
            </p>
          </div>
        </div>

        {/* New Request Form */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              طلب جديد
            </CardTitle>
            <CardDescription>املأ النموذج أدناه لإرسال طلبك</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  عنوان الطلب <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="مثال: طلب شهادة راتب"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الوصف <span className="text-red-500">*</span>
                </label>
                <Textarea
                  placeholder="اكتب تفاصيل طلبك هنا..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={6}
                  className="w-full resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>جارٍ الإرسال...</>
                ) : (
                  <>
                    <Send className="h-4 w-4 ml-2" />
                    إرسال الطلب
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Previous Requests */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              طلباتك السابقة
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">جارٍ التحميل...</div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">لا توجد طلبات سابقة</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{request.title}</h3>
                      {getStatusBadge(request.status)}
                    </div>

                    <p className="text-sm text-gray-600 mb-3 whitespace-pre-wrap">
                      {request.description}
                    </p>

                    <div className="text-xs text-gray-500 mb-3">
                      {formatDate(request.created_at)}
                    </div>

                    {request.response && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-900">
                            الرد من الإدارة:
                          </span>
                        </div>
                        <p className="text-sm text-green-800 whitespace-pre-wrap">
                          {request.response}
                        </p>
                        {request.reviewed_at && (
                          <p className="text-xs text-green-600 mt-2">
                            {formatDate(request.reviewed_at)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomRequest;
