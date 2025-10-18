import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getSession } from "@/lib/auth";
import { getCurrentUserCompanyId } from "@/utils/dataIsolation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Plus, Edit, Trash2, Building2, Search } from "lucide-react";
import { toast } from "sonner";

interface Company {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  _count?: {
    branches: number;
    employees: number;
  };
}

const Companies = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [userCompanyId, setUserCompanyId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    const initData = async () => {
      const session = getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      // Get user's company_id for data isolation
      const companyId = await getCurrentUserCompanyId(session.userId);
      if (!companyId) {
        toast.error("لم يتم العثور على معلومات الشركة");
        return;
      }

      setUserCompanyId(companyId);
      fetchCompanies(companyId);
    };

    initData();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredCompanies(companies);
    } else {
      const filtered = companies.filter((company) =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCompanies(filtered);
    }
  }, [searchTerm, companies]);

  const fetchCompanies = async (companyId: string) => {
    try {
      setLoading(true);

      // Super admin can only see their own company
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", companyId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching companies:", error);
        toast.error("خطأ في تحميل بيانات الشركات");
        return;
      }

      // Fetch counts for the company
      const companiesWithCounts = await Promise.all(
        (data || []).map(async (company) => {
          const [{ count: branchCount }, { count: employeeCount }] = await Promise.all([
            supabase
              .from("branches")
              .select("*", { count: "exact", head: true })
              .eq("company_id", company.id),
            supabase
              .from("users")
              .select("*", { count: "exact", head: true })
              .eq("company_id", company.id),
          ]);

          return {
            ...company,
            _count: {
              branches: branchCount || 0,
              employees: employeeCount || 0,
            },
          };
        })
      );

      setCompanies(companiesWithCounts);
      setFilteredCompanies(companiesWithCounts);
    } catch (error) {
      console.error("Error:", error);
      toast.error("خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("يرجى إدخال اسم الشركة");
      return;
    }

    // Security: Super admin can only edit their own company, not create new ones
    if (!editingCompany) {
      toast.error("لا يمكنك إضافة شركات جديدة. يمكنك فقط تعديل معلومات شركتك.");
      return;
    }

    if (!userCompanyId || editingCompany.id !== userCompanyId) {
      toast.error("غير مصرح لك بتعديل هذه الشركة");
      return;
    }

    try {
      // Update existing company - only allowed to update own company
      const { error } = await supabase
        .from("companies")
        .update({
          name: formData.name,
          description: formData.description || null,
        })
        .eq("id", editingCompany.id)
        .eq("id", userCompanyId); // Double-check at DB level

      if (error) {
        console.error("Error updating company:", error);
        toast.error("خطأ في تحديث الشركة");
        return;
      }

      toast.success("تم تحديث الشركة بنجاح");

      // Reset form and close dialog
      setFormData({ name: "", description: "" });
      setEditingCompany(null);
      setIsDialogOpen(false);
      if (userCompanyId) {
        fetchCompanies(userCompanyId);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("خطأ غير متوقع");
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      description: company.description || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (companyId: string, companyName: string) => {
    // Security: Super admin cannot delete their own company or any company
    toast.error("لا يمكن حذف الشركة. تواصل مع الدعم الفني لحذف الشركة.");
    return;
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingCompany(null);
    setFormData({ name: "", description: "" });
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
            <Building2 className="w-10 h-10 text-purple-600" />
            <h1 className="text-4xl font-bold text-gray-800">إدارة الشركات</h1>
          </div>
        </div>

        {/* Search - No Add button (super_admin cannot create companies) */}
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="البحث عن شركة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>

          {/* Edit Dialog - Only for editing own company */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="hidden">Hidden</Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader>
                <DialogTitle>
                  {editingCompany ? "تعديل الشركة" : "إضافة شركة جديدة"}
                </DialogTitle>
                <DialogDescription>
                  {editingCompany
                    ? "قم بتحديث بيانات الشركة"
                    : "أدخل بيانات الشركة الجديدة"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">اسم الشركة *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="مثال: شركة الأمل للتكنولوجيا"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">الوصف</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="وصف مختصر عن الشركة..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDialogClose}
                  >
                    إلغاء
                  </Button>
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                    {editingCompany ? "تحديث" : "إضافة"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-white">
            <p className="text-sm text-gray-600">إجمالي الشركات</p>
            <p className="text-2xl font-bold text-purple-600">{companies.length}</p>
          </Card>
          <Card className="p-4 bg-white">
            <p className="text-sm text-gray-600">نتائج البحث</p>
            <p className="text-2xl font-bold text-gray-800">{filteredCompanies.length}</p>
          </Card>
          <Card className="p-4 bg-white">
            <p className="text-sm text-gray-600">إجمالي الموظفين</p>
            <p className="text-2xl font-bold text-green-600">
              {companies.reduce((sum, c) => sum + (c._count?.employees || 0), 0)}
            </p>
          </Card>
        </div>
      </div>

      {/* Companies Table */}
      <div className="max-w-7xl mx-auto">
        <Card className="p-6 bg-white">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">جاري التحميل...</p>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">لم يتم العثور على شركتك</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">اسم الشركة</TableHead>
                    <TableHead className="text-right">الوصف</TableHead>
                    <TableHead className="text-right">عدد الفروع</TableHead>
                    <TableHead className="text-right">عدد الموظفين</TableHead>
                    <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">{company.name}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {company.description || "-"}
                      </TableCell>
                      <TableCell>{company._count?.branches || 0}</TableCell>
                      <TableCell>{company._count?.employees || 0}</TableCell>
                      <TableCell>
                        {new Date(company.created_at).toLocaleDateString("ar-SA")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => handleEdit(company)}
                          >
                            <Edit className="w-4 h-4" />
                            تعديل
                          </Button>
                          {/* Delete button hidden - super_admin cannot delete companies */}
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

export default Companies;
