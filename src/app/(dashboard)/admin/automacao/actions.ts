"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { pipelineRequest } from "@/lib/pipeline";
import { sendCarouselPreview } from "@/lib/telegram";

interface ActionResult {
  success: boolean;
  message: string;
  count?: number;
}

export async function runEditorial(tenantId: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  try {
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id, nome, nicho")
      .eq("id", tenantId)
      .single();

    if (!tenant) {
      return { success: false, message: "Tenant nao encontrado" };
    }

    const { data: territorios } = await supabase
      .from("tenant_territorios")
      .select("codigo, nome, peso")
      .eq("tenant_id", tenantId)
      .order("peso", { ascending: false });

    const result = await pipelineRequest("/pipeline/themes", {
      tenant_id: tenantId,
      territorios: territorios ?? [],
    });

    const temas = result.themes as string[];

    if (temas && temas.length > 0) {
      const ideias = temas.map((tema: string, i: number) => ({
        tenant_id: tenantId,
        tema,
        origem: "ia",
        prioridade: temas.length - i,
        usado: false,
      }));

      await supabase.from("ideias").insert(ideias);
    }

    return {
      success: true,
      message: `${temas?.length ?? 0} temas gerados para ${tenant.nome}`,
      count: temas?.length ?? 0,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return { success: false, message: `Falha ao gerar editorial: ${msg}` };
  }
}

export async function runBatchGeneration(
  tenantId: string
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  try {
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id, nome")
      .eq("id", tenantId)
      .single();

    if (!tenant) {
      return { success: false, message: "Tenant nao encontrado" };
    }

    const { data: ideias } = await supabase
      .from("ideias")
      .select("id, tema")
      .eq("tenant_id", tenantId)
      .eq("usado", false)
      .order("prioridade", { ascending: false })
      .limit(7);

    if (!ideias || ideias.length === 0) {
      return {
        success: false,
        message: "Nenhuma ideia disponivel. Gere o editorial primeiro.",
      };
    }

    const temas = ideias.map((i) => i.tema);

    await pipelineRequest("/pipeline/batch", {
      tenant_id: tenantId,
      temas,
    });

    const ideiaIds = ideias.map((i) => i.id);
    await supabase
      .from("ideias")
      .update({ usado: true, usado_em: new Date().toISOString() })
      .in("id", ideiaIds);

    return {
      success: true,
      message: `${temas.length} carrosseis em geracao para ${tenant.nome}`,
      count: temas.length,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return { success: false, message: `Falha na geracao batch: ${msg}` };
  }
}

export async function notifyPendingTelegram(): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  try {
    const { data: carousels } = await supabase
      .from("carousels")
      .select("id, tema, tema_refinado, hook_linha1, hook_linha2, caption, formato, tenant_id, tenants(nome, handle)")
      .eq("status", "pending_approval")
      .eq("telegram_notified", false);

    if (!carousels || carousels.length === 0) {
      return { success: true, message: "Nenhum carrossel pendente para notificar", count: 0 };
    }

    let notified = 0;

    for (const carousel of carousels) {
      const tenant = carousel.tenants as unknown as { nome: string; handle: string } | null;

      const { data: integracoes } = await supabase
        .from("tenant_integracoes")
        .select("aprovacao_chat_id")
        .eq("tenant_id", carousel.tenant_id)
        .single();

      const chatId = integracoes?.aprovacao_chat_id;
      if (!chatId) continue;

      await sendCarouselPreview(chatId, {
        id: carousel.id,
        tema: carousel.tema,
        tema_refinado: carousel.tema_refinado,
        hook_linha1: carousel.hook_linha1,
        hook_linha2: carousel.hook_linha2,
        caption: carousel.caption,
        formato: carousel.formato,
        tenant_nome: tenant?.nome ?? "Desconhecido",
      });

      await supabase
        .from("carousels")
        .update({ telegram_notified: true })
        .eq("id", carousel.id);

      notified++;
    }

    return {
      success: true,
      message: `${notified} notificacao(oes) enviada(s) via Telegram`,
      count: notified,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return { success: false, message: `Falha ao notificar: ${msg}` };
  }
}

export async function runPublishNow(tenantId: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  try {
    const { data: queue } = await supabase
      .from("publish_queue")
      .select("id, carousel_id")
      .eq("tenant_id", tenantId)
      .eq("status", "queued")
      .order("scheduled_for", { ascending: true })
      .limit(1);

    if (!queue || queue.length === 0) {
      return { success: false, message: "Nenhum carrossel na fila de publicacao" };
    }

    await pipelineRequest("/pipeline/publish", {
      tenant_id: tenantId,
      queue_id: queue[0].id,
    });

    return {
      success: true,
      message: "Publicacao iniciada",
      count: 1,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return { success: false, message: `Falha ao publicar: ${msg}` };
  }
}

export async function runMetricsCollection(
  tenantId: string
): Promise<ActionResult> {
  await requireAdmin();

  try {
    await pipelineRequest("/pipeline/intelligence", {
      tenant_id: tenantId,
      mode: "metrics",
    });

    return {
      success: true,
      message: "Coleta de metricas iniciada",
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return { success: false, message: `Falha na coleta: ${msg}` };
  }
}

export async function runIntelligence(
  tenantId: string
): Promise<ActionResult> {
  await requireAdmin();

  try {
    await pipelineRequest("/pipeline/intelligence", {
      tenant_id: tenantId,
      mode: "report",
    });

    return {
      success: true,
      message: "Relatorio de intelligence em geracao",
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return { success: false, message: `Falha ao gerar relatorio: ${msg}` };
  }
}
