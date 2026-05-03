"use client";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Camera, SkipForward, Shield } from "lucide-react";
import type { OnboardingData } from "./wizard";

interface StepInstagramProps {
  data: OnboardingData;
  updateData: (partial: Partial<OnboardingData>) => void;
}

export function StepInstagram({ data, updateData }: StepInstagramProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-neutral-300">Conectar Instagram</Label>
        <p className="text-xs text-neutral-500">
          Conecte sua conta do Instagram para coletar metricas automaticamente.
          A plataforma NAO publica automaticamente — voce sempre baixa e posta manualmente.
        </p>
      </div>

      {/* Permissions Info */}
      <div className="rounded-xl border border-white/[0.06] p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="size-4 text-green-400" />
          <span className="text-sm font-medium text-white">Somente leitura</span>
        </div>
        <ul className="space-y-2 text-sm text-neutral-400">
          <li className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-green-400" />
            Ver metricas dos seus posts (alcance, saves, compartilhamentos)
          </li>
          <li className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-green-400" />
            Ver informacoes basicas da conta
          </li>
          <li className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-neutral-600" />
            <span className="line-through text-neutral-600">Publicar posts</span>
            <span className="text-xs text-green-400">(nao solicitado)</span>
          </li>
        </ul>
      </div>

      {/* Connect Button */}
      <div className="flex flex-col items-center gap-4 py-4">
        {data.instagram_connected ? (
          <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-center">
            <p className="text-sm text-green-400">
              Conectado como @{data.handle}
            </p>
          </div>
        ) : (
          <>
            <Button
              disabled
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 h-12 px-8"
            >
              <Camera className="size-5 mr-2" />
              Conectar com Instagram
            </Button>
            <p className="text-[10px] text-neutral-600">
              Integracao OAuth sera habilitada na Fase 8
            </p>
          </>
        )}
      </div>

      {/* Skip */}
      <div className="text-center">
        <Button
          variant="ghost"
          className="text-neutral-500 hover:text-neutral-300"
          onClick={() => updateData({ instagram_connected: false })}
        >
          <SkipForward className="size-4 mr-1" />
          Pular — conectar depois nas configuracoes
        </Button>
      </div>
    </div>
  );
}
