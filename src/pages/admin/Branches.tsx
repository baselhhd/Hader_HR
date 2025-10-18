import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ArrowLeft, Plus, Edit, Trash2, GitBranch, Search } from "lucide-react";
import { toast } from "sonner";

interface Branch {
  id: string;
  name: string;
  company_id: string;
  created_at: string;
  companies: {
    name: string;
  };
  _count?: {
    locations: number;
  };
}

interface Company {
  id: string;
  name: string;
}

const Branches = () => {
  const navigate = useNavigate();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    company_id: "",
  });

  useEffect(() => {
    fetchCompanies();
    fetchBranches();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredBranches(branches);
    } else {
      const filtered = branches.filter(
        (branch) =>
          branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          branch.companies.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBranches(filtered);
    }
  }, [searchTerm, branches]);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .order("name");

      if (error) {
        console.error("Error fetching companies:", error);
        return;
      }

      setCompanies(data || []);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const fetchBranches = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("branches")
        .select(`
          id,
          name,
          company_id,
          created_at,
          companies (
            name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching branches:", error);
        toast.error("خطأ في تحميل بيانات الفروع");
        return;
      }

      // Fetch location counts
      const branchesWithCounts = await Promise.all(
        (data || []).map(async (branch) => {
          const { count } = await supabase
            .from("locations")
            .select("*", { count: "exact", head: true })
            .eq("branch_id", branch.id);

          return {
            ...branch,
            _count: {
              locations: count || 0,
            },
          };
        })
      );

      setBranches(branchesWithCounts);
      setFilteredBranches(branchesWithCounts);
    } catch (error) {
      console.error("Error:", error);
      toast.error("خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.company_id) {
      toast.error("يرجى إدخال جميع البيانات المطلوبة");
      return;
    }

    try {
      if (editingBranch) {
        // Update
        const { error } = await supabase
          .from("branches")
          .update({
            name: formData.name,
            company_id: formData.company_id,
          })
          .eq("id", editingBranch.id);

        if (error) {
          console.error("Error updating branch:", error);
          toast.error("خطأ في تحديث الفرع");
          return;
        }

        toast.success("تم تحديث الفرع بنجاح");
      } else {
        // Add new
        const { error } = await supabase.from("branches").insert({
          name: formData.name,
          company_id: formData.company_id,
        });

        if (error) {
          console.error("Error adding branch:", error);
          toast.error("خطأ في إضافة الفرع");
          return;
        }

        toast.success("تم إضافة الفرع بنجاح");
      }

      setFormData({ name: "", company_id: "" });
      setEditingBranch(null);
      setIsDialogOpen(false);
      fetchBranches();
    } catch (error) {
      console.error("Error:", error);
      toast.error("خطأ غير متوقع");
    }
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      company_id: branch.company_id,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (branchId: string, branchName: string) => {
    if (
      !confirm(
        `هل أنت متأكد من حذف فرع "${branchName}"؟\n\nتحذير: سيتم حذف جميع المواقع المرتبطة به!`
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase.from("branches").delete().eq("id", branchId);

      if (error) {
        console.error("Error deleting branch:", error);
        toast.error("خطأ في حذف الفرع");
        return;
      }

      toast.success("تم حذف الفرع بنجاح");
      fetchBranches();
    } catch (error) {
      console.error("Error:", error);
      toast.error("خطأ غير متوقع");
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingBranch(null);
    setFormData({ name: "", company_id: "" });
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
            <GitBranch className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-800">إدارة الفروع</h1>
          </div>
        </div>

        {/* Search and Add */}
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="البحث عن فرع أو شركة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4" />
                إضافة فرع جديد
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader>
                <DialogTitle>
                  {editingBranch ? "تعديل الفرع" : "إضافة فرع جديد"}
                </DialogTitle>
                <DialogDescription>
                  {editingBranch ? "قم بتحديث بيانات الفرع" : "أدخل بيانات الفرع الجديد"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="company">الشركة *</Label>
                  <Select
                    value={formData.company_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, company_id: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الشركة" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="name">اسم الفرع *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="مثال: الفرع الرئيسي"
                    required
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    إلغاء
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {editingBranch ? "تحديث" : "إضافة"}
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
            <p className="text-sm text-gray-600">إجمالي الفروع</p>
            <p className="text-2xl font-bold text-blue-600">{branches.length}</p>
          </Card>
          <Card className="p-4 bg-white">
            <p className="text-sm text-gray-600">عدد الشركات</p>
            <p className="text-2xl font-bold text-purple-600">{companies.length}</p>
          </Card>
          <Card className="p-4 bg-white">
            <p className="text-sm text-gray-600">إجمالي المواقع</p>
            <p className="text-2xl font-bold text-green-600">
              {branches.reduce((sum, b) => sum + (b._count?.locations || 0), 0)}
            </p>
          </Card>
        </div>
      </div>

      {/* Branches Table */}
      <div className="max-w-7xl mx-auto">
        <Card className="p-6 bg-white">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">جاري التحميل...</p>
            </div>
          ) : filteredBranches.length === 0 ? (
            <div className="text-center py-12">
              <GitBranch className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">لا توجد فروع</p>
              <Button className="mt-4 gap-2" onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4" />
                إضافة أول فرع
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">اسم الفرع</TableHead>
                    <TableHead className="text-right">الشركة</TableHead>
                    <TableHead className="text-right">عدد المواقع</TableHead>
                    <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBranches.map((branch) => (
                    <TableRow key={branch.id}>
                      <TableCell className="font-medium">{branch.name}</TableCell>
                      <TableCell>{branch.companies.name}</TableCell>
                      <TableCell>{branch._count?.locations || 0}</TableCell>
                      <TableCell>
                        {new Date(branch.created_at).toLocaleDateString("ar-SA")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => handleEdit(branch)}
                          >
                            <Edit className="w-4 h-4" />
                            تعديل
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-red-600 border-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(branch.id, branch.name)}
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

export default Branches;
