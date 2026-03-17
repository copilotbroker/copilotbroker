import { Project, LandingContent, CustomSection } from "@/types/project";
import DynamicHero from "./DynamicHero";
import DynamicAbout from "./DynamicAbout";
import DynamicFeatures from "./DynamicFeatures";
import DynamicUrgency from "./DynamicUrgency";
import DynamicBenefits from "./DynamicBenefits";
import DynamicCTA from "./DynamicCTA";
import DynamicFooter from "./DynamicFooter";
import FormSection from "@/components/FormSection";
import FloatingCTA from "@/components/FloatingCTA";
import iconMap from "./iconMap";

function DynamicCustomSection({ section, theme }: { section: CustomSection; theme: LandingContent["theme"] }) {
  const sectionBg = `${theme.accentColor}08`;
  const textColor = theme.accentColor.toLowerCase() === "#ffffff" ? "#0F172A" : undefined;
  const mutedColor = textColor ? "rgba(15,23,42,0.78)" : undefined;

  return (
    <section className="py-12 px-4 md:py-16 md:px-8" style={{ backgroundColor: sectionBg }}>
      <div className="max-w-5xl mx-auto">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-6 md:mb-8" style={{ color: textColor || theme.primaryColor }}>
          {section.title}
        </h2>
        {section.description && (
          <p className="text-center mb-6 md:mb-8 max-w-2xl mx-auto text-sm md:text-base" style={{ color: mutedColor || "rgba(15,23,42,0.78)" }}>{section.description}</p>
        )}
        {section.type === "embed" && section.embedUrl && (
          <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-200">
            <iframe
              src={section.embedUrl}
              className="w-full"
              style={{ height: "min(500px, 70vw)" }}
              frameBorder="0"
              allowFullScreen
              loading="lazy"
              title={section.title}
            />
          </div>
        )}
        {section.type === "gallery" && section.items && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {section.items.map((item, i) => (
              <div key={i} className="rounded-xl overflow-hidden shadow-lg bg-white/90">
                {item.imageUrl && <img src={item.imageUrl} alt={item.text} className="w-full h-48 sm:h-52 object-cover" />}
                {item.text && <p className="p-3 text-sm text-center" style={{ color: "rgba(15,23,42,0.82)" }}>{item.text}</p>}
              </div>
            ))}
          </div>
        )}
        {section.type === "stats" && section.items && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {section.items.map((item, i) => {
              const Icon = item.icon ? iconMap[item.icon] : null;
              return (
                <div key={i} className="text-center p-6 rounded-xl bg-white/90 shadow-md border border-gray-100">
                  {Icon && <Icon className="w-8 h-8 mx-auto mb-3" style={{ color: theme.primaryColor }} />}
                  {item.value && <p className="text-3xl font-bold mb-1" style={{ color: "#0F172A" }}>{item.value}</p>}
                  <p className="text-sm" style={{ color: "rgba(15,23,42,0.78)" }}>{item.text}</p>
                </div>
              );
            })}
          </div>
        )}
        {section.type === "text" && section.items && (
          <div className="space-y-4 max-w-3xl mx-auto">
            {section.items.map((item, i) => (
              <p key={i} className="leading-relaxed" style={{ color: mutedColor || "rgba(15,23,42,0.82)" }}>{item.text}</p>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

interface Props {
  project: Project;
  previewContent?: LandingContent;
  brokerId?: string | null;
  brokerSlug?: string | null;
}

export default function DynamicLandingPage({ project, previewContent, brokerId, brokerSlug }: Props) {
  const content = previewContent || project.landing_content;
  const isPreview = !!previewContent;
  const isBrokerOwnedLanding = !!project.created_by_broker_id;
  if (!content) return null;

  return (
    <div className="min-h-screen">
      <main>
        <DynamicHero content={content.hero} theme={content.theme} />
        <DynamicAbout content={content.about} theme={content.theme} />
        <DynamicFeatures content={content.features} theme={content.theme} />
        {content.customSections?.map((section, i) => (
          <DynamicCustomSection key={i} section={section} theme={content.theme} />
        ))}
        <DynamicUrgency content={content.urgency} theme={content.theme} />
        <DynamicBenefits content={content.benefits} theme={content.theme} />
        <DynamicCTA content={content.cta} theme={content.theme} />
        {!isPreview && (
          <FormSection
            projectId={project.id}
            projectSlug={project.slug}
            brokerId={brokerId || project.created_by_broker_id}
            brokerSlug={brokerSlug}
            allowBrokerSelection={!isBrokerOwnedLanding}
            webhookUrl={project.webhook_url}
          />
        )}
      </main>
      <DynamicFooter content={content.footer} theme={content.theme} />
      {!isPreview && <FloatingCTA />}
    </div>
  );
}
