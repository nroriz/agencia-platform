"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { pipelineRequest } from "@/lib/pipeline";
import { requireClient } from "@/lib/auth";

export async function approveCarousel(carouselId: string) {
  const user = await requireClient();

  const supabase = await createClient();

  const { data: carousel, error: fetchError } = await supabase
    .from("carousels")
    .select("tenant_id")
    .eq("id", carouselId)
    .eq("tenant_id", user.tenant_id!)
    .single();

  if (fetchError || !carousel) {
    throw new Error("Carrossel nao encontrado ou sem permissao");
  }

  await pipelineRequest("/pipeline/approve", {
    tenant_id: carousel.tenant_id,
    carousel_id: carouselId,
  });

  revalidatePath("/client/aprovacao");
}

export async function editCarousel(carouselId: string, instrucoes: string) {
  const user = await requireClient();

  const supabase = await createClient();

  const { data: carousel, error: fetchError } = await supabase
    .from("carousels")
    .select("tenant_id")
    .eq("id", carouselId)
    .eq("tenant_id", user.tenant_id!)
    .single();

  if (fetchError || !carousel) {
    throw new Error("Carrossel nao encontrado ou sem permissao");
  }

  await pipelineRequest("/pipeline/edit", {
    tenant_id: carousel.tenant_id,
    carousel_id: carouselId,
    instrucoes,
  });

  revalidatePath("/client/aprovacao");
}
