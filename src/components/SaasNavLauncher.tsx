// Floating discreet entry point to Master Panel and Admin Org panel.
// Also exposes the OrgSwitcher for super_admin / multi-org users.
import { Link } from "react-router-dom";
import { ShieldCheck, Building2 } from "lucide-react";
import { useOrgContext } from "@/contexts/OrganizationContext";
import { OrgSwitcher } from "@/components/OrgSwitcher";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const SaasNavLauncher = () => {
  const { isSuperAdmin, isOwnerOrAdmin, memberships } = useOrgContext();
  const showSwitcher = isSuperAdmin || memberships.length > 1;
  if (!isSuperAdmin && !isOwnerOrAdmin && !showSwitcher) return null;

  return (
    <TooltipProvider>
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
        {showSwitcher && (
          <div className="rounded-md border bg-background/95 backdrop-blur shadow-lg">
            <OrgSwitcher />
          </div>
        )}
        <div className="flex flex-col gap-2">
          {isSuperAdmin && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild size="icon" className="rounded-full shadow-lg">
                  <Link to="/master/overview" aria-label="Painel Master">
                    <ShieldCheck className="h-5 w-5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">Painel Master (Copilot Broker)</TooltipContent>
            </Tooltip>
          )}
          {isOwnerOrAdmin && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild size="icon" variant="secondary" className="rounded-full shadow-lg">
                  <Link to="/admin/organizacao" aria-label="Admin Imobiliária">
                    <Building2 className="h-5 w-5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">Gestão da Imobiliária</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};
