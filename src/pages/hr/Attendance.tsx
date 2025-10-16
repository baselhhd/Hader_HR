import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Search, Calendar, Download } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface AttendanceRecord {
  id: string;
  user_id: string;
  check_in: string;
  check_out: string | null;
  method_used: string;
  status: string;
  created_at: string;
  users: {
    username: string;
    full_name: string | null;
  };
}

const Attendance = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    fetchAttendance();
  }, []);

  useEffect(() => {
    let filtered = records;

    // Search filter
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter(
        (record) =>
          record.users.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.users.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter((record) => {
        const recordDate = new Date(record.check_in).toISOString().split("T")[0];
        return recordDate === dateFilter;
      });
    }

    setFilteredRecords(filtered);
  }, [searchTerm, dateFilter, records]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("attendance_records")
        .select(`
          id,
          user_id,
          check_in,
          check_out,
          method_used,
          status,
          created_at,
          users (
            username,
            full_name
          )
        `)
        .order("check_in", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Error fetching attendance:", error);
        toast.error("خطأ في تحميل سجلات الحضور");
        return;
      }

      setRecords(data || []);
      setFilteredRecords(data || []);
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      approved: { label: "موافق عليه", className: "bg-green-600" },
      pending: { label: "معلق", className: "bg-orange-600" },
      rejected: { label: "مرفوض", className: "bg-red-600" },
    };

    const statusInfo = statusMap[status] || { label: status, className: "bg-gray-600" };
    return <Badge className={statusInfo.className}>{statusInfo.label}</Badge>;
  };

  const getMethodBadge = (method: string) => {
    const methodMap: Record<string, { label: string; className: string }> = {
      qr: { label: "QR Code", className: "bg-blue-600" },
      color: { label: "كود اللون", className: "bg-purple-600" },
      numeric: { label: "كود رقمي", className: "bg-indigo-600" },
    };

    const methodInfo = methodMap[method] || { label: method, className: "bg-gray-600" };
    return <Badge variant="outline" className={`${methodInfo.className} text-white`}>{methodInfo.label}</Badge>;
  };

  const calculateDuration = (checkIn: string, checkOut: string | null): string => {
    if (!checkOut) return "-";

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}س ${minutes}د`;
  };

  const handleExport = () => {
    toast.info("قريباً: تصدير البيانات إلى Excel");
  };

  const stats = {
    total: records.length,
    today: records.filter((r) => {
      const today = new Date().toISOString().split("T")[0];
      const recordDate = new Date(r.check_in).toISOString().split("T")[0];
      return recordDate === today;
    }).length,
    approved: records.filter((r) => r.status === "approved").length,
    pending: records.filter((r) => r.status === "pending").length,
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
          <div className="flex items-center gap-3">
            <Clock className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-800">سجلات الحضور والانصراف</h1>
          </div>
        </div>

        {/* Filters */}
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
          <div className="relative">
            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pr-10 w-48"
            />
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleExport}
          >
            <Download className="w-4 h-4" />
            تصدير
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-white">
            <p className="text-sm text-gray-600">إجمالي السجلات</p>
            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
          </Card>
          <Card className="p-4 bg-white">
            <p className="text-sm text-gray-600">حضور اليوم</p>
            <p className="text-2xl font-bold text-green-600">{stats.today}</p>
          </Card>
          <Card className="p-4 bg-white">
            <p className="text-sm text-gray-600">موافق عليه</p>
            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
          </Card>
          <Card className="p-4 bg-white">
            <p className="text-sm text-gray-600">معلق</p>
            <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
          </Card>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="max-w-7xl mx-auto">
        <Card className="p-6 bg-white">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">جاري التحميل...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">لا توجد سجلات</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الموظف</TableHead>
                    <TableHead className="text-right">تاريخ الحضور</TableHead>
                    <TableHead className="text-right">وقت الحضور</TableHead>
                    <TableHead className="text-right">وقت الانصراف</TableHead>
                    <TableHead className="text-right">المدة</TableHead>
                    <TableHead className="text-right">الطريقة</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => {
                    const checkInDate = new Date(record.check_in);
                    const checkOutDate = record.check_out ? new Date(record.check_out) : null;

                    return (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {record.users.full_name || record.users.username}
                        </TableCell>
                        <TableCell>
                          {checkInDate.toLocaleDateString("ar-SA")}
                        </TableCell>
                        <TableCell>
                          {checkInDate.toLocaleTimeString("ar-SA", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell>
                          {checkOutDate
                            ? checkOutDate.toLocaleTimeString("ar-SA", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {calculateDuration(record.check_in, record.check_out)}
                        </TableCell>
                        <TableCell>{getMethodBadge(record.method_used)}</TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Attendance;
