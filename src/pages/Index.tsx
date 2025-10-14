import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Get user role from user_roles table (secure) using RPC
          const { data: userRoles, error: roleError } = await supabase
            .rpc('get_user_roles' as any, { _user_id: session.user.id });

          if (roleError || !userRoles || (userRoles as any[]).length === 0) {
            navigate("/login", { replace: true });
            return;
          }

          // Get the first role (highest priority)
          const role = (userRoles as any[])[0];

          if (role === "employee") {
            navigate("/employee/dashboard", { replace: true });
          } else if (role === "loc_manager") {
            navigate("/manager/dashboard", { replace: true });
          } else if (role === "hr_admin") {
            navigate("/hr/dashboard", { replace: true });
          } else if (role === "super_admin") {
            navigate("/admin/dashboard", { replace: true });
          } else {
            navigate("/login", { replace: true });
          }
        } else {
          navigate("/login", { replace: true });
        }
      } catch (error) {
        console.error("Auth check error:", error);
        navigate("/login", { replace: true });
      }
    };

    checkAuth();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary via-primary-dark to-warning">
      <div className="text-center text-white">
        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-xl">جاري التحميل...</p>
      </div>
    </div>
  );
};

export default Index;
