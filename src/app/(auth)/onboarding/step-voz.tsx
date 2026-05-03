"use client";

import { useState, type KeyboardEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, X, Plus } from "lucide-react";
import type { OnboardingData } from "./wizard";

const TOM_OPTIONS = [
  {
    value: "direto",
    label: "Direto e pratico",
    example: "Faz a conta: R$45 menos R$38...",
  },
  {
    value: "acolhedor",
    label: "Acolhedor e explicativo",
    example: "Vou te explicar como funciona...",
  },
  {
    value: "tecnico",
    label: "Tecnico e preciso",
    example: "A taxa de retencao media do setor e...",
  },
  {
    value: "casual",
    label: "Casual e descontraido",
    example: "Bora la, vou te mostrar um trick...",
  },
];

const SUGESTOES_PROIBIDAS: Record<string, string[]> = {
  Barbearia: ["jornada", "mindset", "escalar", "sinergia", "disruptivo"],
  "Salao de Beleza": ["jornada", "empoderamento", "disruptivo", "hack"],
  "Clinica Odontologica": ["promessa de resultado", "milagre", "hack"],
  Restaurante: ["gourmetizado", "premium", "exclusivo", "hack"],
  "Personal Trainer": ["hack", "segredo", "milagre", "rapido"],
  Advocacia: ["garantia de resultado", "promessa", "hack"],
  default: ["jornada", "mindset", "escalar", "sinergia", "hack"],
};

interface StepVozProps {
  data: OnboardingData;
  updateData: (partial: Partial<OnboardingData>) => void;
}

export function StepVoz({ data, updateData }: StepVozProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newPalavra, setNewPalavra] = useState("");
  const [newExpressao, setNewExpressao] = useState("");
  const [voiceBank, setVoiceBank] = useState("");

  const sugestoes = SUGESTOES_PROIBIDAS[data.nicho] ?? SUGESTOES_PROIBIDAS.default;

  function loadSugestoes() {
    const merged = [...new Set([...data.palavras_proibidas, ...sugestoes])];
    updateData({ palavras_proibidas: merged });
  }

  function addPalavra(e?: KeyboardEvent<HTMLInputElement>) {
    if (e && e.key !== "Enter") return;
    const val = newPalavra.trim();
    if (!val) return;
    updateData({ palavras_proibidas: [...data.palavras_proibidas, val] });
    setNewPalavra("");
  }

  function removePalavra(idx: number) {
    updateData({
      palavras_proibidas: data.palavras_proibidas.filter((_, i) => i !== idx),
    });
  }

  function addExpressao(e?: KeyboardEvent<HTMLInputElement>) {
    if (e && e.key !== "Enter") return;
    const val = newExpressao.trim();
    if (!val) return;
    updateData({ expressoes_tipicas: [...data.expressoes_tipicas, val] });
    setNewExpressao("");
  }

  function removeExpressao(idx: number) {
    updateData({
      expressoes_tipicas: data.expressoes_tipicas.filter((_, i) => i !== idx),
    });
  }

  async function handleSave() {
    if (!data.tenant_id) {
      toast.error("Salve os dados da empresa primeiro (Passo 1)");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    const { error } = await supabase.from("tenant_voz").upsert(
      {
        tenant_id: data.tenant_id,
        tom: data.tom,
        palavras_proibidas: data.palavras_proibidas,
        expressoes_tipicas: data.expressoes_tipicas,
        anti_exemplos: [],
        regras_extras: [],
        voice_bank_text: voiceBank || null,
      },
      { onConflict: "tenant_id" }
    );

    setSaving(false);
    if (error) {
      toast.error("Erro: " + error.message);
    } else {
      setSaved(true);
      toast.success("Voz salva");
    }
  }

  return (
    <div className="space-y-6">
      {/* Tom */}
      <div className="space-y-3">
        <Label className="text-neutral-300">Tom de Voz</Label>
        <div className="grid gap-2">
          {TOM_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateData({ tom: opt.value })}
              className={`rounded-xl border p-4 text-left transition-all ${
                data.tom === opt.value
                  ? "border-orange-500 bg-orange-500/10"
                  : "border-white/[0.08] hover:border-white/[0.15]"
              }`}
            >
              <span className="text-sm font-medium text-white">{opt.label}</span>
              <p className="text-xs text-neutral-500 mt-1 italic">&quot;{opt.example}&quot;</p>
            </button>
          ))}
        </div>
      </div>

      {/* Palavras Proibidas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-neutral-300">Palavras Proibidas</Label>
          {sugestoes.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={loadSugestoes}
              className="text-xs text-orange-400"
            >
              Carregar sugestoes ({data.nicho})
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {data.palavras_proibidas.map((p, i) => (
            <Badge
              key={i}
              variant="destructive"
              className="gap-1 cursor-pointer"
              onClick={() => removePalavra(i)}
            >
              {p}
              <X className="size-3" />
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newPalavra}
            onChange={(e) => setNewPalavra(e.target.value)}
            onKeyDown={(e) => addPalavra(e)}
            placeholder="Digite e pressione Enter"
            className="bg-white/[0.04] border-white/[0.08] text-white"
          />
          <Button variant="outline" size="sm" onClick={() => addPalavra()} className="border-white/[0.1]">
            <Plus className="size-4" />
          </Button>
        </div>
      </div>

      {/* Expressoes Tipicas */}
      <div className="space-y-3">
        <Label className="text-neutral-300">Expressoes Tipicas</Label>
        <p className="text-xs text-neutral-500">
          Frases que voce usa no dia a dia com clientes
        </p>
        <div className="flex flex-wrap gap-2">
          {data.expressoes_tipicas.map((e, i) => (
            <Badge
              key={i}
              variant="secondary"
              className="gap-1 cursor-pointer"
              onClick={() => removeExpressao(i)}
            >
              {e}
              <X className="size-3" />
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newExpressao}
            onChange={(e) => setNewExpressao(e.target.value)}
            onKeyDown={(e) => addExpressao(e)}
            placeholder="Ex: Bora resolver isso"
            className="bg-white/[0.04] border-white/[0.08] text-white"
          />
          <Button variant="outline" size="sm" onClick={() => addExpressao()} className="border-white/[0.1]">
            <Plus className="size-4" />
          </Button>
        </div>
      </div>

      {/* Voice Bank */}
      <div className="space-y-2">
        <Label className="text-neutral-300">Texto de Referencia (opcional)</Label>
        <Textarea
          value={voiceBank}
          onChange={(e) => setVoiceBank(e.target.value)}
          placeholder="Cole aqui textos que representam como voce se comunica..."
          rows={4}
          className="bg-white/[0.04] border-white/[0.08] text-white"
        />
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
          {saved ? "Salvo" : "Salvar Voz"}
        </Button>
      </div>
    </div>
  );
}
