import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, maskPhone } from "../_shared/security.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find leads with expired reservations
    const now = new Date().toISOString();
    const { data: expiredLeads, error } = await supabase
      .from("leads")
      .select("id, roleta_id, corretor_atribuido_id, project_id, name, whatsapp")
      .lte("reserva_expira_em", now)
      .is("atendimento_iniciado_em", null)
      .neq("status", "inactive")
      .in("status_distribuicao", ["atribuicao_inicial", "reassinado_timeout"]);

    if (error) throw error;

    if (!expiredLeads || expiredLeads.length === 0) {
      return new Response(JSON.stringify({ message: "Nenhum lead expirado", processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load global WhatsApp config once
    const { data: globalConfig } = await supabase
      .from("global_whatsapp_config")
      .select("instance_name, instance_token, status")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const envUrl = Deno.env.get("UAZAPI_INSTANCE_URL") || "";
    let baseUrl = "";
    try {
      baseUrl = new URL(envUrl).origin;
    } catch {
      baseUrl = envUrl.replace(/\/[^\/]+\/?$/, "");
    }

    // Helper: check if current time (Brasilia UTC-3) is within pause window
    function isInPauseWindow(pausaInicio: string | null, pausaFim: string | null): boolean {
      if (!pausaInicio || !pausaFim) return false;
      const now = new Date();
      // Convert to Brasilia time (UTC-3)
      const brasiliaOffset = -3 * 60;
      const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
      const brasiliaTime = new Date(utcMs + brasiliaOffset * 60000);
      const currentMinutes = brasiliaTime.getHours() * 60 + brasiliaTime.getMinutes();

      const [startH, startM] = pausaInicio.split(":").map(Number);
      const [endH, endM] = pausaFim.split(":").map(Number);
      const startMinutes = startH * 60 + (startM || 0);
      const endMinutes = endH * 60 + (endM || 0);

      if (startMinutes > endMinutes) {
        // Crosses midnight (e.g. 21:00 - 09:00)
        return currentMinutes >= startMinutes || currentMinutes < endMinutes;
      } else {
        return currentMinutes >= startMinutes && currentMinutes < endMinutes;
      }
    }

    console.log(`Processing ${expiredLeads.length} expired leads`);
    let processed = 0;
    let skippedPause = 0;
    let loopBroken = 0;

    // Max reassignment threshold: if a lead has been reassigned this many times,
    // stop the loop and fallback to leader
    const MAX_REASSIGNMENTS = 6;

    for (const lead of expiredLeads) {
      if (!lead.roleta_id) continue;

      // Get roleta
      const { data: roleta } = await supabase
        .from("roletas")
        .select("*")
        .eq("id", lead.roleta_id)
        .eq("ativa", true)
        .single();

      if (!roleta) continue;

      // Check if we're in the pause window
      if (isInPauseWindow(roleta.timeout_pausa_inicio, roleta.timeout_pausa_fim)) {
        console.log(`Roleta ${roleta.nome}: timeout pausado (${roleta.timeout_pausa_inicio}-${roleta.timeout_pausa_fim})`);
        skippedPause++;
        continue;
      }

      // --- LOOP BREAKER: count recent timeout reassignments for this lead ---
      const { count: reassignmentCount } = await supabase
        .from("roletas_log")
        .select("id", { count: "exact", head: true })
        .eq("lead_id", lead.id)
        .eq("acao", "timeout_reassinado");

      if ((reassignmentCount || 0) >= MAX_REASSIGNMENTS) {
        console.log(`Lead ${lead.id} hit ${reassignmentCount} reassignments - breaking loop, fallback to leader`);

        // Fallback to leader and STOP the timeout cycle
        await supabase
          .from("leads")
          .update({
            broker_id: roleta.lider_id,
            corretor_atribuido_id: roleta.lider_id,
            atribuido_em: new Date().toISOString(),
            reserva_expira_em: null, // No more timeout
            status_distribuicao: "fallback_lider",
            motivo_atribuicao: `Loop detectado (${reassignmentCount} reassinações) - atribuído ao líder`,
          })
          .eq("id", lead.id);

        await supabase.from("roletas_log").insert({
          roleta_id: lead.roleta_id,
          lead_id: lead.id,
          acao: "timeout_loop_breaker",
          de_corretor_id: lead.corretor_atribuido_id,
          para_corretor_id: roleta.lider_id,
          motivo: `Loop detectado: ${reassignmentCount} reassinações sem atendimento. Atribuído ao líder.`,
        });

        const { data: liderData } = await supabase
          .from("brokers")
          .select("name, user_id")
          .eq("id", roleta.lider_id)
          .single();

        await supabase.from("lead_interactions").insert({
          lead_id: lead.id,
          interaction_type: "roleta_fallback",
          notes: `Loop de timeout detectado (${reassignmentCount} reassinações). Nenhum corretor iniciou atendimento. Atribuído ao líder ${liderData?.name || "líder"}.`,
        });

        if (liderData?.user_id) {
          await supabase.from("notifications").insert({
            user_id: liderData.user_id,
            type: "roleta_loop_breaker",
            title: "Lead preso em loop de timeout",
            message: `Lead ${lead.name} passou por ${reassignmentCount} reassinações sem atendimento e foi atribuído a você.`,
            lead_id: lead.id,
          });
        }

        // Trigger cadência for the leader
        try {
          await fetch(`${supabaseUrl}/functions/v1/auto-cadencia-10d`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({ leadId: lead.id }),
          });
          console.log("Auto cadencia triggered for leader (loop breaker), lead:", lead.id);
        } catch (cadErr) {
          console.error("Auto cadencia trigger failed (loop breaker):", cadErr);
        }

        loopBroken++;
        processed++;
        continue;
      }
      // --- END LOOP BREAKER ---

      // Get active members (excluding current assignee)
      const { data: membros } = await supabase
        .from("roletas_membros")
        .select("id, corretor_id, ordem")
        .eq("roleta_id", lead.roleta_id)
        .eq("ativo", true)
        .eq("status_checkin", true)
        .neq("corretor_id", lead.corretor_atribuido_id)
        .order("ordem", { ascending: true });

      const activeMembros = membros || [];
      let newBrokerId: string;
      let statusDistribuicao: string;
      let motivo: string;
      let novaOrdem: number;

      if (activeMembros.length === 0) {
        newBrokerId = roleta.lider_id;
        statusDistribuicao = "fallback_lider";
        motivo = "Timeout - nenhum outro corretor online - atribuído ao líder";
        novaOrdem = roleta.ultimo_membro_ordem_atribuida;
      } else {
        const lastOrder = roleta.ultimo_membro_ordem_atribuida;
        let nextMembro = activeMembros.find((m: any) => m.ordem > lastOrder);
        if (!nextMembro) nextMembro = activeMembros[0];

        newBrokerId = nextMembro.corretor_id;
        statusDistribuicao = "reassinado_timeout";
        motivo = `Timeout de ${roleta.tempo_reserva_minutos}min - reassinado para ordem ${nextMembro.ordem}`;
        novaOrdem = nextMembro.ordem;
      }

      const newExpira = new Date(Date.now() + roleta.tempo_reserva_minutos * 60 * 1000);

      // Update lead
      await supabase
        .from("leads")
        .update({
          broker_id: newBrokerId,
          corretor_atribuido_id: newBrokerId,
          atribuido_em: new Date().toISOString(),
          reserva_expira_em: statusDistribuicao === "fallback_lider" ? null : newExpira.toISOString(),
          status_distribuicao: statusDistribuicao,
          motivo_atribuicao: motivo,
        })
        .eq("id", lead.id);

      // Update roleta pointer
      await supabase
        .from("roletas")
        .update({ ultimo_membro_ordem_atribuida: novaOrdem })
        .eq("id", lead.roleta_id);

      // Log
      await supabase.from("roletas_log").insert({
        roleta_id: lead.roleta_id,
        lead_id: lead.id,
        acao: statusDistribuicao === "fallback_lider" ? "timeout_fallback_lider" : "timeout_reassinado",
        de_corretor_id: lead.corretor_atribuido_id,
        para_corretor_id: newBrokerId,
        motivo,
      });

      // Get broker names for timeline
      const { data: deBroker } = await supabase
        .from("brokers")
        .select("name")
        .eq("id", lead.corretor_atribuido_id)
        .single();
      const { data: paraBroker } = await supabase
        .from("brokers")
        .select("name")
        .eq("id", newBrokerId)
        .single();

      // Register in lead timeline
      await supabase.from("lead_interactions").insert({
        lead_id: lead.id,
        interaction_type: statusDistribuicao === "fallback_lider" ? "roleta_fallback" : "roleta_timeout",
        notes: `Timeout de ${roleta.tempo_reserva_minutos}min. Transferido de ${deBroker?.name || "corretor anterior"} para ${paraBroker?.name || "novo corretor"}.`,
      });

      // Notify new broker (in-app)
      const { data: brokerData } = await supabase
        .from("brokers")
        .select("user_id, whatsapp")
        .eq("id", newBrokerId)
        .single();

      if (brokerData?.user_id) {
        await supabase.from("notifications").insert({
          user_id: brokerData.user_id,
          type: "roleta_timeout",
          title: "Lead Reassinado (Timeout)",
          message: `Lead ${lead.name} foi reassinado a você por timeout.`,
          lead_id: lead.id,
        });
      }

      // Notify new broker via WhatsApp (timeout = always hide lead data)
      if (globalConfig?.instance_token && brokerData?.whatsapp && baseUrl) {
        try {
          const cleanPhone = brokerData.whatsapp.replace(/\D/g, "");

          // Get project name
          let projectName = "Empreendimento";
          if (lead.project_id) {
            const { data: proj } = await supabase
              .from("projects")
              .select("name")
              .eq("id", lead.project_id)
              .single();
            if (proj) projectName = proj.name;
          }

          const message = `🔄 *Lead reassinado por timeout*\n\n📋 *${projectName}*\n\n⚡ Acesse o CRM para ver os dados e iniciar o atendimento.\n⏱️ Tempo para atendimento: ${roleta.tempo_reserva_minutos} min`;

          const resp = await fetch(`${baseUrl}/send/text`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "token": globalConfig.instance_token,
            },
            body: JSON.stringify({
              number: cleanPhone,
              text: message,
            }),
          });

          console.log(`WhatsApp timeout notification to ${maskPhone(cleanPhone)}: ${resp.status}`);
        } catch (whatsappErr) {
          console.error("WhatsApp timeout notification failed (non-critical):", whatsappErr);
        }
      }

      // Trigger auto-cadencia for the new broker (prevents infinite timeout loops)
      try {
        await fetch(`${supabaseUrl}/functions/v1/auto-cadencia-10d`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ leadId: lead.id }),
        });
        console.log("Auto cadencia triggered after timeout reassignment, lead:", lead.id);
      } catch (cadenciaErr) {
        console.error("Auto cadencia trigger failed after timeout (non-critical):", cadenciaErr);
      }

      processed++;
    }

    return new Response(JSON.stringify({ success: true, processed, skippedPause }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in roleta-timeout:", error);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
