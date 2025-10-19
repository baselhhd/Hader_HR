import { useNavigate } from "react-router-dom";
import logoImage from "@/assets/images/logo.png";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  clickable?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-20 w-20",
  xl: "h-32 w-32",
};

export const Logo = ({ size = "md", clickable = false, className = "" }: LogoProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (clickable) {
      navigate("/");
    }
  };

  return (
    <img
      src={logoImage}
      alt="حاضر - نظام إدارة الحضور"
      className={`${sizeClasses[size]} object-contain ${
        clickable ? "cursor-pointer hover:opacity-80 transition-opacity" : ""
      } ${className}`}
      onClick={handleClick}
    />
  );
};
