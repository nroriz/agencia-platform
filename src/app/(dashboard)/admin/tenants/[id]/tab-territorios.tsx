"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";
import type { TenantTerritorio } from "@/types/database";

interface TabTerritoriosProps {
  tenantId: string;
  initialData: TenantTerritorio[];
}

interface TerritorioRow {
  id: string;
  codigo: string;
  nome: string;
  peso: number;
  isNew?: boolean;
}

export function TabTerritorios({ tenantId, initialData }: TabTerritoriosProps) {
  const [rows, setRows] = useState<TerritorioRow[]>(
    initialData.map((t) => ({ id: t.id, codigo: t.codigo, nome: t.nome, peso: t.peso }))
  );
  const [saving, setSaving] = useState(false);

  const totalPeso = rows.reduce((sum, r) => sum + r.peso, 0);

  function addRow() {
    setRows((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        codigo: "",
        nome: "",
        peso: 0,
        isNew: true,
      },
    ]);
  }

  function updateRow(id: string, field: keyof TerritorioRow, value: string | number) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  async function handleSave() {
    if (rows.some((r) => !r.codigo || !r.nome)) {
      toast.error("Preencha codigo e nome de todos os territorios");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    // Delete all existing, then re-insert
    await supabase.from("tenant_territorios").delete().eq("tenant_id", tenantId);

    if (rows.length > 0) {
      const { error } = await supabase.from("tenant_territorios").insert(
        rows.map((r) => ({
          tenant_id: tenantId,
          codigo: r.codigo,
          nome: r.nome,
          peso: r.peso,
        }))
      );

      if (error) {
        toast.error("Erro ao salvar: " + error.message);
        setSaving(false);
        return;
      }
    }

    // Refresh IDs
    const { data } = await supabase
      .from("tenant_territorios")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("nome");

    if (data) {
      setRows(data.map((t) => ({ id: t.id, codigo: t.codigo, nome: t.nome, peso: t.peso })));
    }

    setSaving(false);
    toast.success("Territorios salvos");
  }

  return (
    <div className="space-y-6 pt-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Territorios de Conteudo</CardTitle>
          <Button variant="outline" size="sm" onClick={addRow}>
            <Plus className="size-4 mr-1" />
            Adicionar
          </Button>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum territorio cadastrado
            </p>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Codigo</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead className="w-32">Peso (%)</TableHead>
                      <TableHead className="w-16" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <Input
                            value={row.codigo}
                            onChange={(e) => updateRow(row.id, "codigo", e.target.value)}
                            placeholder="ex: dicas_barba"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.nome}
                            onChange={(e) => updateRow(row.id, "nome", e.target.value)}
                            placeholder="ex: Dicas de Barba"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={row.peso}
                              onChange={(e) => updateRow(row.id, "peso", parseInt(e.target.value))}
                              className="flex-1 accent-orange-500"
                            />
                            <span className="text-xs text-muted-foreground w-8 text-right">
                              {row.peso}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => removeRow(row.id)}
                          >
                            <Trash2 className="size-4 text-red-400" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <Label>Total:</Label>
                  <span
                    className={`text-sm font-bold ${
                      totalPeso === 100
                        ? "text-green-400"
                        : "text-yellow-400"
                    }`}
                  >
                    {totalPeso}%
                  </span>
                  {totalPeso !== 100 && (
                    <span className="text-xs text-yellow-400">
                      (deve somar 100%)
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="size-4 animate-spin mr-2" />
          ) : (
            <Save className="size-4 mr-2" />
          )}
          Salvar Territorios
        </Button>
      </div>
    </div>
  );
}
