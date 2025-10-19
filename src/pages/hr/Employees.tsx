import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Search, UserPlus, Mail, Phone, Edit } from "lucide-react";
import { toast } from "sonner";

interface Employee {
  user_id: string; // This is the PRIMARY KEY in employees table
  employee_number: string;
  department: string;
  position: string;
  users: {
    username: string;
    full_name: string;
    email: string | null;
    phone: string | null;
  };
}

const Employees = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredEmployees(employees);
    } else {
      const filtered = employees.filter(
        (emp) =>
          emp.employee_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.users.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.users.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.position.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEmployees(filtered);
    }
  }, [searchTerm, employees]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("employees")
        .select(`
          user_id,
          employee_number,
          department,
          position,
          users (
            username,
            full_name,
            email,
            phone
          )
        `)
        .order("employee_number", { ascending: true });

      if (error) {
        console.error("Error fetching employees:", error);
        toast.error("خطأ في تحميل بيانات الموظفين");
        return;
      }

      setEmployees(data || []);
      setFilteredEmployees(data || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  const isInternalEmail = (email: string | null) => {
    return email?.endsWith("@internal.hader.local") || !email;
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
          <h1 className="text-4xl font-bold text-gray-800">إدارة الموظفين</h1>
        </div>

        {/* Search and Actions */}
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="البحث عن موظف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
          <Button
            onClick={() => navigate("/hr/employees/add")}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            <UserPlus className="w-4 h-4" />
            إضافة موظف جديد
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-white">
            <p className="text-sm text-gray-600">إجمالي الموظفين</p>
            <p className="text-2xl font-bold text-gray-800">{employees.length}</p>
          </Card>
          <Card className="p-4 bg-white">
            <p className="text-sm text-gray-600">الأقسام</p>
            <p className="text-2xl font-bold text-gray-800">
              {new Set(employees.map((e) => e.department)).size}
            </p>
          </Card>
          <Card className="p-4 bg-white">
            <p className="text-sm text-gray-600">نتائج البحث</p>
            <p className="text-2xl font-bold text-gray-800">{filteredEmployees.length}</p>
          </Card>
        </div>
      </div>

      {/* Employees Table */}
      <div className="max-w-7xl mx-auto">
        <Card className="p-6 bg-white">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">جاري التحميل...</p>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">لا يوجد موظفين</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">رقم الموظف</TableHead>
                    <TableHead className="text-right">اسم المستخدم</TableHead>
                    <TableHead className="text-right">الاسم الكامل</TableHead>
                    <TableHead className="text-right">القسم</TableHead>
                    <TableHead className="text-right">المسمى الوظيفي</TableHead>
                    <TableHead className="text-right">البريد الإلكتروني</TableHead>
                    <TableHead className="text-right">رقم الهاتف</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.user_id}>
                      <TableCell className="font-medium">
                        {employee.employee_number}
                      </TableCell>
                      <TableCell>{employee.users.username}</TableCell>
                      <TableCell>{employee.users.full_name || "-"}</TableCell>
                      <TableCell>{employee.department}</TableCell>
                      <TableCell>{employee.position}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {isInternalEmail(employee.users.email) ? (
                            <span className="text-gray-400 text-sm">غير مسجل</span>
                          ) : (
                            <span className="text-sm">{employee.users.email}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {employee.users.phone ? (
                            <span className="text-sm">{employee.users.phone}</span>
                          ) : (
                            <span className="text-gray-400 text-sm">غير مسجل</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/hr/employees/${employee.user_id}/edit`)}
                          >
                            <Edit className="w-4 h-4 ml-1" />
                            تعديل
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

export default Employees;
