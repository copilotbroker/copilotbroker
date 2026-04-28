// White-label branding page — owners/admins of an organization can customize
// display name, primary color, secondary color, logo and favicon. Files are
// stored in the public org-branding bucket under <org_id>/...
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOrgContext } from "@/contexts/OrganizationContext";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, X, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const AdminOrganizationBranding = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isLoading, activeOrg, isOwnerOrAdmin, isSuperAdmin } = useOrgContext();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#FFFF00");
  const [secondaryColor, setSecondaryColor] = useState("#0a0a0f");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingKind, setUploadingKind] = useState<null | "logo" | "favicon">(null);

  useEffect(() => {
    if (!isLoading && !isOwnerOrAdmin && !isSuperAdmin) {
      navigate("/corretor/dashboard", { replace: true });
    }
  }, [isLoading, isOwnerOrAdmin, isSuperAdmin, navigate]);

  useEffect(() => {
    if (!activeOrg) return;
    setDisplayName(activeOrg.display_name ?? activeOrg.name);
    setPrimaryColor(activeOrg.primary_color ?? "#FFFF00");
    setSecondaryColor(activeOrg.secondary_color ?? "#0a0a0f");
    setLogoUrl(activeOrg.logo_url);
    setFaviconUrl(activeOrg.favicon_url);
  }, [activeOrg]);

  const uploadFile = async (kind: "logo" | "favicon", file: File) => {
    if (!activeOrg) return;
    setUploadingKind(kind);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${activeOrg.id}/${kind}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("org-branding").upload(path, file, {
        upsert: true,
        contentType: file.type,
      });
      if (error) throw error;
      const { data: pub } = supabase.storage.from("org-branding").getPublicUrl(path);
      if (kind === "logo") setLogoUrl(pub.publicUrl);
      else setFaviconUrl(pub.publicUrl);
      toast.success(`${kind === "logo" ? "Logo" : "Favicon"} enviado`);
    } catch (err: any) {
      toast.error(err.message || "Falha no upload");
    } finally {
      setUploadingKind(null);
    }
  };

  const handleSave = async () => {
    if (!activeOrg) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("organizations" as any)
        .update({
          display_name: displayName.trim() || null,
          primary_color: primaryColor || null,
          secondary_color: secondaryColor || null,
          logo_url: logoUrl,
          favicon_url: faviconUrl,
        })
        .eq("id", activeOrg.id);
      if (error) throw error;
      toast.success("Branding salvo");
      await queryClient.invalidateQueries({ queryKey: ["organization-context"] });
    } catch (err: any) {
      toast.error(err.message || "Falha ao salvar");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }
  if (!activeOrg) return <div className="p-6 text-muted-foreground">Sem organização ativa.</div>;

  return (
    <div className="space-y-6 p-6 max-w-3xl mx-auto">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/admin/organizacao")}
        className="-ml-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />Voltar para Organização
      </Button>

      <div>
        <h1 className="text-2xl font-bold">Identidade Visual</h1>
        <p className="text-sm text-muted-foreground">Personalize o painel da sua imobiliária com sua marca.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Nome de exibição</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="display-name">Nome exibido nos painéis</Label>
          <Input
            id="display-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={activeOrg.name}
          />
          <p className="text-xs text-muted-foreground">Aparece no título do navegador e cabeçalho.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Cores</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="primary-color">Cor primária</Label>
            <div className="flex items-center gap-3">
              <input
                id="primary-color-picker"
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-16 rounded border border-border bg-transparent cursor-pointer"
              />
              <Input
                id="primary-color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="font-mono"
              />
            </div>
            <p className="text-xs text-muted-foreground">Botões principais, badges e destaques.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="secondary-color">Cor secundária</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="h-10 w-16 rounded border border-border bg-transparent cursor-pointer"
              />
              <Input
                id="secondary-color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="font-mono"
              />
            </div>
            <p className="text-xs text-muted-foreground">Reservada para uso futuro em elementos de apoio.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Logo</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-lg border border-border flex items-center justify-center bg-muted/30 overflow-hidden">
              {logoUrl
                ? <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
                : <span className="text-xs text-muted-foreground">Sem logo</span>}
            </div>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingKind === "logo"}
              >
                {uploadingKind === "logo" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                Enviar logo
              </Button>
              {logoUrl && (
                <Button variant="ghost" size="sm" onClick={() => setLogoUrl(null)}>
                  <X className="h-3 w-3 mr-1" />Remover
                </Button>
              )}
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadFile("logo", f);
                e.target.value = "";
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">PNG ou SVG, fundo transparente. Recomendado: 256×256px.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Favicon</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded border border-border flex items-center justify-center bg-muted/30 overflow-hidden">
              {faviconUrl
                ? <img src={faviconUrl} alt="Favicon" className="h-full w-full object-contain" />
                : <span className="text-xs text-muted-foreground">—</span>}
            </div>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => faviconInputRef.current?.click()}
                disabled={uploadingKind === "favicon"}
              >
                {uploadingKind === "favicon" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                Enviar favicon
              </Button>
              {faviconUrl && (
                <Button variant="ghost" size="sm" onClick={() => setFaviconUrl(null)}>
                  <X className="h-3 w-3 mr-1" />Remover
                </Button>
              )}
            </div>
            <input
              ref={faviconInputRef}
              type="file"
              accept="image/png,image/x-icon,image/svg+xml"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadFile("favicon", f);
                e.target.value = "";
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">Aparece na aba do navegador. Recomendado: 32×32px ou SVG.</p>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Salvar alterações
        </Button>
      </div>
    </div>
  );
};

export default AdminOrganizationBranding;
