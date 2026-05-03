"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Save, Loader2 } from "lucide-react";
import type { Tenant } from "@/types/database";

interface TabGeralProps {
  tenant: Tenant;
}

export function TabGeral({ tenant }: TabGeralProps) {
  const [form, setForm] = useState({
    nome: tenant.nome,
    nicho: tenant.nicho,
    handle: tenant.handle,
    persona: tenant.persona,
    posicionamento: tenant.posicionamento ?? "",
    publico: tenant.publico,
    diferencial: tenant.diferencial ?? "",
    plano: tenant.plano,
    frequencia_semanal: tenant.frequencia_semanal,
    ativo: tenant.ativo,
  });
  const [saving, setSaving] = useState(false);

  function update(field: string, value: string | number | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("tenants")
      .update({
        nome: form.nome,
        nicho: form.nicho,
        handle: form.handle,
        persona: form.persona,
        posicionamento: form.posicionamento || null,
        publico: form.publico,
        diferencial: form.diferencial || null,
        plano: form.plano,
        frequencia_semanal: form.frequencia_semanal,
        ativo: form.ativo,
      })
      .eq("id", tenant.id);

    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("Dados salvos com sucesso");
    }
  }

  return (
    <div className="space-y-6 pt-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informacoes do Tenant</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={form.nome}
                onChange={(e) => update("nome", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Handle (@)</Label>
              <Input
                value={form.handle}
                onChange={(e) => update("handle", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Nicho</Label>
              <Input
                value={form.nicho}
                onChange={(e) => update("nicho", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Plano</Label>
              <Input
                value={form.plano}
                onChange={(e) => update("plano", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Frequencia Semanal</Label>
              <Input
                type="number"
                min={1}
                max={14}
                value={form.frequencia_semanal}
                onChange={(e) => update("frequencia_semanal", parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch
                checked={form.ativo}
                onCheckedChange={(val) => update("ativo", val)}
              />
              <Label>Ativo</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Persona</Label>
            <Textarea
              value={form.persona}
              onChange={(e) => update("persona", e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Posicionamento</Label>
            <Textarea
              value={form.posicionamento}
              onChange={(e) => update("posicionamento", e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Publico</Label>
            <Textarea
              value={form.publico}
              onChange={(e) => update("publico", e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Diferencial</Label>
            <Textarea
              value={form.diferencial}
              onChange={(e) => update("diferencial", e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="size-4 animate-spin mr-2" />
          ) : (
            <Save className="size-4 mr-2" />
          )}
          Salvar
        </Button>
      </div>
    </div>
  );
}
