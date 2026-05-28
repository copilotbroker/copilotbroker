import { supabase } from "@/integrations/supabase/client";

export interface ResolvedLeadConversation {
  conversationId: string;
  sourceInstance: "global" | "personal";
}

/**
 * Resolves the most recent conversation linked to a lead and returns its
 * id + instance, so the caller knows whether to navigate to the Plantão
 * inbox (global) or the personal inbox (personal).
 */
export async function resolveConversationForLead(leadId: string): Promise<ResolvedLeadConversation | null> {
  const { data, error } = await supabase
    .from("conversations")
    .select("id, source_instance")
    .eq("lead_id", leadId)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return {
    conversationId: data.id,
    sourceInstance: ((data as any).source_instance === "global" ? "global" : "personal") as "global" | "personal",
  };
}

/**
 * Builds the inbox URL for an inbox tab depending on instance + user role.
 * Caller passes the base path (e.g. "/corretor" or "/admin").
 */
export function buildInboxUrlForConversation(
  basePath: "/corretor" | "/admin",
  resolved: ResolvedLeadConversation,
): string {
  const segment = resolved.sourceInstance === "global" ? "plantao" : "inbox";
  return `${basePath}/${segment}?conversationId=${resolved.conversationId}`;
}
