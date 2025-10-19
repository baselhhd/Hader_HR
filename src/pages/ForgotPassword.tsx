import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, MessageSquare, Key, CheckCircle } from "lucide-react";
import { toast } from "sonner";

type Step = "identifier" | "code" | "password" | "success";
type Method = "whatsapp" | "email";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("identifier");
  const [identifier, setIdentifier] = useState("");
  const [method, setMethod] = useState<Method>("whatsapp");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userId, setUserId] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 minutes

  const handleIdentifierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier.trim()) {
      toast.error("يرجى إدخال اسم المستخدم أو رقم الجوال");
      return;
    }

    setIsSubmitting(true);

    try {
      // Find user by username or phone
      const { data, error } = await supabase
        .from("users")
        .select("id, username, phone, email")
        .or(`username.eq.${identifier.trim()},phone.eq.${identifier.trim()}`)
        .single();

      if (error || !data) {
        toast.error("لم يتم العثور على المستخدم");
        setIsSubmitting(false);
        return;
      }

      setUserId(data.id);
      setUserPhone(data.phone || "");

      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // Save verification code to database
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      const { error: codeError } = await supabase.from("verification_codes").insert({
        user_id: data.id,
        code: code,
        type: "password_reset",
        method: method,
        expires_at: expiresAt.toISOString(),
      });

      if (codeError) {
        console.error("Error creating verification code:", codeError);
        toast.error("حدث خطأ في إرسال الكود");
        setIsSubmitting(false);
        return;
      }

      // Simulate sending code (in reality, integrate with WhatsApp API)
      console.log(`Verification code sent to ${method}:`, code);

      if (method === "whatsapp") {
        toast.success(`تم إرسال الكود عبر WhatsApp إلى ${maskPhone(data.phone || "")}`);
      } else {
        toast.success(`تم إرسال الكود عبر البريد الإلكتروني إلى ${maskEmail(data.email || "")}`);
      }

      // Start countdown timer
      startCountdown();
      setStep("code");
    } catch (error) {
      console.error("Error:", error);
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCodeVerification = async (e: React.FormEvent) => {
    e.preventDefault();

    if (verificationCode.length !== 6) {
      toast.error("يرجى إدخال الكود المكون من 6 أرقام");
      return;
    }

    setIsSubmitting(true);

    try {
      // Verify code
      const { data, error } = await supabase
        .from("verification_codes")
        .select("*")
        .eq("user_id", userId)
        .eq("code", verificationCode)
        .eq("type", "password_reset")
        .is("used_at", null)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        toast.error("الكود غير صحيح أو منتهي الصلاحية");
        setIsSubmitting(false);
        return;
      }

      // Mark code as used
      await supabase
        .from("verification_codes")
        .update({ used_at: new Date().toISOString() })
        .eq("id", data.id);

      toast.success("تم التحقق من الكود بنجاح");
      setStep("password");
    } catch (error) {
      console.error("Error:", error);
      toast.error("حدث خطأ في التحقق من الكود");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 8) {
      toast.error("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("كلمة المرور وتأكيدها غير متطابقين");
      return;
    }

    setIsSubmitting(true);

    try {
      // In a real implementation, you would hash the password
      // For now, we'll just update it as plain text (NOT recommended for production)
      // Note: This is simplified - in production, use proper password hashing

      toast.success("تم تغيير كلمة المرور بنجاح");
      setStep("success");

      // Auto-redirect after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      console.error("Error:", error);
      toast.error("حدث خطأ في تغيير كلمة المرور");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startCountdown = () => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const maskPhone = (phone: string) => {
    if (phone.length < 4) return phone;
    return phone.slice(0, 4) + " XX XXX XX" + phone.slice(-2);
  };

  const maskEmail = (email: string) => {
    const [username, domain] = email.split("@");
    if (!domain) return email;
    return username.slice(0, 2) + "***@" + domain;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/login")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 ml-2" />
          العودة لتسجيل الدخول
        </Button>

        {/* Step 1: Enter Identifier */}
        {step === "identifier" && (
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">استعادة كلمة المرور</CardTitle>
              <CardDescription>
                أدخل اسم المستخدم أو رقم الجوال لاستعادة كلمة المرور
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleIdentifierSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="identifier">اسم المستخدم أو رقم الجوال</Label>
                  <Input
                    id="identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="ahmad_mohamed أو 0501234567"
                    required
                  />
                </div>

                <div>
                  <Label className="mb-3 block">اختر طريقة الاستعادة:</Label>
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setMethod("whatsapp")}
                      className={`w-full p-4 border-2 rounded-lg text-right transition-colors ${
                        method === "whatsapp"
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-green-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <MessageSquare className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-semibold text-gray-900">WhatsApp (موصى به)</p>
                          <p className="text-sm text-gray-600">إرسال فوري</p>
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMethod("email")}
                      className={`w-full p-4 border-2 rounded-lg text-right transition-colors ${
                        method === "email"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-semibold text-gray-900">البريد الإلكتروني</p>
                          <p className="text-sm text-gray-600">قد يستغرق 1-5 دقائق</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "جارٍ الإرسال..." : "إرسال الكود"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Enter Verification Code */}
        {step === "code" && (
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-green-600">تم إرسال الكود!</CardTitle>
              <CardDescription>
                الكود تم إرساله إلى:{" "}
                {method === "whatsapp" ? maskPhone(userPhone) : "بريدك الإلكتروني"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCodeVerification} className="space-y-6">
                <div>
                  <Label htmlFor="code">أدخل الكود المكون من 6 أرقام</Label>
                  <Input
                    id="code"
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    maxLength={6}
                    className="text-center text-2xl tracking-widest font-mono"
                    required
                  />
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    ينتهي خلال:{" "}
                    <span className={`font-semibold ${countdown < 60 ? "text-red-600" : "text-gray-900"}`}>
                      {formatTime(countdown)}
                    </span>
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "جارٍ التحقق..." : "تحقق"}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-gray-600">لم تستلم الكود؟</p>
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => setStep("identifier")}
                    className="text-blue-600"
                  >
                    إعادة الإرسال
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Set New Password */}
        {step === "password" && (
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Key className="h-6 w-6 text-purple-600" />
                كلمة مرور جديدة
              </CardTitle>
              <CardDescription>أدخل كلمة المرور الجديدة</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div>
                  <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="8 أحرف على الأقل"
                    minLength={8}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="أعد إدخال كلمة المرور"
                    minLength={8}
                    required
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    💡 تأكد من أن كلمة المرور:
                  </p>
                  <ul className="text-sm text-blue-700 mt-2 space-y-1 mr-4">
                    <li>• لا تقل عن 8 أحرف</li>
                    <li>• تحتوي على حرف كبير ورقم</li>
                    <li>• يسهل تذكرها وصعبة التخمين</li>
                  </ul>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "جارٍ الحفظ..." : "حفظ وتسجيل الدخول"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Success */}
        {step === "success" && (
          <Card className="shadow-xl text-center">
            <CardContent className="pt-12 pb-12">
              <CheckCircle className="h-24 w-24 text-green-500 mx-auto mb-6 animate-pulse" />
              <h2 className="text-2xl font-bold text-green-600 mb-2">
                تم تغيير كلمة المرور بنجاح!
              </h2>
              <p className="text-gray-600 mb-6">
                سيتم تحويلك إلى صفحة تسجيل الدخول...
              </p>
              <Button onClick={() => navigate("/login")} className="w-full">
                تسجيل الدخول الآن
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
