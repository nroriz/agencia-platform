import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Users,
  Images,
  TrendingUp,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default async function AdminDashboardPage() {
  const user = await requireAdmin();
  const supabase = await createClient();

  const { count: tenantCount } = await supabase
    .from("tenants")
    .select("*", { count: "exact", head: true })
    .eq("ativo", true);

  const { count: carouselWeekCount } = await supabase
    .from("carousels")
    .select("*", { count: "exact", head: true })
    .gte(
      "created_at",
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    );

  const { count: pendingCount } = await supabase
    .from("carousels")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending_approval");

  const { count: totalCarousels } = await supabase
    .from("carousels")
    .select("*", { count: "exact", head: true });

  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, nome, handle, ativo, nicho")
    .eq("ativo", true)
    .order("created_at", { ascending: false });

  const { data: recentCarousels } = await supabase
    .from("carousels")
    .select("id, tema_refinado, tema, status, formato, created_at, tenants(nome)")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Ola, {user.nome.split(" ")[0]}
        </h2>
        <p className="text-muted-foreground">
          Aqui esta o resumo da sua agencia hoje.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-[40px]" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tenants Ativos
            </CardTitle>
            <Users className="size-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{tenantCount ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">clientes na plataforma</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-orange-500/10 to-transparent rounded-bl-[40px]" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Carrosseis (7d)
            </CardTitle>
            <Images className="size-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{carouselWeekCount ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              de {totalCarousels ?? 0} no total
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-yellow-500/10 to-transparent rounded-bl-[40px]" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendentes
            </CardTitle>
            <Clock className="size-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingCount ?? 0}</div>
            <Link
              href="/admin/aprovacao"
              className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 mt-1 transition-colors"
            >
              Revisar agora <ArrowRight className="size-3" />
            </Link>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-bl-[40px]" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Reach Total
            </CardTitle>
            <TrendingUp className="size-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">--</div>
            <p className="text-xs text-muted-foreground mt-1">Meta API pendente</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Recent Carousels */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Ultimos Carrosseis</CardTitle>
              <CardDescription>Atividade recente do pipeline</CardDescription>
            </div>
            <Link
              href="/admin/carrosseis"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              Ver todos <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {recentCarousels && recentCarousels.length > 0 ? (
              <div className="space-y-3">
                {recentCarousels.map((c) => {
                  const tenant = c.tenants as unknown as { nome: string } | null;
                  const isPending = c.status === "pending_approval";
                  const isApproved = c.status === "approved" || c.status === "published";
                  return (
                    <Link
                      key={c.id}
                      href={`/admin/carrosseis/${c.id}`}
                      className="flex items-center justify-between rounded-xl border border-border/50 p-3 hover:bg-accent/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`flex size-8 items-center justify-center rounded-lg shrink-0 ${
                            isPending
                              ? "bg-yellow-500/10 text-yellow-400"
                              : isApproved
                              ? "bg-green-500/10 text-green-400"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isPending ? (
                            <AlertCircle className="size-4" />
                          ) : (
                            <CheckCircle2 className="size-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-orange-400 transition-colors">
                            {c.tema_refinado ?? c.tema}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {tenant?.nome ?? "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {c.formato && (
                          <Badge variant="secondary" className="text-[10px]">
                            {c.formato}
                          </Badge>
                        )}
                        <ArrowRight className="size-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Nenhum carrossel criado ainda.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Tenants */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Tenants</CardTitle>
              <CardDescription>Clientes ativos</CardDescription>
            </div>
            <Link
              href="/admin/tenants"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              Gerenciar <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {tenants && tenants.length > 0 ? (
              <div className="space-y-3">
                {tenants.map((tenant) => (
                  <div
                    key={tenant.id}
                    className="flex items-center justify-between rounded-xl border border-border/50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/10 text-sm font-bold text-orange-400">
                        {tenant.nome.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{tenant.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {tenant.handle}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {tenant.nicho}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Nenhum tenant cadastrado.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
