const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

interface TelegramResponse {
  ok: boolean;
  description?: string;
  result?: unknown;
}

interface InlineKeyboardButton {
  text: string;
  callback_data: string;
}

interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

export async function sendTelegramMessage(
  chatId: string,
  text: string,
  replyMarkup?: InlineKeyboardMarkup
): Promise<TelegramResponse> {
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
  };

  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }

  const res = await fetch(`${API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as TelegramResponse;

  if (!data.ok) {
    throw new Error(`Telegram sendMessage failed: ${data.description ?? "unknown error"}`);
  }

  return data;
}

interface CarouselPreviewData {
  id: string;
  tema: string;
  tema_refinado: string | null;
  hook_linha1: string | null;
  hook_linha2: string | null;
  caption: string | null;
  formato: string | null;
  tenant_nome: string;
}

export async function sendCarouselPreview(
  chatId: string,
  carousel: CarouselPreviewData
): Promise<TelegramResponse> {
  const lines: string[] = [
    `<b>Novo Carrossel para Aprovacao</b>`,
    ``,
    `<b>Cliente:</b> ${escapeHtml(carousel.tenant_nome)}`,
    `<b>Tema:</b> ${escapeHtml(carousel.tema_refinado ?? carousel.tema)}`,
  ];

  if (carousel.formato) {
    lines.push(`<b>Formato:</b> ${escapeHtml(carousel.formato)}`);
  }

  if (carousel.hook_linha1) {
    lines.push(``);
    lines.push(`<b>Hook:</b>`);
    lines.push(escapeHtml(carousel.hook_linha1));
    if (carousel.hook_linha2) {
      lines.push(escapeHtml(carousel.hook_linha2));
    }
  }

  if (carousel.caption) {
    lines.push(``);
    lines.push(`<b>Caption:</b>`);
    lines.push(escapeHtml(truncate(carousel.caption, 500)));
  }

  lines.push(``);
  lines.push(`<i>ID: ${carousel.id}</i>`);

  const text = lines.join("\n");

  const replyMarkup: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: "Aprovar", callback_data: `approve:${carousel.id}` },
        { text: "Rejeitar", callback_data: `reject:${carousel.id}` },
      ],
    ],
  };

  return sendTelegramMessage(chatId, text, replyMarkup);
}

export async function answerCallbackQuery(
  callbackQueryId: string,
  text: string
): Promise<TelegramResponse> {
  const res = await fetch(`${API}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text,
    }),
  });

  const data = (await res.json()) as TelegramResponse;

  if (!data.ok) {
    throw new Error(`Telegram answerCallbackQuery failed: ${data.description ?? "unknown error"}`);
  }

  return data;
}

export async function editMessageText(
  chatId: string,
  messageId: number,
  text: string
): Promise<TelegramResponse> {
  const res = await fetch(`${API}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: "HTML",
    }),
  });

  const data = (await res.json()) as TelegramResponse;

  if (!data.ok) {
    throw new Error(`Telegram editMessageText failed: ${data.description ?? "unknown error"}`);
  }

  return data;
}

// ─── Helpers ──────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "...";
}
