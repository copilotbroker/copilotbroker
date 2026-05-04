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

    const { lead_id, project_id, source } = await req.json();

    if (!lead_id) {
      return new Response(JSON.stringify({ error: "lead_id é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const leadSource: "landing_page" | "whatsapp_global" = source === "whatsapp_global" ? "whatsapp_global" : "landing_page";

    let roletaId: string | null = null;

    if (leadSource === "whatsapp_global") {
      // 1a-WG. WhatsApp Plantão lead: prioritize unified catch-all (todas_landing_pages_e_plantao)
      const { data: unifiedRoleta } = await supabase
        .from("roletas")
        .select("id")
        .eq("ativa", true)
        .eq("escopo_empreendimentos", "todas_landing_pages_e_plantao")
        .eq("tipo_origem", "landing_page")
        .limit(1)
        .maybeSingle();

      if (unifiedRoleta) {
        roletaId = unifiedRoleta.id;
        console.log("Using unified catch-all roleta (todas_landing_pages_e_plantao) for plantão lead:", roletaId);
      } else {
        // Fallback: legacy whatsapp_global roleta
        const { data: legacyRoleta } = await supabase
          .from("roletas")
          .select("id")
          .eq("ativa", true)
          .eq("tipo_origem", "whatsapp_global")
          .limit(1)
          .maybeSingle();

        if (legacyRoleta) {
          roletaId = legacyRoleta.id;
          console.log("Using legacy whatsapp_global roleta for plantão lead:", roletaId);
        }
      }
    } else {
      // 1. Landing-page lead: requires project_id
      if (!project_id) {
        return new Response(JSON.stringify({ error: "project_id é obrigatório para leads de landing page" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if project is institutional (created_by_broker_id IS NULL)
      const { data: projectInfo } = await supabase
        .from("projects")
        .select("created_by_broker_id")
        .eq("id", project_id)
        .maybeSingle();

      const isInstitutionalProject = projectInfo && projectInfo.created_by_broker_id === null;

      // 1a. If institutional, prioritize an active catch-all roleta (either variant includes LPs)
      if (isInstitutionalProject) {
        const { data: catchAllRoleta } = await supabase
          .from("roletas")
          .select("id")
          .eq("ativa", true)
          .in("escopo_empreendimentos", ["todas_landing_pages", "todas_landing_pages_e_plantao"])
          .eq("tipo_origem", "landing_page")
          .limit(1)
          .maybeSingle();

        if (catchAllRoleta) {
          roletaId = catchAllRoleta.id;
          console.log("Using catch-all roleta for institutional LP lead:", roletaId);
        }
      }

      // 1b. Fallback to explicit project linkage
      if (!roletaId) {
        const { data: reData, error: reError } = await supabase
          .from("roletas_empreendimentos")
          .select("roleta_id")
          .eq("empreendimento_id", project_id)
          .eq("ativo", true)
          .limit(1)
          .maybeSingle();

        if (reError || !reData) {
          console.log("No active roleta for project:", project_id);
          return new Response(JSON.stringify({ message: "Sem roleta ativa para este empreendimento" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        roletaId = reData.roleta_id;
      }
    }

    if (!roletaId) {
      console.log("No roleta found for source:", leadSource);
      return new Response(JSON.stringify({ message: "Sem roleta ativa para esta origem" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Get roleta
    const { data: roleta, error: roletaError } = await supabase
      .from("roletas")
      .select("*")
      .eq("id", roletaId)
      .eq("ativa", true)
      .single();

    if (roletaError || !roleta) {
      console.log("Roleta not found or inactive:", roletaId);
      return new Response(JSON.stringify({ message: "Roleta não encontrada ou inativa" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const timeoutAtivo = roleta.timeout_ativo ?? true;

    // 3. Get active members with checkin
    const { data: membros } = await supabase
      .from("roletas_membros")
      .select("id, corretor_id, ordem")
      .eq("roleta_id", roletaId)
      .eq("ativo", true)
      .eq("status_checkin", true)
      .order("ordem", { ascending: true });

    const activeMembros = membros || [];
    let assignedBrokerId: string | null = null;
    let statusDistribuicao: string;
    let motivo: string;
    let novaOrdem: number;
    const isDisputa = (roleta as any).modo_distribuicao === "disputa";

    if (activeMembros.length === 0) {
      // Sem corretores online → libera para líderes/gerentes/admins (mesmo tratamento de disputa)
      assignedBrokerId = null;
      statusDistribuicao = "em_disputa";
      motivo = "Sem corretores online — liberado para líderes/gerentes/admins";
      novaOrdem = roleta.ultimo_membro_ordem_atribuida;
      console.log("No brokers online — released to leaders/admins/managers");
    } else if (isDisputa) {
      // Disputa mode: lead fica disponível para todos os online — primeiro a clicar fica
      assignedBrokerId = null;
      statusDistribuicao = "em_disputa";
      motivo = `Disputa - liberado para ${activeMembros.length} corretor(es) online`;
      novaOrdem = roleta.ultimo_membro_ordem_atribuida;
      console.log("Disputa mode: lead released to", activeMembros.length, "brokers");
    } else {
      const lastOrder = roleta.ultimo_membro_ordem_atribuida;
      let nextMembro = activeMembros.find(m => m.ordem > lastOrder);
      if (!nextMembro) {
        nextMembro = activeMembros[0];
      }

      assignedBrokerId = nextMembro.corretor_id;
      statusDistribuicao = "atribuicao_inicial";
      motivo = `Round-robin - ordem ${nextMembro.ordem}`;
      novaOrdem = nextMembro.ordem;
      console.log("Round-robin assigned to broker:", assignedBrokerId, "ordem:", novaOrdem);
    }

    const now = new Date();
    // Only set expiration if timeout is active and not fallback
    const shouldSetExpiration = timeoutAtivo && statusDistribuicao !== "fallback_lider" && statusDistribuicao !== "em_disputa";
    const reservaExpira = shouldSetExpiration
      ? new Date(now.getTime() + roleta.tempo_reserva_minutos * 60 * 1000)
      : null;

    // 4. Update lead
    const { error: updateLeadError } = await supabase
      .from("leads")
      .update({
        broker_id: assignedBrokerId,
        roleta_id: roletaId,
        corretor_atribuido_id: assignedBrokerId,
        atribuido_em: now.toISOString(),
        reserva_expira_em: reservaExpira ? reservaExpira.toISOString() : null,
        status_distribuicao: statusDistribuicao,
        motivo_atribuicao: motivo,
      })
      .eq("id", lead_id);

    if (updateLeadError) {
      console.error("Error updating lead:", updateLeadError);
      throw updateLeadError;
    }

    // 5. Update roleta pointer
    await supabase
      .from("roletas")
      .update({ ultimo_membro_ordem_atribuida: novaOrdem })
      .eq("id", roletaId);

    // 6. Log
    await supabase.from("roletas_log").insert({
      roleta_id: roletaId,
      lead_id: lead_id,
      acao: statusDistribuicao === "fallback_lider" ? "fallback_lider"
            : statusDistribuicao === "em_disputa" ? "atribuicao_inicial"
            : "atribuicao_inicial",
      para_corretor_id: assignedBrokerId,
      motivo: motivo,
    });

    // 6b. Timeline
    const { data: assignedBroker } = assignedBrokerId
      ? await supabase.from("brokers").select("name").eq("id", assignedBrokerId).single()
      : { data: null as any };

    await supabase.from("lead_interactions").insert({
      lead_id: lead_id,
      interaction_type: statusDistribuicao === "fallback_lider" ? "roleta_fallback" : "roleta_atribuicao",
      notes: statusDistribuicao === "em_disputa"
        ? `Liberado em disputa. ${motivo}`
        : `Atribuído via roleta para ${assignedBroker?.name || "corretor"}. ${motivo}`,
    });

    // 7. Notifications
    const { data: brokerData } = assignedBrokerId
      ? await supabase.from("brokers").select("user_id, whatsapp").eq("id", assignedBrokerId).single()
      : { data: null as any };

    const { data: leadData } = await supabase
      .from("leads")
      .select("name, whatsapp")
      .eq("id", lead_id)
      .single();

    const { data: projectData } = project_id
      ? await supabase.from("projects").select("name").eq("id", project_id).single()
      : { data: null };

    const originLabel = leadSource === "whatsapp_global"
      ? "WhatsApp do Plantão"
      : (projectData?.name || "empreendimento");

    if (statusDistribuicao === "em_disputa") {
      const isEmptyQueue = activeMembros.length === 0;

      // Resolve organization id (best-effort)
      let orgId: string | null = null;
      const { data: leadOrg } = await supabase
        .from("leads").select("organization_id").eq("id", lead_id).maybeSingle();
      orgId = (leadOrg as any)?.organization_id ?? null;

      // Recipients: online members (normal disputa) OR org leaders/admins/managers (empty queue)
      let recipientUserIds: string[] = [];
      let recipientWhatsapps: string[] = [];

      if (isEmptyQueue) {
        // Flag conversation as "roleta vazia"
        try {
          await supabase.from("conversations")
            .update({ roleta_vazia_flag: true }).eq("lead_id", lead_id);
        } catch (e) { console.error("flag roleta_vazia failed:", e); }

        const recipients = new Set<string>();
        if (orgId) {
          const { data: orgMembers } = await supabase
            .from("organization_members")
            .select("user_id")
            .eq("organization_id", orgId)
            .eq("approval_status", "approved")
            .eq("is_active", true)
            .in("role", ["owner", "admin", "manager"]);
          (orgMembers || []).forEach((m: any) => m.user_id && recipients.add(m.user_id));
        }
        const { data: leaderRoles } = await supabase
          .from("user_roles").select("user_id").in("role", ["leader", "admin", "super_admin"]);
        (leaderRoles || []).forEach((r: any) => r.user_id && recipients.add(r.user_id));

        recipientUserIds = Array.from(recipients);

        if (recipientUserIds.length) {
          const { data: leaderBrokers } = await supabase
            .from("brokers").select("whatsapp").in("user_id", recipientUserIds);
          recipientWhatsapps = (leaderBrokers || [])
            .map((b: any) => b.whatsapp).filter(Boolean);
        }
      } else {
        const memberIds = activeMembros.map((m: any) => m.corretor_id);
        const { data: memberBrokers } = await supabase
          .from("brokers").select("id, user_id, whatsapp").in("id", memberIds);
        recipientUserIds = (memberBrokers || [])
          .filter((b: any) => b.user_id).map((b: any) => b.user_id);
        recipientWhatsapps = (memberBrokers || [])
          .map((b: any) => b.whatsapp).filter(Boolean);
      }

      // In-app notifications
      const notifTitle = isEmptyQueue ? "🔔 Lead aguardando atendimento" : "🔥 Lead em Disputa";
      const notifMessage = isEmptyQueue
        ? `Lead ${leadData?.name || ""} (${originLabel}) chegou sem corretores online. Qualquer líder/gerente pode iniciar o atendimento.`
        : `Lead ${leadData?.name || ""} (${originLabel}) liberado para disputa. Quem reivindicar primeiro, atende!`;
      if (recipientUserIds.length) {
        await supabase.from("notifications").insert(recipientUserIds.map((uid) => ({
          user_id: uid,
          type: isEmptyQueue ? "roleta_vazia" : "roleta_disputa",
          title: notifTitle,
          message: notifMessage,
          lead_id,
        })));
      }

      // WhatsApp blast
      try {
        const { data: globalConfig } = await supabase
          .from("global_whatsapp_config").select("instance_token")
          .order("created_at", { ascending: false }).limit(1).maybeSingle();
        const envUrl = Deno.env.get("UAZAPI_INSTANCE_URL") || "";
        let baseUrl: string;
        try { baseUrl = new URL(envUrl).origin; } catch { baseUrl = envUrl.replace(/\/[^\/]+\/?$/, ""); }
        if (globalConfig?.instance_token && baseUrl) {
          const msg = isEmptyQueue
            ? `🔔 *Lead aguardando atendimento*\n\n📋 *${originLabel}*\n\n⚠️ Nenhum corretor online no momento. Qualquer líder/gerente pode iniciar o atendimento via CRM → Pré-Atendimento.`
            : `🔥 *Lead em Disputa via Roleta*\n\n📋 *${originLabel}*\n\n⚡ Acesse o CRM → Pré-Atendimento e clique em *Iniciar Atendimento* para assumir.\n\n👥 Quem reivindicar primeiro, atende!`;
          for (const wpp of recipientWhatsapps) {
            const phone = wpp.replace(/\D/g, "");
            fetch(`${baseUrl}/send/text`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "token": globalConfig.instance_token },
              body: JSON.stringify({ number: phone, text: msg }),
            }).catch(() => {});
          }
        }
      } catch (e) { console.error("disputa whatsapp blast failed:", e); }

      return new Response(JSON.stringify({
        success: true,
        status: statusDistribuicao,
        online_count: activeMembros.length,
        disputa: true,
        empty_queue: isEmptyQueue,
        roleta_id: roletaId,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (brokerData?.user_id && leadData) {
      await supabase.from("notifications").insert({
        user_id: brokerData.user_id,
        type: "roleta_lead",
        title: "Novo Lead via Roleta",
        message: `Lead ${leadData.name} (${originLabel}) atribuído a você.`,
        lead_id: lead_id,
      });
    }

    // 7c. Roleta vazia — alert leaders/admins/managers and flag conversation
    if (statusDistribuicao === "fallback_lider") {
      try {
        // Flag any existing conversation for this lead so the Inbox can highlight it.
        await supabase
          .from("conversations")
          .update({ roleta_vazia_flag: true })
          .eq("lead_id", lead_id);

        // Resolve organization_id (prefer roleta -> lider broker -> lead)
        let orgId: string | null = null;
        const { data: liderBroker } = await supabase
          .from("brokers")
          .select("organization_id, user_id")
          .eq("id", roleta.lider_id)
          .maybeSingle();
        orgId = liderBroker?.organization_id ?? null;
        if (!orgId) {
          const { data: leadOrg } = await supabase
            .from("leads")
            .select("organization_id")
            .eq("id", lead_id)
            .maybeSingle();
          orgId = leadOrg?.organization_id ?? null;
        }

        const { data: roletaInfo } = await supabase
          .from("roletas")
          .select("nome")
          .eq("id", roletaId)
          .maybeSingle();

        // Collect recipient user_ids: leader + org admins/managers/owners + global admins
        const recipients = new Set<string>();
        if (liderBroker?.user_id) recipients.add(liderBroker.user_id);

        if (orgId) {
          const { data: orgMembers } = await supabase
            .from("organization_members")
            .select("user_id")
            .eq("organization_id", orgId)
            .eq("approval_status", "approved")
            .eq("is_active", true)
            .in("role", ["owner", "admin", "manager"]);
          (orgMembers || []).forEach((m: any) => m.user_id && recipients.add(m.user_id));
        }

        const { data: globalAdmins } = await supabase
          .from("user_roles")
          .select("user_id")
          .in("role", ["admin", "super_admin"]);
        (globalAdmins || []).forEach((r: any) => r.user_id && recipients.add(r.user_id));

        if (recipients.size > 0) {
          const title = "Roleta vazia: lead atribuído ao líder";
          const message = `Lead ${leadData?.name || ""} chegou na roleta "${roletaInfo?.nome || ""}" sem corretores online. Atribuído ao líder por fallback.`;
          const rows = Array.from(recipients).map((uid) => ({
            user_id: uid,
            type: "roleta_vazia",
            title,
            message,
            lead_id,
          }));
          await supabase.from("notifications").insert(rows);
          console.log(`[roleta-vazia] Notified ${rows.length} recipient(s) for lead ${lead_id}`);
        }
      } catch (vazErr) {
        console.error("[roleta-vazia] alert failed (non-critical):", vazErr);
      }
    }

    // 7b. Check broker WhatsApp instance status
    let brokerInstanceDisconnected = false;
    try {
      const { data: brokerInstance } = await supabase
        .from("broker_whatsapp_instances")
        .select("status")
        .eq("broker_id", assignedBrokerId)
        .maybeSingle();

      brokerInstanceDisconnected = !brokerInstance || brokerInstance.status !== "connected";

      if (brokerInstanceDisconnected && brokerData?.user_id) {
        // Insert notification about disconnected WhatsApp
        await supabase.from("notifications").insert({
          user_id: brokerData.user_id,
          type: "whatsapp_disconnected",
          title: "WhatsApp Desconectado",
          message: "Seu WhatsApp está desconectado. Leads estão chegando mas a cadência automática não será ativada. Reconecte sua instância.",
          lead_id: lead_id,
        });
        console.log("Notification sent: broker WhatsApp disconnected");
      }
    } catch (instanceCheckError) {
      console.error("Instance check failed (non-critical):", instanceCheckError);
    }
    try {
      const { data: globalConfig } = await supabase
        .from("global_whatsapp_config")
        .select("instance_name, instance_token, status")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (globalConfig?.instance_token && brokerData?.whatsapp && leadData) {
        const envUrl = Deno.env.get("UAZAPI_INSTANCE_URL") || "";
        let baseUrl: string;
        try {
          baseUrl = new URL(envUrl).origin;
        } catch {
          baseUrl = envUrl.replace(/\/[^\/]+\/?$/, "");
        }

        if (baseUrl) {
          const cleanBrokerPhone = brokerData.whatsapp.replace(/\D/g, "");

          // Conditional message based on timeout_ativo
          let message: string;
          if (timeoutAtivo) {
            // Timeout active: hide lead data to prevent data leakage on reassignment
            message = `🔔 *Novo lead via Roleta*\n\n📋 *${originLabel}*\n\n⚡ Acesse o CRM para ver os dados e iniciar o atendimento.\n⏱️ Tempo para atendimento: ${roleta.tempo_reserva_minutos} min`;
          } else {
            // No timeout: full lead data (no risk of reassignment)
            message = `🔔 *Novo lead via Roleta*\n\n📋 *${originLabel}*\n👤 ${leadData.name}\n📱 ${leadData.whatsapp}\n\n⚡ Acesse o CRM para iniciar o atendimento.`;
          }

          const apiUrl = `${baseUrl}/send/text`;
          console.log("Sending WhatsApp notification to:", maskPhone(cleanBrokerPhone), "timeout_ativo:", timeoutAtivo);

          const whatsappResp = await fetch(apiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "token": globalConfig.instance_token,
            },
            body: JSON.stringify({
              number: cleanBrokerPhone,
              text: message,
            }),
          });

          const respText = await whatsappResp.text();
          console.log(`WhatsApp response (${whatsappResp.status}):`, respText.substring(0, 300));
        }
      } else {
        console.log("WhatsApp notification skipped: no config or no broker data");
      }
    } catch (whatsappError) {
      console.error("WhatsApp notification failed (non-critical):", whatsappError);
    }

    // 8b. WhatsApp alert for disconnected broker instance
    if (brokerInstanceDisconnected && brokerData?.whatsapp) {
      try {
        const { data: globalCfg } = await supabase
          .from("global_whatsapp_config")
          .select("instance_token")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (globalCfg?.instance_token) {
          const envUrl = Deno.env.get("UAZAPI_INSTANCE_URL") || "";
          let base: string;
          try { base = new URL(envUrl).origin; } catch { base = envUrl.replace(/\/[^\/]+\/?$/, ""); }

          if (base) {
            const phone = brokerData.whatsapp.replace(/\D/g, "");
            const alertMsg = `⚠️ *Sua instância WhatsApp do CRM está desconectada*\n\nLeads estão chegando via roleta, mas a cadência automática não será ativada.\n\nReconecte sua instância acessando o CRM → WhatsApp.`;

            await fetch(`${base}/send/text`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "token": globalCfg.instance_token },
              body: JSON.stringify({ number: phone, text: alertMsg }),
            });
            console.log("WhatsApp disconnect alert sent to broker:", maskPhone(phone));
          }
        }
      } catch (alertErr) {
        console.error("Disconnect alert failed (non-critical):", alertErr);
      }
    }

    // 9. Trigger auto-cadencia-10d (non-blocking)
    try {
      await fetch(`${supabaseUrl}/functions/v1/auto-cadencia-10d`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ leadId: lead_id }),
      });
      console.log("Auto cadencia 10D triggered for lead:", lead_id);
    } catch (cadenciaError) {
      console.error("Auto cadencia trigger failed (non-critical):", cadenciaError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      assigned_to: assignedBrokerId, 
      status: statusDistribuicao 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in roleta-distribuir:", error);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
