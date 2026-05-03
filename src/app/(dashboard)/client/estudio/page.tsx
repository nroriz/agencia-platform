import { requireClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { TenantVisual } from "@/types/database";
import { StudioWorkspace } from "./studio-workspace";
import { Sparkles } from "lucide-react";

export default async function ClientEstudioPage() {
  const user = await requireClient();
  const supabase = await createClient();

  const { data: visual } = await supabase
    .from("tenant_visual")
    .select("*")
    .eq("tenant_id", user.tenant_id!)
    .single();

  const { data: media } = await supabase
    .from("tenant_media")
    .select("*")
    .eq("tenant_id", user.tenant_id!)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="size-5 text-orange-400" />
          Estudio Visual
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Crie e edite imagens para seus posts
        </p>
      </div>
      <StudioWorkspace
        tenantId={user.tenant_id!}
        visual={visual as TenantVisual | null}
        mediaUrls={(media ?? []).map((m: { public_url: string }) => m.public_url)}
      />
    </div>
  );
}
