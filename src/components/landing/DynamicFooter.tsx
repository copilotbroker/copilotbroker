import { LandingContent } from "@/types/project";
import { getMutedTextColor, getReadableTextColor } from "@/lib/landing-theme";

interface Props {
  content: LandingContent["footer"];
  theme: LandingContent["theme"];
}

export default function DynamicFooter({ content, theme }: Props) {
  const headingColor = getReadableTextColor(theme.accentColor);
  const bodyColor = getMutedTextColor(theme.accentColor);

  return (
    <footer className="py-10 px-4 text-center" style={{ backgroundColor: theme.accentColor }}>
      <p className="text-sm font-semibold mb-2" style={{ color: headingColor }}>
        {content.companyName}
      </p>
      <p className="text-xs max-w-2xl mx-auto" style={{ color: bodyColor }}>
        {content.disclaimer}
      </p>
    </footer>
  );
}
