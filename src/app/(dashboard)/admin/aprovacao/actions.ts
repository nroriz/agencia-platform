"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { pipelineRequest } from "@/lib/pipeline";
import { requireAdmin } from "@/lib/auth";

export async function approveCarousel(carouselId: string) {
  await requireAdmin();

  const supabase = await createClient();

  const { data: carousel, error: fetchError } = await supabase
    .from("carousels")
    .select("tenant_id")
    .eq("id", carouselId)
    .single();

  if (fetchError || !carousel) {
    throw new Error("Carrossel nao encontrado");
  }

  await pipelineRequest("/pipeline/approve", {
    tenant_id: carousel.tenant_id,
    carousel_id: carouselId,
  });

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
    throw new Error(`Erro ao rejeitar carrossel: ${error.message}`);
  }

  revalidatePath("/admin/aprovacao");
}
