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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Clock, Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Shift {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  work_hours: number;
  created_at: string;
}

const Shifts = () => {
  const navigate = useNavigate();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    start_time: "",
    end_time: "",
  });

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("shifts")
        .select("*")
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Error fetching shifts:", error);
        toast.error("خطأ في تحميل بيانات الورديات");
        return;
      }

      setShifts(data || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  const calculateWorkHours = (start: string, end: string): number => {
    const [startHour, startMin] = start.split(":").map(Number);
    const [endHour, endMin] = end.split(":").map(Number);

    let hours = endHour - startHour;
    let minutes = endMin - startMin;

    if (minutes < 0) {
      hours--;
      minutes += 60;
    }

    return hours + minutes / 60;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.start_time || !formData.end_time) {
      toast.error("يرجى إدخال جميع البيانات المطلوبة");
      return;
    }

    const workHours = calculateWorkHours(formData.start_time, formData.end_time);

    if (workHours <= 0) {
      toast.error("وقت النهاية يجب أن يكون بعد وقت البداية");
      return;
    }

    try {
      if (editingShift) {
        // Update
        const { error } = await supabase
          .from("shifts")
          .update({
            name: formData.name,
            start_time: formData.start_time,
            end_time: formData.end_time,
            work_hours: workHours,
          })
          .eq("id", editingShift.id);

        if (error) {
          console.error("Error updating shift:", error);
          toast.error("خطأ في تحديث الوردية");
          return;
        }

        toast.success("تم تحديث الوردية بنجاح");
      } else {
        // Add new
        const { error } = await supabase.from("shifts").insert({
          name: formData.name,
          start_time: formData.start_time,
          end_time: formData.end_time,
          work_hours: workHours,
        });

        if (error) {
          console.error("Error adding shift:", error);
          toast.error("خطأ في إضافة الوردية");
          return;
        }

        toast.success("تم إضافة الوردية بنجاح");
      }

      setFormData({ name: "", start_time: "", end_time: "" });
      setEditingShift(null);
      setIsDialogOpen(false);
      fetchShifts();
    } catch (error) {
      console.error("Error:", error);
      toast.error("خطأ غير متوقع");
    }
  };

  const handleEdit = (shift: Shift) => {
    setEditingShift(shift);
    setFormData({
      name: shift.name,
      start_time: shift.start_time,
      end_time: shift.end_time,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (shiftId: string, shiftName: string) => {
    if (!confirm(`هل أنت متأكد من حذف وردية "${shiftName}"؟`)) {
      return;
    }

    try {
      const { error } = await supabase.from("shifts").delete().eq("id", shiftId);

      if (error) {
        console.error("Error deleting shift:", error);
        toast.error("خطأ في حذف الوردية");
        return;
      }

      toast.success("تم حذف الوردية بنجاح");
      fetchShifts();
    } catch (error) {
      console.error("Error:", error);
      toast.error("خطأ غير متوقع");
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingShift(null);
    setFormData({ name: "", start_time: "", end_time: "" });
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
            <Clock className="w-10 h-10 text-teal-600" />
            <h1 className="text-4xl font-bold text-gray-800">إدارة الورديات</h1>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-teal-600 hover:bg-teal-700">
              <Plus className="w-4 h-4" />
              إضافة وردية جديدة
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>
                {editingShift ? "تعديل الوردية" : "إضافة وردية جديدة"}
              </DialogTitle>
              <DialogDescription>
                {editingShift
                  ? "قم بتحديث بيانات الوردية"
                  : "أدخل بيانات الوردية الجديدة"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">اسم الوردية *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="مثال: الوردية الصباحية"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_time">وقت البداية *</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) =>
                      setFormData({ ...formData, start_time: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end_time">وقت النهاية *</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) =>
                      setFormData({ ...formData, end_time: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              {formData.start_time && formData.end_time && (
                <div className="bg-teal-50 p-3 rounded-lg">
                  <p className="text-sm text-teal-800">
                    عدد ساعات العمل:{" "}
                    <span className="font-bold">
                      {calculateWorkHours(formData.start_time, formData.end_time).toFixed(1)} ساعة
                    </span>
                  </p>
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-teal-600 hover:bg-teal-700">
                  {editingShift ? "تحديث" : "إضافة"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="max-w-7xl mx-auto mb-6">
        <Card className="p-4 bg-white">
          <p className="text-sm text-gray-600">إجمالي الورديات</p>
          <p className="text-2xl font-bold text-teal-600">{shifts.length}</p>
        </Card>
      </div>

      {/* Shifts Table */}
      <div className="max-w-7xl mx-auto">
        <Card className="p-6 bg-white">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">جاري التحميل...</p>
            </div>
          ) : shifts.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">لا توجد ورديات</p>
              <Button
                className="mt-4 gap-2"
                onClick={() => setIsDialogOpen(true)}
              >
                <Plus className="w-4 h-4" />
                إضافة أول وردية
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">اسم الوردية</TableHead>
                    <TableHead className="text-right">وقت البداية</TableHead>
                    <TableHead className="text-right">وقت النهاية</TableHead>
                    <TableHead className="text-right">ساعات العمل</TableHead>
                    <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shifts.map((shift) => (
                    <TableRow key={shift.id}>
                      <TableCell className="font-medium">{shift.name}</TableCell>
                      <TableCell>{shift.start_time}</TableCell>
                      <TableCell>{shift.end_time}</TableCell>
                      <TableCell>{shift.work_hours.toFixed(1)} ساعة</TableCell>
                      <TableCell>
                        {new Date(shift.created_at).toLocaleDateString("ar-SA")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => handleEdit(shift)}
                          >
                            <Edit className="w-4 h-4" />
                            تعديل
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-red-600 border-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(shift.id, shift.name)}
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

export default Shifts;
