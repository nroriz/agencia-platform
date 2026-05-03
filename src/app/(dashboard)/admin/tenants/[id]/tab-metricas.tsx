"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp } from "lucide-react";

interface MetricsSummary {
  total_carousels: number;
  published: number;
  avg_engagement: number;
  total_reach: number;
}

interface TabMetricasProps {
  tenantId: string;
}

export function TabMetricas({ tenantId }: TabMetricasProps) {
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const { data: carousels } = await supabase
        .from("carousels")
        .select("id, status")
        .eq("tenant_id", tenantId);

      const total = carousels?.length ?? 0;
      const published = carousels?.filter((c) => c.status === "published").length ?? 0;

      const carouselIds = carousels?.map((c) => c.id) ?? [];
      let avgEngagement = 0;
      let totalReach = 0;

      if (carouselIds.length > 0) {
        const { data: metricsData } = await supabase
          .from("carousel_metrics")
          .select("engagement_rate, reach")
          .in("carousel_id", carouselIds);

        if (metricsData && metricsData.length > 0) {
          avgEngagement =
            metricsData.reduce((sum, m) => sum + (m.engagement_rate ?? 0), 0) /
            metricsData.length;
          totalReach = metricsData.reduce((sum, m) => sum + (m.reach ?? 0), 0);
        }
      }

      setMetrics({
        total_carousels: total,
        published,
        avg_engagement: avgEngagement,
        total_reach: totalReach,
      });
      setLoading(false);
    }

    load();
  }, [tenantId]);

  if (loading) {
    return (
      <div className="pt-4 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Carrosseis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {metrics?.total_carousels ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Publicados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-400">
              {metrics?.published ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1 text-muted-foreground">
              <TrendingUp className="size-4" />
              Engagement Medio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400">
              {(metrics?.avg_engagement ?? 0).toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1 text-muted-foreground">
              <BarChart3 className="size-4" />
              Alcance Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-400">
              {(metrics?.total_reach ?? 0).toLocaleString("pt-BR")}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <BarChart3 className="size-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Graficos detalhados serao adicionados na Fase 8
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
