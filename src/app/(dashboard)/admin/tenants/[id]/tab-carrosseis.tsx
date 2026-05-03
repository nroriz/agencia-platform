"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowRight, LayoutGrid } from "lucide-react";
import Link from "next/link";
import type { CarouselStatus } from "@/types/database";

const STATUS_CONFIG: Record<CarouselStatus, { label: string; variant: string }> = {
  draft: { label: "Rascunho", variant: "bg-neutral-500/15 text-neutral-400" },
  pending_approval: { label: "Pendente", variant: "bg-yellow-500/15 text-yellow-400" },
  approved: { label: "Aprovado", variant: "bg-green-500/15 text-green-400" },
  rejected: { label: "Rejeitado", variant: "bg-red-500/15 text-red-400" },
  scheduled: { label: "Agendado", variant: "bg-blue-500/15 text-blue-400" },
  published: { label: "Publicado", variant: "bg-purple-500/15 text-purple-400" },
  downloaded: { label: "Baixado", variant: "bg-cyan-500/15 text-cyan-400" },
  failed: { label: "Falhou", variant: "bg-red-500/15 text-red-400" },
};

interface CarouselRow {
  id: string;
  tema: string;
  tema_refinado: string | null;
  formato: string | null;
  status: CarouselStatus;
  created_at: string;
}

interface TabCarrosseisProps {
  tenantId: string;
  initialData: CarouselRow[];
}

export function TabCarrosseis({ tenantId: _tenantId, initialData }: TabCarrosseisProps) {
  return (
    <div className="space-y-6 pt-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <LayoutGrid className="size-4 text-muted-foreground" />
            Carrosseis ({initialData.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {initialData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum carrossel encontrado para este tenant
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
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialData.map((carousel) => {
                    const statusInfo = STATUS_CONFIG[carousel.status];
                    return (
                      <TableRow key={carousel.id}>
                        <TableCell className="font-medium max-w-xs truncate">
                          {carousel.tema_refinado ?? carousel.tema}
                        </TableCell>
                        <TableCell>
                          {carousel.formato && (
                            <Badge variant="secondary">{carousel.formato}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.variant}`}
                          >
                            {statusInfo.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(carousel.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/admin/carrosseis/${carousel.id}`}
                            className="inline-flex items-center text-sm text-primary hover:underline"
                          >
                            <ArrowRight className="size-4" />
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
