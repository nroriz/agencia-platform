"use client";

import { useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Pencil, Check } from "lucide-react";
import type { Carousel, CarouselStatus } from "@/types/database";
import { approveCarousel, editCarousel } from "./actions";

interface CarouselCardProps {
  carousel: Carousel;
}

const statusConfig: Record<
  string,
  { label: string; className: string }
> = {
  pending_approval: {
    label: "Pendente",
    className: "bg-yellow-600/20 text-yellow-400 border-yellow-600/30",
  },
  approved: {
    label: "Aprovado",
    className: "bg-green-600/20 text-green-400 border-green-600/30",
  },
  rejected: {
    label: "Rejeitado",
    className: "bg-red-600/20 text-red-400 border-red-600/30",
  },
};

export function CarouselCard({ carousel }: CarouselCardProps) {
  const [isPending, startTransition] = useTransition();
  const [instrucoes, setInstrucoes] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);

  const status = statusConfig[carousel.status] ?? {
    label: carousel.status,
    className: "",
  };

  const createdAt = new Date(carousel.created_at).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const captionPreview = carousel.caption
    ? carousel.caption.length > 150
      ? `${carousel.caption.slice(0, 150)}...`
      : carousel.caption
    : null;

  function handleApprove() {
    startTransition(async () => {
      await approveCarousel(carousel.id);
    });
  }

  function handleEdit() {
    if (!instrucoes.trim()) return;
    startTransition(async () => {
      await editCarousel(carousel.id, instrucoes.trim());
      setInstrucoes("");
      setSheetOpen(false);
    });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base line-clamp-2">
            {carousel.tema_refinado ?? carousel.tema}
          </CardTitle>
          <div className="flex items-center gap-2 shrink-0">
            {carousel.formato && (
              <Badge variant="secondary">{carousel.formato}</Badge>
            )}
            <Badge variant="outline" className={status.className}>
              {status.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {carousel.tema_refinado && carousel.tema_refinado !== carousel.tema && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Tema original
            </p>
            <p className="text-sm text-muted-foreground">{carousel.tema}</p>
          </div>
        )}

        {(carousel.hook_linha1 || carousel.hook_linha2) && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Hook
            </p>
            <p className="text-sm font-semibold">{carousel.hook_linha1}</p>
            {carousel.hook_linha2 && (
              <p className="text-sm text-muted-foreground">
                {carousel.hook_linha2}
              </p>
            )}
          </div>
        )}

        {captionPreview && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Caption
            </p>
            <p className="text-sm text-muted-foreground">{captionPreview}</p>
          </div>
        )}

        {carousel.status === "approved" && carousel.agendado_para && (
          <div className="flex items-center gap-1 text-sm text-green-400">
            <Clock className="size-3" />
            <span>
              Agendado para{" "}
              {new Date(carousel.agendado_para).toLocaleDateString("pt-BR", {
                weekday: "short",
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        )}

        <p className="text-xs text-muted-foreground">{createdAt}</p>

        {carousel.status === "pending_approval" && (
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={handleApprove}
              disabled={isPending}
            >
              <Check className="size-4 mr-1" />
              {isPending ? "Processando..." : "Aprovar"}
            </Button>

            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger
                render={<Button size="sm" variant="outline" className="flex-1" disabled={isPending} />}
              >
                <Pencil className="size-4 mr-1" />
                Editar
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Solicitar Edicao</SheetTitle>
                  <SheetDescription>
                    Descreva as alteracoes que deseja neste carrossel. O
                    pipeline vai reprocessar com suas instrucoes.
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-4 mt-6">
                  <div>
                    <p className="text-sm font-medium mb-1">Tema</p>
                    <p className="text-sm text-muted-foreground">
                      {carousel.tema_refinado ?? carousel.tema}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Instrucoes</p>
                    <Textarea
                      placeholder="Ex: Trocar o hook para algo mais direto. Reduzir o numero de slides para 7..."
                      value={instrucoes}
                      onChange={(e) => setInstrucoes(e.target.value)}
                      rows={6}
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleEdit}
                    disabled={isPending || !instrucoes.trim()}
                  >
                    {isPending ? "Enviando..." : "Enviar para Edicao"}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
