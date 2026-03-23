import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, QrCode, Smartphone, Copy, Check } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

interface QRCodeDisplayProps {
  qrCode: string | null;
  pairingCode: string | null;
  isLoading: boolean;
  onRefresh: () => void;
}

type ViewMode = "pairing" | "qrcode";

export function QRCodeDisplay({ qrCode, pairingCode, isLoading, onRefresh }: QRCodeDisplayProps) {
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<ViewMode>(isMobile ? "pairing" : "qrcode");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isMobile) {
      setViewMode("pairing");
    }
  }, [isMobile]);

  const formattedCode = pairingCode
    ? pairingCode.replace(/(\w{4})(\w{4})/, "$1-$2")
    : null;

  const hasPairingCode = Boolean(formattedCode);
  const hasQRCode = Boolean(qrCode);
  const hasAnyCode = hasPairingCode || hasQRCode;

  const handleCopyCode = async () => {
    if (!pairingCode) return;
    try {
      await navigator.clipboard.writeText(pairingCode);
      setCopied(true);
      toast.success("Código copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const renderPairingCodeView = () => {
    if (hasPairingCode && formattedCode) {
      return (
        <div className="w-full max-w-[280px] flex flex-col items-center justify-center bg-[#0d0d0f] rounded-lg gap-4 p-6">
          <p className="text-xs text-slate-500 text-center">
            Abra o WhatsApp → Aparelhos conectados → Conectar um aparelho → <strong className="text-slate-300">Vincular com número de telefone</strong>
          </p>
          <div
            className="text-3xl font-mono font-bold text-white tracking-[0.3em] select-all cursor-pointer"
            onClick={handleCopyCode}
          >
            {formattedCode}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyCode}
            className="text-primary hover:text-primary/80"
          >
            {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
            {copied ? "Copiado!" : "Copiar código"}
          </Button>
          <p className="text-xs text-slate-500">Digite este código no WhatsApp</p>
        </div>
      );
    }

    // No pairing code available yet — show instructions + generate button
    return (
      <div className="w-full max-w-[280px] flex flex-col items-center justify-center bg-[#0d0d0f] rounded-lg gap-4 p-6">
        <Smartphone className="w-12 h-12 text-slate-600" />
        <p className="text-sm text-slate-400 text-center">
          Clique abaixo para gerar um código numérico de pareamento
        </p>
        <p className="text-xs text-slate-500 text-center">
          Ideal para conectar usando o mesmo celular, sem precisar de uma segunda tela
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="border-[#2a2a2e] text-slate-300 hover:bg-[#2a2a2e]"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Gerar Código
        </Button>
      </div>
    );
  };

  const renderQRCodeView = () => {
    if (hasQRCode) {
      return (
        <div className="p-4 bg-white rounded-lg">
          <img
            src={qrCode!.startsWith("data:") ? qrCode! : `data:image/png;base64,${qrCode!}`}
            alt="WhatsApp QR Code"
            className="w-56 h-56 object-contain"
          />
        </div>
      );
    }

    return (
      <div className="w-full max-w-[280px] flex flex-col items-center justify-center bg-[#0d0d0f] rounded-lg gap-4 p-6">
        <QrCode className="w-12 h-12 text-slate-600" />
        <p className="text-sm text-slate-500 text-center">
          Clique abaixo para gerar o QR Code
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="border-[#2a2a2e] text-slate-300 hover:bg-[#2a2a2e]"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Gerar QR Code
        </Button>
      </div>
    );
  };

  return (
    <Card className="bg-[#1a1a1d] border-[#2a2a2e]">
      <CardHeader>
        {/* Tab-like toggle between modes */}
        <div className="flex items-center gap-1 bg-[#0d0d0f] rounded-lg p-1">
          <button
            onClick={() => setViewMode("pairing")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === "pairing"
                ? "bg-primary text-primary-foreground"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            <Smartphone className="w-4 h-4" />
            Código
          </button>
          <button
            onClick={() => setViewMode("qrcode")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === "qrcode"
                ? "bg-primary text-primary-foreground"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            <QrCode className="w-4 h-4" />
            QR Code
          </button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        {isLoading ? (
          <div className="w-64 h-64 flex items-center justify-center bg-[#0d0d0f] rounded-lg">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {viewMode === "pairing" ? renderPairingCodeView() : renderQRCodeView()}

            {/* Instructions for QR Code mode */}
            {viewMode === "qrcode" && hasQRCode && (
              <p className="mt-4 text-xs text-slate-500 text-center">
                Abra o WhatsApp no seu celular → Menu → Aparelhos conectados → Conectar um aparelho
              </p>
            )}

            {/* Refresh button when codes exist */}
            {hasAnyCode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
                className="mt-3 text-slate-400 hover:text-white"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
