import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Database, RefreshCw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface User {
  id: string;
  username: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  password: string;
  created_at: string;
  last_login_at: string | null;
}

const DatabaseViewer = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching users:", error);
        toast.error("خطأ في جلب بيانات المستخدمين");
        return;
      }

      setUsers(data || []);
      toast.success(`تم جلب ${data?.length || 0} مستخدم بنجاح`);
    } catch (error) {
      console.error("Error:", error);
      toast.error("خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleColors: Record<string, string> = {
      super_admin: "bg-purple-600",
      hr_admin: "bg-blue-600",
      loc_manager: "bg-cyan-600",
      employee: "bg-green-600",
    };

    const roleLabels: Record<string, string> = {
      super_admin: "مدير عام",
      hr_admin: "موارد بشرية",
      loc_manager: "مدير موقع",
      employee: "موظف",
    };

    return (
      <Badge className={roleColors[role] || "bg-gray-600"}>
        {roleLabels[role] || role}
      </Badge>
    );
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`تم نسخ ${label}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6" dir="rtl">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate("/admin/dashboard")}
              variant="outline"
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              العودة
            </Button>
            <div className="flex items-center gap-3">
              <Database className="w-10 h-10 text-slate-600" />
              <div>
                <h1 className="text-4xl font-bold text-gray-800">
                  عرض بيانات المستخدمين
                </h1>
                <p className="text-gray-600">جميع المستخدمين في قاعدة البيانات</p>
              </div>
            </div>
          </div>

          <Button
            onClick={fetchAllUsers}
            className="gap-2 bg-slate-600 hover:bg-slate-700"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            تحديث
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="p-6 bg-white">
            <p className="text-sm text-gray-600 mb-1">إجمالي المستخدمين</p>
            <p className="text-3xl font-bold text-gray-800">{users.length}</p>
          </Card>
          <Card className="p-6 bg-white">
            <p className="text-sm text-gray-600 mb-1">المدراء العامون</p>
            <p className="text-3xl font-bold text-purple-600">
              {users.filter((u) => u.role === "super_admin").length}
            </p>
          </Card>
          <Card className="p-6 bg-white">
            <p className="text-sm text-gray-600 mb-1">الموارد البشرية</p>
            <p className="text-3xl font-bold text-blue-600">
              {users.filter((u) => u.role === "hr_admin").length}
            </p>
          </Card>
          <Card className="p-6 bg-white">
            <p className="text-sm text-gray-600 mb-1">الموظفون</p>
            <p className="text-3xl font-bold text-green-600">
              {users.filter((u) => u.role === "employee").length}
            </p>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="p-6 bg-white">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            جدول المستخدمين الكامل
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">جاري التحميل...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">لا يوجد مستخدمون في قاعدة البيانات</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">ID</TableHead>
                    <TableHead className="text-right">اسم المستخدم</TableHead>
                    <TableHead className="text-right">الاسم الكامل</TableHead>
                    <TableHead className="text-right">البريد الإلكتروني</TableHead>
                    <TableHead className="text-right">الهاتف</TableHead>
                    <TableHead className="text-right">الدور</TableHead>
                    <TableHead className="text-right">كلمة المرور</TableHead>
                    <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                    <TableHead className="text-right">آخر دخول</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-xs">
                        <button
                          onClick={() => copyToClipboard(user.id, "ID")}
                          className="hover:text-blue-600 cursor-pointer"
                          title="انقر للنسخ"
                        >
                          {user.id.substring(0, 8)}...
                        </button>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {user.username}
                      </TableCell>
                      <TableCell>{user.full_name || "-"}</TableCell>
                      <TableCell>
                        {user.email ? (
                          <button
                            onClick={() => copyToClipboard(user.email!, "البريد")}
                            className="hover:text-blue-600 cursor-pointer text-sm"
                            title="انقر للنسخ"
                          >
                            {user.email}
                          </button>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.phone || <span className="text-gray-400">-</span>}
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        <button
                          onClick={() =>
                            copyToClipboard(user.password, "كلمة المرور")
                          }
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded font-mono text-sm cursor-pointer"
                          title="انقر للنسخ"
                        >
                          {user.password}
                        </button>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(user.created_at).toLocaleDateString("ar-SA", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-sm">
                        {user.last_login_at ? (
                          new Date(user.last_login_at).toLocaleDateString(
                            "ar-SA",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )
                        ) : (
                          <span className="text-gray-400">لم يسجل دخول</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        {/* Raw JSON View */}
        <Card className="p-6 bg-white mt-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            البيانات بصيغة JSON
          </h2>
          <div className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto">
            <pre className="text-sm" dir="ltr">
              {JSON.stringify(users, null, 2)}
            </pre>
          </div>
          <Button
            onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(users, null, 2));
              toast.success("تم نسخ JSON إلى الحافظة");
            }}
            className="mt-4"
            variant="outline"
          >
            نسخ JSON
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default DatabaseViewer;
