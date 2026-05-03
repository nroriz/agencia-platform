"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Save, Loader2, Clock } from "lucide-react";
import type { TenantHorario } from "@/types/database";

const DIAS = [
  { value: "segunda", label: "Segunda" },
  { value: "terca", label: "Terca" },
  { value: "quarta", label: "Quarta" },
  { value: "quinta", label: "Quinta" },
  { value: "sexta", label: "Sexta" },
  { value: "sabado", label: "Sabado" },
  { value: "domingo", label: "Domingo" },
];

interface DayConfig {
  ativo: boolean;
  hora: string;
}

interface TabHorariosProps {
  tenantId: string;
  initialData: TenantHorario[];
}

export function TabHorarios({ tenantId, initialData }: TabHorariosProps) {
  const initialMap: Record<string, DayConfig> = {};
  for (const dia of DIAS) {
    const existing = initialData.find((h) => h.dia === dia.value);
    initialMap[dia.value] = {
      ativo: !!existing,
      hora: existing?.hora ?? "10:00",
    };
  }

  const [schedule, setSchedule] = useState(initialMap);
  const [saving, setSaving] = useState(false);

  const activeDays = Object.values(schedule).filter((d) => d.ativo).length;

  function toggleDay(dia: string) {
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
    setSaving(true);
    const supabase = createClient();

    await supabase.from("tenant_horarios").delete().eq("tenant_id", tenantId);

    const activeDias = Object.entries(schedule)
      .filter(([, config]) => config.ativo)
      .map(([dia, config]) => ({
        tenant_id: tenantId,
        dia,
        hora: config.hora,
      }));

    if (activeDias.length > 0) {
      const { error } = await supabase.from("tenant_horarios").insert(activeDias);
      if (error) {
        toast.error("Erro ao salvar: " + error.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    toast.success("Horarios salvos");
  }

  return (
    <div className="space-y-6 pt-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="size-4 text-muted-foreground" />
            Grade Semanal
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {activeDays} post{activeDays !== 1 ? "s" : ""}/semana configurado{activeDays !== 1 ? "s" : ""}
          </span>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {DIAS.map((dia) => (
              <div
                key={dia.value}
                className={`flex items-center gap-4 rounded-lg border p-3 transition-colors ${
                  schedule[dia.value].ativo
                    ? "border-orange-500/30 bg-orange-500/5"
                    : "border-border/50"
                }`}
              >
                <Switch
                  checked={schedule[dia.value].ativo}
                  onCheckedChange={() => toggleDay(dia.value)}
                />
                <span className="w-24 text-sm font-medium">{dia.label}</span>
                <Input
                  type="time"
                  value={schedule[dia.value].hora}
                  onChange={(e) => setHora(dia.value, e.target.value)}
                  disabled={!schedule[dia.value].ativo}
                  className="w-32"
                />
              </div>
            ))}
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
          Salvar Horarios
        </Button>
      </div>
    </div>
  );
}
