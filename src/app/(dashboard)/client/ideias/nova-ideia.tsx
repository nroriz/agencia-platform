"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { criarIdeia } from "./actions";

export function NovaIdeiaDialog() {
  const [open, setOpen] = useState(false);
  const [tema, setTema] = useState("");
  const [prioridade, setPrioridade] = useState("3");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await criarIdeia({
        tema,
        prioridade: Number(prioridade),
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setTema("");
      setPrioridade("3");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="mr-2 size-4" />
        Nova Ideia
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Ideia</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tema">Tema</Label>
            <Input
              id="tema"
              placeholder="Ex: 5 erros que barbeiros cometem no fade"
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prioridade">Prioridade</Label>
            <Select value={prioridade} onValueChange={(v) => v && setPrioridade(v)}>
              <SelectTrigger id="prioridade">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 - Baixa</SelectItem>
                <SelectItem value="2">2 - Normal</SelectItem>
                <SelectItem value="3">3 - Media</SelectItem>
                <SelectItem value="4">4 - Alta</SelectItem>
                <SelectItem value="5">5 - Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
