import { useRef, useState } from "react";
import { Upload, FileText, Download, Trash2, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CadastroDocument } from "@/hooks/use-lead-cadastro";

interface Props {
  label: string;
  documentType: string;
  docs: CadastroDocument[];
  multiple?: boolean;
  onUpload: (file: File, documentType: string) => Promise<CadastroDocument | null>;
  onExtract?: (docId: string, documentType: string) => Promise<any>;
  onExtracted?: (data: any) => void;
  onDownload: (path: string) => Promise<string | null>;
  onRemove: (doc: CadastroDocument) => Promise<void>;
  accept?: string;
  onAiStart?: (label: string) => void;
  onAiEnd?: () => void;
}

export function CadastroUploadField({
  label, documentType, docs, multiple, onUpload, onExtract, onExtracted,
  onDownload, onRemove, accept = "application/pdf,image/*", onAiStart, onAiEnd,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [extracting, setExtracting] = useState<string | null>(null);

  const relevant = docs.filter((d) => d.document_type === documentType && d.is_active);

  const handleFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setBusy(true);
    try {
      for (const f of Array.from(files)) {
        const inserted = await onUpload(f, documentType);
        if (inserted && onExtract) {
          setExtracting(inserted.id);
          onAiStart?.(label);
          try {
            const data = await onExtract(inserted.id, documentType);
            if (data && onExtracted) onExtracted(data);
          } finally {
            onAiEnd?.();
            setExtracting(null);
          }
        }
        if (!multiple) break;
      }
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="bg-[#0f0f12] border border-[#1e1e22] rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-200">{label}</p>
          <p className="text-xs text-slate-500">PDF ou imagem. {multiple ? "Múltiplos arquivos." : ""}</p>
        </div>
        <Button size="sm" variant="outline" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {busy ? "Enviando..." : "Enviar"}
        </Button>
        <input
          ref={inputRef} type="file" accept={accept} multiple={!!multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {extracting && (
        <div className="flex items-center gap-2 text-xs text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-2">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          Lendo documento com IA...
        </div>
      )}

      {relevant.length === 0 ? (
        <p className="text-xs text-slate-600">Nenhum arquivo enviado.</p>
      ) : (
        <ul className="space-y-1.5">
          {relevant.map((d) => (
            <li key={d.id} className="flex items-center gap-2 text-xs bg-[#111114] rounded-lg px-3 py-2 border border-[#1e1e22]">
              <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="flex-1 truncate text-slate-300">{d.file_name ?? d.id}</span>
              {d.ai_extracted && <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-300">IA</Badge>}
              <button
                title="Baixar"
                className="text-slate-400 hover:text-white"
                onClick={async () => {
                  if (!d.file_path) return;
                  const url = await onDownload(d.file_path);
                  if (url) window.open(url, "_blank");
                }}
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              {onExtract && d.file_path && (
                <button
                  title="Reprocessar com IA"
                  className="text-purple-300 hover:text-purple-100 disabled:opacity-50"
                  disabled={extracting === d.id}
                  onClick={async () => {
                    setExtracting(d.id);
                    onAiStart?.(label);
                    try {
                      const data = await onExtract(d.id, documentType);
                      if (data && onExtracted) onExtracted(data);
                    } finally {
                      onAiEnd?.();
                      setExtracting(null);
                    }
                  }}
                >
                  {extracting === d.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                </button>
              )}
              <button title="Remover" className="text-red-400 hover:text-red-300" onClick={() => onRemove(d)}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
