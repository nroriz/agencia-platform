import { requireClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Image, Clock, TrendingUp, CheckSquare } from "lucide-react";

export default async function ClientDashboardPage() {
  const user = await requireClient();
  const supabase = await createClient();

  const { count: pendingCount } = await supabase
    .from("carousels")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending_approval");

  const { data: nextPosts } = await supabase
    .from("carousels")
    .select("id, tema, status, agendado_para")
    .in("status", ["approved", "scheduled"])
    .order("agendado_para", { ascending: true })
    .limit(5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Meu Perfil</h2>
        <p className="text-muted-foreground">
          Bem-vindo, {user.nome}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <CheckSquare className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount ?? 0}</div>
            <p className="text-xs text-muted-foreground">aguardando aprovacao</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reach (7d)</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground">Meta API pendente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saves (7d)</CardTitle>
            <Image className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground">Meta API pendente</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Proximos Posts</CardTitle>
        </CardHeader>
        <CardContent>
          {nextPosts && nextPosts.length > 0 ? (
            <div className="space-y-3">
              {nextPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{post.tema}</p>
                    {post.agendado_para && (
                      <p className="text-sm text-muted-foreground">
                        <Clock className="mr-1 inline size-3" />
                        {new Date(post.agendado_para).toLocaleDateString("pt-BR", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                  <Badge>{post.status}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Nenhum post agendado.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
