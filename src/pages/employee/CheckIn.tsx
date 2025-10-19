import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, QrCode, Palette, Hash, MapPin, CheckCircle, Clock, LogOut, ExternalLink, AlertTriangle, Target, Radio } from "lucide-react";
import { toast } from "sonner";
import QRScanner from "@/components/attendance/QRScanner";
import ColorSelector from "@/components/attendance/ColorSelector";
import CodeInput from "@/components/attendance/CodeInput";
import { useUserCompanyData } from "@/hooks/useUserCompanyData";
import { getSession } from "@/lib/auth";

type CheckInMethod = "select" | "qr" | "color" | "code";
type CheckInStep = "method" | "scanning" | "success" | "pending" | "checkout";
type PageMode = "checkin" | "checkout";

interface LocationInfo {
  id: string;
  name: string;
  lat: number;
  lng: number;
  gps_radius: number;
}

interface AttendanceData {
  id: string;
  check_in: string;
  check_out?: string;
  work_hours?: number;
  gps_distance?: number;
  suspicious_score: number;
  suspicious_reasons?: Array<{
    type: string;
    text: string;
    points: number;
  }>;
}

interface CheckInData {
  company_id: string;
  branch_id: string;
  location_id: string;
  employee_id: string;
  check_in: string;
  method_used: "qr" | "color" | "code";
  method_data: unknown;
  gps_lat?: number;
  gps_lng?: number;
  gps_distance: number | null;
  status: "approved" | "suspicious";
  suspicious_score: number;
  suspicious_reasons?: Array<{
    type: string;
    text: string;
    points: number;
  }>;
}

const CheckIn = () => {
  const navigate = useNavigate();
  const { companyId, branchId, locationId, locationName, locationLat, locationLng, locationRadius } = useUserCompanyData();
  const [step, setStep] = useState<CheckInStep>("method");
  const [method, setMethod] = useState<CheckInMethod>("select");
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [isInRange, setIsInRange] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
  const [pageMode, setPageMode] = useState<PageMode>("checkin");
  const [todayAttendance, setTodayAttendance] = useState<AttendanceData | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsTimestamp, setGpsTimestamp] = useState<number | null>(null);
  const [gpsDistance, setGpsDistance] = useState<number | null>(null);
  const [isGPSLoading, setIsGPSLoading] = useState(true);

  // Update location when hook data is available
  useEffect(() => {
    if (locationId && locationName && locationLat && locationLng && locationRadius) {
      setLocation({
        id: locationId,
        name: locationName,
        lat: locationLat,
        lng: locationLng,
        gps_radius: locationRadius
      });
    }
  }, [locationId, locationName, locationLat, locationLng, locationRadius]);

  useEffect(() => {
    checkTodayAttendance();
    getCurrentLocation();
  }, []);

  const checkTodayAttendance = async () => {
    const session = getSession();
    if (!session) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("attendance_records")
      .select("*")
      .eq("employee_id", session.userId)
      .gte("check_in", today.toISOString())
      .is("check_out", null)
      .maybeSingle();

    if (data && !error) {
      setTodayAttendance(data);
      setPageMode("checkout");
    }
  };

  const getCurrentLocation = () => {
    setIsGPSLoading(true);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(coords);
          setGpsAccuracy(position.coords.accuracy);
          setGpsTimestamp(position.timestamp);

          // Calculate distance if location is available
          if (location) {
            const dist = calculateDistance(
              coords.lat,
              coords.lng,
              location.lat,
              location.lng
            );
            setGpsDistance(dist);
            setIsInRange(dist <= location.gps_radius);
          } else {
            checkIfInRange(coords);
          }

          setIsGPSLoading(false);
        },
        (error) => {
          console.warn("GPS not available:", error.message);
          setIsGPSLoading(false);

          // For development: Allow check-in without GPS
          // In production with HTTPS, GPS will work properly
          toast.warning("سيتم تسجيل الحضور بدون GPS (للتطوير فقط)", {
            duration: 3000,
          });
          setIsInRange(true); // Allow check-in anyway for testing
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      // GPS not supported
      setIsGPSLoading(false);
      toast.warning("GPS غير مدعوم في هذا المتصفح");
      setIsInRange(true); // Allow check-in anyway
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

  const getLocationSource = (accuracy: number): string => {
    if (accuracy <= 20) return "GPS";
    if (accuracy <= 100) return "WiFi + GPS";
    if (accuracy <= 500) return "WiFi";
    return "IP Address";
  };

  const getGoogleMapsUrl = (lat: number, lng: number): string => {
    return `https://www.google.com/maps?q=${lat},${lng}`;
  };

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString("ar-SA", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const handleMethodSelect = (selectedMethod: "qr" | "color" | "code") => {
    setMethod(selectedMethod);
    setStep("scanning");
  };

  const handleCheckInComplete = async (methodData: unknown) => {
    const session = getSession();
    if (!session) return;

    if (!companyId || !branchId || !locationId) {
      toast.error("لم يتم العثور على بيانات الشركة أو الموقع");
      return;
    }

    try {
      const checkInData: CheckInData = {
        company_id: companyId,
        branch_id: branchId,
        location_id: locationId,
        employee_id: session.userId,
        check_in: new Date().toISOString(),
        method_used: method === "qr" ? "qr" : method === "color" ? "color" : "code",
        method_data: methodData,
        gps_lat: userLocation?.lat,
        gps_lng: userLocation?.lng,
        gps_distance: location && userLocation
          ? calculateDistance(userLocation.lat, userLocation.lng, location.lat, location.lng)
          : null,
        status: "approved",
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
        checkInData.status = "suspicious";
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
          employee_id: session.userId,
          suspicious_score: suspicionScore,
          suspicious_reasons: reasons,
          expires_at: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
        });
      }
    } catch (error) {
      console.error("Check-in error:", error);
      toast.error("حدث خطأ أثناء تسجيل الحضور");
    }
  };

  const handleCheckOut = async () => {
    if (!todayAttendance) return;

    setIsCheckingOut(true);
    try {
      const checkOutTime = new Date();
      const checkInTime = new Date(todayAttendance.check_in);
      
      // Calculate work hours
      const workMilliseconds = checkOutTime.getTime() - checkInTime.getTime();
      const workHours = workMilliseconds / (1000 * 60 * 60);

      const { data, error } = await supabase
        .from("attendance_records")
        .update({
          check_out: checkOutTime.toISOString(),
          work_hours: workHours,
        })
        .eq("id", todayAttendance.id)
        .select()
        .single();

      if (error) throw error;

      setAttendanceData(data);
      setStep("success");
      toast.success("تم تسجيل خروجك بنجاح");
    } catch (error) {
      console.error("Check-out error:", error);
      toast.error("حدث خطأ أثناء تسجيل الخروج");
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Check-out page
  if (pageMode === "checkout" && step === "method") {
    const checkInTime = todayAttendance ? new Date(todayAttendance.check_in) : null;
    const currentTime = new Date();
    const workDuration = checkInTime
      ? Math.floor((currentTime.getTime() - checkInTime.getTime()) / (1000 * 60))
      : 0;
    const hours = Math.floor(workDuration / 60);
    const minutes = workDuration % 60;

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
            <h1 className="text-2xl font-bold">تسجيل الخروج</h1>
          </div>
          <div className="flex items-center gap-2 text-white/90 text-sm">
            <MapPin className="w-4 h-4" />
            <span>{location?.name}</span>
          </div>
        </div>

        <div className="p-4 space-y-4 -mt-4">
          {/* Work Summary Card */}
          <Card className="p-6 bg-gradient-to-br from-primary/10 to-success/10 border-2 border-primary/20">
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold mb-2">مدة العمل اليوم</h3>
              <div className="text-5xl font-bold text-primary mb-2">
                {hours}:{minutes.toString().padStart(2, "0")}
              </div>
              <p className="text-sm text-muted-foreground">ساعة ودقيقة</p>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">وقت الدخول</span>
                <span className="font-bold">
                  {checkInTime?.toLocaleTimeString("ar-SA", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">الوقت الحالي</span>
                <span className="font-bold">
                  {currentTime.toLocaleTimeString("ar-SA", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </Card>

          {/* Check-out Button */}
          <Button
            onClick={handleCheckOut}
            disabled={isCheckingOut}
            className="w-full h-16 text-lg font-bold bg-gradient-to-r from-primary to-warning hover:opacity-90"
          >
            {isCheckingOut ? (
              "جاري التسجيل..."
            ) : (
              <>
                <LogOut className="ml-2 w-6 h-6" />
                تسجيل الخروج الآن
              </>
            )}
          </Button>

          <Card className="p-4 bg-primary/5 border-primary/20">
            <p className="text-sm text-center text-muted-foreground">
              💡 يوم عمل موفق! لا تنسَ تسجيل خروجك
            </p>
          </Card>
        </div>
      </div>
    );
  }

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

          {/* GPS Info Card */}
          <Card className="overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">معلومات الموقع</h3>
                </div>
                {isGPSLoading ? (
                  <Badge className="bg-gray-100 text-gray-700">
                    <Clock className="w-3 h-3 ml-1 animate-spin" />
                    جارٍ التحميل...
                  </Badge>
                ) : userLocation && gpsDistance !== null ? (
                  isInRange ? (
                    <Badge className="bg-green-100 text-green-700">
                      <CheckCircle className="w-3 h-3 ml-1" />
                      داخل النطاق
                    </Badge>
                  ) : (
                    <Badge className="bg-orange-100 text-orange-700">
                      <AlertTriangle className="w-3 h-3 ml-1" />
                      خارج النطاق
                    </Badge>
                  )
                ) : (
                  <Badge className="bg-gray-100 text-gray-700">
                    غير متاح
                  </Badge>
                )}
              </div>
            </div>

            <div className="p-4 space-y-3">
              {isGPSLoading ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                  <Clock className="w-8 h-8 mx-auto mb-2 animate-spin text-gray-400" />
                  جارٍ تحديد موقعك...
                </div>
              ) : userLocation ? (
                <>
                  {/* Clickable Coordinates */}
                  <a
                    href={getGoogleMapsUrl(userLocation.lat, userLocation.lng)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-600" />
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">الإحداثيات</p>
                        <p className="text-xs text-gray-600 font-mono direction-ltr text-left">
                          {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
                        </p>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-blue-600 group-hover:translate-x-[-2px] transition-transform" />
                  </a>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Accuracy */}
                    {gpsAccuracy !== null && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Target className="w-3.5 h-3.5 text-gray-600" />
                          <p className="text-xs text-gray-600">الدقة</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                          {gpsAccuracy < 1000
                            ? `${Math.round(gpsAccuracy)} م`
                            : `${(gpsAccuracy / 1000).toFixed(1)} كم`}
                        </p>
                      </div>
                    )}

                    {/* Range Status - حالة النطاق */}
                    {gpsDistance !== null && location && (
                      <div
                        className={`p-3 rounded-lg ${
                          gpsDistance <= location.gps_radius
                            ? 'bg-green-50'
                            : 'bg-orange-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {gpsDistance <= location.gps_radius ? (
                            <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
                          )}
                          <p className="text-xs text-gray-600">الحالة</p>
                        </div>
                        <p className={`text-sm font-semibold ${
                          gpsDistance <= location.gps_radius
                            ? 'text-green-900'
                            : 'text-orange-900'
                        }`}>
                          {gpsDistance <= location.gps_radius
                            ? `متبقي ${Math.round(location.gps_radius - gpsDistance)} م`
                            : `تحتاج ${Math.round(gpsDistance - location.gps_radius)} م`
                          }
                        </p>
                      </div>
                    )}

                    {/* Source */}
                    {gpsAccuracy !== null && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Radio className="w-3.5 h-3.5 text-gray-600" />
                          <p className="text-xs text-gray-600">المصدر</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                          {getLocationSource(gpsAccuracy)}
                        </p>
                      </div>
                    )}

                    {/* Timestamp */}
                    {gpsTimestamp !== null && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-3.5 h-3.5 text-gray-600" />
                          <p className="text-xs text-gray-600">الوقت</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatTime(gpsTimestamp)}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  لم يتم تحديد الموقع
                </div>
              )}
            </div>
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
    const isCheckOut = pageMode === "checkout";
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
        <div className="w-full max-w-md animate-scale-in">
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-slow">
              {isCheckOut ? (
                <LogOut className="w-16 h-16 text-success" />
              ) : (
                <CheckCircle className="w-16 h-16 text-success" />
              )}
            </div>
            <h2 className="text-3xl font-bold text-success mb-2">
              {isCheckOut ? "✅ تم تسجيل خروجك بنجاح!" : "✅ تم تسجيل حضورك بنجاح!"}
            </h2>
            <p className="text-muted-foreground">
              {isCheckOut ? "في أمان الله!" : "يوم عمل موفق!"}
            </p>
          </div>

          <Card className="p-6 space-y-4">
            {isCheckOut ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">وقت الدخول</span>
                  <span className="font-bold">
                    {attendanceData && new Date(attendanceData.check_in).toLocaleTimeString("ar-SA", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">وقت الخروج</span>
                  <span className="font-bold">
                    {attendanceData && new Date(attendanceData.check_out).toLocaleTimeString("ar-SA", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t pt-4">
                  <span className="text-muted-foreground">إجمالي ساعات العمل</span>
                  <span className="font-bold text-primary text-lg">
                    {attendanceData?.work_hours ? attendanceData.work_hours.toFixed(2) : "0"} ساعة
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">الموقع</span>
                  <span className="font-bold">{location?.name}</span>
                </div>
              </>
            ) : (
              <>
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
              </>
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
            {attendanceData?.suspicious_reasons?.map((reason, index: number) => (
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
