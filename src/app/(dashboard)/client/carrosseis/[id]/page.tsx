import { requireClient } from "@/lib/auth";
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
} from "lucide-react";
import Link from "next/link";
import type { CarouselStatus, CarouselSlide } from "@/types/database";
import { ClientDetailActions } from "./detail-actions";
import { CarouselDownloadActions } from "@/components/carousel-download-actions";

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
  params: Promise<{ id: string }>;
}

export default async function ClientCarouselDetailPage({ params }: PageProps) {
  const user = await requireClient();
  const supabase = await createClient();
  const { id } = await params;

  const { data: carousel, error } = await supabase
    .from("carousels")
    .select("*, carousel_slides(*)")
    .eq("id", id)
    .eq("tenant_id", user.tenant_id!)
    .single();

  if (error || !carousel) {
    notFound();
  }

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
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/client/carrosseis"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Voltar
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {carousel.tema_refinado ?? carousel.tema}
          </h2>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusInfo.variant}`}
        >
          {statusInfo.label}
        </span>
      </div>

      {/* Info Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Type className="size-4 text-muted-foreground" />
              Tema Original
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{carousel.tema}</p>
          </CardContent>
        </Card>

        {carousel.territorio && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Hash className="size-4 text-muted-foreground" />
                Territorio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{carousel.territorio}</p>
            </CardContent>
          </Card>
        )}

        {carousel.formato && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Layers className="size-4 text-muted-foreground" />
                Formato
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">{carousel.formato}</Badge>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="size-4 text-muted-foreground" />
              Datas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-sm">
              <span className="text-muted-foreground">Criado:</span> {createdAt}
            </p>
            {scheduledAt && (
              <p className="text-sm">
                <span className="text-muted-foreground">Agendado:</span> {scheduledAt}
              </p>
            )}
            {publishedAt && (
              <p className="text-sm">
                <span className="text-muted-foreground">Publicado:</span> {publishedAt}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hook */}
      {(carousel.hook_linha1 || carousel.hook_linha2) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Hook</CardTitle>
          </CardHeader>
          <CardContent>
            {carousel.hook_linha1 && (
              <p className="text-lg font-bold">{carousel.hook_linha1}</p>
            )}
            {carousel.hook_linha2 && (
              <p className="text-base text-muted-foreground">
                {carousel.hook_linha2}
              </p>
            )}
            {carousel.tipo_capa && (
              <Badge variant="secondary" className="mt-2">
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
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <MessageSquare className="size-4 text-muted-foreground" />
              Caption
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{carousel.caption}</p>
            {carousel.hashtags && carousel.hashtags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {carousel.hashtags.map((tag: string) => (
                  <Badge key={tag} variant="outline" className="text-xs">
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
        <Card className="border-yellow-600/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-400">
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
            <Image className="size-5 text-muted-foreground" />
            Slides ({sortedSlides.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedSlides.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum slide gerado ainda.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sortedSlides.map((slide) => (
                <Card key={slide.id} className="overflow-hidden">
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
                      <span className="text-sm font-medium">
                        Slide {slide.slide_number}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {slide.tipo}
                      </Badge>
                    </div>
                    {slide.data_json != null && (
                      <pre className="text-xs text-muted-foreground bg-muted rounded p-2 overflow-auto max-h-32">
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
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Download className="size-4 text-muted-foreground" />
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

      {/* Action Buttons for pending carousels */}
      {carousel.status === "pending_approval" && (
        <Card>
          <CardContent className="py-4">
            <ClientDetailActions
              carouselId={carousel.id}
              tema={carousel.tema_refinado ?? carousel.tema}
            />
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
