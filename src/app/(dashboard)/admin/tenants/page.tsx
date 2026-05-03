import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, UserCheck, Images } from "lucide-react";
import { TenantTable } from "./tenant-table";

export default async function TenantsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, nome, handle, nicho, plano, frequencia_semanal, ativo, created_at, tenant_visual(cor_acento)")
    .order("created_at", { ascending: false });

  const { data: carouselCounts } = await supabase
    .from("carousels")
    .select("tenant_id");

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: carouselsThisWeek } = await supabase
    .from("carousels")
    .select("*", { count: "exact", head: true })
    .gte("created_at", weekAgo);

  const countMap = new Map<string, number>();
  if (carouselCounts) {
    for (const row of carouselCounts) {
      const current = countMap.get(row.tenant_id) ?? 0;
      countMap.set(row.tenant_id, current + 1);
    }
  }

  const totalTenants = tenants?.length ?? 0;
  const activeTenants = tenants?.filter((t) => t.ativo).length ?? 0;

  const tenantRows = (tenants ?? []).map((t) => {
    const visual = Array.isArray(t.tenant_visual)
      ? t.tenant_visual[0]
      : t.tenant_visual;

    return {
      id: t.id as string,
      nome: t.nome as string,
      handle: t.handle as string,
      nicho: t.nicho as string,
      plano: t.plano as string,
      frequencia_semanal: t.frequencia_semanal as number,
      ativo: t.ativo as boolean,
      carousel_count: countMap.get(t.id as string) ?? 0,
      cor_acento: (visual?.cor_acento as string) ?? null,
    };
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Gestao de Tenants</h2>
        <p className="text-muted-foreground">
          Gerenciar todos os clientes da plataforma
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-[40px]" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tenants
            </CardTitle>
            <Users className="size-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalTenants}</div>
            <p className="text-xs text-muted-foreground mt-1">cadastrados</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-green-500/10 to-transparent rounded-bl-[40px]" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ativos
            </CardTitle>
            <UserCheck className="size-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeTenants}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalTenants > 0
                ? `${Math.round((activeTenants / totalTenants) * 100)}% do total`
                : "—"}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-orange-500/10 to-transparent rounded-bl-[40px]" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Carrosseis esta semana
            </CardTitle>
            <Images className="size-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{carouselsThisWeek ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">produzidos</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tenants</CardTitle>
          <CardDescription>
            {totalTenants} tenant{totalTenants !== 1 ? "s" : ""} cadastrado{totalTenants !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TenantTable tenants={tenantRows} />
        </CardContent>
      </Card>
    </div>
  );
}
