import { createClient } from "@/lib/supabase/server";
import { sendCarouselPreview } from "@/lib/telegram";

interface CarouselRow {
  id: string;
  tenant_id: string;
  tema: string;
  tema_refinado: string | null;
  hook_linha1: string | null;
  hook_linha2: string | null;
  caption: string | null;
  formato: string | null;
}

interface TenantRow {
  nome: string;
}

interface IntegracaoRow {
  aprovacao_canal: string;
  aprovacao_chat_id: string | null;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { carousel_id?: string };
  const { carousel_id } = body;

  if (!carousel_id) {
    return Response.json(
      { error: "carousel_id is required" },
      { status: 400 }
    );
  }

  try {
    // Fetch carousel
    const { data: carousel, error: carouselError } = await supabase
      .from("carousels")
      .select("id, tenant_id, tema, tema_refinado, hook_linha1, hook_linha2, caption, formato")
      .eq("id", carousel_id)
      .single();

    if (carouselError || !carousel) {
      return Response.json(
        { error: "Carousel not found" },
        { status: 404 }
      );
    }

    const carouselData = carousel as CarouselRow;

    // Fetch tenant name
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("nome")
      .eq("id", carouselData.tenant_id)
      .single();

    if (tenantError || !tenant) {
      return Response.json(
        { error: "Tenant not found" },
        { status: 404 }
      );
    }

    const tenantData = tenant as TenantRow;

    // Fetch tenant integrations
    const { data: integracao, error: integracaoError } = await supabase
      .from("tenant_integracoes")
      .select("aprovacao_canal, aprovacao_chat_id")
      .eq("tenant_id", carouselData.tenant_id)
      .single();

    if (integracaoError || !integracao) {
      return Response.json(
        { error: "Tenant integrations not configured" },
        { status: 404 }
      );
    }

    const integracaoData = integracao as IntegracaoRow;

    if (integracaoData.aprovacao_canal !== "telegram") {
      return Response.json(
        { error: "Tenant approval channel is not telegram", canal: integracaoData.aprovacao_canal },
        { status: 400 }
      );
    }

    if (!integracaoData.aprovacao_chat_id) {
      return Response.json(
        { error: "Tenant telegram chat_id not configured" },
        { status: 400 }
      );
    }

    // Send preview to Telegram
    const result = await sendCarouselPreview(integracaoData.aprovacao_chat_id, {
      id: carouselData.id,
      tema: carouselData.tema,
      tema_refinado: carouselData.tema_refinado,
      hook_linha1: carouselData.hook_linha1,
      hook_linha2: carouselData.hook_linha2,
      caption: carouselData.caption,
      formato: carouselData.formato,
      tenant_nome: tenantData.nome,
    });

    return Response.json({ success: true, telegram_response: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send notification";
    console.error("[telegram-notify] Error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
