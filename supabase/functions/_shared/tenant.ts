// Multi-tenant helpers for edge functions.
//
// These helpers resolve the active organization_id from a parent entity
// (broker / lead / conversation / instance). Use them when a function
// needs to filter cross-tenant data or stamp organization_id explicitly.
//
// Inserts into operational tables (conversations, leads, lead_*, calendar_events,
// whatsapp_*) auto-fill organization_id via BEFORE INSERT triggers, so most
// callers do NOT need to pass it manually. Use this helper when:
//   - You need to FILTER queries by tenant (super_admin context).
//   - You're inserting into a table without the auto-fill trigger.
//   - You need to enforce that a request only touches a single tenant.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export type OrgId = string | null;

const cache = new Map<string, OrgId>();

const cached = async (key: string, loader: () => Promise<OrgId>): Promise<OrgId> => {
  if (cache.has(key)) return cache.get(key)!;
  const v = await loader();
  cache.set(key, v);
  return v;
};

export const orgFromBroker = (sb: SupabaseClient, brokerId: string) =>
  cached(`b:${brokerId}`, async () => {
    const { data } = await sb.from("brokers").select("organization_id").eq("id", brokerId).maybeSingle();
    return (data?.organization_id as string) ?? null;
  });

export const orgFromLead = (sb: SupabaseClient, leadId: string) =>
  cached(`l:${leadId}`, async () => {
    const { data } = await sb.from("leads").select("organization_id").eq("id", leadId).maybeSingle();
    return (data?.organization_id as string) ?? null;
  });

export const orgFromConversation = (sb: SupabaseClient, conversationId: string) =>
  cached(`c:${conversationId}`, async () => {
    const { data } = await sb.from("conversations").select("organization_id, broker_id").eq("id", conversationId).maybeSingle();
    if (data?.organization_id) return data.organization_id as string;
    if (data?.broker_id) return await orgFromBroker(sb, data.broker_id as string);
    return null;
  });

export const orgFromInstanceToken = (sb: SupabaseClient, instanceToken: string) =>
  cached(`it:${instanceToken}`, async () => {
    const { data } = await sb
      .from("broker_whatsapp_instances")
      .select("organization_id, broker_id")
      .eq("instance_token", instanceToken)
      .maybeSingle();
    if (data?.organization_id) return data.organization_id as string;
    if (data?.broker_id) return await orgFromBroker(sb, data.broker_id as string);
    return null;
  });

/** Verify the calling user (JWT) is a super_admin or member of the requested org. */
export const assertOrgAccess = async (
  sb: SupabaseClient,
  userId: string,
  orgId: string,
): Promise<boolean> => {
  const { data: superAdmin } = await sb
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "super_admin")
    .maybeSingle();
  if (superAdmin) return true;

  const { data: member } = await sb
    .from("organization_members")
    .select("id")
    .eq("user_id", userId)
    .eq("organization_id", orgId)
    .eq("is_active", true)
    .maybeSingle();
  return !!member;
};
