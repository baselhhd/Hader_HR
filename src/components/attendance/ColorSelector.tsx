import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ColorData {
  color: string;
}

interface ColorSelectorProps {
  locationId: string;
  onSuccess: (data: ColorData) => void;
  onCancel: () => void;
}

const colors = [
  { name: "red", label: "أحمر", bg: "bg-red-500", hover: "hover:bg-red-600" },
  { name: "green", label: "أخضر", bg: "bg-green-500", hover: "hover:bg-green-600" },
  { name: "blue", label: "أزرق", bg: "bg-blue-500", hover: "hover:bg-blue-600" },
  { name: "yellow", label: "أصفر", bg: "bg-yellow-500", hover: "hover:bg-yellow-600" },
];

const ColorSelector = ({ locationId, onSuccess, onCancel }: ColorSelectorProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleColorSelect = async (colorName: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Verify color code
      const { data: colorData, error } = await supabase
        .from("color_codes")
        .select("*")
        .eq("location_id", locationId)
        .eq("current_color", colorName)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (error || !colorData) {
        toast.error("اللون غير صحيح أو منتهي الصلاحية");
        setIsSubmitting(false);
        return;
      }

      toast.success("تم اختيار اللون بنجاح!");
      onSuccess({ color: colorName });
    } catch (error) {
      console.error("Color selection error:", error);
      toast.error("حدث خطأ أثناء التحقق من اللون");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="bg-gradient-header text-white p-6 pb-8">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="text-white hover:bg-white/20"
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">اختر اللون</h1>
        </div>
      </div>

      <div className="p-4 -mt-4 space-y-6">
        <Card className="p-6 bg-primary/5 border-primary/20">
          <p className="text-center text-lg font-medium">
            اختر اللون الظاهر على شاشة مدير الموقع
          </p>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          {colors.map((color) => (
            <button
              key={color.name}
              onClick={() => handleColorSelect(color.name)}
              disabled={isSubmitting}
              className={`
                aspect-square rounded-3xl transition-all duration-200
                ${color.bg} ${color.hover}
                shadow-lg hover:shadow-xl hover:scale-105 active:scale-95
                disabled:opacity-50 disabled:cursor-not-allowed
                flex flex-col items-center justify-center gap-2
              `}
            >
              <span className="text-white text-2xl font-bold">{color.label}</span>
            </button>
          ))}
        </div>

        <Card className="p-4 bg-warning/5 border-warning/20">
          <p className="text-sm text-center text-muted-foreground">
            💡 اللون يتغير تلقائياً كل 20 ثانية
          </p>
        </Card>
      </div>
    </div>
  );
};

export default ColorSelector;
