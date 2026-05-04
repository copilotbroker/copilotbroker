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
        console.log(`Lead ${lead.id} hit ${reassignmentCount} reassignments - releasing to leaders/admins`);

        // Release to leaders/admins/managers (no specific broker)
        await supabase
          .from("leads")
          .update({
            broker_id: null,
            corretor_atribuido_id: null,
            atribuido_em: new Date().toISOString(),
            reserva_expira_em: null,
            status_distribuicao: "em_disputa",
            motivo_atribuicao: `Loop detectado (${reassignmentCount} reassinações) - liberado para líderes/gerentes/admins`,
          })
          .eq("id", lead.id);

        await supabase.from("roletas_log").insert({
          roleta_id: lead.roleta_id,
          lead_id: lead.id,
          acao: "timeout_loop_breaker",
          de_corretor_id: lead.corretor_atribuido_id,
          para_corretor_id: null,
          motivo: `Loop detectado: ${reassignmentCount} reassinações sem atendimento. Liberado para líderes.`,
        });

        await supabase.from("lead_interactions").insert({
          lead_id: lead.id,
          interaction_type: "roleta_fallback",
          notes: `Loop de timeout detectado (${reassignmentCount} reassinações). Liberado para líderes/gerentes/admins iniciarem o atendimento.`,
        });

        // Notify org leaders/admins/managers (best-effort)
        try {
          const { data: leadOrg } = await supabase
            .from("leads").select("organization_id").eq("id", lead.id).maybeSingle();
          const orgId = (leadOrg as any)?.organization_id ?? null;
          const recipients = new Set<string>();
          if (orgId) {
            const { data: orgMembers } = await supabase
              .from("organization_members").select("user_id")
              .eq("organization_id", orgId).eq("approval_status", "approved").eq("is_active", true)
              .in("role", ["owner", "admin", "manager"]);
            (orgMembers || []).forEach((m: any) => m.user_id && recipients.add(m.user_id));
          }
          const { data: leaderRoles } = await supabase
            .from("user_roles").select("user_id").in("role", ["leader", "admin", "super_admin"]);
          (leaderRoles || []).forEach((r: any) => r.user_id && recipients.add(r.user_id));
          if (recipients.size) {
            await supabase.from("notifications").insert(Array.from(recipients).map((uid) => ({
              user_id: uid,
              type: "roleta_loop_breaker",
              title: "Lead preso em loop de timeout",
              message: `Lead ${lead.name} passou por ${reassignmentCount} reassinações sem atendimento. Disponível para qualquer líder/gerente assumir.`,
              lead_id: lead.id,
            })));
          }
        } catch (e) { console.error("loop-breaker notify failed:", e); }

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
      let newBrokerId: string | null;
      let statusDistribuicao: string;
      let motivo: string;
      let novaOrdem: number;

      const isFallback = activeMembros.length === 0;
      if (isFallback) {
        // Sem outro corretor online → libera para líderes/gerentes/admins
        newBrokerId = null as any;
        statusDistribuicao = "em_disputa";
        motivo = "Timeout — sem corretores online — liberado para líderes/gerentes/admins";
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
          reserva_expira_em: isFallback ? null : newExpira.toISOString(),
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
        acao: isFallback ? "timeout_liberado_lideres" : "timeout_reassinado",
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
      const { data: paraBroker } = newBrokerId
        ? await supabase.from("brokers").select("name").eq("id", newBrokerId).single()
        : { data: null as any };

      // Register in lead timeline
      await supabase.from("lead_interactions").insert({
        lead_id: lead.id,
        interaction_type: isFallback ? "roleta_fallback" : "roleta_timeout",
        notes: isFallback
          ? `Timeout de ${roleta.tempo_reserva_minutos}min. Sem corretores online — liberado para líderes/gerentes/admins.`
          : `Timeout de ${roleta.tempo_reserva_minutos}min. Transferido de ${deBroker?.name || "corretor anterior"} para ${paraBroker?.name || "novo corretor"}.`,
      });

      // Notify new broker (in-app + WhatsApp) — only when there's a real new broker
      if (newBrokerId) {
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

        if (globalConfig?.instance_token && brokerData?.whatsapp && baseUrl) {
          try {
            const cleanPhone = brokerData.whatsapp.replace(/\D/g, "");
            let projectName = "Empreendimento";
            if (lead.project_id) {
              const { data: proj } = await supabase.from("projects").select("name").eq("id", lead.project_id).single();
              if (proj) projectName = proj.name;
            }
            const message = `🔄 *Lead reassinado por timeout*\n\n📋 *${projectName}*\n\n⚡ Acesse o CRM para ver os dados e iniciar o atendimento.\n⏱️ Tempo para atendimento: ${roleta.tempo_reserva_minutos} min`;
            const resp = await fetch(`${baseUrl}/send/text`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "token": globalConfig.instance_token },
              body: JSON.stringify({ number: cleanPhone, text: message }),
            });
            console.log(`WhatsApp timeout notification to ${maskPhone(cleanPhone)}: ${resp.status}`);
          } catch (whatsappErr) {
            console.error("WhatsApp timeout notification failed (non-critical):", whatsappErr);
          }
        }

        // Trigger auto-cadencia for the new broker
        try {
          await fetch(`${supabaseUrl}/functions/v1/auto-cadencia-10d`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseServiceKey}` },
            body: JSON.stringify({ leadId: lead.id }),
          });
        } catch (cadenciaErr) {
          console.error("Auto cadencia trigger failed after timeout (non-critical):", cadenciaErr);
        }
      } else {
        // Released to leaders/admins/managers — notify them
        try {
          const orgId = (await supabase.from("leads").select("organization_id").eq("id", lead.id).maybeSingle()).data?.organization_id ?? null;
          const recipients = new Set<string>();
          if (orgId) {
            const { data: orgMembers } = await supabase
              .from("organization_members").select("user_id")
              .eq("organization_id", orgId).eq("approval_status", "approved").eq("is_active", true)
              .in("role", ["owner", "admin", "manager"]);
            (orgMembers || []).forEach((m: any) => m.user_id && recipients.add(m.user_id));
          }
          const { data: leaderRoles } = await supabase
            .from("user_roles").select("user_id").in("role", ["leader", "admin", "super_admin"]);
          (leaderRoles || []).forEach((r: any) => r.user_id && recipients.add(r.user_id));
          if (recipients.size) {
            await supabase.from("notifications").insert(Array.from(recipients).map((uid) => ({
              user_id: uid,
              type: "roleta_vazia",
              title: "Lead aguardando atendimento",
              message: `Lead ${lead.name} ficou sem corretores online após timeout. Disponível para qualquer líder/gerente assumir.`,
              lead_id: lead.id,
            })));
          }
        } catch (e) { console.error("notify leaders on timeout-fallback failed:", e); }
      }

      processed++;
    }

    // ==================== PART 2: Global Conversations Timeout ====================
    const { data: expiredConvs, error: convError } = await supabase
      .from("conversations")
      .select("id, broker_id, phone, phone_normalized, display_name, source_instance, roleta_modo, lead_id")
      .eq("source_instance", "global")
      .eq("attendance_started", false)
      .lte("reserva_expira_em", now)
      .not("reserva_expira_em", "is", null)
      .not("lead_id", "is", null);

    if (convError) {
      console.error("Error fetching expired conversations:", convError);
    }

    const expiredConversations = expiredConvs || [];
    let convProcessed = 0;
    let convLoopBroken = 0;

    if (expiredConversations.length > 0) {
      console.log(`Processing ${expiredConversations.length} expired global conversations`);

      // Get the active roleta that handles plantão leads:
      // - First try the unified catch-all (todas_landing_pages_e_plantao)
      // - Fallback to legacy whatsapp_global roleta
      let { data: globalRoleta } = await supabase
        .from("roletas")
        .select("*")
        .eq("ativa", true)
        .eq("escopo_empreendimentos", "todas_landing_pages_e_plantao")
        .eq("tipo_origem", "landing_page")
        .limit(1)
        .maybeSingle();

      if (!globalRoleta) {
        const { data: legacyRoleta } = await supabase
          .from("roletas")
          .select("*")
          .eq("ativa", true)
          .eq("tipo_origem", "whatsapp_global")
          .limit(1)
          .maybeSingle();
        globalRoleta = legacyRoleta;
      }

      if (globalRoleta) {
        // Check pause window
        const inPause = isInPauseWindow(globalRoleta.timeout_pausa_inicio, globalRoleta.timeout_pausa_fim);

        for (const conv of expiredConversations) {
          if (inPause) {
            console.log(`Global roleta ${globalRoleta.nome}: timeout pausado`);
            skippedPause++;
            continue;
          }

          // Loop breaker: count reassignments for this conversation
          const { count: convReassignCount } = await supabase
            .from("roletas_log")
            .select("id", { count: "exact", head: true })
            .eq("roleta_id", globalRoleta.id)
            .eq("acao", "timeout_reassinado_conv")
            .eq("motivo", `conversation:${conv.id}`);

          if ((convReassignCount || 0) >= MAX_REASSIGNMENTS) {
            console.log(`Conv ${conv.id} hit ${convReassignCount} reassignments - releasing to leaders/admins`);

            await supabase
              .from("conversations")
              .update({
                broker_id: null,
                reserva_expira_em: null,
                atribuido_em: new Date().toISOString(),
                roleta_vazia_flag: true,
              })
              .eq("id", conv.id);

            if (conv.lead_id) {
              await supabase
                .from("leads")
                .update({
                  broker_id: null,
                  corretor_atribuido_id: null,
                  atribuido_em: new Date().toISOString(),
                  reserva_expira_em: null,
                  status_distribuicao: "em_disputa",
                  motivo_atribuicao: `Loop detectado (${convReassignCount} reassinações) - liberado para líderes/gerentes/admins`,
                })
                .eq("id", conv.lead_id);
            }

            await supabase.from("roletas_log").insert({
              roleta_id: globalRoleta.id,
              acao: "timeout_loop_breaker_conv",
              de_corretor_id: conv.broker_id,
              para_corretor_id: null,
              motivo: `conversation:${conv.id}`,
            });

            // Notify org leaders/admins/managers
            try {
              const { data: leadOrg } = conv.lead_id
                ? await supabase.from("leads").select("organization_id").eq("id", conv.lead_id).maybeSingle()
                : { data: null as any };
              const orgId = (leadOrg as any)?.organization_id ?? null;
              const recipients = new Set<string>();
              if (orgId) {
                const { data: orgMembers } = await supabase
                  .from("organization_members").select("user_id")
                  .eq("organization_id", orgId).eq("approval_status", "approved").eq("is_active", true)
                  .in("role", ["owner", "admin", "manager"]);
                (orgMembers || []).forEach((m: any) => m.user_id && recipients.add(m.user_id));
              }
              const { data: leaderRoles } = await supabase
                .from("user_roles").select("user_id").in("role", ["leader", "admin", "super_admin"]);
              (leaderRoles || []).forEach((r: any) => r.user_id && recipients.add(r.user_id));
              if (recipients.size) {
                await supabase.from("notifications").insert(Array.from(recipients).map((uid) => ({
                  user_id: uid,
                  type: "roleta_loop_breaker",
                  title: "Conversa do Plantão aguardando",
                  message: `Conversa do Plantão (${conv.display_name || conv.phone}) passou por ${convReassignCount} reassinações sem atendimento. Disponível para qualquer líder/gerente assumir.`,
                  lead_id: conv.lead_id,
                })));
              }
            } catch (e) { console.error("notify leaders on conv-loop failed:", e); }

            convLoopBroken++;
            convProcessed++;
            continue;
          }

          // Get active members excluding current
          const { data: membros } = await supabase
            .from("roletas_membros")
            .select("id, corretor_id, ordem")
            .eq("roleta_id", globalRoleta.id)
            .eq("ativo", true)
            .eq("status_checkin", true)
            .neq("corretor_id", conv.broker_id)
            .order("ordem", { ascending: true });

          const activeMembros = membros || [];
          let newBrokerId: string | null;
          let novaOrdem: number;
          const isFallback = activeMembros.length === 0;

          if (isFallback) {
            newBrokerId = null;
            novaOrdem = globalRoleta.ultimo_membro_ordem_atribuida;
          } else {
            const lastOrder = globalRoleta.ultimo_membro_ordem_atribuida;
            const nextMembro = activeMembros.find((m: any) => m.ordem > lastOrder) || activeMembros[0];
            newBrokerId = nextMembro.corretor_id;
            novaOrdem = nextMembro.ordem;
          }

          const newExpira = isFallback
            ? null
            : new Date(Date.now() + globalRoleta.tempo_reserva_minutos * 60 * 1000).toISOString();

          // Update conversation
          await supabase
            .from("conversations")
            .update({
              broker_id: newBrokerId,
              atribuido_em: new Date().toISOString(),
              reserva_expira_em: newExpira,
              ...(isFallback ? { roleta_vazia_flag: true } : {}),
            })
            .eq("id", conv.id);

          if (conv.lead_id) {
            await supabase
              .from("leads")
              .update({
                broker_id: newBrokerId,
                corretor_atribuido_id: newBrokerId,
                atribuido_em: new Date().toISOString(),
                reserva_expira_em: newExpira,
                status_distribuicao: isFallback ? "em_disputa" : "reassinado_timeout",
              })
              .eq("id", conv.lead_id);
          }

          await supabase
            .from("roletas")
            .update({ ultimo_membro_ordem_atribuida: novaOrdem })
            .eq("id", globalRoleta.id);

          await supabase.from("roletas_log").insert({
            roleta_id: globalRoleta.id,
            acao: isFallback ? "timeout_liberado_lideres_conv" : "timeout_reassinado_conv",
            de_corretor_id: conv.broker_id,
            para_corretor_id: newBrokerId,
            motivo: `conversation:${conv.id}`,
          });

          if (newBrokerId) {
            const { data: brokerData } = await supabase
              .from("brokers").select("user_id, whatsapp").eq("id", newBrokerId).single();

            if (brokerData?.user_id) {
              await supabase.from("notifications").insert({
                user_id: brokerData.user_id,
                type: "roleta_timeout",
                title: "Conversa reassinada (timeout)",
                message: `Conversa do Plantão (${conv.display_name || conv.phone}) foi reassinada por timeout.`,
              });
            }

            if (globalConfig?.instance_token && brokerData?.whatsapp && baseUrl) {
              try {
                const cleanPhone = brokerData.whatsapp.replace(/\D/g, "");
                const alertMsg = `🔄 *Conversa do Plantão reassinada*\n\nVocê tem um contato aguardando atendimento na aba "Novos" do Plantão.\n\n⚡ Acesse o CRM para iniciar o atendimento.\n⏱️ Tempo: ${globalRoleta.tempo_reserva_minutos} min`;
                await fetch(`${baseUrl}/send/text`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", "token": globalConfig.instance_token },
                  body: JSON.stringify({ number: cleanPhone, text: alertMsg }),
                });
              } catch (whatsappErr) {
                console.error("WhatsApp conv timeout notification failed:", whatsappErr);
              }
            }
          }

          convProcessed++;
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      leads_processed: processed,
      conversations_processed: convProcessed,
      skippedPause,
      loopBroken: loopBroken + convLoopBroken,
    }), {
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
