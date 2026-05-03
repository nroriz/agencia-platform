import { requireClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Lightbulb, Star, Check } from "lucide-react";
import { NovaIdeiaDialog } from "./nova-ideia";
import type { Ideia } from "@/types/database";

const origemColors: Record<string, "default" | "secondary" | "outline"> = {
  manual: "default",
  ia: "secondary",
  tendencia: "outline",
};

function PrioridadeStars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`size-3.5 ${
            i < value
              ? "fill-yellow-500 text-yellow-500"
              : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

export default async function IdeiasPage() {
  const user = await requireClient();
  const supabase = await createClient();

  const { data } = await supabase
    .from("ideias")
    .select("*")
    .eq("tenant_id", user.tenant_id!)
    .order("prioridade", { ascending: false });

  const ideias = (data ?? []) as Ideia[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Banco de Ideias</h2>
          <p className="text-muted-foreground">
            {ideias.length} {ideias.length === 1 ? "ideia" : "ideias"} cadastradas
          </p>
        </div>
        <NovaIdeiaDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="size-5" />
            Ideias
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ideias.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tema</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Usado</TableHead>
                  <TableHead>Criado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ideias.map((ideia) => (
                  <TableRow key={ideia.id}>
                    <TableCell className="font-medium max-w-xs truncate">
                      {ideia.tema}
                    </TableCell>
                    <TableCell>
                      <Badge variant={origemColors[ideia.origem] ?? "default"}>
                        {ideia.origem}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <PrioridadeStars value={ideia.prioridade} />
                    </TableCell>
                    <TableCell>
                      {ideia.usado ? (
                        <Check className="size-4 text-green-500" />
                      ) : (
                        <span className="text-muted-foreground text-sm">--</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(ideia.created_at).toLocaleDateString("pt-BR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">
              Nenhuma ideia cadastrada. Clique em &quot;Nova Ideia&quot; para comecar.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
