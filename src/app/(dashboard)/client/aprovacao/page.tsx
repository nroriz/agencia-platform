import { requireClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Inbox } from "lucide-react";
import type { Carousel } from "@/types/database";
import { CarouselCard } from "./carousel-card";

export default async function ClientAprovacaoPage() {
  const user = await requireClient();
  const supabase = await createClient();

  const { data: carousels } = await supabase
    .from("carousels")
    .select("*")
    .eq("tenant_id", user.tenant_id!)
    .in("status", ["pending_approval", "approved", "rejected"])
    .order("created_at", { ascending: false })
    .limit(20);

  const items = (carousels ?? []) as Carousel[];

  const pending = items.filter((c) => c.status === "pending_approval");
  const approved = items.filter((c) => c.status === "approved");
  const rejected = items.filter((c) => c.status === "rejected");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Aprovacao</h2>
        <p className="text-muted-foreground">
          Revise e aprove seus carrosseis antes da publicacao
        </p>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            Pendentes
            {pending.length > 0 && (
              <Badge
                variant="secondary"
                className="bg-yellow-600/20 text-yellow-400 text-xs px-1.5"
              >
                {pending.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            Aprovados
            {approved.length > 0 && (
              <Badge
                variant="secondary"
                className="bg-green-600/20 text-green-400 text-xs px-1.5"
              >
                {approved.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            Rejeitados
            {rejected.length > 0 && (
              <Badge
                variant="secondary"
                className="bg-red-600/20 text-red-400 text-xs px-1.5"
              >
                {rejected.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <CarouselGrid carousels={pending} emptyMessage="Nenhum carrossel pendente de aprovacao" />
        </TabsContent>

        <TabsContent value="approved">
          <CarouselGrid carousels={approved} emptyMessage="Nenhum carrossel aprovado" />
        </TabsContent>

        <TabsContent value="rejected">
          <CarouselGrid carousels={rejected} emptyMessage="Nenhum carrossel rejeitado" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CarouselGrid({
  carousels,
  emptyMessage,
}: {
  carousels: Carousel[];
  emptyMessage: string;
}) {
  if (carousels.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Inbox className="size-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground">
            {emptyMessage}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {carousels.map((carousel) => (
        <CarouselCard key={carousel.id} carousel={carousel} />
      ))}
    </div>
  );
}
