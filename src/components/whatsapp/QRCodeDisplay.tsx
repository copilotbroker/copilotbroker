import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, QrCode, Smartphone } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface QRCodeDisplayProps {
  qrCode: string | null;
  pairingCode: string | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export function QRCodeDisplay({ qrCode, pairingCode, isLoading, onRefresh }: QRCodeDisplayProps) {
  const isMobile = useIsMobile();
  // On mobile, default to pairing code; on desktop, default to QR code
  const [showCode, setShowCode] = useState(isMobile || Boolean(pairingCode));

  useEffect(() => {
    if (pairingCode && isMobile) {
      setShowCode(true);
    } else if (pairingCode && !qrCode) {
      setShowCode(true);
    }
  }, [pairingCode, isMobile, qrCode]);

  const formattedCode = pairingCode
    ? pairingCode.replace(/(\w{4})(\w{4})/, "$1-$2")
    : null;

  const hasPairingCode = Boolean(formattedCode);
  const hasQRCode = Boolean(qrCode);
  const isShowingPairingCode = hasPairingCode && (showCode || !hasQRCode);

  return (
    <Card className="bg-[#1a1a1d] border-[#2a2a2e]">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          {isShowingPairingCode ? <Smartphone className="w-5 h-5" /> : <QrCode className="w-5 h-5" />}
          {isShowingPairingCode ? "Código de Pareamento" : "QR Code"}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        {isLoading ? (
          <div className="w-64 h-64 flex items-center justify-center bg-[#0d0d0f] rounded-lg">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : hasQRCode || hasPairingCode ? (
          <>
            {isShowingPairingCode && formattedCode ? (
              <div className="w-64 h-64 flex flex-col items-center justify-center bg-[#0d0d0f] rounded-lg gap-4">
                <p className="text-xs text-slate-500 text-center px-4">
                  Abra o WhatsApp → Aparelhos conectados → Conectar um aparelho → <strong className="text-slate-300">Vincular com número de telefone</strong>
                </p>
                <div className="text-3xl font-mono font-bold text-white tracking-[0.3em] select-all">
                  {formattedCode}
                </div>
                <p className="text-xs text-slate-500">Digite este código no WhatsApp</p>
              </div>
            ) : (
              <div className="p-4 bg-white rounded-lg">
                <img
                  src={qrCode!.startsWith("data:") ? qrCode! : `data:image/png;base64,${qrCode!}`}
                  alt="WhatsApp QR Code"
                  className="w-56 h-56 object-contain"
                />
              </div>
            )}

            <div className="mt-4 text-center space-y-2">
              {!isShowingPairingCode && (
                <p className="text-xs text-slate-500">
                  Abra o WhatsApp no seu celular → Menu → Aparelhos conectados → Conectar um aparelho
                </p>
              )}

              <div className="flex flex-col items-center gap-2">
                {hasPairingCode && hasQRCode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCode((current) => !current)}
                    className="text-primary hover:text-primary/80"
                  >
                    <Smartphone className="w-4 h-4 mr-2" />
                    {isShowingPairingCode ? "Usar QR Code" : "Usar código numérico"}
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRefresh}
                  disabled={isLoading}
                  className="text-slate-400 hover:text-white"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="w-64 h-64 flex flex-col items-center justify-center bg-[#0d0d0f] rounded-lg gap-4">
            <QrCode className="w-12 h-12 text-slate-600" />
            <p className="text-sm text-slate-500 text-center">
              Clique abaixo para gerar o QR Code
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="border-[#2a2a2e] text-slate-300 hover:bg-[#2a2a2e]"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Gerar QR Code
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
