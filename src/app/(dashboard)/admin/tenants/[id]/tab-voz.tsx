"use client";

import { useState, type KeyboardEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, Loader2, X, Plus, MessageCircle } from "lucide-react";
import type { TenantVoz } from "@/types/database";

interface TabVozProps {
  tenantId: string;
  initialData: TenantVoz | null;
}

export function TabVoz({ tenantId, initialData }: TabVozProps) {
  const [tom, setTom] = useState(initialData?.tom ?? "");
  const [palavrasProibidas, setPalavrasProibidas] = useState<string[]>(
    initialData?.palavras_proibidas ?? []
  );
  const [expressoesTipicas, setExpressoesTipicas] = useState<string[]>(
    initialData?.expressoes_tipicas ?? []
  );
  const [antiExemplos, setAntiExemplos] = useState<Array<{ errado: string; certo: string }>>(
    initialData?.anti_exemplos ?? []
  );
  const [regrasExtras, setRegrasExtras] = useState<string[]>(
    initialData?.regras_extras ?? []
  );
  const [voiceBank, setVoiceBank] = useState(initialData?.voice_bank_text ?? "");
  const [saving, setSaving] = useState(false);

  const [newPalavra, setNewPalavra] = useState("");
  const [newExpressao, setNewExpressao] = useState("");
  const [newRegra, setNewRegra] = useState("");

  function addChip(
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    inputSetter: React.Dispatch<React.SetStateAction<string>>
  ) {
    const trimmed = value.trim();
    if (!trimmed) return;
    setter((prev) => [...prev, trimmed]);
    inputSetter("");
  }

  function handleChipKeyDown(
    e: KeyboardEvent<HTMLInputElement>,
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    inputSetter: React.Dispatch<React.SetStateAction<string>>
  ) {
    if (e.key === "Enter") {
      e.preventDefault();
      addChip(value, setter, inputSetter);
    }
  }

  function removeChip(index: number, setter: React.Dispatch<React.SetStateAction<string[]>>) {
    setter((prev) => prev.filter((_, i) => i !== index));
  }

  function addAntiExemplo() {
    setAntiExemplos((prev) => [...prev, { errado: "", certo: "" }]);
  }

  function updateAntiExemplo(index: number, field: "errado" | "certo", value: string) {
    setAntiExemplos((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function removeAntiExemplo(index: number) {
    setAntiExemplos((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();

    const payload = {
      tenant_id: tenantId,
      tom,
      palavras_proibidas: palavrasProibidas,
      expressoes_tipicas: expressoesTipicas,
      anti_exemplos: antiExemplos.filter((a) => a.errado || a.certo),
      regras_extras: regrasExtras,
      voice_bank_text: voiceBank || null,
    };

    let error;
    if (initialData) {
      ({ error } = await supabase
        .from("tenant_voz")
        .update(payload)
        .eq("tenant_id", tenantId));
    } else {
      ({ error } = await supabase.from("tenant_voz").insert(payload));
    }

    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("Voz da marca salva");
    }
  }

  return (
    <div className="space-y-6 pt-4">
      {/* Tom */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircle className="size-4 text-muted-foreground" />
            Tom de Voz
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={tom}
            onChange={(e) => setTom(e.target.value)}
            placeholder="Descreva o tom de voz da marca (ex: informal, direto, motivacional...)"
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Palavras Proibidas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Palavras Proibidas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {palavrasProibidas.map((p, i) => (
              <Badge
                key={i}
                variant="destructive"
                className="gap-1 cursor-pointer"
                onClick={() => removeChip(i, setPalavrasProibidas)}
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
              onKeyDown={(e) => handleChipKeyDown(e, newPalavra, setPalavrasProibidas, setNewPalavra)}
              placeholder="Digite e pressione Enter"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => addChip(newPalavra, setPalavrasProibidas, setNewPalavra)}
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Expressoes Tipicas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Expressoes Tipicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {expressoesTipicas.map((e, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="gap-1 cursor-pointer"
                onClick={() => removeChip(i, setExpressoesTipicas)}
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
              onKeyDown={(e) => handleChipKeyDown(e, newExpressao, setExpressoesTipicas, setNewExpressao)}
              placeholder="Digite e pressione Enter"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => addChip(newExpressao, setExpressoesTipicas, setNewExpressao)}
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Anti-exemplos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Anti-exemplos</CardTitle>
          <Button variant="outline" size="sm" onClick={addAntiExemplo}>
            <Plus className="size-4 mr-1" />
            Adicionar
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {antiExemplos.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum anti-exemplo cadastrado
            </p>
          )}
          {antiExemplos.map((item, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex-1 space-y-1">
                <Input
                  value={item.errado}
                  onChange={(e) => updateAntiExemplo(i, "errado", e.target.value)}
                  placeholder="Errado: NAO diga isso"
                  className="border-red-500/30"
                />
              </div>
              <div className="flex-1 space-y-1">
                <Input
                  value={item.certo}
                  onChange={(e) => updateAntiExemplo(i, "certo", e.target.value)}
                  placeholder="Certo: Diga assim"
                  className="border-green-500/30"
                />
              </div>
              <Button variant="ghost" size="icon-sm" onClick={() => removeAntiExemplo(i)}>
                <X className="size-4 text-red-400" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Regras Extras */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Regras Extras</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {regrasExtras.map((r, i) => (
              <Badge
                key={i}
                variant="outline"
                className="gap-1 cursor-pointer"
                onClick={() => removeChip(i, setRegrasExtras)}
              >
                {r}
                <X className="size-3" />
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newRegra}
              onChange={(e) => setNewRegra(e.target.value)}
              onKeyDown={(e) => handleChipKeyDown(e, newRegra, setRegrasExtras, setNewRegra)}
              placeholder="Digite e pressione Enter"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => addChip(newRegra, setRegrasExtras, setNewRegra)}
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Voice Bank */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Voice Bank</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={voiceBank}
            onChange={(e) => setVoiceBank(e.target.value)}
            placeholder="Texto longo de referencia para o tom de voz da marca..."
            rows={6}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="size-4 animate-spin mr-2" />
          ) : (
            <Save className="size-4 mr-2" />
          )}
          Salvar Voz
        </Button>
      </div>
    </div>
  );
}
