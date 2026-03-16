import { useMemo, useState } from "react";
import { Download, ExternalLink, FileText, Image as ImageIcon, Mic, Play, Video } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { ConversationMessage } from "@/hooks/use-conversations";

const getMessageTypeLabel = (type: string) => {
  switch (type) {
    case "image":
      return "Imagem";
    case "audio":
      return "Áudio";
    case "video":
      return "Vídeo";
    case "document":
      return "Documento";
    default:
      return "Mídia";
  }
};

const getPublicUrlFromStoragePath = (storagePath?: string | null) => {
  if (!storagePath) return null;
  const { data } = supabase.storage.from("project-media").getPublicUrl(storagePath);
  return data.publicUrl || null;
};

const hasRenderableExtension = (url: string, extensions: string[]) => {
  const normalized = url.split("?")[0].toLowerCase();
  return extensions.some((extension) => normalized.endsWith(extension));
};

interface MessageMediaProps {
  msg: ConversationMessage;
}

export function MessageMedia({ msg }: MessageMediaProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);
  const metadata = (msg.metadata || {}) as Record<string, unknown>;

  const fileName = typeof metadata.file_name === "string" ? metadata.file_name : getMessageTypeLabel(msg.message_type);
  const mimeType = typeof metadata.mime_type === "string" ? metadata.mime_type : "";
  const storagePath = typeof metadata.storage_path === "string" ? metadata.storage_path : null;
  const primaryUrl = typeof metadata.file_url === "string" ? metadata.file_url : null;
  const thumbnailUrl = typeof metadata.thumbnail_url === "string" ? metadata.thumbnail_url : null;
  const inlineReady = metadata.is_inline_ready === true || !!storagePath;
  const bucketUrl = useMemo(() => getPublicUrlFromStoragePath(storagePath), [storagePath]);
  const resolvedUrl = inlineReady ? (bucketUrl || primaryUrl) : null;
  const resolvedThumbnail = inlineReady ? (thumbnailUrl || bucketUrl || primaryUrl) : thumbnailUrl;

  const caption = msg.content && !["Foto", "Áudio", "Vídeo", "Documento", "[Mídia]"].includes(msg.content)
    ? msg.content
    : "";

  const isImage = inlineReady && msg.message_type === "image" && !!resolvedUrl && !previewFailed && (
    mimeType.startsWith("image/") || hasRenderableExtension(resolvedUrl, [".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".svg"])
  );
  const isVideo = inlineReady && msg.message_type === "video" && !!resolvedUrl && (
    mimeType.startsWith("video/") || hasRenderableExtension(resolvedUrl, [".mp4", ".webm", ".ogg", ".mov"])
  );
  const isAudio = inlineReady && msg.message_type === "audio" && !!resolvedUrl && (
    mimeType.startsWith("audio/") || hasRenderableExtension(resolvedUrl, [".mp3", ".ogg", ".wav", ".m4a", ".aac"])
  );

  if (!resolvedUrl) {
    return <p className="whitespace-pre-wrap break-words">{msg.content}</p>;
  }

  if (isImage) {
    return (
      <>
        <button type="button" onClick={() => setViewerOpen(true)} className="block w-full space-y-2 text-left">
          <img
            src={resolvedThumbnail || resolvedUrl}
            alt={fileName}
            className="max-h-72 w-full rounded-xl object-cover"
            loading="lazy"
            onError={() => setPreviewFailed(true)}
          />
          {caption ? <p className="whitespace-pre-wrap break-words">{caption}</p> : null}
        </button>

        <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
          <DialogContent className="max-w-5xl border-border bg-card p-2 text-card-foreground">
            <div className="space-y-3">
              <div className="overflow-hidden rounded-xl bg-muted/40">
                <img src={resolvedUrl} alt={fileName} className="max-h-[80vh] w-full object-contain" />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-1">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{fileName}</p>
                  {caption ? <p className="truncate text-xs text-muted-foreground">{caption}</p> : null}
                </div>
                <div className="flex items-center gap-2">
                  <Button asChild size="sm" variant="outline">
                    <a href={resolvedUrl} target="_blank" rel="noreferrer">Abrir</a>
                  </Button>
                  <Button asChild size="sm">
                    <a href={resolvedUrl} download={fileName}>Baixar</a>
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (isVideo) {
    return (
      <>
        <div className="min-w-[240px] space-y-2">
          <button type="button" onClick={() => setViewerOpen(true)} className="group relative block w-full overflow-hidden rounded-xl bg-muted/40 text-left">
            <video controls preload="metadata" className="max-h-80 w-full rounded-xl bg-black">
              <source src={resolvedUrl} type={mimeType || undefined} />
            </video>
            {resolvedThumbnail && resolvedThumbnail !== resolvedUrl ? (
              <img src={resolvedThumbnail} alt={fileName} className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20" loading="lazy" />
            ) : null}
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
              <span className="rounded-full border border-border bg-card/90 p-3 text-foreground shadow-sm">
                <Play className="h-5 w-5" />
              </span>
            </span>
          </button>
          {caption ? <p className="whitespace-pre-wrap break-words">{caption}</p> : null}
        </div>

        <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
          <DialogContent className="max-w-5xl border-border bg-card p-2 text-card-foreground">
            <div className="space-y-3">
              <video controls autoPlay className="max-h-[80vh] w-full rounded-xl bg-black">
                <source src={resolvedUrl} type={mimeType || undefined} />
              </video>
              <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-1">
                <p className="truncate text-sm font-medium text-foreground">{fileName}</p>
                <div className="flex items-center gap-2">
                  <Button asChild size="sm" variant="outline">
                    <a href={resolvedUrl} target="_blank" rel="noreferrer">Abrir</a>
                  </Button>
                  <Button asChild size="sm">
                    <a href={resolvedUrl} download={fileName}>Baixar</a>
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (isAudio) {
    return (
      <div className="min-w-[240px] space-y-2">
        <div className="rounded-xl border border-border bg-card/70 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Mic className="h-4 w-4" />
            <span className="truncate">{fileName}</span>
          </div>
          <audio controls preload="metadata" className="w-full">
            <source src={resolvedUrl} type={mimeType || undefined} />
          </audio>
        </div>
        {caption ? <p className="whitespace-pre-wrap break-words">{caption}</p> : null}
      </div>
    );
  }

  const icon = msg.message_type === "image"
    ? <ImageIcon className="h-5 w-5 text-muted-foreground" />
    : msg.message_type === "video"
    ? <Video className="h-5 w-5 text-muted-foreground" />
    : msg.message_type === "audio"
    ? <Mic className="h-5 w-5 text-muted-foreground" />
    : <FileText className="h-5 w-5 text-muted-foreground" />;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
        {icon}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground">{fileName}</p>
          <p className="text-xs text-muted-foreground">
            {inlineReady ? (mimeType || "Abrir arquivo") : "Mídia recebida sem preview disponível"}
          </p>
        </div>
        {resolvedUrl ? (
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline">
              <a href={resolvedUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            <Button asChild size="sm">
              <a href={resolvedUrl} download={fileName}>
                <Download className="h-4 w-4" />
              </a>
            </Button>
          </div>
        ) : null}
      </div>
      {caption ? <p className="whitespace-pre-wrap break-words">{caption}</p> : null}
    </div>
  );
}
