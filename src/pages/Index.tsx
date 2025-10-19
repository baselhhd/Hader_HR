import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSession } from "@/lib/auth";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = getSession();

        if (session) {
          // Route based on role from localStorage session
          if (session.role === "employee") {
            navigate("/employee/dashboard", { replace: true });
          } else if (session.role === "manager") {
            navigate("/manager/dashboard", { replace: true });
          } else if (session.role === "hr") {
            navigate("/hr/dashboard", { replace: true });
          } else if (session.role === "admin") {
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
