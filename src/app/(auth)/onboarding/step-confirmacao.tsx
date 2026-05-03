"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Palette, MessageCircle, LayoutGrid, Image as ImageIcon } from "lucide-react";
import type { OnboardingData } from "./wizard";

interface StepConfirmacaoProps {
  data: OnboardingData;
}

export function StepConfirmacao({ data }: StepConfirmacaoProps) {
  const items = [
    {
      icon: CheckCircle2,
      label: "Empresa",
      value: data.nome || "Nao configurado",
      ok: !!data.nome,
    },
    {
      icon: Palette,
      label: "Visual",
      value: data.logo_url ? "Logo + cores definidas" : "Cores definidas",
      ok: !!data.cor_acento,
      preview: (
        <div className="flex gap-1.5 mt-1">
          <div className="size-5 rounded" style={{ backgroundColor: data.cor_fundo }} />
          <div className="size-5 rounded" style={{ backgroundColor: data.cor_acento }} />
          <div className="size-5 rounded border border-white/[0.1]" style={{ backgroundColor: data.cor_texto }} />
        </div>
      ),
    },
    {
      icon: MessageCircle,
      label: "Voz",
      value: data.tom || "Nao configurado",
      ok: !!data.tom,
    },
    {
      icon: LayoutGrid,
      label: "Conteudo",
      value: `${data.territorios.length} territorios, ${data.frequencia_semanal}x/semana`,
      ok: data.territorios.length > 0,
    },
    {
      icon: ImageIcon,
      label: "Fotos",
      value: `${data.fotos.length} foto(s)`,
      ok: data.fotos.length > 0,
    },
  ];

  return (
    <div className="space-y-6">
      <p className="text-sm text-neutral-400">
        Revise suas configuracoes antes de ativar sua conta.
        Voce pode editar tudo depois nas configuracoes.
      </p>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.label}
            className={`rounded-xl border p-4 flex items-start gap-3 ${
              item.ok ? "border-green-500/20 bg-green-500/5" : "border-white/[0.06]"
            }`}
          >
            <item.icon
              className={`size-5 mt-0.5 ${
                item.ok ? "text-green-400" : "text-neutral-600"
              }`}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">{item.label}</span>
                {item.ok ? (
                  <Badge variant="default" className="bg-green-600/20 text-green-400 text-[10px]">
                    OK
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px]">
                    Opcional
                  </Badge>
                )}
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">{item.value}</p>
              {item.preview}
            </div>
          </div>
        ))}
      </div>

      {/* Preview Card */}
      <div className="rounded-xl border border-white/[0.06] p-4 text-center space-y-2">
        <div
          className="mx-auto w-[200px] h-[250px] rounded-lg overflow-hidden relative"
          style={{ backgroundColor: data.cor_fundo }}
        >
          <div
            className="h-6 flex items-center justify-center"
            style={{ borderBottom: `2px solid ${data.cor_acento}` }}
          >
            <span style={{ color: data.cor_texto, fontSize: "6px", opacity: 0.5 }}>
              @{data.handle || "handle"}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center gap-2 p-4 pt-6">
            <span
              style={{
                color: data.cor_acento,
                fontFamily: data.fonte_headline,
                fontSize: "24px",
                fontWeight: 900,
              }}
            >
              01
            </span>
            <span
              style={{
                color: data.cor_texto,
                fontFamily: data.fonte_headline,
                fontSize: "11px",
                fontWeight: 800,
                textAlign: "center",
              }}
            >
              Seu Primeiro Post
            </span>
            <span
              style={{
                color: data.cor_texto,
                fontFamily: data.fonte_corpo,
                fontSize: "7px",
                opacity: 0.6,
                textAlign: "center",
              }}
            >
              Sera gerado automaticamente
            </span>
          </div>
          <div className="absolute bottom-2 left-0 right-0 text-center">
            <span style={{ color: data.cor_acento, fontSize: "6px" }}>
              {data.nome}
            </span>
          </div>
        </div>
        <p className="text-xs text-neutral-500">
          Seu primeiro carrossel real sera gerado apos a confirmacao
        </p>
      </div>
    </div>
  );
}
