"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, CheckCircle2, Plus, Trash2 } from "lucide-react";
import type { OnboardingData } from "./wizard";

const SUGESTOES_TERRITORIOS: Record<string, Array<{ codigo: string; nome: string }>> = {
  Barbearia: [
    { codigo: "precificacao", nome: "Precificacao" },
    { codigo: "gestao_financeira", nome: "Gestao Financeira" },
    { codigo: "atendimento", nome: "Atendimento ao Cliente" },
    { codigo: "marketing", nome: "Marketing" },
    { codigo: "tendencias", nome: "Tendencias" },
  ],
  "Salao de Beleza": [
    { codigo: "tendencias", nome: "Tendencias" },
    { codigo: "tecnicas", nome: "Tecnicas" },
    { codigo: "gestao", nome: "Gestao de Salao" },
    { codigo: "fidelizacao", nome: "Fidelizacao" },
    { codigo: "marketing", nome: "Marketing" },
  ],
  "Clinica Odontologica": [
    { codigo: "procedimentos", nome: "Procedimentos" },
    { codigo: "mitos_verdades", nome: "Mitos e Verdades" },
    { codigo: "cuidados", nome: "Cuidados" },
    { codigo: "prevencao", nome: "Prevencao" },
    { codigo: "marketing", nome: "Marketing" },
  ],
  Restaurante: [
    { codigo: "cmv", nome: "CMV e Custos" },
    { codigo: "ficha_tecnica", nome: "Ficha Tecnica" },
    { codigo: "delivery", nome: "Delivery" },
    { codigo: "atendimento", nome: "Atendimento" },
    { codigo: "marketing", nome: "Marketing" },
  ],
  "Personal Trainer": [
    { codigo: "treino", nome: "Treino" },
    { codigo: "nutricao", nome: "Nutricao" },
    { codigo: "motivacao", nome: "Motivacao" },
    { codigo: "resultados", nome: "Resultados" },
    { codigo: "marketing", nome: "Marketing" },
  ],
  default: [
    { codigo: "dicas", nome: "Dicas" },
    { codigo: "tendencias", nome: "Tendencias" },
    { codigo: "bastidores", nome: "Bastidores" },
    { codigo: "educacional", nome: "Educacional" },
    { codigo: "marketing", nome: "Marketing" },
  ],
};

const DIAS = [
  { value: "segunda", label: "Seg" },
  { value: "terca", label: "Ter" },
  { value: "quarta", label: "Qua" },
  { value: "quinta", label: "Qui" },
  { value: "sexta", label: "Sex" },
  { value: "sabado", label: "Sab" },
  { value: "domingo", label: "Dom" },
];

interface StepConteudoProps {
  data: OnboardingData;
  updateData: (partial: Partial<OnboardingData>) => void;
}

export function StepConteudo({ data, updateData }: StepConteudoProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newTerritorio, setNewTerritorio] = useState("");
  const [schedule, setSchedule] = useState<Record<string, { ativo: boolean; hora: string }>>(() => {
    const map: Record<string, { ativo: boolean; hora: string }> = {};
    for (const dia of DIAS) {
      const existing = data.horarios.find((h) => h.dia === dia.value);
      map[dia.value] = { ativo: !!existing, hora: existing?.hora ?? "10:00" };
    }
    return map;
  });

  const sugestoes = SUGESTOES_TERRITORIOS[data.nicho] ?? SUGESTOES_TERRITORIOS.default;
  const totalPeso = data.territorios.reduce((s, t) => s + t.peso, 0);

  function loadSugestoes() {
    const evenWeight = Math.floor(100 / sugestoes.length);
    const territories = sugestoes.map((s, i) => ({
      ...s,
      peso: i === sugestoes.length - 1 ? 100 - evenWeight * (sugestoes.length - 1) : evenWeight,
    }));
    updateData({ territorios: territories });
  }

  function addTerritorio() {
    if (!newTerritorio.trim()) return;
    updateData({
      territorios: [
        ...data.territorios,
        {
          codigo: newTerritorio.trim().toLowerCase().replace(/\s+/g, "_"),
          nome: newTerritorio.trim(),
          peso: 0,
        },
      ],
    });
    setNewTerritorio("");
  }

  function updatePeso(idx: number, peso: number) {
    const updated = [...data.territorios];
    updated[idx] = { ...updated[idx], peso };
    updateData({ territorios: updated });
  }

  function removeTerritorio(idx: number) {
    updateData({ territorios: data.territorios.filter((_, i) => i !== idx) });
  }

  function toggleDia(dia: string) {
    setSchedule((prev) => ({
      ...prev,
      [dia]: { ...prev[dia], ativo: !prev[dia].ativo },
    }));
  }

  function setHora(dia: string, hora: string) {
    setSchedule((prev) => ({
      ...prev,
      [dia]: { ...prev[dia], hora },
    }));
  }

  async function handleSave() {
    if (!data.tenant_id) {
      toast.error("Salve os dados da empresa primeiro (Passo 1)");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    // Save territories
    await supabase.from("tenant_territorios").delete().eq("tenant_id", data.tenant_id);
    if (data.territorios.length > 0) {
      await supabase.from("tenant_territorios").insert(
        data.territorios.map((t) => ({
          tenant_id: data.tenant_id,
          codigo: t.codigo,
          nome: t.nome,
          peso: t.peso,
        }))
      );
    }

    // Save schedule
    const activeHorarios = Object.entries(schedule)
      .filter(([, c]) => c.ativo)
      .map(([dia, c]) => ({ dia, hora: c.hora }));

    await supabase.from("tenant_horarios").delete().eq("tenant_id", data.tenant_id);
    if (activeHorarios.length > 0) {
      await supabase.from("tenant_horarios").insert(
        activeHorarios.map((h) => ({
          tenant_id: data.tenant_id,
          dia: h.dia,
          hora: h.hora,
        }))
      );
    }

    // Update frequency
    const freq = activeHorarios.length || data.frequencia_semanal;
    await supabase
      .from("tenants")
      .update({ frequencia_semanal: freq })
      .eq("id", data.tenant_id);
    updateData({ frequencia_semanal: freq, horarios: activeHorarios });

    setSaving(false);
    setSaved(true);
    toast.success("Conteudo salvo");
  }

  return (
    <div className="space-y-6">
      {/* Territories */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-neutral-300">Territorios de Conteudo</Label>
          {data.territorios.length === 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={loadSugestoes}
              className="text-xs text-orange-400"
            >
              Carregar sugestoes ({data.nicho || "padrao"})
            </Button>
          )}
        </div>

        {data.territorios.length > 0 && (
          <div className="space-y-2">
            {data.territorios.map((t, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border border-white/[0.08] p-3"
              >
                <span className="text-sm text-white flex-1">{t.nome}</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={t.peso}
                  onChange={(e) => updatePeso(i, parseInt(e.target.value))}
                  className="w-24 accent-orange-500"
                />
                <span className="text-xs text-neutral-400 w-8 text-right">{t.peso}%</span>
                <Button variant="ghost" size="icon-sm" onClick={() => removeTerritorio(i)}>
                  <Trash2 className="size-3 text-red-400" />
                </Button>
              </div>
            ))}
            <div className="flex justify-between text-xs">
              <span className="text-neutral-500">Total:</span>
              <span className={totalPeso === 100 ? "text-green-400" : "text-yellow-400"}>
                {totalPeso}%
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Input
            value={newTerritorio}
            onChange={(e) => setNewTerritorio(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTerritorio()}
            placeholder="Adicionar territorio..."
            className="bg-white/[0.04] border-white/[0.08] text-white"
          />
          <Button variant="outline" size="sm" onClick={addTerritorio} className="border-white/[0.1]">
            <Plus className="size-4" />
          </Button>
        </div>
      </div>

      {/* Schedule */}
      <div className="space-y-3">
        <Label className="text-neutral-300">Dias e Horarios</Label>
        <div className="grid grid-cols-7 gap-2">
          {DIAS.map((dia) => (
            <div
              key={dia.value}
              className={`rounded-xl border p-2 text-center transition-all ${
                schedule[dia.value].ativo
                  ? "border-orange-500/50 bg-orange-500/10"
                  : "border-white/[0.06]"
              }`}
            >
              <button
                onClick={() => toggleDia(dia.value)}
                className="text-xs font-medium text-neutral-300 w-full"
              >
                {dia.label}
              </button>
              {schedule[dia.value].ativo && (
                <input
                  type="time"
                  value={schedule[dia.value].hora}
                  onChange={(e) => setHora(dia.value, e.target.value)}
                  className="mt-1 w-full bg-transparent border-0 text-[10px] text-neutral-400 text-center"
                />
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-neutral-500">
          {Object.values(schedule).filter((s) => s.ativo).length} posts/semana
        </p>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className={saved
            ? "bg-green-600 hover:bg-green-700 text-white"
            : "bg-gradient-to-r from-orange-500 to-red-600 text-white"
          }
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin mr-1" />
          ) : saved ? (
            <CheckCircle2 className="size-4 mr-1" />
          ) : null}
          {saved ? "Salvo" : "Salvar Conteudo"}
        </Button>
      </div>
    </div>
  );
}
