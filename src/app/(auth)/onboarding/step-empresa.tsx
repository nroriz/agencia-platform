"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";
import type { OnboardingData } from "./wizard";

const NICHOS = [
  "Barbearia",
  "Salao de Beleza",
  "Clinica Odontologica",
  "Restaurante",
  "Personal Trainer",
  "Advocacia",
  "Contabilidade",
  "E-commerce",
  "Outro",
];

interface StepEmpresaProps {
  data: OnboardingData;
  updateData: (partial: Partial<OnboardingData>) => void;
}

export function StepEmpresa({ data, updateData }: StepEmpresaProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(!!data.tenant_id);
  const [customNicho, setCustomNicho] = useState("");

  async function handleSave() {
    if (!data.nome || !data.nicho || !data.handle) {
      toast.error("Preencha nome, nicho e handle");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    const nicho = data.nicho === "Outro" ? customNicho || "Outro" : data.nicho;

    if (data.tenant_id) {
      // Update existing
      const { error } = await supabase
        .from("tenants")
        .update({
          nome: data.nome,
          nicho,
          handle: data.handle.replace("@", ""),
          persona: data.sobre || data.nome,
          publico: `Clientes de ${nicho.toLowerCase()}`,
          posicionamento: data.cidade || null,
        })
        .eq("id", data.tenant_id);

      if (error) {
        toast.error("Erro: " + error.message);
        setSaving(false);
        return;
      }
    } else {
      // Create new tenant
      const { data: tenant, error } = await supabase
        .from("tenants")
        .insert({
          nome: data.nome,
          nicho,
          handle: data.handle.replace("@", ""),
          persona: data.sobre || data.nome,
          publico: `Clientes de ${nicho.toLowerCase()}`,
          posicionamento: data.cidade || null,
          plano: "starter",
          ativo: false,
          frequencia_semanal: 3,
        })
        .select("id")
        .single();

      if (error || !tenant) {
        toast.error("Erro: " + (error?.message ?? "Falha ao criar tenant"));
        setSaving(false);
        return;
      }

      updateData({ tenant_id: tenant.id, nicho });
    }

    setSaving(false);
    setSaved(true);
    toast.success("Dados da empresa salvos");
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-neutral-300">Nome do Negocio *</Label>
          <Input
            value={data.nome}
            onChange={(e) => updateData({ nome: e.target.value })}
            placeholder="Ex: Barbearia do Joao"
            className="bg-white/[0.04] border-white/[0.08] text-white"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-neutral-300">@ do Instagram *</Label>
          <Input
            value={data.handle}
            onChange={(e) => updateData({ handle: e.target.value })}
            placeholder="@seuperfil"
            className="bg-white/[0.04] border-white/[0.08] text-white"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-neutral-300">Nicho *</Label>
        <div className="grid grid-cols-3 gap-2">
          {NICHOS.map((n) => (
            <button
              key={n}
              onClick={() => updateData({ nicho: n })}
              className={`rounded-lg border px-3 py-2 text-sm transition-all ${
                data.nicho === n
                  ? "border-orange-500 bg-orange-500/10 text-orange-400"
                  : "border-white/[0.08] text-neutral-400 hover:border-white/[0.15] hover:text-white"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        {data.nicho === "Outro" && (
          <Input
            value={customNicho}
            onChange={(e) => setCustomNicho(e.target.value)}
            placeholder="Qual seu nicho?"
            className="mt-2 bg-white/[0.04] border-white/[0.08] text-white"
          />
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-neutral-300">Cidade / Estado</Label>
        <Input
          value={data.cidade}
          onChange={(e) => updateData({ cidade: e.target.value })}
          placeholder="Ex: Sao Paulo, SP"
          className="bg-white/[0.04] border-white/[0.08] text-white"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-neutral-300">Sobre o negocio</Label>
        <Textarea
          value={data.sobre}
          onChange={(e) => updateData({ sobre: e.target.value })}
          placeholder="Descreva seu negocio em 2-3 frases..."
          rows={3}
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
          {saved ? "Salvo" : "Salvar"}
        </Button>
      </div>
    </div>
  );
}
