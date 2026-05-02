// Roleta Auto Checkout — runs every minute via pg_cron.
// For each active roleta with auto_checkout_enabled = true whose
// configured horário matches the current HH:MM in UTC-3, sets
// status_checkin = false for all online members and logs the action.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function nowHHMM_UTC3(): string {
  // Brasília is UTC-3, no DST.
  const d = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function isWeekendUTC3(): boolean {
  // 0 = Sunday, 6 = Saturday in UTC-3
  const d = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const dow = d.getUTCDay();
  return dow === 0 || dow === 6;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const target = nowHHMM_UTC3(); // e.g. "21:00"

  // Skip on weekends — auto-checkout only runs Mon–Fri (UTC-3).
  if (isWeekendUTC3()) {
    return new Response(
      JSON.stringify({ ok: true, skipped: "weekend", target_utc3: target }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    // Find roletas due now. Compare by HH:MM (time stored as time zone-less).
    const { data: roletas, error: rErr } = await supabase
      .from("roletas")
      .select("id, nome, auto_checkout_horario")
      .eq("ativa", true)
      .eq("auto_checkout_enabled", true);

    if (rErr) throw rErr;

    const due = (roletas || []).filter((r: any) => {
      const h = String(r.auto_checkout_horario || "").slice(0, 5);
      return h === target;
    });

    let totalCheckouts = 0;
    const processed: Array<{ roleta_id: string; nome: string; count: number }> = [];

    for (const roleta of due) {
      // Fetch online members BEFORE update so we can log them.
      const { data: online, error: oErr } = await supabase
        .from("roletas_membros")
        .select("id, corretor_id")
        .eq("roleta_id", roleta.id)
        .eq("ativo", true)
        .eq("status_checkin", true);

      if (oErr) {
        console.error("[auto-checkout] fetch online failed", roleta.id, oErr);
        continue;
      }
      if (!online || online.length === 0) {
        processed.push({ roleta_id: roleta.id, nome: roleta.nome, count: 0 });
        continue;
      }

      const ids = online.map((m: any) => m.id);
      const { error: uErr } = await supabase
        .from("roletas_membros")
        .update({
          status_checkin: false,
          checkout_em: new Date().toISOString(),
        })
        .in("id", ids);

      if (uErr) {
        console.error("[auto-checkout] update failed", roleta.id, uErr);
        continue;
      }

      // Log per member.
      const motivo = `Checkout automático agendado ${target}`;
      const logRows = online.map((m: any) => ({
        roleta_id: roleta.id,
        acao: "auto_checkout",
        de_corretor_id: m.corretor_id,
        motivo,
      }));
      const { error: lErr } = await supabase.from("roletas_log").insert(logRows);
      if (lErr) console.error("[auto-checkout] log failed", roleta.id, lErr);

      totalCheckouts += online.length;
      processed.push({
        roleta_id: roleta.id,
        nome: roleta.nome,
        count: online.length,
      });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        target_utc3: target,
        roletas_due: due.length,
        total_checkouts: totalCheckouts,
        processed,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (err: any) {
    console.error("[auto-checkout] error", err);
    return new Response(
      JSON.stringify({ ok: false, error: err.message || String(err) }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
