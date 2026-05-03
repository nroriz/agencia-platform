import { requireClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MediaLibrary, type MediaItem } from "@/components/media-library";
import { Image } from "lucide-react";

export default async function ClientFotosPage() {
  const user = await requireClient();
  const supabase = await createClient();

  const { data: media } = await supabase
    .from("tenant_media")
    .select("*")
    .eq("tenant_id", user.tenant_id!)
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Image className="size-5 text-muted-foreground" />
          Minhas Fotos
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie as fotos do seu negocio. Elas serao usadas nos carrosseis.
        </p>
      </div>
      <MediaLibrary
        tenantId={user.tenant_id!}
        initialData={(media as MediaItem[]) ?? []}
      />
    </div>
  );
}
