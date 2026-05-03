import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type {
  Tenant,
  TenantVisual,
  TenantVoz,
  TenantTerritorio,
  TenantHorario,
  TenantIntegracoes,
  Ideia,
  TenantMedia,
  TenantBrandDNA,
} from "@/types/database";
import { TenantWorkspace } from "./workspace";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function TenantDetailPage({ params, searchParams }: PageProps) {
  await requireAdmin();
  const supabase = await createClient();
  const { id } = await params;
  const { tab } = await searchParams;

  const { data: tenant, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !tenant) {
    notFound();
  }

  const [
    { data: visual },
    { data: voz },
    { data: brandDna },
    { data: territorios },
    { data: horarios },
    { data: integracoes },
    { data: ideias },
    { data: carousels },
    { data: media },
  ] = await Promise.all([
    supabase.from("tenant_visual").select("*").eq("tenant_id", id).single(),
    supabase.from("tenant_voz").select("*").eq("tenant_id", id).single(),
    supabase.from("tenant_brand_dna").select("*").eq("tenant_id", id).single(),
    supabase.from("tenant_territorios").select("*").eq("tenant_id", id).order("nome"),
    supabase.from("tenant_horarios").select("*").eq("tenant_id", id).order("dia"),
    supabase.from("tenant_integracoes").select("*").eq("tenant_id", id).single(),
    supabase.from("ideias").select("*").eq("tenant_id", id).order("created_at", { ascending: false }).limit(100),
    supabase.from("carousels").select("id, tema, tema_refinado, formato, status, created_at").eq("tenant_id", id).order("created_at", { ascending: false }).limit(50),
    supabase.from("tenant_media").select("*").eq("tenant_id", id).order("created_at", { ascending: false }).limit(200),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/tenants"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Tenants
        </Link>
        <span className="text-muted-foreground">/</span>
        <h2 className="text-xl font-bold tracking-tight">{tenant.nome}</h2>
        <span className="text-sm text-muted-foreground">@{tenant.handle}</span>
      </div>

      <TenantWorkspace
        tenant={tenant as Tenant}
        visual={visual as TenantVisual | null}
        voz={voz as TenantVoz | null}
        brandDna={brandDna as TenantBrandDNA | null}
        territorios={(territorios as TenantTerritorio[]) ?? []}
        horarios={(horarios as TenantHorario[]) ?? []}
        integracoes={integracoes as TenantIntegracoes | null}
        ideias={(ideias as Ideia[]) ?? []}
        media={(media as TenantMedia[]) ?? []}
        carousels={carousels ?? []}
        initialTab={tab ?? "geral"}
      />
    </div>
  );
}
