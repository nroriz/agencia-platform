"use server";

import { requireClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface NovaIdeiaInput {
  tema: string;
  prioridade: number;
}

export async function criarIdeia(input: NovaIdeiaInput) {
  const user = await requireClient();

  if (!input.tema.trim()) {
    return { error: "Tema e obrigatorio." };
  }

  if (input.prioridade < 1 || input.prioridade > 5) {
    return { error: "Prioridade deve ser entre 1 e 5." };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("ideias").insert({
    tenant_id: user.tenant_id!,
    tema: input.tema.trim(),
    origem: "manual",
    prioridade: input.prioridade,
    usado: false,
  });

  if (error) {
    return { error: "Erro ao salvar ideia. Tente novamente." };
  }

  revalidatePath("/client/ideias");
  return { success: true };
}
