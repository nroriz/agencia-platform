import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  Download,
  Hash,
  Image,
  Layers,
  MessageSquare,
  Type,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import type { CarouselStatus, CarouselSlide } from "@/types/database";
import { DetailActions } from "./detail-actions";
import { CarouselDownloadActions } from "@/components/carousel-download-actions";

const STATUS_CONFIG: Record<CarouselStatus, { label: string; variant: string; bg: string }> = {
  draft: { label: "Rascunho", variant: "bg-neutral-500/15 text-neutral-400 border border-neutral-500/20", bg: "from-neutral-500/10" },
  pending_approval: { label: "Pendente", variant: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20", bg: "from-yellow-500/10" },
  approved: { label: "Aprovado", variant: "bg-green-500/15 text-green-400 border border-green-500/20", bg: "from-green-500/10" },
  rejected: { label: "Rejeitado", variant: "bg-red-500/15 text-red-400 border border-red-500/20", bg: "from-red-500/10" },
  scheduled: { label: "Agendado", variant: "bg-blue-500/15 text-blue-400 border border-blue-500/20", bg: "from-blue-500/10" },
  published: { label: "Publicado", variant: "bg-purple-500/15 text-purple-400 border border-purple-500/20", bg: "from-purple-500/10" },
  downloaded: { label: "Baixado", variant: "bg-cyan-500/15 text-cyan-400 border border-cyan-500/20", bg: "from-cyan-500/10" },
  failed: { label: "Falhou", variant: "bg-red-500/15 text-red-400 border border-red-500/20", bg: "from-red-500/10" },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminCarouselDetailPage({ params }: PageProps) {
  await requireAdmin();
  const supabase = await createClient();
  const { id } = await params;

  const { data: carousel, error } = await supabase
    .from("carousels")
    .select("*, tenants(nome, handle), carousel_slides(*)")
    .eq("id", id)
    .single();

  if (error || !carousel) {
    notFound();
  }

  const tenant = carousel.tenants as unknown as {
    nome: string;
    handle: string;
  } | null;

  const slides = (carousel.carousel_slides as unknown as CarouselSlide[]) ?? [];
  const sortedSlides = [...slides].sort((a, b) => a.slide_number - b.slide_number);

  const statusInfo = STATUS_CONFIG[carousel.status as CarouselStatus];

  const createdAt = new Date(carousel.created_at).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const scheduledAt = carousel.agendado_para
    ? new Date(carousel.agendado_para).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const publishedAt = carousel.publicado_em
    ? new Date(carousel.publicado_em).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/admin/carrosseis"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Voltar para Carrosseis
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/10 text-lg font-bold text-orange-400 shrink-0">
            {tenant?.nome?.charAt(0) ?? "?"}
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {carousel.tema_refinado ?? carousel.tema}
            </h2>
            <p className="text-muted-foreground">
              {tenant?.nome ?? "Tenant desconhecido"} · {tenant?.handle ?? "—"}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium shrink-0 ${statusInfo.variant}`}
        >
          {statusInfo.label}
        </span>
      </div>

      {/* Info Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl ${statusInfo.bg} to-transparent rounded-bl-[32px]`} />
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
              <Type className="size-3.5" />
              Tema Original
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{carousel.tema}</p>
          </CardContent>
        </Card>

        {carousel.territorio && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                <Hash className="size-3.5" />
                Territorio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">{carousel.territorio}</p>
            </CardContent>
          </Card>
        )}

        {carousel.formato && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                <Layers className="size-3.5" />
                Formato
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" className="text-xs">{carousel.formato}</Badge>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
              <Calendar className="size-3.5" />
              Datas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-sm">
              <span className="text-muted-foreground">Criado:</span>{" "}
              <span className="font-medium">{createdAt}</span>
            </p>
            {scheduledAt && (
              <p className="text-sm">
                <span className="text-muted-foreground">Agendado:</span>{" "}
                <span className="font-medium">{scheduledAt}</span>
              </p>
            )}
            {publishedAt && (
              <p className="text-sm">
                <span className="text-muted-foreground">Publicado:</span>{" "}
                <span className="font-medium">{publishedAt}</span>
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hook */}
      {(carousel.hook_linha1 || carousel.hook_linha2) && (
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-orange-500/8 to-transparent rounded-bl-[48px]" />
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
              Hook
            </CardTitle>
          </CardHeader>
          <CardContent>
            {carousel.hook_linha1 && (
              <p className="text-xl font-bold leading-tight">{carousel.hook_linha1}</p>
            )}
            {carousel.hook_linha2 && (
              <p className="text-base text-muted-foreground mt-1">
                {carousel.hook_linha2}
              </p>
            )}
            {carousel.tipo_capa && (
              <Badge variant="secondary" className="mt-3 text-xs">
                Capa: {carousel.tipo_capa}
              </Badge>
            )}
          </CardContent>
        </Card>
      )}

      {/* Caption & Hashtags */}
      {carousel.caption && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
              <MessageSquare className="size-3.5" />
              Caption
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{carousel.caption}</p>
            {carousel.hashtags && carousel.hashtags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {carousel.hashtags.map((tag: string) => (
                  <Badge key={tag} variant="outline" className="text-xs text-orange-400 border-orange-500/20">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Instructions */}
      {carousel.edit_instrucoes && (
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-yellow-400">
              <AlertTriangle className="size-3.5" />
              Instrucoes de Edicao
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{carousel.edit_instrucoes}</p>
          </CardContent>
        </Card>
      )}

      {/* Slides */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="size-5 text-orange-400" />
            Slides ({sortedSlides.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedSlides.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-muted mb-4">
                <Image className="size-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Nenhum slide gerado ainda.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sortedSlides.map((slide) => (
                <Card key={slide.id} className="overflow-hidden border-border/50 hover:border-orange-500/30 transition-colors">
                  {slide.png_url && (
                    <div className="aspect-square relative bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={slide.png_url}
                        alt={`Slide ${slide.slide_number}`}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">
                        Slide {slide.slide_number}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        {slide.tipo}
                      </Badge>
                    </div>
                    {slide.data_json != null && (
                      <pre className="text-[10px] text-muted-foreground bg-muted/50 rounded-lg p-2.5 overflow-auto max-h-32 font-mono">
                        {JSON.stringify(slide.data_json as Record<string, unknown>, null, 2)}
                      </pre>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Download Actions */}
      {sortedSlides.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
              <Download className="size-3.5" />
              Download
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CarouselDownloadActions
              carouselId={carousel.id}
              caption={carousel.caption}
              hashtags={carousel.hashtags}
              slideUrls={sortedSlides
                .filter((s) => s.png_url)
                .map((s) => ({ slideNumber: s.slide_number, url: s.png_url! }))}
            />
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {carousel.status === "pending_approval" && (
        <Card className="border-orange-500/20">
          <CardContent className="py-4">
            <DetailActions carouselId={carousel.id} />
          </CardContent>
        </Card>
      )}

      {/* Meta Post ID */}
      {carousel.meta_post_id && (
        <p className="text-xs text-muted-foreground">
          Meta Post ID: {carousel.meta_post_id}
        </p>
      )}
    </div>
  );
}
