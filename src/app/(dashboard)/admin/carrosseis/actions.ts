"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { pipelineRequest } from "@/lib/pipeline";
import { requireAdmin } from "@/lib/auth";

export async function approveCarousel(carouselId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { data: carousel, error } = await supabase
    .from("carousels")
    .select("tenant_id")
    .eq("id", carouselId)
    .single();

  if (error || !carousel) {
    throw new Error("Carrossel nao encontrado");
  }

  await pipelineRequest("/pipeline/approve", {
    tenant_id: carousel.tenant_id,
    carousel_id: carouselId,
  });

  revalidatePath("/admin/carrosseis");
  revalidatePath(`/admin/carrosseis/${carouselId}`);
  revalidatePath("/admin/aprovacao");
}

export async function rejectCarousel(carouselId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("carousels")
    .update({ status: "rejected" as string })
    .eq("id", carouselId);

  if (error) {
    throw new Error(`Erro ao rejeitar: ${error.message}`);
  }

  revalidatePath("/admin/carrosseis");
  revalidatePath(`/admin/carrosseis/${carouselId}`);
  revalidatePath("/admin/aprovacao");
}

export async function generateCarousel(tenantId: string, tema: string) {
  await requireAdmin();

  const result = await pipelineRequest("/pipeline/start", {
    tenant_id: tenantId,
    tema,
  });

  revalidatePath("/admin/carrosseis");
  revalidatePath("/admin/aprovacao");
  return result;
}

interface ThemeSuggestion {
  tema: string;
  territorio: string;
  formato: string;
  razao: string;
}

export async function generateThemes(
  tenantId: string,
  modo: string,
  quantidade: number,
): Promise<ThemeSuggestion[]> {
  await requireAdmin();

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 3000}`;

  const res = await fetch(`${baseUrl}/api/themes/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      tenant_id: tenantId,
      modo,
      quantidade,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Erro desconhecido" }));
    throw new Error(
      (body as { error?: string }).error ?? `Erro ${res.status}`,
    );
  }

  const data = (await res.json()) as { temas: ThemeSuggestion[] };
  return data.temas;
}

export async function generateBatchCarousels(
  tenantId: string,
  temas: string[],
) {
  await requireAdmin();

  const result = await pipelineRequest("/pipeline/batch", {
    tenant_id: tenantId,
    temas,
  });

  revalidatePath("/admin/carrosseis");
  revalidatePath("/admin/aprovacao");
  return result;
}
