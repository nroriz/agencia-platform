import { requireClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download } from "lucide-react";
import Link from "next/link";

export default async function ClientDownloadsPage() {
  const user = await requireClient();
  const supabase = await createClient();

  const { data: carousels } = await supabase
    .from("carousels")
    .select("id, tema, tema_refinado, formato, status, created_at")
    .eq("tenant_id", user.tenant_id!)
    .in("status", ["approved", "downloaded"])
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Download className="size-5 text-muted-foreground" />
          Downloads
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Carrosseis aprovados prontos para download
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {!carousels || carousels.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum carrossel pronto para download
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tema</TableHead>
                    <TableHead>Formato</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Acao</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {carousels.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium max-w-xs truncate">
                        {c.tema_refinado ?? c.tema}
                      </TableCell>
                      <TableCell>
                        {c.formato && <Badge variant="secondary">{c.formato}</Badge>}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={c.status === "downloaded" ? "default" : "outline"}
                          className={c.status === "downloaded" ? "bg-cyan-600" : ""}
                        >
                          {c.status === "downloaded" ? "Baixado" : "Aprovado"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/client/carrosseis/${c.id}`}>
                          <Button variant="outline" size="sm">
                            <Download className="size-4 mr-1" />
                            Ver
                          </Button>
                        </Link>
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
