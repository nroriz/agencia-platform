"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { Check, Pencil } from "lucide-react";
import { approveCarousel, editCarousel } from "../../aprovacao/actions";

interface DetailActionsProps {
  carouselId: string;
  tema: string;
}

export function ClientDetailActions({ carouselId, tema }: DetailActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [instrucoes, setInstrucoes] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const router = useRouter();

  function handleApprove() {
    startTransition(async () => {
      await approveCarousel(carouselId);
      router.refresh();
    });
  }

  function handleEdit() {
    if (!instrucoes.trim()) return;
    startTransition(async () => {
      await editCarousel(carouselId, instrucoes.trim());
      setInstrucoes("");
      setSheetOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={handleApprove}
        disabled={isPending}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        <Check className="size-4 mr-1" />
        {isPending ? "Processando..." : "Aprovar"}
      </Button>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger render={<Button variant="outline" disabled={isPending} />}>
          <Pencil className="size-4 mr-1" />
          Solicitar Edicao
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Solicitar Edicao</SheetTitle>
            <SheetDescription>
              Descreva as alteracoes que deseja neste carrossel.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div>
              <p className="text-sm font-medium mb-1">Tema</p>
              <p className="text-sm text-muted-foreground">{tema}</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Instrucoes</p>
              <Textarea
                placeholder="Ex: Trocar o hook para algo mais direto..."
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
  );
}
