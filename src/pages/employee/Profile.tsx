import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, User, Mail, Phone, Lock, Check, X, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import {
  isInternalEmail,
  isValidEmail,
  isValidSaudiPhone,
  formatSaudiPhone,
  updateUserEmail,
  updateUserPhone
} from "@/utils/authHelpers";

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string;
  company_id: string;
  created_at: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Email state
  const [newEmail, setNewEmail] = useState("");
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  // Phone state
  const [newPhone, setNewPhone] = useState("");
  const [isUpdatingPhone, setIsUpdatingPhone] = useState(false);
  const [showPhoneForm, setShowPhoneForm] = useState(false);

  // Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("حدث خطأ أثناء تحميل البيانات");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail || !isValidEmail(newEmail)) {
      toast.error("يرجى إدخال بريد إلكتروني صحيح");
      return;
    }

    setIsUpdatingEmail(true);

    try {
      const result = await updateUserEmail(newEmail);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("تم إرسال رابط التأكيد إلى البريد الإلكتروني الجديد");
        toast.info("يرجى التحقق من بريدك الإلكتروني لإتمام العملية");
        setShowEmailForm(false);
        setNewEmail("");
        // تحديث الصفحة بعد 2 ثانية
        setTimeout(() => loadProfile(), 2000);
      }
    } catch (error) {
      console.error("Error updating email:", error);
      toast.error("حدث خطأ أثناء تحديث البريد الإلكتروني");
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleUpdatePhone = async () => {
    if (!newPhone || !isValidSaudiPhone(newPhone)) {
      toast.error("يرجى إدخال رقم جوال سعودي صحيح");
      return;
    }

    setIsUpdatingPhone(true);

    try {
      const result = await updateUserPhone(newPhone);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("تم تحديث رقم الجوال بنجاح");
        setShowPhoneForm(false);
        setNewPhone("");
        loadProfile();
      }
    } catch (error) {
      console.error("Error updating phone:", error);
      toast.error("حدث خطأ أثناء تحديث رقم الجوال");
    } finally {
      setIsUpdatingPhone(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("كلمات المرور غير متطابقة");
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success("تم تغيير كلمة المرور بنجاح");
      setShowPasswordForm(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error("حدث خطأ أثناء تغيير كلمة المرور");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return name.substring(0, 2);
  };

  const hasRealEmail = profile?.email && !isInternalEmail(profile.email);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4" dir="rtl">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/employee/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 ml-2" />
            العودة إلى لوحة التحكم
          </Button>
          <h1 className="text-3xl font-bold text-foreground">الملف الشخصي</h1>
          <p className="text-muted-foreground mt-1">إدارة معلوماتك الشخصية وإعداداتك</p>
        </div>

        {/* Profile Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-2xl">{profile.full_name}</CardTitle>
                <CardDescription className="text-base mt-1">
                  @{profile.username}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-sm text-muted-foreground">اسم المستخدم</Label>
                <p className="font-medium mt-1">{profile.username}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">الدور</Label>
                <p className="font-medium mt-1">
                  {profile.role === 'employee' && 'موظف'}
                  {profile.role === 'loc_manager' && 'مدير موقع'}
                  {profile.role === 'hr_admin' && 'مدير موارد بشرية'}
                  {profile.role === 'super_admin' && 'مدير النظام'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              البريد الإلكتروني
            </CardTitle>
            <CardDescription>
              {hasRealEmail
                ? "بريدك الإلكتروني الحالي"
                : "لم تقم بإضافة بريد إلكتروني حقيقي بعد"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasRealEmail ? (
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="font-medium">{profile.email}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEmailForm(!showEmailForm)}
                >
                  تغيير
                </Button>
              </div>
            ) : (
              <>
                {!showEmailForm ? (
                  <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-2">
                      <X className="w-5 h-5 text-yellow-600" />
                      <span className="text-muted-foreground">Email داخلي (غير حقيقي)</span>
                    </div>
                    <Button
                      onClick={() => setShowEmailForm(true)}
                      size="sm"
                    >
                      <Mail className="w-4 h-4 ml-2" />
                      إضافة بريد إلكتروني
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">البريد الإلكتروني الجديد</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="example@email.com"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        disabled={isUpdatingEmail}
                      />
                      <p className="text-xs text-muted-foreground">
                        سيتم إرسال رابط تأكيد إلى البريد الإلكتروني الجديد
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleUpdateEmail}
                        disabled={isUpdatingEmail}
                      >
                        {isUpdatingEmail ? "جاري الحفظ..." : "حفظ"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowEmailForm(false);
                          setNewEmail("");
                        }}
                        disabled={isUpdatingEmail}
                      >
                        إلغاء
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Phone Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              رقم الجوال
            </CardTitle>
            <CardDescription>
              {profile.phone
                ? "رقم جوالك الحالي (مطلوب لإشعارات WhatsApp)"
                : "لم تقم بإضافة رقم جوال بعد"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {profile.phone && !showPhoneForm ? (
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="font-medium" dir="ltr">{profile.phone}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPhoneForm(true)}
                >
                  تغيير
                </Button>
              </div>
            ) : (
              <>
                {!showPhoneForm ? (
                  <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-2">
                      <X className="w-5 h-5 text-yellow-600" />
                      <span className="text-muted-foreground">لم يتم إضافة رقم جوال</span>
                    </div>
                    <Button
                      onClick={() => setShowPhoneForm(true)}
                      size="sm"
                    >
                      <Phone className="w-4 h-4 ml-2" />
                      إضافة رقم جوال
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">رقم الجوال</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="05XXXXXXXX أو +966XXXXXXXXX"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        disabled={isUpdatingPhone}
                        dir="ltr"
                      />
                      <p className="text-xs text-muted-foreground">
                        رقم جوال سعودي (مطلوب لاحقاً لاستقبال إشعارات WhatsApp)
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleUpdatePhone}
                        disabled={isUpdatingPhone}
                      >
                        {isUpdatingPhone ? "جاري الحفظ..." : "حفظ"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowPhoneForm(false);
                          setNewPhone("");
                        }}
                        disabled={isUpdatingPhone}
                      >
                        إلغاء
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Password Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              تغيير كلمة المرور
            </CardTitle>
            <CardDescription>
              تحديث كلمة المرور الخاصة بك
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showPasswordForm ? (
              <Button
                onClick={() => setShowPasswordForm(true)}
                variant="outline"
              >
                <Lock className="w-4 h-4 ml-2" />
                تغيير كلمة المرور
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="أدخل كلمة المرور الجديدة"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isUpdatingPassword}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="أعد إدخال كلمة المرور"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isUpdatingPassword}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleUpdatePassword}
                    disabled={isUpdatingPassword}
                  >
                    {isUpdatingPassword ? "جاري الحفظ..." : "حفظ"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    disabled={isUpdatingPassword}
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
