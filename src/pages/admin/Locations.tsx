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
import { ArrowLeft, Plus, Edit, Trash2, MapPin, Search, Navigation } from "lucide-react";
import { toast } from "sonner";

interface Location {
  id: string;
  name: string;
  branch_id: string;
  company_id: string;
  lat: number;
  lng: number;
  gps_radius: number;
  created_at: string;
  branches: {
    name: string;
    companies: {
      name: string;
    };
  };
}

interface Branch {
  id: string;
  name: string;
  company_id: string;
  companies: {
    name: string;
  };
}

const Locations = () => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<Location[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    branch_id: "",
    company_id: "",
    lat: "",
    lng: "",
    gps_radius: "100",
  });

  useEffect(() => {
    fetchBranches();
    fetchLocations();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredLocations(locations);
    } else {
      const filtered = locations.filter(
        (location) =>
          location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          location.branches.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          location.branches.companies.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLocations(filtered);
    }
  }, [searchTerm, locations]);

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase
        .from("branches")
        .select(`
          id,
          name,
          company_id,
          companies (
            name
          )
        `)
        .order("name");

      if (error) {
        console.error("Error fetching branches:", error);
        return;
      }

      setBranches(data || []);
    } catch (error: any) {
      console.error("Error:", error);
    }
  };

  const fetchLocations = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("locations")
        .select(`
          id,
          name,
          branch_id,
          company_id,
          lat,
          lng,
          gps_radius,
          created_at,
          branches (
            name,
            companies (
              name
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching locations:", error);
        toast.error("خطأ في تحميل بيانات المواقع");
        return;
      }

      setLocations(data || []);
      setFilteredLocations(data || []);
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            lat: position.coords.latitude.toFixed(6),
            lng: position.coords.longitude.toFixed(6),
          });
          toast.success("تم الحصول على الموقع الحالي");
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("فشل الحصول على الموقع الحالي");
        }
      );
    } else {
      toast.error("المتصفح لا يدعم تحديد الموقع");
    }
  };

  const handleBranchChange = (branchId: string) => {
    const selectedBranch = branches.find((b) => b.id === branchId);
    if (selectedBranch) {
      setFormData({
        ...formData,
        branch_id: branchId,
        company_id: selectedBranch.company_id,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.branch_id || !formData.lat || !formData.lng) {
      toast.error("يرجى إدخال جميع البيانات المطلوبة");
      return;
    }

    const lat = parseFloat(formData.lat);
    const lng = parseFloat(formData.lng);
    const radius = parseInt(formData.gps_radius);

    if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
      toast.error("يرجى إدخال قيم صحيحة للإحداثيات ونصف القطر");
      return;
    }

    try {
      if (editingLocation) {
        // Update
        const { error } = await supabase
          .from("locations")
          .update({
            name: formData.name,
            branch_id: formData.branch_id,
            company_id: formData.company_id,
            lat,
            lng,
            gps_radius: radius,
          })
          .eq("id", editingLocation.id);

        if (error) {
          console.error("Error updating location:", error);
          toast.error("خطأ في تحديث الموقع");
          return;
        }

        toast.success("تم تحديث الموقع بنجاح");
      } else {
        // Add new
        const { error } = await supabase.from("locations").insert({
          name: formData.name,
          branch_id: formData.branch_id,
          company_id: formData.company_id,
          lat,
          lng,
          gps_radius: radius,
        });

        if (error) {
          console.error("Error adding location:", error);
          toast.error("خطأ في إضافة الموقع");
          return;
        }

        toast.success("تم إضافة الموقع بنجاح");
      }

      setFormData({ name: "", branch_id: "", company_id: "", lat: "", lng: "", gps_radius: "100" });
      setEditingLocation(null);
      setIsDialogOpen(false);
      fetchLocations();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("خطأ غير متوقع");
    }
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      branch_id: location.branch_id,
      company_id: location.company_id,
      lat: location.lat.toString(),
      lng: location.lng.toString(),
      gps_radius: location.gps_radius.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (locationId: string, locationName: string) => {
    if (!confirm(`هل أنت متأكد من حذف موقع "${locationName}"؟`)) {
      return;
    }

    try {
      const { error } = await supabase.from("locations").delete().eq("id", locationId);

      if (error) {
        console.error("Error deleting location:", error);
        toast.error("خطأ في حذف الموقع");
        return;
      }

      toast.success("تم حذف الموقع بنجاح");
      fetchLocations();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("خطأ غير متوقع");
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingLocation(null);
    setFormData({ name: "", branch_id: "", company_id: "", lat: "", lng: "", gps_radius: "100" });
  };

  const openInMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
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
            <MapPin className="w-10 h-10 text-green-600" />
            <h1 className="text-4xl font-bold text-gray-800">إدارة المواقع</h1>
          </div>
        </div>

        {/* Search and Add */}
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="البحث عن موقع..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4" />
                إضافة موقع جديد
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl" className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingLocation ? "تعديل الموقع" : "إضافة موقع جديد"}
                </DialogTitle>
                <DialogDescription>
                  {editingLocation ? "قم بتحديث بيانات الموقع" : "أدخل بيانات الموقع الجديد"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="branch">الفرع *</Label>
                  <Select
                    value={formData.branch_id}
                    onValueChange={handleBranchChange}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الفرع" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name} ({branch.companies.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="name">اسم الموقع *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="مثال: المكتب الرئيسي"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lat">خط العرض (Latitude) *</Label>
                    <Input
                      id="lat"
                      type="number"
                      step="0.000001"
                      value={formData.lat}
                      onChange={(e) =>
                        setFormData({ ...formData, lat: e.target.value })
                      }
                      placeholder="24.7136"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lng">خط الطول (Longitude) *</Label>
                    <Input
                      id="lng"
                      type="number"
                      step="0.000001"
                      value={formData.lng}
                      onChange={(e) =>
                        setFormData({ ...formData, lng: e.target.value })
                      }
                      placeholder="46.6753"
                      required
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleGetCurrentLocation}
                >
                  <Navigation className="w-4 h-4" />
                  استخدام موقعي الحالي
                </Button>
                <div>
                  <Label htmlFor="radius">نصف القطر المسموح (متر) *</Label>
                  <Input
                    id="radius"
                    type="number"
                    value={formData.gps_radius}
                    onChange={(e) =>
                      setFormData({ ...formData, gps_radius: e.target.value })
                    }
                    placeholder="100"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    المسافة المسموحة للموظف من نقطة GPS للتسجيل
                  </p>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    إلغاء
                  </Button>
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    {editingLocation ? "تحديث" : "إضافة"}
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
            <p className="text-sm text-gray-600">إجمالي المواقع</p>
            <p className="text-2xl font-bold text-green-600">{locations.length}</p>
          </Card>
          <Card className="p-4 bg-white">
            <p className="text-sm text-gray-600">عدد الفروع</p>
            <p className="text-2xl font-bold text-blue-600">{branches.length}</p>
          </Card>
          <Card className="p-4 bg-white">
            <p className="text-sm text-gray-600">نتائج البحث</p>
            <p className="text-2xl font-bold text-gray-800">{filteredLocations.length}</p>
          </Card>
        </div>
      </div>

      {/* Locations Table */}
      <div className="max-w-7xl mx-auto">
        <Card className="p-6 bg-white">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">جاري التحميل...</p>
            </div>
          ) : filteredLocations.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">لا توجد مواقع</p>
              <Button className="mt-4 gap-2" onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4" />
                إضافة أول موقع
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">اسم الموقع</TableHead>
                    <TableHead className="text-right">الفرع</TableHead>
                    <TableHead className="text-right">الشركة</TableHead>
                    <TableHead className="text-right">الإحداثيات</TableHead>
                    <TableHead className="text-right">نصف القطر</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLocations.map((location) => (
                    <TableRow key={location.id}>
                      <TableCell className="font-medium">{location.name}</TableCell>
                      <TableCell>{location.branches.name}</TableCell>
                      <TableCell>{location.branches.companies.name}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => openInMaps(location.lat, location.lng)}
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <MapPin className="w-4 h-4" />
                          {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                        </button>
                      </TableCell>
                      <TableCell>{location.gps_radius}م</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => handleEdit(location)}
                          >
                            <Edit className="w-4 h-4" />
                            تعديل
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-red-600 border-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(location.id, location.name)}
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

export default Locations;
