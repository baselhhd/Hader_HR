import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, UserPlus, Save } from "lucide-react";
import { toast } from "sonner";
import { getSession } from "@/lib/auth";

interface Branch {
  id: string;
  name: string;
}

interface Location {
  id: string;
  name: string;
  branch_id: string;
}

interface Shift {
  id: string;
  name: string;
  location_id: string;
}

const AddEmployee = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  // Form state
  const [fullName, setFullName] = useState("");
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [branchId, setBranchId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [hireDate, setHireDate] = useState("");
  const [shiftId, setShiftId] = useState("");
  const [vacationBalance, setVacationBalance] = useState("21");
  const [sickLeaveBalance, setSickLeaveBalance] = useState("10");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Data state
  const [branches, setBranches] = useState<Branch[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [filteredShifts, setFilteredShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyId, setCompanyId] = useState("");

  useEffect(() => {
    const session = getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    // Get company_id from user session
    const fetchUserCompany = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("company_id, branch_id")
        .eq("id", session.userId)
        .single();

      if (error) {
        console.error("Error fetching user company:", error);
        return;
      }

      if (data) {
        setCompanyId(data.company_id);
        fetchBranches(data.company_id);
        fetchLocations(data.company_id);
        fetchShifts();
      }
    };

    fetchUserCompany();

    if (isEditMode && id) {
      fetchEmployeeData(id);
    }
  }, [id, isEditMode]);

  useEffect(() => {
    if (branchId) {
      const filtered = locations.filter((loc) => loc.branch_id === branchId);
      setFilteredLocations(filtered);
    } else {
      setFilteredLocations([]);
    }
  }, [branchId, locations]);

  useEffect(() => {
    if (locationId) {
      const filtered = shifts.filter((shift) => shift.location_id === locationId);
      setFilteredShifts(filtered);
    } else {
      setFilteredShifts([]);
    }
  }, [locationId, shifts]);

  const fetchBranches = async (compId: string) => {
    const { data, error } = await supabase
      .from("branches")
      .select("id, name")
      .eq("company_id", compId)
      .eq("is_active", true)
      .order("name");

    if (error) {
      console.error("Error fetching branches:", error);
      return;
    }

    setBranches(data || []);
  };

  const fetchLocations = async (compId: string) => {
    const { data, error } = await supabase
      .from("locations")
      .select("id, name, branch_id")
      .eq("company_id", compId)
      .eq("is_active", true)
      .order("name");

    if (error) {
      console.error("Error fetching locations:", error);
      return;
    }

    setLocations(data || []);
  };

  const fetchShifts = async () => {
    const { data, error } = await supabase
      .from("shifts")
      .select("id, name, location_id")
      .eq("is_active", true)
      .order("name");

    if (error) {
      console.error("Error fetching shifts:", error);
      return;
    }

    setShifts(data || []);
  };

  const fetchEmployeeData = async (employeeId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("employees")
        .select(`
          *,
          users (
            full_name,
            username,
            email,
            phone,
            branch_id,
            is_active
          )
        `)
        .eq("user_id", employeeId)
        .single();

      if (error) throw error;

      if (data && data.users) {
        setFullName(data.users.full_name || "");
        setEmployeeNumber(data.employee_number || "");
        setPhone(data.users.phone || "");
        setEmail(data.users.email || "");
        setBranchId(data.users.branch_id || "");
        setLocationId(data.location_id || "");
        setDepartment(data.department || "");
        setPosition(data.position || "");
        setHireDate(data.hire_date || "");
        setShiftId(data.shift_id || "");
        setVacationBalance(data.vacation_balance?.toString() || "21");
        setSickLeaveBalance(data.sick_leave_balance?.toString() || "10");
        setUsername(data.users.username || "");
        setIsActive(data.users.is_active ?? true);
      }
    } catch (error) {
      console.error("Error fetching employee:", error);
      toast.error("خطأ في تحميل بيانات الموظف");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!fullName.trim()) {
      toast.error("يرجى إدخال الاسم الكامل");
      return false;
    }

    if (!employeeNumber.trim()) {
      toast.error("يرجى إدخال الرقم الوظيفي");
      return false;
    }

    if (!phone.trim()) {
      toast.error("يرجى إدخال رقم الجوال");
      return false;
    }

    if (!branchId) {
      toast.error("يرجى اختيار الفرع");
      return false;
    }

    if (!locationId) {
      toast.error("يرجى اختيار الموقع");
      return false;
    }

    if (!shiftId) {
      toast.error("يرجى اختيار الوردية");
      return false;
    }

    if (!hireDate) {
      toast.error("يرجى إدخال تاريخ التعيين");
      return false;
    }

    if (!isEditMode) {
      if (!username.trim()) {
        toast.error("يرجى إدخال اسم المستخدم");
        return false;
      }

      if (!password || password.length < 8) {
        toast.error("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (isEditMode && id) {
        // Update existing employee
        await updateEmployee(id);
      } else {
        // Create new employee
        await createEmployee();
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("حدث خطأ أثناء حفظ البيانات");
    } finally {
      setIsSubmitting(false);
    }
  };

  const createEmployee = async () => {
    // Generate internal email
    const internalEmail = email.trim() || `${username}@internal.hader.local`;

    // Step 1: Create user (simulating auth without Supabase Auth)
    const userId = crypto.randomUUID();

    const { error: userError } = await supabase.from("users").insert({
      id: userId,
      company_id: companyId,
      branch_id: branchId,
      username: username.trim(),
      email: internalEmail,
      phone: phone.trim(),
      full_name: fullName.trim(),
      role: "employee",
      is_active: isActive,
    });

    if (userError) {
      console.error("Error creating user:", userError);
      throw new Error("فشل إنشاء حساب المستخدم");
    }

    // Step 2: Create employee record
    const { error: employeeError } = await supabase.from("employees").insert({
      user_id: userId,
      employee_number: employeeNumber.trim(),
      location_id: locationId,
      department: department.trim() || null,
      position: position.trim() || null,
      hire_date: hireDate,
      shift_id: shiftId,
      vacation_balance: parseInt(vacationBalance),
      sick_leave_balance: parseInt(sickLeaveBalance),
      is_active: isActive,
    });

    if (employeeError) {
      // Rollback: delete user
      await supabase.from("users").delete().eq("id", userId);
      console.error("Error creating employee:", employeeError);
      throw new Error("فشل إنشاء سجل الموظف");
    }

    toast.success("تم إضافة الموظف بنجاح");
    navigate("/hr/employees");
  };

  const updateEmployee = async (employeeUserId: string) => {
    // Update user record
    const updateEmail = email.trim() || `${username}@internal.hader.local`;

    const { error: userError } = await supabase
      .from("users")
      .update({
        full_name: fullName.trim(),
        email: updateEmail,
        phone: phone.trim(),
        branch_id: branchId,
        is_active: isActive,
      })
      .eq("id", employeeUserId);

    if (userError) {
      console.error("Error updating user:", userError);
      throw new Error("فشل تحديث بيانات المستخدم");
    }

    // Update employee record
    const { error: employeeError } = await supabase
      .from("employees")
      .update({
        employee_number: employeeNumber.trim(),
        location_id: locationId,
        department: department.trim() || null,
        position: position.trim() || null,
        hire_date: hireDate,
        shift_id: shiftId,
        vacation_balance: parseInt(vacationBalance),
        sick_leave_balance: parseInt(sickLeaveBalance),
        is_active: isActive,
      })
      .eq("user_id", employeeUserId);

    if (employeeError) {
      console.error("Error updating employee:", employeeError);
      throw new Error("فشل تحديث سجل الموظف");
    }

    toast.success("تم تحديث بيانات الموظف بنجاح");
    navigate("/hr/employees");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-4 flex items-center justify-center">
        <p className="text-gray-600">جارٍ التحميل...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/hr/employees")}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditMode ? "تعديل بيانات موظف" : "إضافة موظف جديد"}
            </h1>
            <p className="text-sm text-gray-600">
              {isEditMode
                ? "قم بتحديث بيانات الموظف"
                : "املأ النموذج أدناه لإضافة موظف جديد"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>البيانات الشخصية</CardTitle>
              <CardDescription>المعلومات الأساسية للموظف</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">
                    الاسم الكامل <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="أحمد محمد السعيد"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="employeeNumber">
                    الرقم الوظيفي <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="employeeNumber"
                    type="text"
                    value={employeeNumber}
                    onChange={(e) => setEmployeeNumber(e.target.value)}
                    placeholder="EMP001"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">
                    رقم الجوال <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0501234567"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">البريد الإلكتروني (اختياري)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ahmad@company.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work Information */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>بيانات العمل</CardTitle>
              <CardDescription>معلومات الموقع والوردية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="branch">
                    الفرع <span className="text-red-500">*</span>
                  </Label>
                  <Select value={branchId} onValueChange={setBranchId}>
                    <SelectTrigger id="branch">
                      <SelectValue placeholder="اختر الفرع" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="location">
                    الموقع <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={locationId}
                    onValueChange={setLocationId}
                    disabled={!branchId}
                  >
                    <SelectTrigger id="location">
                      <SelectValue placeholder="اختر الموقع" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredLocations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="department">القسم (اختياري)</Label>
                  <Input
                    id="department"
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="المبيعات"
                  />
                </div>

                <div>
                  <Label htmlFor="position">المسمى الوظيفي (اختياري)</Label>
                  <Input
                    id="position"
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="موظف مبيعات"
                  />
                </div>

                <div>
                  <Label htmlFor="hireDate">
                    تاريخ التعيين <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="hireDate"
                    type="date"
                    value={hireDate}
                    onChange={(e) => setHireDate(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="shift">
                    الوردية <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={shiftId}
                    onValueChange={setShiftId}
                    disabled={!locationId}
                  >
                    <SelectTrigger id="shift">
                      <SelectValue placeholder="اختر الوردية" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredShifts.map((shift) => (
                        <SelectItem key={shift.id} value={shift.id}>
                          {shift.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leave Balances */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>أرصدة الإجازات</CardTitle>
              <CardDescription>رصيد الإجازات السنوية والمرضية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vacationBalance">
                    رصيد الإجازات السنوية (أيام)
                  </Label>
                  <Input
                    id="vacationBalance"
                    type="number"
                    value={vacationBalance}
                    onChange={(e) => setVacationBalance(e.target.value)}
                    min="0"
                  />
                </div>

                <div>
                  <Label htmlFor="sickLeaveBalance">
                    رصيد الإجازات المرضية (أيام)
                  </Label>
                  <Input
                    id="sickLeaveBalance"
                    type="number"
                    value={sickLeaveBalance}
                    onChange={(e) => setSickLeaveBalance(e.target.value)}
                    min="0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Data (Add mode only) */}
          {!isEditMode && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>بيانات الحساب</CardTitle>
                <CardDescription>
                  سيتم إنشاء حساب جديد للموظف بهذه البيانات
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username">
                      اسم المستخدم <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="ahmad_sales"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="password">
                      كلمة المرور <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="8 أحرف على الأقل"
                      required
                      minLength={8}
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  💡 ملاحظة: يمكنك إرسال بيانات الدخول للموظف عبر رقم الجوال
                </p>
              </CardContent>
            </Card>
          )}

          {/* Status */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>الحالة</CardTitle>
              <CardDescription>تفعيل أو تعطيل حساب الموظف</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">حساب نشط</Label>
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/hr/employees")}
              className="flex-1"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>جارٍ الحفظ...</>
              ) : (
                <>
                  {isEditMode ? <Save className="h-4 w-4 ml-2" /> : <UserPlus className="h-4 w-4 ml-2" />}
                  {isEditMode ? "حفظ التغييرات" : "إضافة الموظف"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployee;
