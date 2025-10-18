import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Users as UsersIcon, Search, Plus, Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface User {
  id: string;
  username: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  last_login_at: string | null;
  created_at: string;
}

const Users = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    email: "",
    phone: "",
    password: "",
    role: "employee",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(
        (user) =>
          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching users:", error);
        toast.error("خطأ في تحميل بيانات المستخدمين");
        return;
      }

      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleLabels: Record<string, { label: string; className: string }> = {
      super_admin: { label: "مدير عام", className: "bg-purple-600" },
      hr_admin: { label: "موارد بشرية", className: "bg-blue-600" },
      loc_manager: { label: "مدير موقع", className: "bg-green-600" },
      employee: { label: "موظف", className: "bg-gray-600" },
    };

    const roleInfo = roleLabels[role] || { label: role, className: "bg-gray-600" };
    return <Badge className={roleInfo.className}>{roleInfo.label}</Badge>;
  };

  const isInternalEmail = (email: string | null) => {
    return email?.endsWith("@internal.hader.local") || !email;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username.trim() || !formData.role) {
      toast.error("يرجى إدخال اسم المستخدم والدور على الأقل");
      return;
    }

    if (!editingUser && !formData.password) {
      toast.error("يرجى إدخال كلمة المرور للمستخدم الجديد");
      return;
    }

    try {
      if (editingUser) {
        // Update user
        const updateData: {
          username: string;
          full_name: string | null;
          email: string | null;
          phone: string | null;
          role: string;
        } = {
          username: formData.username,
          full_name: formData.full_name || null,
          email: formData.email || null,
          phone: formData.phone || null,
          role: formData.role,
        };

        const { error } = await supabase
          .from("users")
          .update(updateData)
          .eq("id", editingUser.id);

        if (error) {
          console.error("Error updating user:", error);
          toast.error("خطأ في تحديث المستخدم");
          return;
        }

        toast.success("تم تحديث المستخدم بنجاح");
      } else {
        // Add new user
        const { error } = await supabase.from("users").insert({
          username: formData.username,
          full_name: formData.full_name || null,
          email: formData.email || `${formData.username}@internal.hader.local`,
          phone: formData.phone || null,
          password: formData.password, // In real app, this should be hashed
          role: formData.role,
        });

        if (error) {
          console.error("Error adding user:", error);
          toast.error("خطأ في إضافة المستخدم");
          return;
        }

        toast.success("تم إضافة المستخدم بنجاح");
      }

      setFormData({
        username: "",
        full_name: "",
        email: "",
        phone: "",
        password: "",
        role: "employee",
      });
      setEditingUser(null);
      setIsDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error("Error:", error);
      toast.error("خطأ غير متوقع");
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      full_name: user.full_name || "",
      email: user.email || "",
      phone: user.phone || "",
      password: "",
      role: user.role,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (userId: string, username: string) => {
    if (!confirm(`هل أنت متأكد من حذف المستخدم "${username}"؟\n\nتحذير: سيتم حذف جميع سجلات الحضور والطلبات المرتبطة به!`)) {
      return;
    }

    try {
      const { error } = await supabase.from("users").delete().eq("id", userId);

      if (error) {
        console.error("Error deleting user:", error);
        toast.error("خطأ في حذف المستخدم");
        return;
      }

      toast.success("تم حذف المستخدم بنجاح");
      fetchUsers();
    } catch (error) {
      console.error("Error:", error);
      toast.error("خطأ غير متوقع");
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingUser(null);
    setFormData({
      username: "",
      full_name: "",
      email: "",
      phone: "",
      password: "",
      role: "employee",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-6" dir="rtl">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button
            onClick={() => navigate("/admin/dashboard")}
            variant="outline"
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة
          </Button>
          <div className="flex items-center gap-3">
            <UsersIcon className="w-10 h-10 text-indigo-600" />
            <h1 className="text-4xl font-bold text-gray-800">إدارة المستخدمين</h1>
          </div>
        </div>

        {/* Search and Add */}
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="البحث عن مستخدم..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4" />
                إضافة مستخدم جديد
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl" className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? "تعديل المستخدم" : "إضافة مستخدم جديد"}
                </DialogTitle>
                <DialogDescription>
                  {editingUser
                    ? "قم بتحديث بيانات المستخدم"
                    : "أدخل بيانات المستخدم الجديد"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username">اسم المستخدم *</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      placeholder="مثال: ahmed.ali"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="full_name">الاسم الكامل</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) =>
                        setFormData({ ...formData, full_name: e.target.value })
                      }
                      placeholder="مثال: أحمد علي"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="مثال: ahmed@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">رقم الهاتف</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="مثال: 0501234567"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="role">الدور الوظيفي *</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) =>
                        setFormData({ ...formData, role: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الدور" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="super_admin">مدير عام</SelectItem>
                        <SelectItem value="hr_admin">موارد بشرية</SelectItem>
                        <SelectItem value="loc_manager">مدير موقع</SelectItem>
                        <SelectItem value="employee">موظف</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {!editingUser && (
                    <div>
                      <Label htmlFor="password">كلمة المرور *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        placeholder="••••••••"
                        required={!editingUser}
                      />
                    </div>
                  )}
                </div>

                {!formData.email && (
                  <div className="bg-indigo-50 p-3 rounded-lg">
                    <p className="text-sm text-indigo-800">
                      ملاحظة: في حالة عدم إدخال بريد إلكتروني، سيتم إنشاء بريد داخلي تلقائياً:{" "}
                      <span className="font-bold">
                        {formData.username}@internal.hader.local
                      </span>
                    </p>
                  </div>
                )}

                <div className="flex gap-2 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    إلغاء
                  </Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                    {editingUser ? "تحديث" : "إضافة"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-white">
            <p className="text-sm text-gray-600">إجمالي المستخدمين</p>
            <p className="text-2xl font-bold text-indigo-600">{users.length}</p>
          </Card>
          <Card className="p-4 bg-white">
            <p className="text-sm text-gray-600">المدراء العامون</p>
            <p className="text-2xl font-bold text-purple-600">
              {users.filter((u) => u.role === "super_admin").length}
            </p>
          </Card>
          <Card className="p-4 bg-white">
            <p className="text-sm text-gray-600">الموارد البشرية</p>
            <p className="text-2xl font-bold text-blue-600">
              {users.filter((u) => u.role === "hr_admin").length}
            </p>
          </Card>
          <Card className="p-4 bg-white">
            <p className="text-sm text-gray-600">الموظفين</p>
            <p className="text-2xl font-bold text-green-600">
              {users.filter((u) => u.role === "employee").length}
            </p>
          </Card>
        </div>
      </div>

      {/* Users Table */}
      <div className="max-w-7xl mx-auto">
        <Card className="p-6 bg-white">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">جاري التحميل...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">لا يوجد مستخدمين</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">اسم المستخدم</TableHead>
                    <TableHead className="text-right">الاسم الكامل</TableHead>
                    <TableHead className="text-right">الدور</TableHead>
                    <TableHead className="text-right">البريد الإلكتروني</TableHead>
                    <TableHead className="text-right">رقم الهاتف</TableHead>
                    <TableHead className="text-right">آخر تسجيل دخول</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.full_name || "-"}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        {isInternalEmail(user.email) ? (
                          <span className="text-gray-400 text-sm">بريد داخلي</span>
                        ) : (
                          <span className="text-sm">{user.email}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.phone ? (
                          <span className="text-sm">{user.phone}</span>
                        ) : (
                          <span className="text-gray-400 text-sm">غير مسجل</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.last_login_at ? (
                          <span className="text-sm">
                            {new Date(user.last_login_at).toLocaleDateString("ar-SA")}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">لم يسجل دخول بعد</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit className="w-4 h-4" />
                            تعديل
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-red-600 border-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(user.id, user.username)}
                          >
                            <Trash2 className="w-4 h-4" />
                            حذف
                          </Button>
                        </div>
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

export default Users;
