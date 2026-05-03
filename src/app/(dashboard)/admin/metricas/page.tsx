import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  CheckCircle,
  Star,
  Eye,
  Trophy,
} from "lucide-react";
import { CarouselsPerDayChart, StatusPieChart } from "./charts";
import type { CarouselStatus } from "@/types/database";

interface StatusRow {
  status: CarouselStatus;
  count: number;
}

interface DailyRow {
  date: string;
  count: number;
}

interface TopCarousel {
  id: string;
  tema: string;
  status: CarouselStatus;
  engagement: number;
  saves: number;
  shares: number;
  comments: number;
  reach: number;
}

const STATUS_LABELS: Record<CarouselStatus, string> = {
  draft: "Rascunho",
  pending_approval: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
  scheduled: "Agendado",
  published: "Publicado",
  downloaded: "Baixado",
  failed: "Falha",
};

const STATUS_COLORS: Record<CarouselStatus, string> = {
  draft: "bg-neutral-500/15 text-neutral-400",
  pending_approval: "bg-yellow-500/15 text-yellow-400",
  approved: "bg-green-500/15 text-green-400",
  rejected: "bg-red-500/15 text-red-400",
  scheduled: "bg-blue-500/15 text-blue-400",
  published: "bg-purple-500/15 text-purple-400",
  downloaded: "oklch(0.7 0.15 200)",
  failed: "bg-red-500/15 text-red-400",
};

export default async function MetricasPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { count: totalCarousels } = await supabase
    .from("carousels")
    .select("*", { count: "exact", head: true });

  const { count: approvedCount } = await supabase
    .from("carousels")
    .select("*", { count: "exact", head: true })
    .in("status", ["approved", "scheduled", "published"]);

  const approvedRate =
    totalCarousels && totalCarousels > 0
      ? Math.round(((approvedCount ?? 0) / totalCarousels) * 100)
      : 0;

  const { data: avgData } = await supabase
    .from("carousel_metrics")
    .select("engagement_rate");

  const validRates = (avgData ?? [])
    .map((m) => m.engagement_rate)
    .filter((r): r is number => r !== null && r > 0);
  const avgScore =
    validRates.length > 0
      ? (validRates.reduce((a, b) => a + b, 0) / validRates.length).toFixed(1)
      : "—";

  const { data: reachData } = await supabase
    .from("carousel_metrics")
    .select("reach");

  const totalReach = (reachData ?? []).reduce((sum, m) => sum + (m.reach ?? 0), 0);

  const { data: allCarousels } = await supabase
    .from("carousels")
    .select("status");

  const statusMap = new Map<CarouselStatus, number>();
  for (const c of allCarousels ?? []) {
    const s = c.status as CarouselStatus;
    statusMap.set(s, (statusMap.get(s) ?? 0) + 1);
  }
  const statusData: StatusRow[] = Array.from(statusMap.entries()).map(
    ([status, count]) => ({ status, count })
  );

  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: recentCarousels } = await supabase
    .from("carousels")
    .select("created_at")
    .gte("created_at", thirtyDaysAgo);

  const dailyMap = new Map<string, number>();
  for (const c of recentCarousels ?? []) {
    const day = c.created_at.slice(0, 10);
    dailyMap.set(day, (dailyMap.get(day) ?? 0) + 1);
  }

  const dailyData: DailyRow[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    dailyData.push({
      date: key.slice(5),
      count: dailyMap.get(key) ?? 0,
    });
  }

  const { data: metricsWithCarousel } = await supabase
    .from("carousel_metrics")
    .select("carousel_id, saves, shares, comments, reach")
    .order("saves", { ascending: false })
    .limit(50);

  const engagementMap = new Map<
    string,
    { saves: number; shares: number; comments: number; reach: number }
  >();
  for (const m of metricsWithCarousel ?? []) {
    const existing = engagementMap.get(m.carousel_id) ?? {
      saves: 0,
      shares: 0,
      comments: 0,
      reach: 0,
    };
    engagementMap.set(m.carousel_id, {
      saves: existing.saves + (m.saves ?? 0),
      shares: existing.shares + (m.shares ?? 0),
      comments: existing.comments + (m.comments ?? 0),
      reach: existing.reach + (m.reach ?? 0),
    });
  }

  const topIds = Array.from(engagementMap.entries())
    .map(([id, metrics]) => ({
      id,
      engagement: metrics.saves + metrics.shares + metrics.comments,
      ...metrics,
    }))
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 5);

  let topCarousels: TopCarousel[] = [];
  if (topIds.length > 0) {
    const { data: carouselDetails } = await supabase
      .from("carousels")
      .select("id, tema, status")
      .in(
        "id",
        topIds.map((t) => t.id)
      );

    topCarousels = topIds.map((t) => {
      const detail = (carouselDetails ?? []).find((c) => c.id === t.id);
      return {
        id: t.id,
        tema: detail?.tema ?? "—",
        status: (detail?.status ?? "draft") as CarouselStatus,
        engagement: t.engagement,
        saves: t.saves,
        shares: t.shares,
        comments: t.comments,
        reach: t.reach,
      };
    });
  }

  function formatNumber(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Metricas</h2>
        <p className="text-muted-foreground">
          Visao agregada de todos os tenants
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-[40px]" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Carrosseis
            </CardTitle>
            <BarChart3 className="size-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalCarousels ?? 0}</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-green-500/10 to-transparent rounded-bl-[40px]" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa Aprovacao
            </CardTitle>
            <CheckCircle className="size-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{approvedRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {approvedCount ?? 0} de {totalCarousels ?? 0}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-orange-500/10 to-transparent rounded-bl-[40px]" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Engagement
            </CardTitle>
            <Star className="size-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgScore}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {validRates.length} medicoes
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-bl-[40px]" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Reach Total
            </CardTitle>
            <Eye className="size-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatNumber(totalReach)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <CarouselsPerDayChart data={dailyData} />
        </div>
        <div className="lg:col-span-2">
          <StatusPieChart data={statusData} />
        </div>
      </div>

      {/* Top Carousels */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/10">
            <Trophy className="size-4 text-orange-400" />
          </div>
          <CardTitle>Top Carrosseis por Engajamento</CardTitle>
        </CardHeader>
        <CardContent>
          {topCarousels.length > 0 ? (
            <div className="space-y-3">
              {topCarousels.map((carousel, i) => (
                <div
                  key={carousel.id}
                  className="flex items-center justify-between rounded-xl border border-border/50 p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-sm font-bold text-muted-foreground">
                      #{i + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{carousel.tema}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[carousel.status]}`}>
                          {STATUS_LABELS[carousel.status]}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatNumber(carousel.saves)} saves · {formatNumber(carousel.shares)} shares · {formatNumber(carousel.comments)} comments
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-lg font-bold text-orange-400">
                      {formatNumber(carousel.engagement)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatNumber(carousel.reach)} reach
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-muted mb-4">
                <Trophy className="size-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Nenhuma metrica de engajamento disponivel.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
