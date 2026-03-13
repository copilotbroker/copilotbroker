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
  created_by_broker_id?: string | null;
  landing_content?: any;
}

interface BrokerProject {
  id: string;
  project: Project;
  url: string;
}

interface Broker {
  id: string;
  slug: string;
  name: string;
}

export function useBrokerProjects(brokerId?: string | null) {
  const [broker, setBroker] = useState<Broker | null>(null);
  const [brokerProjects, setBrokerProjects] = useState<BrokerProject[]>([]);
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [myCreatedProjects, setMyCreatedProjects] = useState<BrokerProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const buildUrl = (project: Project, brokerSlug: string, forBrokerId?: string) => {
    // Broker-owned projects use /corretor/cidade/projeto (no broker slug in URL)
    if (project.created_by_broker_id && project.created_by_broker_id === forBrokerId) {
      return `/corretor/${project.city_slug}/${project.slug}`;
    }
    if (project.slug === "estanciavelha") return `/estanciavelha/${brokerSlug}`;
    if (project.slug === "prontos") return `/prontos/${brokerSlug}`;
    return `/${project.city_slug}/${project.slug}/${brokerSlug}`;
  };

  const fetchBroker = useCallback(async () => {
    if (!brokerId) return;
    const { data, error } = await supabase
      .from("brokers")
      .select("id, slug, name")
      .eq("id", brokerId)
      .maybeSingle();
    if (error) { console.error("Error fetching broker:", error); return; }
    setBroker(data);
  }, [brokerId]);

  const fetchBrokerProjects = useCallback(async () => {
    if (!brokerId || !broker) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("broker_projects")
        .select(`id, project:projects(id, name, slug, city, city_slug, type, created_by_broker_id, landing_content)`)
        .eq("broker_id", brokerId)
        .eq("is_active", true);
      if (error) throw error;

      const companyProjects: BrokerProject[] = [];
      const ownProjects: BrokerProject[] = [];

      (data || []).filter((bp: any) => bp.project).forEach((bp: any) => {
        const item: BrokerProject = {
          id: bp.id,
          project: bp.project as Project,
          url: buildUrl(bp.project as Project, broker.slug),
        };
        if (bp.project.created_by_broker_id === brokerId) {
          ownProjects.push(item);
        } else {
          companyProjects.push(item);
        }
      });

      setBrokerProjects(companyProjects);
      setMyCreatedProjects(ownProjects);
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

  const updateSlug = async (newSlug: string) => {
    if (!brokerId || !newSlug.trim()) return false;
    setIsSaving(true);
    try {
      const { data: existing } = await supabase.from("brokers").select("id").eq("slug", newSlug).neq("id", brokerId).maybeSingle();
      if (existing) { toast.error("Este link já está em uso por outro corretor."); return false; }

      const { error } = await supabase.from("brokers").update({ slug: newSlug }).eq("id", brokerId);
      if (error) throw error;

      setBroker((prev) => prev ? { ...prev, slug: newSlug } : null);
      const rebuildUrls = (list: BrokerProject[]) => list.map((bp) => ({ ...bp, url: buildUrl(bp.project, newSlug) }));
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
    return buildUrl(project, broker.slug);
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

  return {
    broker,
    brokerProjects,
    myCreatedProjects,
    availableProjects,
    unassociatedProjects,
    isLoading,
    isSaving,
    addProject,
    removeProject,
    updateSlug,
    checkSlugAvailability,
    getProjectUrl,
    refetch: fetchBrokerProjects,
    totalProjects: availableProjects.length,
    pendingCount: unassociatedProjects.length,
  };
}
