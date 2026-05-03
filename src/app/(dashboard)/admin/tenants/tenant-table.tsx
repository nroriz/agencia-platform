"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
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
import { Search } from "lucide-react";
import Link from "next/link";

interface TenantRow {
  id: string;
  nome: string;
  handle: string;
  nicho: string;
  plano: string;
  frequencia_semanal: number;
  ativo: boolean;
  carousel_count: number;
  cor_acento: string | null;
}

const planoBadgeVariant: Record<string, "default" | "secondary" | "outline"> = {
  starter: "outline",
  growth: "secondary",
  scale: "default",
};

function getPlanoBadgeClass(plano: string): string {
  switch (plano.toLowerCase()) {
    case "scale":
      return "bg-violet-600 text-white hover:bg-violet-700";
    case "growth":
      return "bg-blue-600 text-white hover:bg-blue-700";
    case "starter":
      return "border-zinc-600 text-zinc-300";
    default:
      return "";
  }
}

interface TenantTableProps {
  tenants: TenantRow[];
}

export function TenantTable({ tenants }: TenantTableProps) {
  const [search, setSearch] = useState("");

  const filtered = tenants.filter((t) =>
    t.nome.toLowerCase().includes(search.toLowerCase()) ||
    t.handle.toLowerCase().includes(search.toLowerCase()) ||
    t.nicho.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar tenant..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Handle</TableHead>
              <TableHead>Nicho</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead className="text-center">Freq. Semanal</TableHead>
              <TableHead className="text-center">Carrosseis</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length > 0 ? (
              filtered.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell className="font-medium">{tenant.nome}</TableCell>
                  <TableCell className="text-muted-foreground">
                    @{tenant.handle}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{tenant.nicho}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPlanoBadgeClass(tenant.plano)}>
                      {tenant.plano}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {tenant.frequencia_semanal}x
                  </TableCell>
                  <TableCell className="text-center">
                    {tenant.carousel_count}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={tenant.ativo ? "default" : "destructive"}
                    >
                      {tenant.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/tenants/${tenant.id}`}>
                      <Button variant="outline" size="sm">
                        Ver
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  {search
                    ? "Nenhum tenant encontrado."
                    : "Nenhum tenant cadastrado."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
