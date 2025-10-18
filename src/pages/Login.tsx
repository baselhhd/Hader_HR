import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { saveSession } from "@/lib/auth";

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error("يرجى إدخال اسم المستخدم وكلمة المرور");
      return;
    }

    setIsLoading(true);

    try {
      // First, get user by username to check if exists and get full data
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, username, email, full_name, role, company_id, branch_id")
        .eq("username", username)
        .single();

      if (userError || !userData) {
        toast.error("اسم المستخدم غير صحيح");
        setIsLoading(false);
        return;
      }

      // For testing: Use simple password check (password = 123456 for all users)
      // In production, this should use proper authentication
      const correctPassword = "123456";

      if (password !== correctPassword) {
        toast.error("كلمة المرور غير صحيحة");
        setIsLoading(false);
        return;
      }

      // Try to create session in Supabase Auth (but don't fail if it doesn't work)
      try {
        const authEmail = `${username}@test.com`;
        await supabase.auth.signInWithPassword({
          email: authEmail,
          password: password,
        });
      } catch (authError) {
        console.log("Auth session creation skipped:", authError);
        // Continue anyway - we verified password above
      }

      // Save session to localStorage
      saveSession({
        userId: userData.id,
        username: userData.username,
        email: userData.email,
        fullName: userData.full_name,
        role: userData.role,
        companyId: userData.company_id,
        branchId: userData.branch_id,
      });

      // Update last login
      await supabase
        .from("users")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", userData.id);

      toast.success("مرحباً بك!");

      // Redirect based on role
      if (userData.role === "employee") {
        navigate("/employee/dashboard");
      } else if (userData.role === "loc_manager") {
        navigate("/manager/dashboard");
      } else if (userData.role === "hr_admin") {
        navigate("/hr/dashboard");
      } else if (userData.role === "super_admin") {
        navigate("/admin/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      const message = error instanceof Error ? error.message : 'خطأ غير متوقع';
      toast.error("حدث خطأ أثناء تسجيل الدخول");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary-dark to-warning p-4" dir="rtl">
      <div className="w-full max-w-md animate-scale-in">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
            <Clock className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">حاضر</h1>
          <p className="text-white/90">نظام إدارة الحضور الذكي</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-center mb-6 text-foreground">
            تسجيل الدخول
          </h2>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">اسم المستخدم</Label>
              <Input
                id="username"
                type="text"
                placeholder="أدخل اسم المستخدم"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                autoFocus
                className="h-12 text-lg"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="أدخل كلمة المرور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-12 text-lg pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  disabled={isLoading}
                />
                <Label
                  htmlFor="remember"
                  className="text-sm cursor-pointer"
                >
                  تذكرني
                </Label>
              </div>

              <a
                href="/forgot-password"
                className="text-sm text-primary hover:text-primary-dark transition-colors font-medium"
              >
                نسيت كلمة المرور؟
              </a>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              className="w-full h-12 text-lg font-bold bg-gradient-primary hover:opacity-90 transition-opacity"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                  جاري تسجيل الدخول...
                </>
              ) : (
                "تسجيل الدخول"
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-white/80 text-sm mt-6">
          © 2024 حاضر - جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
};

export default Login;
