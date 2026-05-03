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
  LayoutGrid,
  Clock,
  Send,
  CalendarCheck,
  AlertTriangle,
  Eye,
  ArrowRight,
  Plus,
} from "lucide-react";
import Link from "next/link";
import type { CarouselStatus } from "@/types/database";
import { CarouselFilterTabs } from "./carousel-filter-tabs";
import { GerarCarousel } from "./gerar-carousel";
import { GerarTemas } from "./gerar-temas";

const STATUS_CONFIG: Record<CarouselStatus, { label: string; variant: string }> = {
  draft: { label: "Rascunho", variant: "bg-neutral-500/15 text-neutral-400 border border-neutral-500/20" },
  pending_approval: { label: "Pendente", variant: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20" },
  approved: { label: "Aprovado", variant: "bg-green-500/15 text-green-400 border border-green-500/20" },
  rejected: { label: "Rejeitado", variant: "bg-red-500/15 text-red-400 border border-red-500/20" },
  scheduled: { label: "Agendado", variant: "bg-blue-500/15 text-blue-400 border border-blue-500/20" },
  published: { label: "Publicado", variant: "bg-purple-500/15 text-purple-400 border border-purple-500/20" },
  downloaded: { label: "Baixado", variant: "bg-cyan-500/15 text-cyan-400 border border-cyan-500/20" },
  failed: { label: "Falhou", variant: "bg-red-500/15 text-red-400 border border-red-500/20" },
};

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminCarrosseisPage({ searchParams }: PageProps) {
  await requireAdmin();
  const supabase = await createClient();
  const { status: statusFilter } = await searchParams;

  let query = supabase
    .from("carousels")
    .select("*, tenants(nome, handle)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data: carousels } = await query;

  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, nome, handle")
    .eq("ativo", true)
    .order("nome");

  const { data: allCarousels } = await supabase
    .from("carousels")
    .select("status");

  const statusCounts: Record<string, number> = { all: 0 };
  if (allCarousels) {
    statusCounts.all = allCarousels.length;
    for (const c of allCarousels) {
      const s = c.status as string;
      statusCounts[s] = (statusCounts[s] ?? 0) + 1;
    }
  }

  const total = statusCounts.all;
  const published = statusCounts.published ?? 0;
  const pending = statusCounts.pending_approval ?? 0;
  const scheduled = statusCounts.scheduled ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Carrosseis</h2>
          <p className="text-muted-foreground">
            Gerenciar todos os carrosseis de todos os tenants
          </p>
        </div>
        <div className="flex items-center gap-2">
          <GerarTemas tenants={tenants ?? []} />
          <GerarCarousel tenants={tenants ?? []} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-[40px]" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
            <LayoutGrid className="size-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground mt-1">carrosseis criados</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-bl-[40px]" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Publicados
            </CardTitle>
            <Send className="size-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{published}</div>
            <p className="text-xs text-muted-foreground mt-1">no Instagram</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-yellow-500/10 to-transparent rounded-bl-[40px]" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendentes
            </CardTitle>
            <Clock className="size-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pending}</div>
            {pending > 0 && (
              <Link
                href="/admin/aprovacao"
                className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 mt-1 transition-colors"
              >
                Revisar agora <ArrowRight className="size-3" />
              </Link>
            )}
            {pending === 0 && (
              <p className="text-xs text-muted-foreground mt-1">aguardando revisao</p>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-green-500/10 to-transparent rounded-bl-[40px]" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Agendados
            </CardTitle>
            <CalendarCheck className="size-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{scheduled}</div>
            <p className="text-xs text-muted-foreground mt-1">para publicar</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <CarouselFilterTabs counts={statusCounts} />

      {/* Carousel List */}
      {!carousels || carousels.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-muted mb-4">
              <AlertTriangle className="size-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-muted-foreground">
              Nenhum carrossel encontrado
            </p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Tente alterar o filtro ou gere um novo carrossel
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {carousels.map((carousel) => {
            const tenant = carousel.tenants as unknown as {
              nome: string;
              handle: string;
            } | null;

            const statusInfo = STATUS_CONFIG[carousel.status as CarouselStatus];
            const createdAt = new Date(carousel.created_at).toLocaleDateString(
              "pt-BR",
              { day: "2-digit", month: "2-digit", year: "numeric" }
            );

            return (
              <Link
                key={carousel.id}
                href={`/admin/carrosseis/${carousel.id}`}
                className="flex items-center justify-between rounded-xl border border-border/50 bg-card/50 p-4 hover:bg-accent/50 transition-all group"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/10 text-sm font-bold text-orange-400 shrink-0">
                    {tenant?.nome?.charAt(0) ?? "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate group-hover:text-orange-400 transition-colors">
                      {carousel.tema_refinado ?? carousel.tema}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tenant?.nome ?? "—"} · {tenant?.handle ?? "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  {carousel.formato && (
                    <Badge variant="secondary" className="text-[10px] hidden sm:inline-flex">
                      {carousel.formato}
                    </Badge>
                  )}
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium ${statusInfo.variant}`}
                  >
                    {statusInfo.label}
                  </span>
                  <span className="text-xs text-muted-foreground hidden md:inline">
                    {createdAt}
                  </span>
                  <ArrowRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
