// Tenant switcher — visible only when user belongs to multiple orgs OR is super_admin.
// For super_admin we additionally fetch all organizations to allow impersonation/inspection.
import { useEffect, useState } from "react";
import { Building2, Check, ChevronsUpDown } from "lucide-react";
import { useOrgContext } from "@/contexts/OrganizationContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface OrgOption {
  id: string;
  name: string;
  slug: string;
  status: string;
}

export const OrgSwitcher = ({ className }: { className?: string }) => {
  const { isSuperAdmin, memberships, activeOrg, activeOrgId, setActiveOrg } = useOrgContext();
  const [open, setOpen] = useState(false);
  const [allOrgs, setAllOrgs] = useState<OrgOption[]>([]);

  // For super_admin, list all organizations (not just memberships).
  useEffect(() => {
    if (!isSuperAdmin || !open) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("organizations" as any)
        .select("id, name, slug, status")
        .order("name") as any;
      if (!cancelled && data) setAllOrgs(data as OrgOption[]);
    })();
    return () => { cancelled = true; };
  }, [isSuperAdmin, open]);

  // Hide switcher entirely for users with a single org and no super_admin powers.
  if (!isSuperAdmin && memberships.length <= 1) return null;

  const memberOptions: OrgOption[] = memberships.map((m) => ({
    id: m.organization.id,
    name: m.organization.name,
    slug: m.organization.slug,
    status: m.organization.status,
  }));

  const otherOrgs = isSuperAdmin
    ? allOrgs.filter((o) => !memberOptions.some((m) => m.id === o.id))
    : [];

  const label = activeOrg?.name ?? "Selecionar imobiliária";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("h-9 justify-between gap-2 min-w-[180px] max-w-[260px]", className)}
        >
          <Building2 className="h-4 w-4 shrink-0 opacity-70" />
          <span className="truncate text-sm font-medium">{label}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="end">
        <Command>
          <CommandInput placeholder="Buscar imobiliária..." />
          <CommandList>
            <CommandEmpty>Nenhuma imobiliária encontrada.</CommandEmpty>
            {memberOptions.length > 0 && (
              <CommandGroup heading="Minhas imobiliárias">
                {memberOptions.map((org) => (
                  <CommandItem
                    key={org.id}
                    value={`${org.name} ${org.slug}`}
                    onSelect={() => {
                      setActiveOrg(org.id);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", activeOrgId === org.id ? "opacity-100" : "opacity-0")} />
                    <div className="flex flex-col">
                      <span className="text-sm">{org.name}</span>
                      <span className="text-xs text-muted-foreground">{org.slug}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {otherOrgs.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Todas as imobiliárias (Master)">
                  {otherOrgs.map((org) => (
                    <CommandItem
                      key={org.id}
                      value={`${org.name} ${org.slug}`}
                      onSelect={() => {
                        setActiveOrg(org.id);
                        setOpen(false);
                      }}
                    >
                      <Check className={cn("mr-2 h-4 w-4", activeOrgId === org.id ? "opacity-100" : "opacity-0")} />
                      <div className="flex flex-col">
                        <span className="text-sm">{org.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {org.slug} · {org.status}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
