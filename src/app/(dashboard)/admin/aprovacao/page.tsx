import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Inbox, Clock } from "lucide-react";
import { AprovacaoActions } from "./aprovacao-actions";

export default async function AprovacaoPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: carousels } = await supabase
    .from("carousels")
    .select("*, tenants(nome, handle)")
    .eq("status", "pending_approval")
    .order("created_at", { ascending: false });

  const totalPending = carousels?.length ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Aprovacao</h2>
          <p className="text-muted-foreground">
            Carrosseis aguardando aprovacao de todos os tenants
          </p>
        </div>
        {totalPending > 0 && (
          <div className="flex items-center gap-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 px-4 py-2">
            <Clock className="size-4 text-yellow-400" />
            <span className="text-sm font-medium text-yellow-400">
              {totalPending} pendente{totalPending !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {!carousels || carousels.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="flex size-20 items-center justify-center rounded-2xl bg-green-500/10 mb-4">
              <CheckCircle2 className="size-10 text-green-400" />
            </div>
            <p className="text-lg font-medium">Tudo em dia!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Nenhum carrossel pendente de aprovacao
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {carousels.map((carousel) => {
            const tenant = carousel.tenants as unknown as {
              nome: string;
              handle: string;
            } | null;

            const createdAt = new Date(carousel.created_at).toLocaleDateString(
              "pt-BR",
              {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }
            );

            const captionPreview = carousel.caption
              ? carousel.caption.length > 120
                ? `${carousel.caption.slice(0, 120)}...`
                : carousel.caption
              : null;

            return (
              <Card key={carousel.id} className="relative overflow-hidden group hover:border-orange-500/30 transition-colors">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-yellow-500/10 to-transparent rounded-bl-[32px]" />
                <CardContent className="p-5 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/10 text-sm font-bold text-orange-400">
                        {tenant?.nome?.charAt(0) ?? "?"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">
                          {tenant?.nome ?? "Tenant desconhecido"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tenant?.handle ?? "—"}
                        </p>
                      </div>
                    </div>
                    {carousel.formato && (
                      <Badge variant="secondary" className="text-[10px]">
                        {carousel.formato}
                      </Badge>
                    )}
                  </div>

                  {/* Content */}
                  {carousel.tema_refinado && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                        Tema refinado
                      </p>
                      <p className="text-sm font-medium">{carousel.tema_refinado}</p>
                    </div>
                  )}

                  {(carousel.hook_linha1 || carousel.hook_linha2) && (
                    <div className="space-y-1 rounded-lg bg-muted/50 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                        Hook
                      </p>
                      <p className="text-sm font-bold leading-tight">
                        {carousel.hook_linha1}
                      </p>
                      {carousel.hook_linha2 && (
                        <p className="text-xs text-muted-foreground">
                          {carousel.hook_linha2}
                        </p>
                      )}
                    </div>
                  )}

                  {captionPreview && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                        Caption
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {captionPreview}
                      </p>
                    </div>
                  )}

                  <p className="text-[10px] text-muted-foreground/60">{createdAt}</p>

                  <AprovacaoActions carouselId={carousel.id} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
