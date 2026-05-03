import { createClient } from "@/lib/supabase/server";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { chat_id?: string; message?: string };
  const { chat_id, message } = body;

  if (!chat_id) {
    return Response.json(
      { error: "chat_id is required" },
      { status: 400 }
    );
  }

  const text = message || "Teste de conexao com o bot da agencia. Se voce recebeu esta mensagem, a integracao esta funcionando!";

  try {
    const result = await sendTelegramMessage(chat_id, text);
    return Response.json({ success: true, telegram_response: result });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to send test message";
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
