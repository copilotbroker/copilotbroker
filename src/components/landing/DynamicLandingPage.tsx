import { Project, LandingContent } from "@/types/project";
import DynamicHero from "./DynamicHero";
import DynamicAbout from "./DynamicAbout";
import DynamicFeatures from "./DynamicFeatures";
import DynamicUrgency from "./DynamicUrgency";
import DynamicBenefits from "./DynamicBenefits";
import DynamicCTA from "./DynamicCTA";
import DynamicFooter from "./DynamicFooter";
import FormSection from "@/components/FormSection";
import FloatingCTA from "@/components/FloatingCTA";

interface Props {
  project: Project;
  /** If passed, renders in preview mode using this content instead of project.landing_content */
  previewContent?: LandingContent;
}

export default function DynamicLandingPage({ project, previewContent }: Props) {
  const content = previewContent || project.landing_content;
  if (!content) return null;

  return (
    <div className="min-h-screen">
      <main>
        <DynamicHero content={content.hero} theme={content.theme} />
        <DynamicAbout content={content.about} theme={content.theme} />
        <DynamicFeatures content={content.features} theme={content.theme} />
        <DynamicUrgency content={content.urgency} theme={content.theme} />
        <DynamicBenefits content={content.benefits} theme={content.theme} />
        <DynamicCTA content={content.cta} theme={content.theme} />
        <FormSection
          projectId={project.id}
          projectSlug={project.slug}
          allowBrokerSelection={true}
          webhookUrl={project.webhook_url}
        />
      </main>
      <DynamicFooter content={content.footer} theme={content.theme} />
      <FloatingCTA />
    </div>
  );
}
