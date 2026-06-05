import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Monitor, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import DynamicLandingPage from "@/components/landing/DynamicLandingPage";
import { LandingContent, Project } from "@/types/project";

interface Props {
  project: Project;
  previewContent?: LandingContent;
  brokerId?: string | null;
  brokerName?: string | null;
}

const DEVICES = {
  desktop: { width: 1280, label: "Desktop", Icon: Monitor },
  mobile: { width: 390, label: "Mobile", Icon: Smartphone },
} as const;

type DeviceKey = keyof typeof DEVICES;

/**
 * Renderiza children dentro de um iframe usando React portal.
 * O iframe tem seu próprio viewport, então media queries (md:, lg:)
 * disparam de acordo com a largura real do iframe — exatamente
 * como ficará na página publicada em um dispositivo daquele tamanho.
 */
function IframePortal({
  width,
  scale,
  children,
}: {
  width: number;
  scale: number;
  children: React.ReactNode;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const setup = () => {
      const doc = iframe.contentDocument;
      if (!doc) return;

      // Reset doc
      doc.open();
      doc.write(
        '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body></body></html>'
      );
      doc.close();

      // Copia estilos do documento pai para o iframe
      const head = doc.head;
      Array.from(
        document.querySelectorAll('style, link[rel="stylesheet"]')
      ).forEach((node) => {
        head.appendChild(node.cloneNode(true));
      });

      // Observa novos estilos inseridos pelo Vite/HMR
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((m) => {
          m.addedNodes.forEach((node) => {
            if (
              node instanceof HTMLStyleElement ||
              (node instanceof HTMLLinkElement && node.rel === "stylesheet")
            ) {
              head.appendChild(node.cloneNode(true));
            }
          });
        });
      });
      observer.observe(document.head, { childList: true });

      doc.body.style.margin = "0";
      setMountNode(doc.body);

      return () => observer.disconnect();
    };

    // iframe pode não estar pronto imediatamente
    if (iframe.contentDocument?.readyState === "complete") {
      return setup();
    }
    iframe.addEventListener("load", setup);
    return () => iframe.removeEventListener("load", setup);
  }, []);

  return (
    <iframe
      ref={iframeRef}
      title="landing-preview"
      style={{
        width,
        height: `calc(100% / ${scale})`,
        border: "none",
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        background: "white",
      }}
    >
      {mountNode && createPortal(children, mountNode)}
    </iframe>
  );
}

export default function ScaledLandingPreview({ project, previewContent }: Props) {
  const [device, setDevice] = useState<DeviceKey>("desktop");
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const deviceWidth = DEVICES[device].width;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      setScale(Math.min(1, w / deviceWidth));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [deviceWidth]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-center gap-1 p-2 border-b border-[#2a2a2e] bg-[#0f0f12]">
        {(Object.keys(DEVICES) as DeviceKey[]).map((key) => {
          const { Icon, label } = DEVICES[key];
          const active = device === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setDevice(key)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                active
                  ? "bg-[#FFFF00] text-black"
                  : "text-slate-300 hover:bg-[#1e1e22]"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          );
        })}
      </div>
      <div ref={containerRef} className="flex-1 overflow-hidden bg-[#0a0a0f] flex justify-center">
        <div
          style={{
            width: deviceWidth * scale,
            height: "100%",
          }}
        >
          <IframePortal width={deviceWidth} scale={scale}>
            <DynamicLandingPage project={project} previewContent={previewContent} />
          </IframePortal>
        </div>
      </div>
    </div>
  );
}
