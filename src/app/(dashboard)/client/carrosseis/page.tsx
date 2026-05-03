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
  LayoutGrid,
  Clock,
  CheckCircle2,
  Send,
  Inbox,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import type { CarouselStatus } from "@/types/database";
import { CarouselFilterTabs } from "./carousel-filter-tabs";

const STATUS_CONFIG: Record<CarouselStatus, { label: string; variant: string }> = {
  draft: { label: "Rascunho", variant: "bg-neutral-600/20 text-neutral-400" },
  pending_approval: { label: "Pendente", variant: "bg-yellow-600/20 text-yellow-400" },
  approved: { label: "Aprovado", variant: "bg-green-600/20 text-green-400" },
  rejected: { label: "Rejeitado", variant: "bg-red-600/20 text-red-400" },
  scheduled: { label: "Agendado", variant: "bg-blue-600/20 text-blue-400" },
  published: { label: "Publicado", variant: "bg-purple-600/20 text-purple-400" },
  downloaded: { label: "Baixado", variant: "bg-cyan-600/20 text-cyan-400" },
  failed: { label: "Falhou", variant: "bg-red-600/20 text-red-400" },
};

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function ClientCarrosseisPage({ searchParams }: PageProps) {
  const user = await requireClient();
  const supabase = await createClient();
  const { status: statusFilter } = await searchParams;

  // Fetch carousels for this tenant only
  let query = supabase
    .from("carousels")
    .select("*")
    .eq("tenant_id", user.tenant_id!)
    .order("created_at", { ascending: false })
    .limit(50);

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data: carousels } = await query;

  // Counts for tabs
  const { data: allCarousels } = await supabase
    .from("carousels")
    .select("status")
    .eq("tenant_id", user.tenant_id!);

  const statusCounts: Record<string, number> = { all: 0 };
  if (allCarousels) {
    statusCounts.all = allCarousels.length;
    for (const c of allCarousels) {
      const s = c.status as string;
      statusCounts[s] = (statusCounts[s] ?? 0) + 1;
    }
  }

  const total = statusCounts.all;
  const pending = statusCounts.pending_approval ?? 0;
  const approved = statusCounts.approved ?? 0;
  const published = statusCounts.published ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Meus Carrosseis</h2>
        <p className="text-muted-foreground">
          Acompanhe todos os carrosseis da sua conta
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <LayoutGrid className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="size-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
            <CheckCircle2 className="size-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Publicados</CardTitle>
            <Send className="size-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{published}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <CarouselFilterTabs counts={statusCounts} />

      {/* Carousel Cards */}
      {!carousels || carousels.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Inbox className="size-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              Nenhum carrossel encontrado
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {carousels.map((carousel) => {
            const statusInfo = STATUS_CONFIG[carousel.status as CarouselStatus];
            const createdAt = new Date(carousel.created_at).toLocaleDateString(
              "pt-BR",
              {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }
            );

            return (
              <Card key={carousel.id} className="group">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base line-clamp-1">
                      {carousel.tema_refinado ?? carousel.tema}
                    </CardTitle>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.variant}`}
                    >
                      {statusInfo.label}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(carousel.hook_linha1 || carousel.hook_linha2) && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Hook
                      </p>
                      <p className="text-sm font-semibold">
                        {carousel.hook_linha1}
                      </p>
                      {carousel.hook_linha2 && (
                        <p className="text-sm text-muted-foreground">
                          {carousel.hook_linha2}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {carousel.formato && (
                        <Badge variant="secondary">{carousel.formato}</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {createdAt}
                      </span>
                    </div>

                    <Link
                      href={`/client/carrosseis/${carousel.id}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      Ver
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
