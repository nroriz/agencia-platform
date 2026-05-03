"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Lightbulb } from "lucide-react";
import type { Ideia } from "@/types/database";

interface TabIdeiasProps {
  tenantId: string;
  initialData: Ideia[];
}

export function TabIdeias({ tenantId, initialData }: TabIdeiasProps) {
  const [ideias, setIdeias] = useState(initialData);
  const [newTema, setNewTema] = useState("");
  const [newOrigem, setNewOrigem] = useState("manual");
  const [newPrioridade, setNewPrioridade] = useState(5);
  const [adding, setAdding] = useState(false);

  async function addIdeia() {
    if (!newTema.trim()) {
      toast.error("Preencha o tema");
      return;
    }

    setAdding(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("ideias")
      .insert({
        tenant_id: tenantId,
        tema: newTema.trim(),
        origem: newOrigem,
        prioridade: newPrioridade,
        usado: false,
      })
      .select()
      .single();

    setAdding(false);
    if (error) {
      toast.error("Erro: " + error.message);
      return;
    }

    setIdeias((prev) => [data as Ideia, ...prev]);
    setNewTema("");
    toast.success("Ideia adicionada");
  }

  async function deleteIdeia(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("ideias").delete().eq("id", id);

    if (error) {
      toast.error("Erro: " + error.message);
      return;
    }

    setIdeias((prev) => prev.filter((i) => i.id !== id));
    toast.success("Ideia removida");
  }

  return (
    <div className="space-y-6 pt-4">
      {/* Add New */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="size-4 text-yellow-400" />
            Nova Ideia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-1">
              <Input
                value={newTema}
                onChange={(e) => setNewTema(e.target.value)}
                placeholder="Tema da ideia..."
                onKeyDown={(e) => e.key === "Enter" && addIdeia()}
              />
            </div>
            <select
              value={newOrigem}
              onChange={(e) => setNewOrigem(e.target.value)}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
            >
              <option value="manual">Manual</option>
              <option value="ia">IA</option>
              <option value="cliente">Cliente</option>
              <option value="tendencia">Tendencia</option>
            </select>
            <Input
              type="number"
              min={1}
              max={10}
              value={newPrioridade}
              onChange={(e) => setNewPrioridade(parseInt(e.target.value) || 5)}
              className="w-20"
              placeholder="Prio"
            />
            <Button onClick={addIdeia} disabled={adding} size="sm">
              <Plus className="size-4 mr-1" />
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Ideias ({ideias.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ideias.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma ideia cadastrada
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tema</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead className="text-center">Prioridade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ideias.map((ideia) => (
                    <TableRow key={ideia.id}>
                      <TableCell className="font-medium max-w-xs truncate">
                        {ideia.tema}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{ideia.origem}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`text-sm font-bold ${
                            ideia.prioridade >= 8
                              ? "text-red-400"
                              : ideia.prioridade >= 5
                              ? "text-yellow-400"
                              : "text-muted-foreground"
                          }`}
                        >
                          {ideia.prioridade}
                        </span>
                      </TableCell>
                      <TableCell>
                        {ideia.usado ? (
                          <Badge variant="default" className="bg-green-600">
                            Usado
                          </Badge>
                        ) : (
                          <Badge variant="outline">Disponivel</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(ideia.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => deleteIdeia(ideia.id)}
                        >
                          <Trash2 className="size-4 text-red-400" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
