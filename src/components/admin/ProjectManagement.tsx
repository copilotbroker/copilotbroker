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
  Home, FileEdit, EyeOff, Eye, Copy, Check,
} from "lucide-react";
import ProjectWizard from "./ProjectWizard";
import { toast } from "sonner";

function ProjectStatsCard({ projectId }: { projectId: string }) {
  const { stats, isLoading } = useProjectStats(projectId);
  if (isLoading) return <span className="text-muted-foreground">...</span>;
  return (
    <span className="text-[11px] text-muted-foreground/70">
      {stats.totalLeads} leads · {stats.todayLeads} hoje
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

function ProjectListCard({ project, onEdit, onEditLanding, onToggleStatus }: {
  project: Project;
  onEdit: (p: Project) => void;
  onEditLanding: (p: Project) => void;
  onToggleStatus: (id: string, active: boolean) => void;
}) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const statusConfig = PROJECT_STATUS_CONFIG[project.status] || { label: project.status, color: 'text-muted-foreground', bgColor: 'bg-muted/30 border-border' };
  const isBrokerCreated = !!project.created_by_broker_id;
  const url = `/${project.city_slug}/${project.slug}`;
  const isActive = project.is_active;
  const isDraft = !project.is_active && !project.landing_content && project.status === "pre_launch";

  const copyUrl = async () => {
    const fullUrl = `${window.location.origin}${url}`;
    await navigator.clipboard.writeText(fullUrl);
    setCopiedUrl(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const borderClass = isDraft
    ? "border-dashed border-amber-500/40 bg-amber-950/20 hover:border-amber-500/60"
    : isActive
    ? "border-emerald-500/30 bg-emerald-950/20 hover:border-emerald-500/50"
    : "border-border bg-muted/10 hover:border-border/80 opacity-60";

  const iconColor = isDraft ? "text-amber-400" : isActive ? "text-emerald-400" : "text-muted-foreground";

  return (
    <div className={`rounded-lg p-3 border transition-colors ${borderClass}`}>
      <div className="flex items-start gap-3">
        {isBrokerCreated ? (
          <Home className={`w-5 h-5 ${iconColor} mt-0.5 shrink-0`} />
        ) : (
          <Building2 className={`w-5 h-5 ${iconColor} mt-0.5 shrink-0`} />
        )}

        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <h3 className="font-semibold text-foreground truncate text-sm max-w-[55%]">{project.name}</h3>
            {isDraft && (
              <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded shrink-0 font-medium">
                Rascunho
              </span>
            )}
            {isActive && (
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded shrink-0 font-medium">
                Publicado
              </span>
            )}
            {!isActive && !isDraft && (
              <span className="text-[10px] text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded shrink-0 font-medium">
                Inativo
              </span>
            )}
            <span className="text-[10px] text-muted-foreground bg-[#2a2a2e] px-1.5 py-0.5 rounded shrink-0">
              {project.city}
            </span>
            {project.landing_content && (
              <span className="text-[10px] text-[#FFFF00] bg-[#FFFF00]/10 px-1.5 py-0.5 rounded shrink-0 font-medium flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5" /> IA
              </span>
            )}
            {isBrokerCreated && (
              <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded shrink-0">
                Corretor
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isActive && (
              <p className="text-[11px] text-muted-foreground/70 truncate">
                {window.location.origin}{url}
              </p>
            )}
            {isDraft && (
              <p className="text-[11px] text-muted-foreground/70">
                Landing page ainda não publicada.
              </p>
            )}
            <ProjectStatsCard projectId={project.id} />
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {project.landing_content && (
            <button
              onClick={() => onEditLanding(project)}
              className="p-1.5 rounded-md bg-[#2a2a2e]/50 text-[#FFFF00] hover:bg-[#FFFF00]/10 transition-colors"
              title="Editar Landing IA"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => onEdit(project)}
            className="p-1.5 rounded-md bg-[#2a2a2e]/50 text-muted-foreground hover:text-foreground hover:bg-[#2a2a2e] transition-colors"
            title="Editar configurações"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          {isActive && (
            <button
              onClick={() => copyUrl()}
              className="p-1.5 rounded-md bg-[#2a2a2e]/50 text-muted-foreground hover:text-primary hover:bg-[#2a2a2e] transition-colors"
              title="Copiar link"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
          {isActive && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md bg-[#2a2a2e]/50 text-muted-foreground hover:text-foreground hover:bg-[#2a2a2e] transition-colors"
              title="Abrir landing page"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <button
            onClick={() => onToggleStatus(project.id, !project.is_active)}
            className="p-1.5 rounded-md bg-[#2a2a2e]/50 text-muted-foreground hover:text-orange-400 hover:bg-orange-500/10 transition-colors"
            title={project.is_active ? "Inativar" : "Ativar"}
          >
            {project.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
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

  const { activeCompany, activeBroker, inactiveProjects, draftProjects } = useMemo(() => {
    const activeCompany: Project[] = [];
    const activeBroker: Project[] = [];
    const inactiveProjects: Project[] = [];
    const draftProjects: Project[] = [];

    projects.forEach((p) => {
      if (!p.is_active) {
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

  const renderProjectList = (items: Project[], emptyIcon: React.ReactNode, emptyText: string) => {
    if (items.length === 0) {
      return (
        <div className="bg-[#1e1e22] border border-[#2a2a2e] rounded-lg p-8 text-center">
          {emptyIcon}
          <p className="text-muted-foreground">{emptyText}</p>
        </div>
      );
    }
    return (
      <div className="grid gap-3">
        {items.map((project) => (
          <ProjectListCard
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Landing Pages</h2>
          <p className="text-sm text-muted-foreground">
            {activeCompany.length + activeBroker.length} {(activeCompany.length + activeBroker.length) === 1 ? 'ativa' : 'ativas'}
            {draftProjects.length > 0 && ` · ${draftProjects.length} rascunho${draftProjects.length > 1 ? 's' : ''}`}
            {inactiveProjects.length > 0 && ` · ${inactiveProjects.length} inativa${inactiveProjects.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchProjects(true)}
            className="bg-[#1e1e22] border-[#2a2a2e] hover:bg-[#2a2a2e] text-muted-foreground"
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
            <TabsTrigger value="ativas" className="data-[state=active]:bg-[#2a2a2e] flex-1 min-w-0 text-xs sm:text-sm gap-1.5">
              <Eye className="w-4 h-4 shrink-0" />
              <span className="truncate">Ativas ({activeCompany.length + activeBroker.length})</span>
            </TabsTrigger>
            <TabsTrigger value="inativas" className="data-[state=active]:bg-[#2a2a2e] flex-1 min-w-0 text-xs sm:text-sm gap-1.5">
              <EyeOff className="w-4 h-4 shrink-0" />
              <span className="truncate">Inativas ({inactiveProjects.length})</span>
            </TabsTrigger>
            <TabsTrigger value="rascunhos" className="data-[state=active]:bg-[#2a2a2e] flex-1 min-w-0 text-xs sm:text-sm gap-1.5">
              <FileEdit className="w-4 h-4 shrink-0" />
              <span className="truncate">Rascunhos ({draftProjects.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ativas" className="space-y-6">
            {activeCompany.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#FFFF00]" />
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Imobiliária ({activeCompany.length})</p>
                </div>
                <div className="grid gap-3">
                  {activeCompany.map((project) => (
                    <ProjectListCard
                      key={project.id}
                      project={project}
                      onEdit={handleOpenDialog}
                      onEditLanding={setEditLandingProject}
                      onToggleStatus={toggleProjectStatus}
                    />
                  ))}
                </div>
              </div>
            )}

            {activeBroker.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-cyan-400" />
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Criadas por Corretores ({activeBroker.length})</p>
                </div>
                <div className="grid gap-3">
                  {activeBroker.map((project) => (
                    <ProjectListCard
                      key={project.id}
                      project={project}
                      onEdit={handleOpenDialog}
                      onEditLanding={setEditLandingProject}
                      onToggleStatus={toggleProjectStatus}
                    />
                  ))}
                </div>
              </div>
            )}

            {activeCompany.length === 0 && activeBroker.length === 0 && (
              <div className="bg-[#1e1e22] border border-[#2a2a2e] rounded-lg p-8 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma landing page ativa</p>
                <Button
                  variant="outline"
                  className="mt-4 bg-[#1e1e22] border-[#2a2a2e] hover:bg-[#2a2a2e] text-foreground"
                  onClick={() => setShowWizard(true)}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Criar primeira landing page
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="inativas">
            {renderProjectList(
              inactiveProjects,
              <EyeOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />,
              "Nenhuma landing page inativa"
            )}
          </TabsContent>

          <TabsContent value="rascunhos">
            {renderProjectList(
              draftProjects,
              <FileEdit className="h-12 w-12 text-muted-foreground mx-auto mb-4" />,
              "Nenhum rascunho encontrado"
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
