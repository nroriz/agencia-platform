import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Bot } from "lucide-react";
import { AutomationCards } from "./automation-cards";

export default async function AutomacaoPage() {
  await requireAdmin();
  const supabase = await createClient();

  // Fetch active tenants
  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, nome")
    .eq("ativo", true)
    .order("nome");

  // Count pending carousels (not yet notified via Telegram)
  const { count: pendingCount } = await supabase
    .from("carousels")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending_approval");

  // Count approved carousels in publish queue
  const { count: publishQueueCount } = await supabase
    .from("publish_queue")
    .select("id", { count: "exact", head: true })
    .eq("status", "queued");

  // Latest metrics collection date
  const { data: latestMetric } = await supabase
    .from("carousel_metrics")
    .select("collected_at")
    .order("collected_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Latest intelligence report date
  const { data: latestReport } = await supabase
    .from("data_intelligence")
    .select("created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/20">
          <Bot className="size-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Central de Automacao
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure e monitore os processos automaticos da agencia
          </p>
        </div>
      </div>

      {/* Automation cards */}
      <AutomationCards
        tenants={tenants ?? []}
        pendingCount={pendingCount ?? 0}
        publishQueueCount={publishQueueCount ?? 0}
        lastMetricsDate={latestMetric?.collected_at ?? null}
        lastReportDate={latestReport?.created_at ?? null}
      />
    </div>
  );
}
