"use client";

import { useState, useTransition } from "react";
import {
  Calendar,
  Sparkles,
  MessageSquare,
  Send,
  BarChart3,
  Brain,
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  runEditorial,
  runBatchGeneration,
  notifyPendingTelegram,
  runPublishNow,
  runMetricsCollection,
  runIntelligence,
} from "./actions";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

interface Tenant {
  id: string;
  nome: string;
}

interface AutomationCardsProps {
  tenants: Tenant[];
  pendingCount: number;
  publishQueueCount: number;
  lastMetricsDate: string | null;
  lastReportDate: string | null;
}

interface CardConfig {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  iconColor: string;
  status: string;
  buttonLabel: string;
  needsTenant: boolean;
  link?: string;
}

export function AutomationCards({
  tenants,
  pendingCount,
  publishQueueCount,
  lastMetricsDate,
  lastReportDate,
}: AutomationCardsProps) {
  const [selectedTenant, setSelectedTenant] = useState<string>(
    tenants[0]?.id ?? ""
  );
  const [results, setResults] = useState<
    Record<string, { success: boolean; message: string }>
  >({});

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Nunca";
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const cards: CardConfig[] = [
    {
      id: "editorial",
      title: "Editorial Semanal",
      description: "Gera temas automaticamente baseado nos territorios",
      icon: Calendar,
      gradient: "from-blue-500/20 to-blue-600/5",
      iconColor: "text-blue-400",
      status: "Proximo: Domingo 20:00",
      buttonLabel: "Executar Agora",
      needsTenant: true,
    },
    {
      id: "batch",
      title: "Geracao Batch",
      description: "Gera carrosseis em lote para a semana",
      icon: Sparkles,
      gradient: "from-orange-500/20 to-orange-600/5",
      iconColor: "text-orange-400",
      status: "Proximo: Segunda 06:00",
      buttonLabel: "Executar Agora",
      needsTenant: true,
    },
    {
      id: "telegram",
      title: "Aprovacao Telegram",
      description: "Envia previews para aprovacao via Telegram",
      icon: MessageSquare,
      gradient: "from-green-500/20 to-green-600/5",
      iconColor: "text-green-400",
      status: `${pendingCount} pendentes para notificar`,
      buttonLabel: "Notificar Pendentes",
      needsTenant: false,
    },
    {
      id: "publish",
      title: "Publicacao Instagram",
      description: "Publica carrosseis aprovados no horario agendado",
      icon: Send,
      gradient: "from-purple-500/20 to-purple-600/5",
      iconColor: "text-purple-400",
      status: `${publishQueueCount} na fila de publicacao`,
      buttonLabel: "Publicar Agora",
      needsTenant: true,
    },
    {
      id: "metrics",
      title: "Coleta Metricas",
      description: "Coleta reach, saves, shares do Instagram",
      icon: BarChart3,
      gradient: "from-cyan-500/20 to-cyan-600/5",
      iconColor: "text-cyan-400",
      status: `Ultima coleta: ${formatDate(lastMetricsDate)}`,
      buttonLabel: "Coletar Agora",
      needsTenant: true,
    },
    {
      id: "intelligence",
      title: "Intelligence",
      description: "Analisa performance e gera insights semanais",
      icon: Brain,
      gradient: "from-pink-500/20 to-pink-600/5",
      iconColor: "text-pink-400",
      status: `Ultimo relatorio: ${formatDate(lastReportDate)}`,
      buttonLabel: "Gerar Relatorio",
      needsTenant: true,
      link: "/admin/automacao/intelligence",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Tenant selector */}
      <div className="flex items-center gap-3">
        <label
          htmlFor="tenant-select"
          className="text-sm font-medium text-muted-foreground"
        >
          Tenant:
        </label>
        <select
          id="tenant-select"
          value={selectedTenant}
          onChange={(e) => setSelectedTenant(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40"
        >
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nome}
            </option>
          ))}
        </select>
      </div>

      {/* Cards grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <AutomationCard
            key={card.id}
            config={card}
            tenantId={selectedTenant}
            result={results[card.id]}
            onResult={(result) =>
              setResults((prev) => ({ ...prev, [card.id]: result }))
            }
          />
        ))}
      </div>
    </div>
  );
}

interface AutomationCardProps {
  config: CardConfig;
  tenantId: string;
  result?: { success: boolean; message: string };
  onResult: (result: { success: boolean; message: string }) => void;
}

function AutomationCard({
  config,
  tenantId,
  result,
  onResult,
}: AutomationCardProps) {
  const [isPending, startTransition] = useTransition();
  const Icon = config.icon;

  const handleAction = () => {
    startTransition(async () => {
      let res: { success: boolean; message: string };

      switch (config.id) {
        case "editorial":
          res = await runEditorial(tenantId);
          break;
        case "batch":
          res = await runBatchGeneration(tenantId);
          break;
        case "telegram":
          res = await notifyPendingTelegram();
          break;
        case "publish":
          res = await runPublishNow(tenantId);
          break;
        case "metrics":
          res = await runMetricsCollection(tenantId);
          break;
        case "intelligence":
          res = await runIntelligence(tenantId);
          break;
        default:
          res = { success: false, message: "Acao desconhecida" };
      }

      onResult(res);
    });
  };

  return (
    <Card className="relative overflow-hidden hover:border-orange-500/30 transition-colors">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${config.gradient} pointer-events-none`}
      />
      <CardContent className="relative p-5 space-y-4">
        {/* Icon + Title */}
        <div className="flex items-start gap-3">
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${config.gradient}`}
          >
            <Icon className={`size-5 ${config.iconColor}`} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">{config.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {config.description}
            </p>
          </div>
        </div>

        {/* Status */}
        <p className="text-xs text-muted-foreground/80">{config.status}</p>

        {/* Result feedback */}
        {result && (
          <div
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
              result.success
                ? "bg-green-500/10 text-green-400"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            {result.success ? (
              <CheckCircle2 className="size-3.5 shrink-0" />
            ) : (
              <XCircle className="size-3.5 shrink-0" />
            )}
            <span>{result.message}</span>
          </div>
        )}

        {/* Action button */}
        <Button
          size="sm"
          variant="secondary"
          className="w-full"
          disabled={isPending}
          onClick={handleAction}
        >
          {isPending ? (
            <>
              <Loader2 className="size-3.5 animate-spin mr-2" />
              Executando...
            </>
          ) : (
            config.buttonLabel
          )}
        </Button>

        {/* Optional link */}
        {config.link && (
          <Link href={config.link}>
            <Button
              size="sm"
              variant="ghost"
              className="w-full gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="size-3" />
              Ver Relatorios
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
