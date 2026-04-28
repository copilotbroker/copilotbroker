// Floating discreet entry point to Master Panel and Admin Org panel.
// Only renders for super_admin or org owner/admin. Stays out of the way of the existing sidebar.
import { Link } from "react-router-dom";
import { ShieldCheck, Building2 } from "lucide-react";
import { useOrganization } from "@/hooks/use-organization";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const SaasNavLauncher = () => {
  const { isSuperAdmin, isOwnerOrAdmin } = useOrganization();
  if (!isSuperAdmin && !isOwnerOrAdmin) return null;

  return (
    <TooltipProvider>
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
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
    </TooltipProvider>
  );
};
