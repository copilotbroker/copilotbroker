import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Find orphan plantão leads (created in last 2h, no conversation)
    const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { data: orphans, error } = await supabase
      .from("leads")
      .select("id, name, whatsapp, broker_id, created_at")
      .eq("source", "whatsapp_global")
      .gte("created_at", cutoff)
      .limit(50);

    if (error) {
      console.error("[reconcile] query failed:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!orphans || orphans.length === 0) {
      return new Response(JSON.stringify({ recovered: 0, checked: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter: no existing conversation linked
    const ids = orphans.map((o: any) => o.id);
    const { data: existingConvs } = await supabase
      .from("conversations")
      .select("lead_id")
      .in("lead_id", ids);
    const linked = new Set((existingConvs || []).map((c: any) => c.lead_id));
    const trueOrphans = orphans.filter((o: any) => !linked.has(o.id));

    if (trueOrphans.length === 0) {
      return new Response(JSON.stringify({ recovered: 0, checked: orphans.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve placeholder leader from active plantão roleta
    const { data: roletaRow } = await supabase
      .from("roletas")
      .select("id, lider_id, modo_distribuicao")
      .eq("ativa", true)
      .or("escopo_empreendimentos.eq.todas_landing_pages_e_plantao,tipo_origem.eq.whatsapp_global")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const liderId = (roletaRow as any)?.lider_id || null;
    const roletaModo = (roletaRow as any)?.modo_distribuicao || "disputa";

    if (!liderId) {
      console.warn("[reconcile] No active plantão roleta found");
      return new Response(JSON.stringify({ recovered: 0, checked: orphans.length, reason: "no_roleta" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let recovered = 0;
    for (const lead of trueOrphans) {
      try {
        const phoneClean = (lead.whatsapp || "").replace(/[^0-9]/g, "");
        const phoneNorm = phoneClean.length <= 11 ? `55${phoneClean}` : phoneClean;
        const phone = `+${phoneNorm}`;
        const brokerId = lead.broker_id || liderId;

        // Ensure attribution
        const { data: existingAttr } = await supabase
          .from("lead_attribution")
          .select("id")
          .eq("lead_id", lead.id)
          .limit(1)
          .maybeSingle();
        if (!existingAttr) {
          await supabase.from("lead_attribution").insert({
            lead_id: lead.id,
            landing_page: "whatsapp_global",
            utm_source: "whatsapp",
            utm_medium: "plantao",
          });
        }

        // Run roleta distribution if not yet distributed
        if (!lead.broker_id) {
          await fetch(`${SUPABASE_URL}/functions/v1/roleta-distribuir`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({ lead_id: lead.id, source: "whatsapp_global" }),
          }).catch((e) => console.error(`[reconcile] roleta-distribuir lead=${lead.id}`, e));
        }

        // Re-fetch lead to know assigned broker
        const { data: refreshed } = await supabase
          .from("leads")
          .select("broker_id, roleta_id")
          .eq("id", lead.id)
          .single();
        const finalBrokerId = (refreshed as any)?.broker_id || brokerId;

        // Create conversation
        await supabase.from("conversations").insert({
          broker_id: finalBrokerId,
          phone,
          phone_normalized: phoneNorm,
          lead_id: lead.id,
          display_name: lead.name,
          display_name_source: "lead",
          source_instance: "global",
          status: "unread",
          ai_mode: "copilot",
          attendance_started: false,
          last_message_preview: "(mensagem original recebida — verificar histórico no WhatsApp do Plantão)",
          last_message_at: lead.created_at,
          last_message_direction: "inbound",
          last_message_type: "text",
          roleta_modo: roletaModo,
        });

        await supabase.from("lead_interactions").insert({
          lead_id: lead.id,
          interaction_type: "roleta_atribuicao",
          notes: "Lead recuperado por reconciliação automática (job de órfãos do Plantão).",
        });

        recovered++;
        console.log(`[reconcile] recovered lead ${lead.id} (${lead.name})`);
      } catch (e) {
        console.error(`[reconcile] failed lead=${lead.id}`, e);
      }
    }

    return new Response(JSON.stringify({ recovered, checked: orphans.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[reconcile] fatal:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
