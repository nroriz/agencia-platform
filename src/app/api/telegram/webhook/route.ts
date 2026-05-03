import { createClient } from "@/lib/supabase/server";
import { pipelineRequest } from "@/lib/pipeline";
import { answerCallbackQuery, editMessageText } from "@/lib/telegram";
import type { CarouselStatus } from "@/types/database";

interface TelegramCallbackQuery {
  id: string;
  data?: string;
  message?: {
    message_id: number;
    chat: {
      id: number;
    };
    text?: string;
  };
}

interface TelegramUpdate {
  update_id: number;
  callback_query?: TelegramCallbackQuery;
}

const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || "";

export async function POST(request: Request) {
  // Validate webhook secret from URL
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!WEBHOOK_SECRET || token !== WEBHOOK_SECRET) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const update = (await request.json()) as TelegramUpdate;

  // Only handle callback queries (inline button presses)
  const callbackQuery = update.callback_query;
  if (!callbackQuery?.data || !callbackQuery.message) {
    return Response.json({ ok: true });
  }

  const callbackData = callbackQuery.data;
  const chatId = String(callbackQuery.message.chat.id);
  const messageId = callbackQuery.message.message_id;

  // Parse callback_data: "approve:{id}" or "reject:{id}"
  const colonIndex = callbackData.indexOf(":");
  if (colonIndex === -1) {
    await answerCallbackQuery(callbackQuery.id, "Acao invalida");
    return Response.json({ ok: true });
  }

  const action = callbackData.slice(0, colonIndex);
  const carouselId = callbackData.slice(colonIndex + 1);

  if (!["approve", "reject"].includes(action) || !carouselId) {
    await answerCallbackQuery(callbackQuery.id, "Acao invalida");
    return Response.json({ ok: true });
  }

  try {
    const supabase = await createClient();

    // Fetch carousel to get tenant_id and current status
    const { data: carousel, error: fetchError } = await supabase
      .from("carousels")
      .select("id, tenant_id, status, tema")
      .eq("id", carouselId)
      .single();

    if (fetchError || !carousel) {
      await answerCallbackQuery(callbackQuery.id, "Carrossel nao encontrado");
      return Response.json({ ok: true });
    }

    // Prevent duplicate actions
    if (carousel.status !== "pending_approval") {
      await answerCallbackQuery(
        callbackQuery.id,
        `Carrossel ja foi processado (status: ${carousel.status})`
      );
      return Response.json({ ok: true });
    }

    const newStatus: CarouselStatus = action === "approve" ? "approved" : "rejected";

    // Update carousel status in Supabase
    const { error: updateError } = await supabase
      .from("carousels")
      .update({ status: newStatus })
      .eq("id", carouselId);

    if (updateError) {
      await answerCallbackQuery(callbackQuery.id, "Erro ao atualizar status");
      return Response.json({ ok: true });
    }

    // If approved, try to notify pipeline (non-blocking)
    if (action === "approve") {
      try {
        await pipelineRequest("/pipeline/approve", {
          tenant_id: carousel.tenant_id,
          carousel_id: carouselId,
        });
      } catch {
        // Pipeline may be down — carousel is already approved in DB
        console.warn(
          `[telegram-webhook] Pipeline notify failed for carousel ${carouselId}, status already updated`
        );
      }
    }

    // Answer the callback query
    const statusLabel = action === "approve" ? "Aprovado" : "Rejeitado";
    await answerCallbackQuery(callbackQuery.id, `${statusLabel} com sucesso!`);

    // Edit the original message to reflect the action
    const emoji = action === "approve" ? "\u2705" : "\u274C";
    const originalText = callbackQuery.message.text ?? "";
    const updatedText = `${originalText}\n\n${emoji} <b>${statusLabel} por Telegram</b>`;
    await editMessageText(chatId, messageId, updatedText);
  } catch (err) {
    console.error("[telegram-webhook] Error processing callback:", err);
    try {
      await answerCallbackQuery(callbackQuery.id, "Erro interno ao processar");
    } catch {
      // Best effort
    }
  }

  return Response.json({ ok: true });
}
