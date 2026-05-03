import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Brain,
  TrendingUp,
  BarChart3,
  FileText,
  CalendarDays,
  ArrowLeft,
  Trophy,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ReportDetail } from "./report-detail";

export default async function IntelligencePage() {
  await requireAdmin();
  const supabase = await createClient();

  // Fetch intelligence reports with tenant info
  const { data: reports } = await supabase
    .from("data_intelligence")
    .select("id, tenant_id, periodo, report_json, created_at, tenants(nome)")
    .order("created_at", { ascending: false })
    .limit(20);

  // Count total reports
  const { count: totalReports } = await supabase
    .from("data_intelligence")
    .select("id", { count: "exact", head: true });

  // Latest report date
  const latestReportDate = reports?.[0]?.created_at ?? null;

  // Avg engagement rate from 7d carousel metrics
  const { data: engagementData } = await supabase
    .from("carousel_metrics")
    .select("engagement_rate")
    .eq("janela", "7d")
    .not("engagement_rate", "is", null);

  const avgEngagement =
    engagementData && engagementData.length > 0
      ? engagementData.reduce(
          (sum, m) => sum + (m.engagement_rate ?? 0),
          0
        ) / engagementData.length
      : 0;

  // Top format: most used format from published carousels
  const { data: formatData } = await supabase
    .from("carousels")
    .select("formato")
    .eq("status", "published")
    .not("formato", "is", null);

  const formatCounts: Record<string, number> = {};
  formatData?.forEach((c) => {
    const fmt = c.formato as string;
    formatCounts[fmt] = (formatCounts[fmt] ?? 0) + 1;
  });
  const topFormat =
    Object.entries(formatCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A";

  // Top 5 carousels by engagement rate (7d window)
  const { data: topCarousels } = await supabase
    .from("carousel_metrics")
    .select(
      "carousel_id, engagement_rate, reach, saves, shares, likes, collected_at, carousels(tema, formato, tenant_id, tenants(nome))"
    )
    .eq("janela", "7d")
    .not("engagement_rate", "is", null)
    .order("engagement_rate", { ascending: false })
    .limit(5);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Nunca";
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const summaryCards = [
    {
      title: "Total Relatorios",
      value: totalReports ?? 0,
      icon: FileText,
      gradient: "from-blue-500/20 to-blue-600/5",
      iconColor: "text-blue-400",
    },
    {
      title: "Ultimo Relatorio",
      value: latestReportDate
        ? new Date(latestReportDate).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
          })
        : "Nenhum",
      icon: CalendarDays,
      gradient: "from-green-500/20 to-green-600/5",
      iconColor: "text-green-400",
    },
    {
      title: "Avg Engagement Rate",
      value: `${avgEngagement.toFixed(2)}%`,
      icon: TrendingUp,
      gradient: "from-orange-500/20 to-orange-600/5",
      iconColor: "text-orange-400",
    },
    {
      title: "Top Formato",
      value: topFormat,
      icon: BarChart3,
      gradient: "from-purple-500/20 to-purple-600/5",
      iconColor: "text-purple-400",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg shadow-pink-500/20">
            <Brain className="size-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Intelligence &amp; Insights
            </h2>
            <p className="text-sm text-muted-foreground">
              Relatorios de performance e analises geradas por IA
            </p>
          </div>
        </div>
        <Link href="/admin/automacao">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="size-3.5" />
            Voltar
          </Button>
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.title}
              className="relative overflow-hidden border-border/50"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${card.gradient} pointer-events-none`}
              />
              <CardContent className="relative p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${card.gradient}`}
                  >
                    <Icon className={`size-4 ${card.iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {card.title}
                    </p>
                    <p className="text-lg font-bold truncate">{card.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Top Performing Carousels */}
      {topCarousels && topCarousels.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Trophy className="size-5 text-yellow-500" />
            <h3 className="text-lg font-semibold">
              Top Performing (7 dias)
            </h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {topCarousels.map((item, index) => {
              const carousel = item.carousels as unknown as {
                tema: string;
                formato: string | null;
                tenant_id: string;
                tenants: { nome: string } | null;
              } | null;
              return (
                <Card
                  key={item.carousel_id}
                  className="relative overflow-hidden border-border/50 hover:border-yellow-500/30 transition-colors"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 pointer-events-none" />
                  <CardContent className="relative p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-bold"
                      >
                        #{index + 1}
                      </Badge>
                      <span className="text-xs font-bold text-yellow-500">
                        {(item.engagement_rate ?? 0).toFixed(2)}%
                      </span>
                    </div>
                    <p className="text-xs font-medium line-clamp-2">
                      {carousel?.tema ?? "Sem tema"}
                    </p>
                    <div className="flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
                      <span>
                        {carousel?.tenants?.nome ?? "—"}
                      </span>
                      {carousel?.formato && (
                        <Badge variant="outline" className="text-[10px] px-1.5">
                          {carousel.formato}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-3 text-[10px] text-muted-foreground pt-1">
                      <span>R {item.reach}</span>
                      <span>S {item.saves}</span>
                      <span>Sh {item.shares}</span>
                      <span>L {item.likes}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Reports list */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Relatorios Recentes</h3>
        {reports && reports.length > 0 ? (
          <div className="space-y-3">
            {reports.map((report) => {
              const tenant = report.tenants as unknown as {
                nome: string;
              } | null;
              return (
                <ReportDetail
                  key={report.id}
                  reportId={report.id}
                  tenantName={tenant?.nome ?? "Tenant removido"}
                  periodo={report.periodo}
                  createdAt={report.created_at}
                  reportJson={report.report_json}
                />
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Brain className="size-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhum relatorio gerado ainda.
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Execute o agente de Intelligence na Central de Automacao.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
