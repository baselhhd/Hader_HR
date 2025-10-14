import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, QrCode, Palette, Hash, MapPin, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import QRScanner from "@/components/attendance/QRScanner";
import ColorSelector from "@/components/attendance/ColorSelector";
import CodeInput from "@/components/attendance/CodeInput";

type CheckInMethod = "select" | "qr" | "color" | "code";
type CheckInStep = "method" | "scanning" | "success" | "pending";

interface LocationInfo {
  id: string;
  name: string;
  lat: number;
  lng: number;
  gps_radius: number;
}

const CheckIn = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<CheckInStep>("method");
  const [method, setMethod] = useState<CheckInMethod>("select");
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [isInRange, setIsInRange] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [attendanceData, setAttendanceData] = useState<any>(null);

  useEffect(() => {
    loadLocation();
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(coords);
          checkIfInRange(coords);
        },
        (error) => {
          console.error("GPS Error:", error);
          toast.error("تعذر الحصول على موقعك الحالي");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  const loadLocation = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: empData } = await supabase
      .from("employees")
      .select(`
        location_id,
        locations:location_id (id, name, lat, lng, gps_radius)
      `)
      .eq("user_id", user.id)
      .single();

    if (empData?.locations) {
      setLocation(empData.locations as any);
    }
  };

  const checkIfInRange = (coords: { lat: number; lng: number }) => {
    if (!location) return;

    const distance = calculateDistance(
      coords.lat,
      coords.lng,
      location.lat,
      location.lng
    );

    setIsInRange(distance <= location.gps_radius);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const handleMethodSelect = (selectedMethod: "qr" | "color" | "code") => {
    setMethod(selectedMethod);
    setStep("scanning");
  };

  const handleCheckInComplete = async (methodData: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const checkInData: any = {
        company_id: "00000000-0000-0000-0000-000000000001",
        branch_id: "00000000-0000-0000-0000-000000000011",
        location_id: location?.id,
        employee_id: user.id,
        check_in: new Date().toISOString(),
        method_used: method === "qr" ? "qr" as const : method === "color" ? "color" as const : "code" as const,
        method_data: methodData,
        gps_lat: userLocation?.lat,
        gps_lng: userLocation?.lng,
        gps_distance: location && userLocation
          ? calculateDistance(userLocation.lat, userLocation.lng, location.lat, location.lng)
          : null,
        status: "approved" as const,
        suspicious_score: 0,
      };

      // Calculate suspicion score
      let suspicionScore = 0;
      const reasons = [];

      if (!isInRange && location && userLocation) {
        suspicionScore += 40;
        reasons.push({ type: "gps", text: "GPS خارج النطاق", points: 40 });
      }

      // Check time
      const now = new Date();
      const hour = now.getHours();
      if (hour < 6 || hour > 22) {
        suspicionScore += 15;
        reasons.push({ type: "time", text: "وقت غير معتاد", points: 15 });
      }

      if (suspicionScore >= 50) {
        checkInData.status = "suspicious" as const;
        checkInData.suspicious_score = suspicionScore;
        checkInData.suspicious_reasons = reasons;
      }

      const { data: attendance, error } = await supabase
        .from("attendance_records")
        .insert([checkInData])
        .select()
        .single();

      if (error) throw error;

      setAttendanceData(attendance);
      setStep(suspicionScore >= 50 ? "pending" : "success");

      // Create verification request if suspicious
      if (suspicionScore >= 50) {
        await supabase.from("verification_requests").insert({
          attendance_record_id: attendance.id,
          employee_id: user.id,
          suspicious_score: suspicionScore,
          suspicious_reasons: reasons,
          expires_at: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
        });
      }
    } catch (error: any) {
      console.error("Check-in error:", error);
      toast.error("حدث خطأ أثناء تسجيل الحضور");
    }
  };

  if (step === "method") {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <div className="bg-gradient-header text-white p-6 pb-8">
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/employee/dashboard")}
              className="text-white hover:bg-white/20"
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold">اختر طريقة التحضير</h1>
          </div>
          <div className="flex items-center gap-2 text-white/90 text-sm">
            <MapPin className="w-4 h-4" />
            <span>{location?.name}</span>
            {isInRange ? (
              <span className="text-success">• في النطاق ✓</span>
            ) : (
              <span className="text-warning">• خارج النطاق</span>
            )}
          </div>
        </div>

        <div className="p-4 space-y-4 -mt-4">
          {/* QR Code Method */}
          <Card
            className="p-6 hover-scale cursor-pointer card-elevated"
            onClick={() => handleMethodSelect("qr")}
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                <QrCode className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-1">📷 مسح QR Code</h3>
                <p className="text-sm text-muted-foreground">الأسرع - مسح فوري</p>
                <span className="inline-block mt-2 px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                  موصى به
                </span>
              </div>
            </div>
          </Card>

          {/* Color Method */}
          <Card
            className="p-6 hover-scale cursor-pointer"
            onClick={() => handleMethodSelect("color")}
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-success/10 rounded-2xl flex items-center justify-center">
                <Palette className="w-8 h-8 text-success" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-1">🎨 اختيار اللون</h3>
                <p className="text-sm text-muted-foreground">بسيط جداً</p>
              </div>
            </div>
          </Card>

          {/* Code Method */}
          <Card
            className="p-6 hover-scale cursor-pointer"
            onClick={() => handleMethodSelect("code")}
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-warning/10 rounded-2xl flex items-center justify-center">
                <Hash className="w-8 h-8 text-warning" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-1">#️⃣ إدخال الكود</h3>
                <p className="text-sm text-muted-foreground">4 أرقام فقط</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-primary/5 border-primary/20">
            <p className="text-sm text-center text-muted-foreground flex items-center justify-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>💡 GPS سيتم تسجيله تلقائياً</span>
            </p>
          </Card>
        </div>
      </div>
    );
  }

  if (step === "scanning") {
    if (method === "qr") {
      return <QRScanner onSuccess={handleCheckInComplete} onCancel={() => setStep("method")} />;
    } else if (method === "color") {
      return <ColorSelector locationId={location?.id || ""} onSuccess={handleCheckInComplete} onCancel={() => setStep("method")} />;
    } else if (method === "code") {
      return <CodeInput locationId={location?.id || ""} onSuccess={handleCheckInComplete} onCancel={() => setStep("method")} />;
    }
  }

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
        <div className="w-full max-w-md animate-scale-in">
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-slow">
              <CheckCircle className="w-16 h-16 text-success" />
            </div>
            <h2 className="text-3xl font-bold text-success mb-2">
              ✅ تم تسجيل حضورك بنجاح!
            </h2>
            <p className="text-muted-foreground">يوم عمل موفق!</p>
          </div>

          <Card className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">الوقت</span>
              <span className="font-bold">
                {attendanceData && new Date(attendanceData.check_in).toLocaleTimeString("ar-SA", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">الموقع</span>
              <span className="font-bold">{location?.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">الطريقة</span>
              <span className="font-bold">
                {method === "qr" ? "QR Code" : method === "color" ? "اللون" : "الكود"}
              </span>
            </div>
            {attendanceData?.gps_distance && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">المسافة</span>
                <span className="font-bold">{Math.round(attendanceData.gps_distance)} متر</span>
              </div>
            )}
          </Card>

          <Button
            onClick={() => navigate("/employee/dashboard")}
            className="w-full mt-6 h-14 text-lg font-bold bg-gradient-primary"
          >
            العودة للرئيسية
          </Button>
        </div>
      </div>
    );
  }

  if (step === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
        <div className="w-full max-w-md animate-scale-in">
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-slow">
              <Clock className="w-16 h-16 text-warning" />
            </div>
            <h2 className="text-3xl font-bold text-warning mb-2">
              ⏳ يحتاج موافقة المدير
            </h2>
            <p className="text-muted-foreground">سيتم الرد خلال 20 دقيقة</p>
          </div>

          <Card className="p-6 space-y-4 bg-warning/5 border-warning/20">
            <h3 className="font-bold text-lg">أسباب الاشتباه:</h3>
            {attendanceData?.suspicious_reasons?.map((reason: any, index: number) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-background rounded-lg">
                <div className="w-10 h-10 bg-warning/10 rounded-full flex items-center justify-center text-warning font-bold">
                  {reason.points}
                </div>
                <span>{reason.text}</span>
              </div>
            ))}
          </Card>

          <Card className="p-4 mt-4 bg-primary/5 border-primary/20">
            <p className="text-sm text-center">
              ستتلقى إشعار WhatsApp عند الموافقة
            </p>
          </Card>

          <Button
            onClick={() => navigate("/employee/dashboard")}
            variant="outline"
            className="w-full mt-6 h-12"
          >
            العودة للرئيسية
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default CheckIn;
