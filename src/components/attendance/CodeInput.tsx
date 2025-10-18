import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Delete } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CodeData {
  code: string;
}

interface CodeInputProps {
  locationId: string;
  onSuccess: (data: CodeData) => void;
  onCancel: () => void;
}

const CodeInput = ({ locationId, onSuccess, onCancel }: CodeInputProps) => {
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNumberClick = (num: string) => {
    if (code.length < 4) {
      const newCode = code + num;
      setCode(newCode);
      if (newCode.length === 4) {
        handleSubmit(newCode);
      }
    }
  };

  const handleDelete = () => {
    setCode(code.slice(0, -1));
  };

  const handleSubmit = async (fullCode: string) => {
    if (isSubmitting || fullCode.length !== 4) return;
    setIsSubmitting(true);

    try {
      // Verify numeric code
      const { data: codeData, error } = await supabase
        .from("numeric_codes")
        .select("*")
        .eq("location_id", locationId)
        .eq("code", fullCode)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (error || !codeData) {
        toast.error("الكود غير صحيح أو منتهي الصلاحية");
        setCode("");
        setIsSubmitting(false);
        return;
      }

      toast.success("تم إدخال الكود بنجاح!");
      onSuccess({ code: fullCode });
    } catch (error) {
      console.error("Code verification error:", error);
      toast.error("حدث خطأ أثناء التحقق من الكود");
      setCode("");
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
          <h1 className="text-2xl font-bold">أدخل الكود</h1>
        </div>
      </div>

      <div className="p-4 -mt-4 space-y-6">
        <Card className="p-6 bg-primary/5 border-primary/20">
          <p className="text-center text-lg font-medium mb-4">
            أدخل الكود المكون من 4 أرقام
          </p>
          <div className="flex justify-center gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-16 h-20 rounded-xl bg-background border-2 border-primary/30 flex items-center justify-center text-4xl font-bold"
              >
                {code[i] || ""}
              </div>
            ))}
          </div>
        </Card>

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num.toString())}
              disabled={isSubmitting}
              className="h-16 rounded-xl bg-card hover:bg-accent font-bold text-2xl transition-colors disabled:opacity-50 shadow-md hover:shadow-lg active:scale-95"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleDelete}
            disabled={isSubmitting || code.length === 0}
            className="h-16 rounded-xl bg-danger/10 hover:bg-danger/20 text-danger font-bold text-xl transition-colors disabled:opacity-30 shadow-md flex items-center justify-center"
          >
            <Delete className="w-6 h-6" />
          </button>
          <button
            onClick={() => handleNumberClick("0")}
            disabled={isSubmitting}
            className="h-16 rounded-xl bg-card hover:bg-accent font-bold text-2xl transition-colors disabled:opacity-50 shadow-md hover:shadow-lg active:scale-95"
          >
            0
          </button>
          <button
            onClick={() => code.length === 4 && handleSubmit(code)}
            disabled={isSubmitting || code.length !== 4}
            className="h-16 rounded-xl bg-gradient-success text-white font-bold transition-all disabled:opacity-30 shadow-md hover:shadow-lg active:scale-95"
          >
            ✓
          </button>
        </div>

        <Card className="p-4 bg-warning/5 border-warning/20">
          <p className="text-sm text-center text-muted-foreground">
            💡 الكود يتجدد كل 5 دقائق
          </p>
        </Card>
      </div>
    </div>
  );
};

export default CodeInput;
