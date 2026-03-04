import { LandingContent } from "@/types/project";

interface Props {
  content: LandingContent["footer"];
  theme: LandingContent["theme"];
}

export default function DynamicFooter({ content, theme }: Props) {
  return (
    <footer className="py-10 px-4 text-center" style={{ backgroundColor: theme.accentColor }}>
      <p className="text-sm font-semibold mb-2" style={{ color: theme.primaryColor }}>
        {content.companyName}
      </p>
      <p className="text-xs max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.4)" }}>
        {content.disclaimer}
      </p>
    </footer>
  );
}
