import { type LucideProps } from "lucide-react";
import { forwardRef } from "react";

const WhatsAppSvg = forwardRef<SVGSVGElement, LucideProps>(
  ({ size = 24, color = "currentColor", strokeWidth: _sw, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
      <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
    </svg>
  )
);
WhatsAppSvg.displayName = "WhatsAppSvg";

/** Purple WhatsApp icon for Plantão (global instance) */
export const WhatsAppPlantaoIcon = forwardRef<SVGSVGElement, LucideProps>(
  (props, ref) => <WhatsAppSvg ref={ref} color="#a855f7" {...props} />
);
WhatsAppPlantaoIcon.displayName = "WhatsAppPlantaoIcon";

/** Green WhatsApp icon for Inbox (personal instance) */
export const WhatsAppInboxIcon = forwardRef<SVGSVGElement, LucideProps>(
  (props, ref) => <WhatsAppSvg ref={ref} color="#22c55e" {...props} />
);
WhatsAppInboxIcon.displayName = "WhatsAppInboxIcon";
