import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  slug: string;
  city: string;
  city_slug: string | null;
  type?: string;
  is_active?: boolean;
  created_by_broker_id?: string | null;
  landing_content?: any;
  description?: string | null;
  status?: string;
}

interface BrokerProject {
  id: string;
  project: Project;
  url: string;
  isDraft?: boolean;
}

interface Broker {
  id: string;
  slug: string;
  name: string;
  organization_slug?: string | null;
}

export function useBrokerProjects(brokerId?: string | null) {
  const [broker, setBroker] = useState<Broker | null>(null);
  const [brokerProjects, setBrokerProjects] = useState<BrokerProject[]>([]);
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [myCreatedProjects, setMyCreatedProjects] = useState<BrokerProject[]>([]);
  const [myDraftProjects, setMyDraftProjects] = useState<BrokerProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const buildUrl = (project: Project, brokerSlug: string, forBrokerId?: string, orgSlug?: string | null) => {
    const orgPrefix = orgSlug ? `/${orgSlug}` : "";
    if (project.created_by_broker_id && project.created_by_broker_id === forBrokerId) {
      return `${orgPrefix}/${brokerSlug}/${project.city_slug}/${project.slug}`;
    }
    if (project.slug === "estanciavelha") return `${orgPrefix}/estanciavelha/${brokerSlug}`;
    if (project.slug === "prontos") return `${orgPrefix}/prontos/${brokerSlug}`;
    return `${orgPrefix}/${project.city_slug}/${project.slug}/${brokerSlug}`;
  };

  const fetchBroker = useCallback(async () => {
    if (!brokerId) return;
    const { data, error } = await supabase
      .from("brokers")
      .select("id, slug, name, organization:organizations(slug)")
      .eq("id", brokerId)
      .maybeSingle();
    if (error) { console.error("Error fetching broker:", error); return; }
    if (data) {
      setBroker({
        id: (data as any).id,
        slug: (data as any).slug,
        name: (data as any).name,
        organization_slug: (data as any).organization?.slug ?? null,
      });
    }
  }, [brokerId]);

  const fetchBrokerProjects = useCallback(async () => {
    if (!brokerId || !broker) return;
    setIsLoading(true);
    try {
      // Fetch active broker_projects
      const { data, error } = await supabase
        .from("broker_projects")
        .select(`id, project:projects(id, name, slug, city, city_slug, type, created_by_broker_id, landing_content, is_active, description, status)`)
        .eq("broker_id", brokerId)
        .eq("is_active", true);
      if (error) throw error;

      const companyProjects: BrokerProject[] = [];
      const ownProjects: BrokerProject[] = [];

      (data || []).filter((bp: any) => bp.project).forEach((bp: any) => {
        const project = bp.project as Project;
        // Skip drafts from the active list — they'll be shown separately
        if (project.created_by_broker_id === brokerId && !project.is_active) return;
        const item: BrokerProject = {
          id: bp.id,
          project,
          url: buildUrl(project, broker.slug, brokerId, broker.organization_slug),
        };
        if (project.created_by_broker_id === brokerId) {
          ownProjects.push(item);
        } else {
          companyProjects.push(item);
        }
      });

      setBrokerProjects(companyProjects);
      setMyCreatedProjects(ownProjects);

      // Fetch draft projects (is_active = false, created by this broker)
      const { data: drafts, error: draftError } = await supabase
        .from("projects")
        .select("id, name, slug, city, city_slug, type, created_by_broker_id, landing_content, is_active, description, status")
        .eq("created_by_broker_id", brokerId)
        .eq("is_active", false);
      
      if (!draftError && drafts) {
        const draftItems: BrokerProject[] = drafts.map((p: any) => ({
          id: p.id, // use project id as identifier for drafts
          project: p as Project,
          url: "",
          isDraft: true,
        }));
        setMyDraftProjects(draftItems);
      }
    } catch (error) {
      console.error("Error fetching broker projects:", error);
    } finally {
      setIsLoading(false);
    }
  }, [brokerId, broker]);

  const fetchAvailableProjects = useCallback(async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("id, name, slug, city, city_slug, type, created_by_broker_id")
      .eq("is_active", true)
      .is("created_by_broker_id", null)
      .order("name");
    if (error) { console.error("Error fetching available projects:", error); return; }
    setAvailableProjects(data || []);
  }, []);

  const addProject = async (projectId: string) => {
    if (!brokerId) return false;
    setIsSaving(true);
    try {
      const { data: existing } = await supabase
        .from("broker_projects")
        .select("id, is_active")
        .eq("broker_id", brokerId)
        .eq("project_id", projectId)
        .maybeSingle();

      if (existing) {
        if (existing.is_active) { toast.info("Este empreendimento já está associado."); return false; }
        const { error } = await supabase.from("broker_projects").update({ is_active: true }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("broker_projects").insert({ broker_id: brokerId, project_id: projectId, is_active: true });
        if (error) throw error;
      }
      toast.success("Empreendimento adicionado!");
      await fetchBrokerProjects();
      return true;
    } catch (error) {
      console.error("Error adding project:", error);
      toast.error("Erro ao adicionar empreendimento.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const removeProject = async (brokerProjectId: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from("broker_projects").update({ is_active: false }).eq("id", brokerProjectId);
      if (error) throw error;
      toast.success("Empreendimento removido!");
      await fetchBrokerProjects();
      return true;
    } catch (error) {
      console.error("Error removing project:", error);
      toast.error("Erro ao remover empreendimento.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteDraft = async (projectId: string) => {
    setIsSaving(true);
    try {
      // Remove broker_projects link if exists
      await supabase.from("broker_projects").delete().eq("project_id", projectId).eq("broker_id", brokerId!);
      // Delete the project
      const { error } = await supabase.from("projects").delete().eq("id", projectId);
      if (error) throw error;
      toast.success("Rascunho excluído!");
      await fetchBrokerProjects();
      return true;
    } catch (error) {
      console.error("Error deleting draft:", error);
      toast.error("Erro ao excluir rascunho.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const updateSlug = async (newSlug: string) => {
    if (!brokerId || !newSlug.trim()) return false;
    setIsSaving(true);
    try {
      const { data: existing } = await supabase.from("brokers").select("id").eq("slug", newSlug).neq("id", brokerId).maybeSingle();
      if (existing) { toast.error("Este link já está em uso por outro corretor."); return false; }

      const { error } = await supabase.from("brokers").update({ slug: newSlug }).eq("id", brokerId);
      if (error) throw error;

      setBroker((prev) => prev ? { ...prev, slug: newSlug } : null);
      const rebuildUrls = (list: BrokerProject[]) => list.map((bp) => ({ ...bp, url: buildUrl(bp.project, newSlug, brokerId, broker?.organization_slug) }));
      setBrokerProjects(rebuildUrls);
      setMyCreatedProjects(rebuildUrls);

      toast.success("Link atualizado com sucesso!");
      return true;
    } catch (error) {
      console.error("Error updating slug:", error);
      toast.error("Erro ao atualizar link.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const checkSlugAvailability = async (slug: string) => {
    if (!slug.trim() || !brokerId) return false;
    const { data } = await supabase.from("brokers").select("id").eq("slug", slug).neq("id", brokerId).maybeSingle();
    return !data;
  };

  const getProjectUrl = (project: Project) => {
    if (!broker) return "";
    return buildUrl(project, broker.slug, brokerId, broker.organization_slug);
  };

  const unassociatedProjects = availableProjects.filter(
    (p) => !brokerProjects.some((bp) => bp.project.id === p.id)
  );

  useEffect(() => {
    fetchBroker();
    fetchAvailableProjects();
  }, [fetchBroker, fetchAvailableProjects]);

  useEffect(() => {
    if (broker) fetchBrokerProjects();
  }, [broker, fetchBrokerProjects]);

  const inactivateProject = async (projectId: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from("projects").update({ is_active: false }).eq("id", projectId);
      if (error) throw error;
      toast.success("Imóvel inativado!");
      await fetchBrokerProjects();
      return true;
    } catch (error) {
      console.error("Error inactivating project:", error);
      toast.error("Erro ao inativar imóvel.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    broker,
    brokerProjects,
    myCreatedProjects,
    myDraftProjects,
    availableProjects,
    unassociatedProjects,
    isLoading,
    isSaving,
    addProject,
    removeProject,
    deleteDraft,
    inactivateProject,
    updateSlug,
    checkSlugAvailability,
    getProjectUrl,
    refetch: fetchBrokerProjects,
    totalProjects: availableProjects.length,
    pendingCount: unassociatedProjects.length,
  };
}
