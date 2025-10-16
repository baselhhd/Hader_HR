import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Settings as SettingsIcon, Save, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface SystemSettings {
  company_name: string;
  work_start_time: string;
  work_end_time: string;
  default_work_hours: number;
  late_threshold_minutes: number;
  enable_qr_auth: boolean;
  enable_color_auth: boolean;
  enable_numeric_auth: boolean;
  require_gps: boolean;
  gps_radius_meters: number;
  enable_notifications: boolean;
  auto_approve_attendance: boolean;
}

const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>({
    company_name: "Hader HR System",
    work_start_time: "08:00",
    work_end_time: "17:00",
    default_work_hours: 9,
    late_threshold_minutes: 15,
    enable_qr_auth: true,
    enable_color_auth: true,
    enable_numeric_auth: true,
    require_gps: true,
    gps_radius_meters: 100,
    enable_notifications: true,
    auto_approve_attendance: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      // In a real app, fetch settings from database
      // For now, we'll use localStorage
      const savedSettings = localStorage.getItem("system_settings");
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error: any) {
      console.error("Error fetching settings:", error);
      toast.error("خطأ في تحميل الإعدادات");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validate settings
      if (settings.default_work_hours <= 0) {
        toast.error("عدد ساعات العمل يجب أن يكون أكبر من صفر");
        return;
      }

      if (settings.late_threshold_minutes < 0) {
        toast.error("حد التأخير لا يمكن أن يكون سالباً");
        return;
      }

      if (settings.gps_radius_meters < 10) {
        toast.error("نطاق GPS يجب أن يكون على الأقل 10 متر");
        return;
      }

      // In a real app, save to database
      // For now, we'll use localStorage
      localStorage.setItem("system_settings", JSON.stringify(settings));

      toast.success("تم حفظ الإعدادات بنجاح");
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error("خطأ في حفظ الإعدادات");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!confirm("هل أنت متأكد من إعادة تعيين جميع الإعدادات إلى القيم الافتراضية؟")) {
      return;
    }

    setSettings({
      company_name: "Hader HR System",
      work_start_time: "08:00",
      work_end_time: "17:00",
      default_work_hours: 9,
      late_threshold_minutes: 15,
      enable_qr_auth: true,
      enable_color_auth: true,
      enable_numeric_auth: true,
      require_gps: true,
      gps_radius_meters: 100,
      enable_notifications: true,
      auto_approve_attendance: false,
    });

    toast.info("تم إعادة تعيين الإعدادات إلى القيم الافتراضية");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-6 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-6" dir="rtl">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate("/admin/dashboard")}
              variant="outline"
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              العودة
            </Button>
            <div className="flex items-center gap-3">
              <SettingsIcon className="w-10 h-10 text-purple-600" />
              <h1 className="text-4xl font-bold text-gray-800">إعدادات النظام</h1>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleReset}
            >
              <RefreshCw className="w-4 h-4" />
              إعادة تعيين
            </Button>
            <Button
              className="gap-2 bg-purple-600 hover:bg-purple-700"
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="w-4 h-4" />
              {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* General Settings */}
        <Card className="p-6 bg-white">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">الإعدادات العامة</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="company_name">اسم الشركة</Label>
              <Input
                id="company_name"
                value={settings.company_name}
                onChange={(e) =>
                  setSettings({ ...settings, company_name: e.target.value })
                }
                placeholder="اسم الشركة"
              />
            </div>
          </div>
        </Card>

        {/* Work Hours Settings */}
        <Card className="p-6 bg-white">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">إعدادات ساعات العمل</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="work_start_time">وقت بداية العمل</Label>
                <Input
                  id="work_start_time"
                  type="time"
                  value={settings.work_start_time}
                  onChange={(e) =>
                    setSettings({ ...settings, work_start_time: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="work_end_time">وقت نهاية العمل</Label>
                <Input
                  id="work_end_time"
                  type="time"
                  value={settings.work_end_time}
                  onChange={(e) =>
                    setSettings({ ...settings, work_end_time: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="default_work_hours">عدد ساعات العمل الافتراضية</Label>
                <Input
                  id="default_work_hours"
                  type="number"
                  min="1"
                  max="24"
                  value={settings.default_work_hours}
                  onChange={(e) =>
                    setSettings({ ...settings, default_work_hours: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label htmlFor="late_threshold_minutes">حد التأخير المسموح (بالدقائق)</Label>
                <Input
                  id="late_threshold_minutes"
                  type="number"
                  min="0"
                  max="120"
                  value={settings.late_threshold_minutes}
                  onChange={(e) =>
                    setSettings({ ...settings, late_threshold_minutes: Number(e.target.value) })
                  }
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Authentication Settings */}
        <Card className="p-6 bg-white">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">إعدادات المصادقة</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enable_qr_auth">تفعيل المصادقة برمز QR</Label>
                <p className="text-sm text-gray-500">السماح للموظفين بتسجيل الحضور عبر رمز QR</p>
              </div>
              <Switch
                id="enable_qr_auth"
                checked={settings.enable_qr_auth}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enable_qr_auth: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enable_color_auth">تفعيل المصادقة بكود اللون</Label>
                <p className="text-sm text-gray-500">السماح للموظفين بتسجيل الحضور عبر كود اللون</p>
              </div>
              <Switch
                id="enable_color_auth"
                checked={settings.enable_color_auth}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enable_color_auth: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enable_numeric_auth">تفعيل المصادقة بالكود الرقمي</Label>
                <p className="text-sm text-gray-500">السماح للموظفين بتسجيل الحضور عبر كود رقمي</p>
              </div>
              <Switch
                id="enable_numeric_auth"
                checked={settings.enable_numeric_auth}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enable_numeric_auth: checked })
                }
              />
            </div>
          </div>
        </Card>

        {/* GPS Settings */}
        <Card className="p-6 bg-white">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">إعدادات الموقع (GPS)</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="require_gps">طلب التحقق من الموقع</Label>
                <p className="text-sm text-gray-500">
                  التأكد من أن الموظف موجود في نطاق الموقع المسموح
                </p>
              </div>
              <Switch
                id="require_gps"
                checked={settings.require_gps}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, require_gps: checked })
                }
              />
            </div>

            {settings.require_gps && (
              <>
                <Separator />
                <div>
                  <Label htmlFor="gps_radius_meters">نطاق GPS المسموح (بالمتر)</Label>
                  <Input
                    id="gps_radius_meters"
                    type="number"
                    min="10"
                    max="1000"
                    value={settings.gps_radius_meters}
                    onChange={(e) =>
                      setSettings({ ...settings, gps_radius_meters: Number(e.target.value) })
                    }
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    القيمة الموصى بها: 100 متر
                  </p>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* System Behavior Settings */}
        <Card className="p-6 bg-white">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">إعدادات سلوك النظام</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enable_notifications">تفعيل الإشعارات</Label>
                <p className="text-sm text-gray-500">إرسال إشعارات للموظفين والمسؤولين</p>
              </div>
              <Switch
                id="enable_notifications"
                checked={settings.enable_notifications}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enable_notifications: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto_approve_attendance">الموافقة التلقائية على الحضور</Label>
                <p className="text-sm text-gray-500">
                  الموافقة تلقائياً على سجلات الحضور بدون مراجعة يدوية
                </p>
              </div>
              <Switch
                id="auto_approve_attendance"
                checked={settings.auto_approve_attendance}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, auto_approve_attendance: checked })
                }
              />
            </div>
          </div>
        </Card>

        {/* Save Button at Bottom */}
        <Card className="p-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">هل قمت بإجراء تغييرات؟</h3>
              <p className="text-purple-100">
                لا تنسى حفظ التغييرات قبل مغادرة الصفحة
              </p>
            </div>
            <Button
              variant="secondary"
              className="gap-2"
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="w-4 h-4" />
              {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
