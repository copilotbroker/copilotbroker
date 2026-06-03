import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Mic, Pause, Play, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { renderTextWithLinks } from "@/lib/linkify";

interface TranscriptionMeta {
  status?: "pending" | "done" | "failed" | "rate_limited" | string;
  text?: string;
  model?: string;
  generated_at?: string;
  error?: string;
}

interface OpusAudioPlayerProps {
  url: string;
  mimeType: string;
  fileName: string;
  caption?: string;
  messageId: string;
  transcription?: TranscriptionMeta | null;
}

// In-memory cache so re-renders don't re-decode.
const bufferCache = new Map<string, AudioBuffer>();
let sharedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!sharedCtx) {
    const Ctor = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    sharedCtx = new Ctor();
  }
  return sharedCtx;
}

function nativeCanPlay(mimeType: string, url: string): boolean {
  if (typeof document === "undefined") return false;
  try {
    const a = document.createElement("audio");
    const u = url.split("?")[0].toLowerCase();
    const isOgg = mimeType.toLowerCase().includes("ogg") || mimeType.toLowerCase().includes("opus")
      || u.endsWith(".ogg") || u.endsWith(".opus");
    const tries = [
      mimeType || "",
      isOgg ? 'audio/ogg; codecs="opus"' : "",
      isOgg ? "audio/ogg" : "",
    ].filter(Boolean);
    for (const t of tries) {
      const r = a.canPlayType(t);
      if (r === "probably") return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function decodeOpusToBuffer(url: string): Promise<AudioBuffer> {
  if (bufferCache.has(url)) return bufferCache.get(url)!;
  const ctx = getAudioContext();
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Falha ao baixar áudio (${resp.status})`);
  const arr = await resp.arrayBuffer();

  // Try native decode first (works for mp3/m4a/wav and Chrome's opus support).
  try {
    const buf = await ctx.decodeAudioData(arr.slice(0));
    bufferCache.set(url, buf);
    return buf;
  } catch {
    // Fall back to wasm Opus decoder.
  }

  const { OggOpusDecoder } = await import("ogg-opus-decoder");
  const decoder = new OggOpusDecoder();
  await decoder.ready;
  const { channelData, sampleRate } = await decoder.decodeFile(new Uint8Array(arr));
  decoder.free();

  if (!channelData.length || !channelData[0].length) throw new Error("Áudio vazio");
  const length = channelData[0].length;
  const buf = ctx.createBuffer(channelData.length, length, sampleRate);
  for (let ch = 0; ch < channelData.length; ch++) {
    const src = channelData[ch];
    const copy = new Float32Array(src.length);
    copy.set(src);
    buf.copyToChannel(copy, ch);
  }
  bufferCache.set(url, buf);
  return buf;
}

function fmt(t: number): string {
  if (!isFinite(t) || t < 0) t = 0;
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function OpusAudioPlayer({ url, mimeType, fileName, caption, messageId, transcription }: OpusAudioPlayerProps) {
  const [useNative] = useState(() => nativeCanPlay(mimeType, url));
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  // WASM path state
  const [buffer, setBuffer] = useState<AudioBuffer | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [rate, setRate] = useState(1);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startedAtRef = useRef<number>(0);
  const offsetRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  const duration = buffer?.duration ?? 0;

  const tick = useCallback(() => {
    if (!sourceRef.current || !buffer) return;
    const ctx = getAudioContext();
    const elapsed = (ctx.currentTime - startedAtRef.current) * rate + offsetRef.current;
    if (elapsed >= buffer.duration) {
      setPosition(buffer.duration);
      setPlaying(false);
      offsetRef.current = 0;
      return;
    }
    setPosition(elapsed);
    rafRef.current = requestAnimationFrame(tick);
  }, [buffer, rate]);

  const stopWasm = useCallback(() => {
    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch { /* ignore */ }
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const playWasm = useCallback(async (fromOffset: number) => {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") await ctx.resume();
    let buf = buffer;
    if (!buf) {
      setLoading(true);
      setLoadError(null);
      try {
        buf = await decodeOpusToBuffer(url);
        setBuffer(buf);
      } catch (e: any) {
        setLoadError(e?.message || "Falha ao decodificar áudio");
        setLoading(false);
        return;
      }
      setLoading(false);
    }
    stopWasm();
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = rate;
    src.connect(ctx.destination);
    src.onended = () => {
      // natural end (not from manual stop)
      if (sourceRef.current === src) {
        setPlaying(false);
        offsetRef.current = 0;
        setPosition(buf!.duration);
      }
    };
    src.start(0, fromOffset);
    sourceRef.current = src;
    startedAtRef.current = ctx.currentTime;
    offsetRef.current = fromOffset;
    setPlaying(true);
    rafRef.current = requestAnimationFrame(tick);
  }, [buffer, rate, stopWasm, tick, url]);

  const togglePlayWasm = useCallback(async () => {
    if (playing) {
      const ctx = getAudioContext();
      const elapsed = (ctx.currentTime - startedAtRef.current) * rate + offsetRef.current;
      offsetRef.current = Math.min(elapsed, duration);
      stopWasm();
      setPlaying(false);
    } else {
      await playWasm(offsetRef.current >= duration ? 0 : offsetRef.current);
    }
  }, [playing, rate, duration, stopWasm, playWasm]);

  const seekWasm = useCallback((next: number) => {
    offsetRef.current = Math.max(0, Math.min(next, duration || 0));
    setPosition(offsetRef.current);
    if (playing) {
      playWasm(offsetRef.current);
    }
  }, [duration, playing, playWasm]);

  const cycleRate = useCallback(() => {
    const order = [1, 1.5, 2];
    const idx = order.indexOf(rate);
    const next = order[(idx + 1) % order.length];
    setRate(next);
    if (useNative && audioElRef.current) {
      audioElRef.current.playbackRate = next;
    } else if (playing && buffer) {
      // restart at current offset with new rate
      const ctx = getAudioContext();
      const elapsed = (ctx.currentTime - startedAtRef.current) * rate + offsetRef.current;
      offsetRef.current = Math.min(elapsed, buffer.duration);
      stopWasm();
      // playWasm will use the new rate from state on next tick — use immediate next via setTimeout
      setTimeout(() => playWasm(offsetRef.current), 0);
    }
  }, [rate, useNative, playing, buffer, stopWasm, playWasm]);

  useEffect(() => () => stopWasm(), [stopWasm]);

  return (
    <div className="min-w-[260px] max-w-[360px] space-y-2">
      <div className="rounded-2xl border border-border bg-card/70 p-3">
        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Mic className="h-3.5 w-3.5" />
          <span className="truncate">{fileName || "Áudio"}</span>
        </div>

        {useNative ? (
          <audio
            ref={audioElRef}
            controls
            preload="metadata"
            className="w-full"
            src={url}
          />
        ) : (
          <NativeFallbackUI
            loading={loading}
            error={loadError}
            playing={playing}
            position={position}
            duration={duration}
            rate={rate}
            onToggle={togglePlayWasm}
            onSeek={seekWasm}
            onCycleRate={cycleRate}
          />
        )}
      </div>

      <TranscriptionBlock messageId={messageId} transcription={transcription} />

      {caption ? <p className="whitespace-pre-wrap break-words">{renderTextWithLinks(caption)}</p> : null}
    </div>
  );
}

function NativeFallbackUI({
  loading, error, playing, position, duration, rate,
  onToggle, onSeek, onCycleRate,
}: {
  loading: boolean;
  error: string | null;
  playing: boolean;
  position: number;
  duration: number;
  rate: number;
  onToggle: () => void;
  onSeek: (t: number) => void;
  onCycleRate: () => void;
}) {
  const pct = duration > 0 ? Math.min(100, (position / duration) * 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="h-9 w-9 shrink-0 rounded-full"
          onClick={onToggle}
          disabled={loading}
          aria-label={playing ? "Pausar" : "Tocar"}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>

        <div
          className="relative h-2 flex-1 cursor-pointer rounded-full bg-muted"
          onClick={(e) => {
            if (!duration) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            onSeek((x / rect.width) * duration);
          }}
        >
          <div className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>

        <button
          type="button"
          onClick={onCycleRate}
          className="shrink-0 rounded-md border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground"
          aria-label="Velocidade"
        >
          {rate}x
        </button>
      </div>

      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{fmt(position)}</span>
        <span>{fmt(duration)}</span>
      </div>

      {error ? <p className="text-[11px] text-destructive">{error}</p> : null}
    </div>
  );
}

function TranscriptionBlock({ messageId, transcription }: { messageId: string; transcription?: TranscriptionMeta | null }) {
  const [retrying, setRetrying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const status = transcription?.status || (transcription?.text ? "done" : "pending");
  const text = transcription?.text || "";

  const retry = useCallback(async () => {
    if (retrying) return;
    setRetrying(true);
    try {
      await supabase.functions.invoke("transcribe-audio", { body: { message_id: messageId } });
    } catch (e) {
      console.warn("transcribe-audio retry failed", e);
    } finally {
      setRetrying(false);
    }
  }, [messageId, retrying]);

  if (status === "done" && text) {
    const long = text.length > 220;
    const display = !long || expanded ? text : `${text.slice(0, 220).trim()}…`;
    return (
      <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2">
        <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Transcrição</div>
        <p className="whitespace-pre-wrap break-words text-xs leading-relaxed text-foreground/90">{display}</p>
        {long ? (
          <button type="button" onClick={() => setExpanded((v) => !v)} className="mt-1 text-[10px] font-medium text-primary hover:underline">
            {expanded ? "Mostrar menos" : "Mostrar mais"}
          </button>
        ) : null}
      </div>
    );
  }

  if (status === "failed" || status === "rate_limited") {
    return (
      <div className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-2">
        <span className="text-[11px] text-muted-foreground">
          {status === "rate_limited" ? "Limite de transcrição atingido." : "Não foi possível transcrever."}
        </span>
        <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-[11px]" onClick={retry} disabled={retrying}>
          <RefreshCw className={`mr-1 h-3 w-3 ${retrying ? "animate-spin" : ""}`} /> Tentar novamente
        </Button>
      </div>
    );
  }

  // pending / unknown
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
      <Loader2 className="h-3 w-3 animate-spin" />
      <span>Transcrevendo áudio…</span>
    </div>
  );
}
