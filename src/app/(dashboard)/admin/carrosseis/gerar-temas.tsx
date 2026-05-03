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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Lightbulb,
  Sparkles,
  Copy,
  Check,
  Wand2,
  Loader2,
  Layers,
} from "lucide-react";
import {
  generateThemes,
  generateCarousel,
  generateBatchCarousels,
} from "./actions";

interface Tenant {
  id: string;
  nome: string;
  handle: string;
}

interface ThemeSuggestion {
  tema: string;
  territorio: string;
  formato: string;
  razao: string;
}

const MODE_OPTIONS = [
  { value: "editorial", label: "Editorial Semanal" },
  { value: "tendencias", label: "Tendencias do Nicho" },
  { value: "ideias", label: "Baseado em Ideias" },
] as const;

const QTY_OPTIONS = [3, 5, 7, 10] as const;

interface GerarTemasProps {
  tenants: Tenant[];
}

export function GerarTemas({ tenants }: GerarTemasProps) {
  const [open, setOpen] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [modo, setModo] = useState("editorial");
  const [quantidade, setQuantidade] = useState(5);
  const [temas, setTemas] = useState<ThemeSuggestion[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [generatingIdx, setGeneratingIdx] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isBatchPending, startBatchTransition] = useTransition();
  const router = useRouter();

  function handleGenerate() {
    if (!tenantId) return;
    setMessage(null);
    setTemas([]);

    startTransition(async () => {
      try {
        const result = await generateThemes(tenantId, modo, quantidade);
        setTemas(result);
      } catch (err) {
        setMessage(
          `Erro: ${err instanceof Error ? err.message : "Falha ao gerar temas"}`,
        );
      }
    });
  }

  async function handleCopy(tema: string, idx: number) {
    await navigator.clipboard.writeText(tema);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  function handleUseTema(tema: string, idx: number) {
    if (!tenantId) return;
    setGeneratingIdx(idx);

    startTransition(async () => {
      try {
        await generateCarousel(tenantId, tema);
        setMessage(`Carrossel "${tema.slice(0, 40)}..." gerado com sucesso!`);
        router.refresh();
      } catch (err) {
        setMessage(
          `Erro: ${err instanceof Error ? err.message : "Falha ao gerar carrossel"}`,
        );
      } finally {
        setGeneratingIdx(null);
      }
    });
  }

  function handleGenerateAll() {
    if (!tenantId || temas.length === 0) return;

    startBatchTransition(async () => {
      try {
        const temasTexto = temas.map((t) => t.tema);
        await generateBatchCarousels(tenantId, temasTexto);
        setMessage(
          `${temas.length} carrosseis enviados para geracao em lote!`,
        );
        router.refresh();
      } catch (err) {
        setMessage(
          `Erro: ${err instanceof Error ? err.message : "Falha no lote"}`,
        );
      }
    });
  }

  function handleOpenChange(value: boolean) {
    setOpen(value);
    if (!value) {
      setTemas([]);
      setMessage(null);
      setCopiedIdx(null);
      setGeneratingIdx(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Lightbulb className="size-4 mr-2" />
        Gerar Temas
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="size-5 text-yellow-400" />
            Gerar Sugestoes de Temas
          </DialogTitle>
          <DialogDescription>
            Gere temas inteligentes baseados no perfil, territorios e ideias do
            tenant. Depois, transforme em carrosseis com um clique.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Tenant Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tenant</label>
            <select
              value={tenantId ?? ""}
              onChange={(e) => setTenantId(e.target.value || null)}
              className="flex h-8 w-full items-center rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              <option value="">Selecione o tenant</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome} ({t.handle})
                </option>
              ))}
            </select>
          </div>

          {/* Mode + Quantity Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Modo</label>
              <select
                value={modo}
                onChange={(e) => setModo(e.target.value)}
                className="flex h-8 w-full items-center rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                {MODE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Quantidade</label>
              <select
                value={String(quantidade)}
                onChange={(e) => setQuantidade(Number(e.target.value))}
                className="flex h-8 w-full items-center rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                {QTY_OPTIONS.map((n) => (
                  <option key={n} value={String(n)}>
                    {n} temas
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            className="w-full"
            onClick={handleGenerate}
            disabled={isPending || !tenantId}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Gerando temas...
              </>
            ) : (
              <>
                <Sparkles className="size-4 mr-2" />
                Gerar Temas
              </>
            )}
          </Button>

          {/* Message */}
          {message && (
            <p
              className={`text-sm font-medium ${
                message.startsWith("Erro") ? "text-red-400" : "text-green-400"
              }`}
            >
              {message}
            </p>
          )}

          {/* Results */}
          {temas.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  {temas.length} temas gerados
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateAll}
                  disabled={isBatchPending || isPending}
                >
                  {isBatchPending ? (
                    <>
                      <Loader2 className="size-3 mr-1.5 animate-spin" />
                      Gerando lote...
                    </>
                  ) : (
                    <>
                      <Layers className="size-3 mr-1.5" />
                      Gerar Todos
                    </>
                  )}
                </Button>
              </div>

              {temas.map((tema, idx) => (
                <Card
                  key={idx}
                  className="border-border/50 bg-card/50 hover:bg-accent/30 transition-colors"
                >
                  <CardContent className="p-4 space-y-3">
                    <p className="text-sm font-medium leading-relaxed">
                      {tema.tema}
                    </p>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="secondary"
                        className="text-[10px] bg-orange-500/15 text-orange-400 border border-orange-500/20"
                      >
                        {tema.territorio}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="text-[10px] bg-blue-500/15 text-blue-400 border border-blue-500/20"
                      >
                        {tema.formato}
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {tema.razao}
                    </p>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleCopy(tema.tema, idx)}
                      >
                        {copiedIdx === idx ? (
                          <>
                            <Check className="size-3 mr-1" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="size-3 mr-1" />
                            Copiar
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-orange-400 hover:text-orange-300"
                        onClick={() => handleUseTema(tema.tema, idx)}
                        disabled={generatingIdx === idx || isPending}
                      >
                        {generatingIdx === idx ? (
                          <>
                            <Loader2 className="size-3 mr-1 animate-spin" />
                            Gerando...
                          </>
                        ) : (
                          <>
                            <Wand2 className="size-3 mr-1" />
                            Usar Tema
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
