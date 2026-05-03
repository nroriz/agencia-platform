"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Sparkles } from "lucide-react";
import { generateCarousel } from "./actions";

interface Tenant {
  id: string;
  nome: string;
  handle: string;
}

interface GerarCarouselProps {
  tenants: Tenant[];
}

export function GerarCarousel({ tenants }: GerarCarouselProps) {
  const [open, setOpen] = useState(false);
  const [tenantId, setTenantId] = useState("");
  const [tema, setTema] = useState("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();

  function handleGenerate() {
    if (!tenantId || !tema.trim()) return;

    startTransition(async () => {
      try {
        await generateCarousel(tenantId, tema.trim());
        setResult("Carrossel gerado com sucesso!");
        setTema("");
        setTimeout(() => {
          setOpen(false);
          setResult(null);
          router.refresh();
        }, 1500);
      } catch (err) {
        setResult(
          `Erro: ${err instanceof Error ? err.message : "Falha ao gerar"}`
        );
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4 mr-2" />
        Gerar Carrossel
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-orange-400" />
            Gerar Novo Carrossel
          </DialogTitle>
          <DialogDescription>
            Selecione o tenant e informe o tema. O pipeline de IA vai gerar o
            carrossel completo automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tenant</label>
            <Select value={tenantId} onValueChange={(v) => v && setTenantId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tenant" />
              </SelectTrigger>
              <SelectContent>
                {tenants.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nome} ({t.handle})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tema</label>
            <Input
              placeholder="Ex: Precificacao de corte masculino"
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleGenerate();
              }}
            />
          </div>

          {result && (
            <p
              className={`text-sm font-medium ${
                result.startsWith("Erro") ? "text-red-400" : "text-green-400"
              }`}
            >
              {result}
            </p>
          )}

          <Button
            className="w-full"
            onClick={handleGenerate}
            disabled={isPending || !tenantId || !tema.trim()}
          >
            <Sparkles className="size-4 mr-2" />
            {isPending ? "Gerando... (pode levar alguns minutos)" : "Gerar Carrossel"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
