import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogOut, Users, AlertTriangle, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { QRCodeCanvas } from "qrcode.react";
import { getSession, clearSession } from "@/lib/auth";
import { useUserLocationInfo } from "@/hooks/useUserLocationInfo";
import { UserLocationDisplay } from "@/components/UserLocationDisplay";

interface ManagerData {
  location_id: string;
  locations?: {
    id: string;
    name: string;
    company_id: string;
  };
}

interface LocationData {
  id: string;
  name: string;
  company_id: string;
}

interface AttendanceRecord {
  id: string;
  check_in: string;
  method_used: string;
  status: string;
  users?: {
    full_name: string;
  };
}

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ userId: string; role: string; username: string } | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [activeMethod, setActiveMethod] = useState<"qr" | "color" | "code">("qr");
  const [currentCode, setCurrentCode] = useState("");
  const [currentColor, setCurrentColor] = useState("red");
  const [currentNumericCode, setCurrentNumericCode] = useState("0000");
  const [timeLeft, setTimeLeft] = useState(120);
  const [todayStats, setTodayStats] = useState({ present: 0, late: 0, absent: 0, total: 20 });
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [suspiciousCount, setSuspiciousCount] = useState(0);

  // Get user location info (company, branch, locations)
  const locationInfo = useUserLocationInfo(user?.userId || "", user?.role || "");

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (location) {
      generateCodes();
      const interval = setInterval(() => {
        if (activeMethod === "qr") {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              generateQRCode();
              return 120;
            }
            return prev - 1;
          });
        } else if (activeMethod === "color") {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              generateColorCode();
              return 20;
            }
            return prev - 1;
          });
        } else if (activeMethod === "code") {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              generateNumericCode();
              return 300;
            }
            return prev - 1;
          });
        }
      }, 1000);

      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, activeMethod]);

  const checkAuth = async () => {
    // Check for local session first
    const session = getSession();

    if (!session) {
      navigate("/login");
      return;
    }

    // Check if user has loc_manager role
    if (session.role !== "loc_manager") {
      toast.error("غير مصرح لك بالدخول");
      navigate("/login");
      return;
    }

    setUser(session);
    await loadData(session.userId);
  };

  const loadData = async (userId: string) => {
    try {
      console.log("🔍 Loading location data for user:", userId);

      // Get manager's location
      const { data: locationData, error: locationError } = await supabase
        .from("location_managers")
        .select(`
          location_id,
          locations:location_id (id, name, company_id)
        `)
        .eq("user_id", userId)
        .single();

      if (locationError) {
        console.error("❌ Error fetching location_managers:", locationError);
        toast.error("لم يتم العثور على موقع لهذا المدير");
        return;
      }

      if (locationData?.locations) {
        console.log("✅ Location loaded:", locationData.locations);
        setLocation(locationData.locations);
        await loadTodayStats(locationData.locations.id);
        await loadRecentAttendance(locationData.locations.id);
        await loadSuspiciousCount(locationData.locations.id);
      } else {
        console.error("❌ No location data found for manager");
        toast.error("لم يتم تعيين موقع لهذا المدير");
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("حدث خطأ أثناء تحميل البيانات");
    }
  };

  const loadTodayStats = async (locationId: string) => {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("attendance_records")
      .select("id, late_minutes")
      .eq("location_id", locationId)
      .gte("check_in", `${today}T00:00:00`)
      .lte("check_in", `${today}T23:59:59`);

    if (data) {
      const lateCount = data.filter(r => r.late_minutes > 0).length;
      setTodayStats({
        present: data.length,
        late: lateCount,
        absent: 20 - data.length,
        total: 20,
      });
    }
  };

  const loadRecentAttendance = async (locationId: string) => {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("attendance_records")
      .select(`
        id,
        check_in,
        method_used,
        status,
        users:employee_id (full_name)
      `)
      .eq("location_id", locationId)
      .gte("check_in", `${today}T00:00:00`)
      .order("check_in", { ascending: false })
      .limit(5);

    setRecentAttendance(data || []);
  };

  const loadSuspiciousCount = async (locationId: string) => {
    const { data: records } = await supabase
      .from("attendance_records")
      .select("id")
      .eq("location_id", locationId)
      .eq("status", "suspicious");

    if (records && records.length > 0) {
      const recordIds = records.map(r => r.id);
      const { count } = await supabase
        .from("verification_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending")
        .in("attendance_record_id", recordIds);

      setSuspiciousCount(count || 0);
    }
  };

  const generateCodes = () => {
    generateQRCode();
    generateColorCode();
    generateNumericCode();
  };

  const generateQRCode = async () => {
    if (!location?.id) {
      console.error("Cannot generate QR code: location not loaded");
      return;
    }

    const code = crypto.randomUUID();
    setCurrentCode(code);

    const { error } = await supabase.from("qr_codes").insert({
      location_id: location.id,
      code_data: code,
      expires_at: new Date(Date.now() + 120000).toISOString(),
    });

    if (error) {
      console.error("Error generating QR code:", error);
    } else {
      console.log("✅ QR Code generated:", code.substring(0, 20) + "...");
    }
  };

  const generateColorCode = async () => {
    if (!location?.id) {
      console.error("Cannot generate color code: location not loaded");
      return;
    }

    const colors = ["red", "green", "blue", "yellow"];
    const color = colors[Math.floor(Math.random() * colors.length)];
    setCurrentColor(color);

    const { error } = await supabase.from("color_codes").insert({
      location_id: location.id,
      current_color: color,
      expires_at: new Date(Date.now() + 20000).toISOString(),
    });

    if (error) {
      console.error("Error generating color code:", error);
    } else {
      console.log("✅ Color Code generated:", color);
    }
  };

  const generateNumericCode = async () => {
    if (!location?.id) {
      console.error("Cannot generate numeric code: location not loaded");
      return;
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setCurrentNumericCode(code);

    const { error } = await supabase.from("numeric_codes").insert({
      location_id: location.id,
      code: code,
      expires_at: new Date(Date.now() + 300000).toISOString(),
    });

    if (error) {
      console.error("Error generating numeric code:", error);
    } else {
      console.log("✅ Numeric Code generated:", code);
    }
  };

  const handleLogout = async () => {
    // Clear local session
    clearSession();

    // Try to sign out from Supabase Auth (but don't fail if it doesn't work)
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.log("Supabase auth signout skipped:", error);
    }

    navigate("/login");
    toast.success("تم تسجيل الخروج بنجاح");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const colorMap = {
    red: { bg: "bg-red-500", name: "أحمر" },
    green: { bg: "bg-green-500", name: "أخضر" },
    blue: { bg: "bg-blue-500", name: "أزرق" },
    yellow: { bg: "bg-yellow-500", name: "أصفر" },
  };

  if (!location) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-6" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-header text-white p-6 pb-8 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">مرحباً طارق</h1>
            <p className="text-white/90 text-sm flex items-center gap-2">
              📍
              <UserLocationDisplay
                companyName={locationInfo.company?.name}
                branchName={locationInfo.branch?.name}
                locationName={locationInfo.location?.name}
                locationsCount={locationInfo.locations.length}
                variant="inline"
              />
            </p>
            <p className="text-white/80 text-xs mt-1">
              {format(new Date(), "EEEE، dd MMMM", { locale: ar })} • {format(new Date(), "hh:mm a")}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-white hover:bg-white/20"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* Active Method Selector */}
        <Card className="p-4">
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            طريقة التحضير النشطة:
          </label>
          <select
            value={activeMethod}
            onChange={(e) => {
              setActiveMethod(e.target.value as "qr" | "color" | "code");
              setTimeLeft(e.target.value === "qr" ? 120 : e.target.value === "color" ? 20 : 300);
            }}
            className="w-full h-12 px-4 rounded-lg border-2 border-primary/30 bg-background font-medium"
          >
            <option value="qr">QR Code</option>
            <option value="color">اللون</option>
            <option value="code">الكود الرقمي</option>
          </select>
        </Card>

        {/* Code Display */}
        <Card className="p-6 card-elevated">
          {activeMethod === "qr" && (
            <div className="text-center">
              <div className="inline-block p-4 bg-white rounded-2xl">
                <QRCodeCanvas value={currentCode} size={250} />
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 text-muted-foreground">
                <Clock className="w-5 h-5" />
                <span className="text-lg font-bold">
                  يتجدد خلال: {formatTime(timeLeft)}
                </span>
              </div>
            </div>
          )}

          {activeMethod === "color" && (
            <div className="text-center">
              <div className={`w-64 h-64 rounded-3xl ${colorMap[currentColor as keyof typeof colorMap].bg} mx-auto shadow-2xl`}></div>
              <p className="text-2xl font-bold mt-4">
                اللون الحالي: {colorMap[currentColor as keyof typeof colorMap].name}
              </p>
              <div className="mt-2 flex items-center justify-center gap-2 text-muted-foreground">
                <Clock className="w-5 h-5" />
                <span className="text-lg font-bold">
                  يتجدد خلال: {formatTime(timeLeft)}
                </span>
              </div>
            </div>
          )}

          {activeMethod === "code" && (
            <div className="text-center">
              <p className="text-6xl font-bold tracking-widest text-primary mb-4">
                {currentNumericCode}
              </p>
              <p className="text-xl text-muted-foreground mb-4">الكود الرقمي</p>
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Clock className="w-5 h-5" />
                <span className="text-lg font-bold">
                  يتجدد خلال: {formatTime(timeLeft)}
                </span>
              </div>
            </div>
          )}
        </Card>

        {/* Quick Methods */}
        <div className="flex gap-2">
          {["qr", "color", "code"].map((m) => (
            <Button
              key={m}
              variant={activeMethod === m ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setActiveMethod(m as "qr" | "color" | "code");
                setTimeLeft(m === "qr" ? 120 : m === "color" ? 20 : 300);
              }}
              className="flex-1"
            >
              {m === "qr" ? "QR" : m === "color" ? "اللون" : "الكود"}
            </Button>
          ))}
        </div>

        {/* Today Stats */}
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">إحصائيات اليوم</h3>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="text-3xl font-bold text-success">{todayStats.present}</p>
              <p className="text-xs text-muted-foreground mt-1">حاضر</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-warning">{todayStats.late}</p>
              <p className="text-xs text-muted-foreground mt-1">متأخر</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-danger">{todayStats.absent}</p>
              <p className="text-xs text-muted-foreground mt-1">غائب</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">
                {Math.round((todayStats.present / todayStats.total) * 100)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">النسبة</p>
            </div>
          </div>
        </Card>

        {/* Suspicious Requests Alert */}
        {suspiciousCount > 0 && (
          <Card
            className="p-4 bg-warning/10 border-warning/30 cursor-pointer hover-scale"
            onClick={() => navigate("/manager/verifications")}
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-warning" />
              <div className="flex-1">
                <p className="font-bold text-lg">⚠️ يحتاج تأكيدك ({suspiciousCount})</p>
                <p className="text-sm text-muted-foreground">اضغط للمراجعة</p>
              </div>
            </div>
          </Card>
        )}

        {/* Recent Attendance */}
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">📋 آخر التسجيلات</h3>
          <div className="space-y-3">
            {recentAttendance.map((record) => (
              <div key={record.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">{record.users?.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(record.check_in), "hh:mm a")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-2 py-1 bg-background rounded-full">
                    {record.method_used === "qr" ? "QR" : record.method_used === "color" ? "لون" : "كود"}
                  </span>
                  {record.status === "approved" ? "✓" : record.status === "suspicious" ? "⚠️" : "⏳"}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ManagerDashboard;
