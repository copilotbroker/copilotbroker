import { useEffect, useRef, useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import DynamicLandingPage from "@/components/landing/DynamicLandingPage";
import { LandingContent, Project } from "@/types/project";

interface Props {
  project: Project;
  previewContent?: LandingContent;
}

const DEVICES = {
  desktop: { width: 1280, label: "Desktop", Icon: Monitor },
  mobile: { width: 390, label: "Mobile", Icon: Smartphone },
} as const;

type DeviceKey = keyof typeof DEVICES;

export default function ScaledLandingPreview({ project, previewContent }: Props) {
  const [device, setDevice] = useState<DeviceKey>("desktop");
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [containerHeight, setContainerHeight] = useState(0);

  const deviceWidth = DEVICES[device].width;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      setScale(Math.min(1, w / deviceWidth));
      setContainerHeight(h);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [deviceWidth]);

  const scaledHeight = containerHeight > 0 ? containerHeight / scale : 0;

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
      <div ref={containerRef} className="flex-1 overflow-hidden bg-white">
        <div
          className="overflow-y-auto mx-auto"
          style={{
            width: deviceWidth * scale,
            height: "100%",
          }}
        >
          <div
            style={{
              width: deviceWidth,
              height: scaledHeight || undefined,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <DynamicLandingPage project={project} previewContent={previewContent} />
          </div>
        </div>
      </div>
    </div>
  );
}
