import { useState, useMemo } from "react";
import { useProjects, useProjectStats } from "@/hooks/use-projects";
import { Project, PROJECT_STATUS_CONFIG, ProjectStatus } from "@/types/project";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Building2, MapPin, Users, ExternalLink, Pencil, RefreshCw, Sparkles,
  Home, FileEdit, EyeOff, Eye,
} from "lucide-react";
import ProjectWizard from "./ProjectWizard";

function ProjectStatsCard({ projectId }: { projectId: string }) {
  const { stats, isLoading } = useProjectStats(projectId);
  if (isLoading) return <span className="text-slate-500">...</span>;
  return (
    <span className="text-sm text-slate-400">
      {stats.totalLeads} leads ({stats.todayLeads} hoje)
    </span>
  );
}

interface ProjectFormData {
  name: string;
  slug: string;
  city: string;
  city_slug: string;
  description: string;
  status: ProjectStatus;
  hero_title: string;
  hero_subtitle: string;
  webhook_url: string;
  ai_prompt: string;
}

const initialFormData: ProjectFormData = {
  name: "", slug: "", city: "", city_slug: "", description: "", status: "pre_launch",
  hero_title: "", hero_subtitle: "", webhook_url: "", ai_prompt: "",
};

function ProjectCard({ project, onEdit, onEditLanding, onToggleStatus }: {
  project: Project;
  onEdit: (p: Project) => void;
  onEditLanding: (p: Project) => void;
  onToggleStatus: (id: string, active: boolean) => void;
}) {
  const statusConfig = PROJECT_STATUS_CONFIG[project.status] || { label: project.status, color: 'text-slate-400', bgColor: 'bg-slate-800/30 border-slate-700' };
  const isBrokerCreated = !!project.created_by_broker_id;

  return (
    <div className={`relative bg-[#1e1e22] border border-[#2a2a2e] rounded-xl overflow-hidden ${!project.is_active ? "opacity-60" : ""}`}>
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-semibold text-white truncate">{project.name}</h3>
              {project.landing_content && (
                <Badge variant="outline" className="text-[10px] border-[#FFFF00]/40 text-[#FFFF00] bg-[#FFFF00]/10">
                  <Sparkles className="w-3 h-3 mr-0.5" />
                  Landing IA
                </Badge>
              )}
              {isBrokerCreated && (
                <Badge variant="outline" className="text-[10px] border-cyan-500/40 text-cyan-400 bg-cyan-500/10">
                  <Home className="w-3 h-3 mr-0.5" />
                  Corretor
                </Badge>
              )}
            </div>
            <p className="flex items-center gap-1 text-slate-400 text-sm">
              <MapPin className="h-3 w-3" />
              {project.city}
            </p>
          </div>
          <span className={`px-2 py-0.5 text-xs rounded-full border shrink-0 ${statusConfig.bgColor} ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
        </div>
      </div>
      <div className="px-4 pb-4 space-y-4">
        {project.description && (
          <p className="text-sm text-slate-400 line-clamp-2">{project.description}</p>
        )}
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-slate-500" />
          <ProjectStatsCard projectId={project.id} />
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-[#2a2a2e]">
          <div className="flex items-center gap-2">
            <Switch
              checked={project.is_active}
              onCheckedChange={(checked) => onToggleStatus(project.id, checked)}
            />
            <span className="text-sm text-slate-400">{project.is_active ? "Ativo" : "Inativo"}</span>
          </div>
          <div className="flex gap-1">
            {project.landing_content && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEditLanding(project)}
                className="hover:bg-[#2a2a2e] text-[#FFFF00]"
                title="Editar Landing IA"
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(project)}
              className="hover:bg-[#2a2a2e] text-slate-400"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" asChild className="hover:bg-[#2a2a2e] text-slate-400">
              <a href={`/${project.city_slug}/${project.slug}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectManagement() {
  const { projects, isLoading, fetchProjects, createProject, updateProject, toggleProjectStatus } = useProjects();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>(initialFormData);
  const [showWizard, setShowWizard] = useState(false);
  const [editLandingProject, setEditLandingProject] = useState<Project | null>(null);

  // Categorize projects
  const { activeCompany, activeBroker, inactiveProjects, draftProjects } = useMemo(() => {
    const activeCompany: Project[] = [];
    const activeBroker: Project[] = [];
    const inactiveProjects: Project[] = [];
    const draftProjects: Project[] = [];

    projects.forEach((p) => {
      if (!p.is_active) {
        // Check if it's a draft (no landing_content and inactive) or truly inactive
        if (!p.landing_content && p.status === "pre_launch") {
          draftProjects.push(p);
        } else {
          inactiveProjects.push(p);
        }
        return;
      }
      if (p.created_by_broker_id) {
        activeBroker.push(p);
      } else {
        activeCompany.push(p);
      }
    });

    return { activeCompany, activeBroker, inactiveProjects, draftProjects };
  }, [projects]);

  const handleOpenDialog = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        name: project.name,
        slug: project.slug,
        city: project.city,
        city_slug: project.city_slug || "",
        description: project.description || "",
        status: project.status,
        hero_title: project.hero_title || "",
        hero_subtitle: project.hero_subtitle || "",
        webhook_url: project.webhook_url || "",
        ai_prompt: (project as any).ai_prompt || "",
      });
    } else {
      setEditingProject(null);
      setFormData(initialFormData);
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.slug || !formData.city || !formData.city_slug) return;

    const projectData = {
      name: formData.name.trim(),
      slug: formData.slug.toLowerCase().replace(/[^a-z0-9-]/g, ""),
      city: formData.city.trim(),
      city_slug: formData.city_slug.toLowerCase().replace(/[^a-z0-9-]/g, ""),
      description: formData.description.trim() || null,
      status: formData.status,
      hero_title: formData.hero_title.trim() || null,
      hero_subtitle: formData.hero_subtitle.trim() || null,
      webhook_url: formData.webhook_url.trim() || null,
      ai_prompt: formData.ai_prompt.trim() || null,
    };

    if (editingProject) {
      await updateProject(editingProject.id, projectData);
    } else {
      await createProject(projectData);
    }

    setIsDialogOpen(false);
    setFormData(initialFormData);
    setEditingProject(null);
  };

  if (showWizard) {
    return (
      <ProjectWizard
        inline
        onBack={() => { setShowWizard(false); fetchProjects(true); }}
        onComplete={() => fetchProjects(true)}
      />
    );
  }

  if (editLandingProject) {
    return (
      <ProjectWizard
        inline
        onBack={() => { setEditLandingProject(null); fetchProjects(true); }}
        editProject={{
          id: editLandingProject.id,
          name: editLandingProject.name,
          slug: editLandingProject.slug,
          city: editLandingProject.city,
          city_slug: editLandingProject.city_slug,
          landing_content: editLandingProject.landing_content,
          webhook_url: editLandingProject.webhook_url,
        }}
        onComplete={() => fetchProjects(true)}
      />
    );
  }

  const renderProjectGrid = (items: Project[], emptyIcon: React.ReactNode, emptyText: string) => {
    if (items.length === 0) {
      return (
        <div className="bg-[#1e1e22] border border-[#2a2a2e] rounded-xl">
          <div className="flex flex-col items-center justify-center py-12">
            {emptyIcon}
            <p className="text-slate-400">{emptyText}</p>
          </div>
        </div>
      );
    }
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onEdit={handleOpenDialog}
            onEditLanding={setEditLandingProject}
            onToggleStatus={toggleProjectStatus}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Landing Pages</h2>
          <p className="text-slate-400">Gerencie as landing pages da imobiliária e dos corretores</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchProjects(true)}
            className="bg-[#1e1e22] border-[#2a2a2e] hover:bg-[#2a2a2e] text-slate-400"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setShowWizard(true)} className="bg-[#FFFF00] text-black hover:brightness-110 gap-1.5">
            <Sparkles className="h-4 w-4" />
            Nova Landing Page
          </Button>
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProject ? "Editar Empreendimento" : "Novo Empreendimento"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Empreendimento *</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="Ex: Residencial Alto da Serra" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade *</Label>
                  <Input id="city" value={formData.city} onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))} placeholder="Portão" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city_slug">Slug da Cidade (URL) *</Label>
                  <Input id="city_slug" value={formData.city_slug} onChange={(e) => setFormData(prev => ({ ...prev, city_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))} placeholder="portao" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug do Projeto (URL) *</Label>
                  <Input id="slug" value={formData.slug} onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))} placeholder="goldenview" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: ProjectStatus) => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(PROJECT_STATUS_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">URL: /{formData.city_slug || "cidade"}/{formData.slug || "projeto"}</p>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Descrição curta do empreendimento..." rows={2} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ai_prompt">Prompt do Agente IA (para Copiloto e Piloto Automático)</Label>
                <Textarea id="ai_prompt" value={formData.ai_prompt} onChange={(e) => setFormData(prev => ({ ...prev, ai_prompt: e.target.value }))} placeholder={`Faça uma descrição completa sobre o empreendimento...`} rows={6} />
                <p className="text-xs text-muted-foreground">Este prompt será enviado ao Copiloto e Piloto Automático dos corretores.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhook_url">Webhook URL (opcional)</Label>
                <Input id="webhook_url" type="url" value={formData.webhook_url} onChange={(e) => setFormData(prev => ({ ...prev, webhook_url: e.target.value }))} placeholder="https://webhook.example.com/..." />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">{editingProject ? "Salvar Alterações" : "Criar Empreendimento"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-[#FFFF00]" />
        </div>
      ) : (
        <Tabs defaultValue="ativas" className="space-y-4">
          <TabsList className="bg-[#1e1e22] border border-[#2a2a2e] w-full sm:w-auto">
            <TabsTrigger value="ativas" className="data-[state=active]:bg-[#2a2a2e] text-xs sm:text-sm gap-1.5">
              <Eye className="w-4 h-4" />
              Ativas ({activeCompany.length + activeBroker.length})
            </TabsTrigger>
            <TabsTrigger value="inativas" className="data-[state=active]:bg-[#2a2a2e] text-xs sm:text-sm gap-1.5">
              <EyeOff className="w-4 h-4" />
              Inativas ({inactiveProjects.length})
            </TabsTrigger>
            <TabsTrigger value="rascunhos" className="data-[state=active]:bg-[#2a2a2e] text-xs sm:text-sm gap-1.5">
              <FileEdit className="w-4 h-4" />
              Rascunhos ({draftProjects.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ativas" className="space-y-6">
            {/* Company pages */}
            {activeCompany.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#FFFF00]" />
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Imobiliária ({activeCompany.length})</p>
                </div>
                {renderProjectGrid(activeCompany, null, "")}
              </div>
            )}

            {/* Broker-created pages */}
            {activeBroker.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-cyan-400" />
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Criadas por Corretores ({activeBroker.length})</p>
                </div>
                {renderProjectGrid(activeBroker, null, "")}
              </div>
            )}

            {activeCompany.length === 0 && activeBroker.length === 0 && (
              <div className="bg-[#1e1e22] border border-[#2a2a2e] rounded-xl">
                <div className="flex flex-col items-center justify-center py-12">
                  <Building2 className="h-12 w-12 text-slate-500 mb-4" />
                  <p className="text-slate-400">Nenhuma landing page ativa</p>
                  <Button
                    variant="outline"
                    className="mt-4 bg-[#1e1e22] border-[#2a2a2e] hover:bg-[#2a2a2e] text-white"
                    onClick={() => setShowWizard(true)}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Criar primeira landing page
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="inativas">
            {renderProjectGrid(
              inactiveProjects,
              <EyeOff className="h-12 w-12 text-slate-500 mb-4" />,
              "Nenhuma landing page inativa"
            )}
          </TabsContent>

          <TabsContent value="rascunhos">
            {renderProjectGrid(
              draftProjects,
              <FileEdit className="h-12 w-12 text-slate-500 mb-4" />,
              "Nenhum rascunho encontrado"
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
