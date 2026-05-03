import { requireClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Bookmark, Share2, BarChart3 } from "lucide-react";
import { EngagementChart } from "./charts";
import type { CarouselStatus } from "@/types/database";

interface RecentCarousel {
  id: string;
  tema: string;
  status: CarouselStatus;
  publicado_em: string | null;
  reach: number;
  saves: number;
  shares: number;
  comments: number;
  engagement_rate: number | null;
}

interface EngagementDataPoint {
  tema: string;
  reach: number;
  saves: number;
  shares: number;
  comments: number;
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

const STATUS_VARIANT: Record<CarouselStatus, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  pending_approval: "outline",
  approved: "default",
  rejected: "destructive",
  scheduled: "secondary",
  published: "default",
  downloaded: "secondary",
  failed: "destructive",
};

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export default async function ClientMetricasPage() {
  const user = await requireClient();
  const supabase = await createClient();
  const tenantId = user.tenant_id;

  // Total carousels for this tenant
  const { count: totalCarousels } = await supabase
    .from("carousels")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  // Carousels by status (for summary)
  const { data: allCarousels } = await supabase
    .from("carousels")
    .select("status")
    .eq("tenant_id", tenantId);

  const statusMap = new Map<CarouselStatus, number>();
  for (const c of allCarousels ?? []) {
    const s = c.status as CarouselStatus;
    statusMap.set(s, (statusMap.get(s) ?? 0) + 1);
  }

  // Last 10 carousels with their metrics
  const { data: recentCarouselsRaw } = await supabase
    .from("carousels")
    .select("id, tema, status, publicado_em")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(10);

  const carouselIds = (recentCarouselsRaw ?? []).map((c) => c.id);

  // Fetch metrics for those carousels
  let metricsMap = new Map<
    string,
    { reach: number; saves: number; shares: number; comments: number; engagement_rate: number | null }
  >();

  if (carouselIds.length > 0) {
    const { data: metricsRaw } = await supabase
      .from("carousel_metrics")
      .select("carousel_id, reach, saves, shares, comments, engagement_rate")
      .in("carousel_id", carouselIds);

    for (const m of metricsRaw ?? []) {
      const existing = metricsMap.get(m.carousel_id);
      if (!existing || (m.reach ?? 0) > existing.reach) {
        metricsMap.set(m.carousel_id, {
          reach: m.reach ?? 0,
          saves: m.saves ?? 0,
          shares: m.shares ?? 0,
          comments: m.comments ?? 0,
          engagement_rate: m.engagement_rate,
        });
      }
    }
  }

  const recentCarousels: RecentCarousel[] = (recentCarouselsRaw ?? []).map((c) => {
    const metrics = metricsMap.get(c.id);
    return {
      id: c.id,
      tema: c.tema,
      status: c.status as CarouselStatus,
      publicado_em: c.publicado_em,
      reach: metrics?.reach ?? 0,
      saves: metrics?.saves ?? 0,
      shares: metrics?.shares ?? 0,
      comments: metrics?.comments ?? 0,
      engagement_rate: metrics?.engagement_rate ?? null,
    };
  });

  // Aggregate metrics for stat cards — get all carousel IDs for this tenant
  const { data: tenantCarouselIds } = await supabase
    .from("carousels")
    .select("id")
    .eq("tenant_id", tenantId);

  const allTenantIds = (tenantCarouselIds ?? []).map((c) => c.id);

  const { data: allMetrics } = allTenantIds.length > 0
    ? await supabase
        .from("carousel_metrics")
        .select("reach, saves, shares, comments, carousel_id")
        .in("carousel_id", allTenantIds)
    : { data: [] as { reach: number; saves: number; shares: number; comments: number; carousel_id: string }[] };

  // Deduplicate metrics: pick the highest reach per carousel
  const bestMetrics = new Map<
    string,
    { reach: number; saves: number; shares: number; comments: number }
  >();
  for (const m of allMetrics ?? []) {
    const existing = bestMetrics.get(m.carousel_id);
    if (!existing || (m.reach ?? 0) > existing.reach) {
      bestMetrics.set(m.carousel_id, {
        reach: m.reach ?? 0,
        saves: m.saves ?? 0,
        shares: m.shares ?? 0,
        comments: m.comments ?? 0,
      });
    }
  }

  let totalReach = 0;
  let totalSaves = 0;
  let totalShares = 0;

  for (const metrics of bestMetrics.values()) {
    totalReach += metrics.reach;
    totalSaves += metrics.saves;
    totalShares += metrics.shares;
  }

  // Engagement chart data (last 10 carousels, reversed for chronological order)
  const engagementData: EngagementDataPoint[] = [...recentCarousels]
    .reverse()
    .map((c) => ({
      tema: c.tema.length > 20 ? c.tema.slice(0, 20) + "..." : c.tema,
      reach: c.reach,
      saves: c.saves,
      shares: c.shares,
      comments: c.comments,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Metricas</h2>
        <p className="text-muted-foreground">
          Performance dos seus carrosseis
        </p>
      </div>

      {/* Row 1: Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <BarChart3 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCarousels ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              {statusMap.get("published") ?? 0} publicados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reach Total</CardTitle>
            <Eye className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalReach)}</div>
            <p className="text-xs text-muted-foreground">alcance acumulado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saves Total</CardTitle>
            <Bookmark className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalSaves)}</div>
            <p className="text-xs text-muted-foreground">salvamentos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shares Total</CardTitle>
            <Share2 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalShares)}</div>
            <p className="text-xs text-muted-foreground">compartilhamentos</p>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Engagement Chart */}
      <EngagementChart data={engagementData} />

      {/* Row 3: Recent Carousels Table */}
      <Card>
        <CardHeader>
          <CardTitle>Carrosseis Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentCarousels.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tema</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Reach</TableHead>
                  <TableHead className="text-right">Saves</TableHead>
                  <TableHead className="text-right">Shares</TableHead>
                  <TableHead className="text-right">Comments</TableHead>
                  <TableHead className="text-right">Eng. Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentCarousels.map((carousel) => (
                  <TableRow key={carousel.id}>
                    <TableCell className="max-w-[200px] truncate font-medium">
                      {carousel.tema}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[carousel.status]}>
                        {STATUS_LABELS[carousel.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(carousel.reach)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(carousel.saves)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(carousel.shares)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(carousel.comments)}
                    </TableCell>
                    <TableCell className="text-right">
                      {carousel.engagement_rate !== null
                        ? `${carousel.engagement_rate.toFixed(1)}%`
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">
              Nenhum carrossel encontrado.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
