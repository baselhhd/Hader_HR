import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, QrCode } from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface QRScannerProps {
  onSuccess: (data: any) => void;
  onCancel: () => void;
}

const QRScanner = ({ onSuccess, onCancel }: QRScannerProps) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
      },
      false
    );

    scanner.render(handleScan, handleError);
    scannerRef.current = scanner;

    return () => {
      scanner.clear().catch(console.error);
    };
  }, []);

  const handleScan = async (decodedText: string) => {
    if (!isScanning) return;
    setIsScanning(false);

    try {
      // Verify QR code exists and is not expired
      const { data: qrData, error } = await supabase
        .from("qr_codes")
        .select("*")
        .eq("code_data", decodedText)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (error || !qrData) {
        toast.error("رمز QR غير صحيح أو منتهي الصلاحية");
        setIsScanning(true);
        return;
      }

      // Mark QR as used
      await supabase
        .from("qr_codes")
        .update({
          used_by: (await supabase.auth.getUser()).data.user?.id,
          used_at: new Date().toISOString(),
        })
        .eq("id", qrData.id);

      toast.success("تم مسح QR بنجاح!");
      onSuccess({ qr_code: decodedText });
    } catch (error) {
      console.error("QR Scan error:", error);
      toast.error("حدث خطأ أثناء مسح QR");
      setIsScanning(true);
    }
  };

  const handleError = (error: any) => {
    // Ignore frequent errors
    if (error.includes("NotFoundException")) return;
    console.warn("QR Scan error:", error);
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
          <h1 className="text-2xl font-bold">مسح QR Code</h1>
        </div>
      </div>

      <div className="p-4 -mt-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <div id="qr-reader" className="w-full"></div>
        </div>

        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <QrCode className="w-5 h-5" />
            <p className="text-sm">وجّه الكاميرا نحو رمز QR الموجود على شاشة المدير</p>
          </div>
          
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm text-muted-foreground">
              💡 تأكد من توفر إضاءة جيدة لمسح أفضل
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
