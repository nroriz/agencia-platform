import { createClient } from "@/lib/supabase/server";
import { pipelineRequest } from "@/lib/pipeline";
import type { CarouselFormat } from "@/types/database";

type GenerateMode = "editorial" | "tendencias" | "ideias";

interface ThemeSuggestion {
  tema: string;
  territorio: string;
  formato: string;
  razao: string;
}

interface TenantData {
  nome: string;
  nicho: string;
  persona: string;
  publico: string;
  posicionamento: string | null;
  diferencial: string | null;
}

interface TerritorioRow {
  codigo: string;
  nome: string;
  peso: number;
}

interface VozRow {
  tom: string;
  expressoes_tipicas: string[];
}

interface IdeiaRow {
  tema: string;
  prioridade: number;
}

interface CarouselRow {
  tema: string;
  tema_refinado: string | null;
  territorio: string | null;
}

// ─── Hook Templates ───────────────────────────────────────────
const HOOK_TEMPLATES = [
  "{n} coisas que {persona} precisa saber sobre {assunto}",
  "Como {acao} sem {dor}",
  "Por que {assunto} esta destruindo seu {resultado}",
  "O erro que 90% dos {persona} cometem com {assunto}",
  "A verdade sobre {assunto} que ninguem conta",
  "{assunto}: mito ou realidade?",
  "Pare de {erro} agora (faca isso em vez disso)",
  "O guia definitivo para {acao}",
  "Antes vs Depois: {assunto} na pratica",
  "{n} sinais de que voce precisa de {solucao}",
  "O que {referencia_autoridade} nao te conta sobre {assunto}",
  "Voce sabia que {fato_surpreendente}?",
  "{n} dicas de {especialidade} que valem ouro",
  "Como {persona} pode {resultado} em {tempo}",
  "O segredo por tras de {assunto}",
  "Checklist: {n} passos para {resultado}",
  "{assunto} para iniciantes: por onde comecar",
  "O que muda quando voce {acao}",
  "{n} erros que custam caro em {assunto}",
  "Tendencia {ano}: {assunto} vai mudar tudo",
  "Compare: {opcao_a} vs {opcao_b}",
  "A rotina que {resultado} em {tempo}",
  "Nunca mais erre {assunto} — faca assim",
  "Se voce {dor}, precisa ler isso",
  "Por que {concorrente_generico} faz diferente e funciona",
  "{n} motivos para {acao} hoje",
  "O que todo {persona} deveria saber sobre {assunto}",
  "A transformacao comeca com {acao}",
  "Atencao {persona}: {alerta} sobre {assunto}",
  "Ranking: os {n} melhores {assunto} de {ano}",
  "{assunto} esta mudando — voce esta preparado?",
  "A pergunta que todo {persona} faz sobre {assunto}",
  "De {estado_antes} para {estado_depois}: como chegar la",
  "Isso e o que acontece quando voce {acao}",
  "O minimo que voce precisa saber sobre {assunto}",
];

const FORMATOS: CarouselFormat[] = [
  "educativo",
  "checklist",
  "polemico",
  "storytelling",
  "comparativo",
  "trend_alert",
];

const FORMATO_LABELS: Record<CarouselFormat, string> = {
  educativo: "Educativo",
  checklist: "Checklist",
  polemico: "Polemico",
  storytelling: "Storytelling",
  comparativo: "Comparativo",
  trend_alert: "Trend Alert",
};

// ─── Nicho-specific topic banks ───────────────────────────────
const NICHO_TOPICS: Record<string, string[]> = {
  barbearia: [
    "corte degrade", "barba alinhada", "hidratacao capilar", "produtos para barba",
    "tendencias masculinas", "cuidado com a pele", "corte social", "pomada vs cera",
    "rotina capilar", "barboterapia", "corte infantil", "design de barba",
    "calvicie", "queda de cabelo", "coloracao masculina", "dicas de estilo",
    "como escolher o corte ideal", "frequencia ideal de corte",
    "cuidados pos corte", "ferramentas do barbeiro",
  ],
  clinica: [
    "saude preventiva", "check-up anual", "qualidade de vida", "nutricao",
    "saude mental", "exercicio fisico", "sono", "hidratacao", "suplementacao",
    "dermatologia", "estetica", "procedimentos", "envelhecimento saudavel",
    "imunidade", "habitos saudaveis", "mitos sobre saude",
  ],
  restaurante: [
    "harmonizacao", "ingredientes da estacao", "receitas exclusivas",
    "bastidores da cozinha", "historia dos pratos", "tecnicas culinarias",
    "experiencia gastronomica", "drinks especiais", "sobremesas artesanais",
    "menu degustacao", "sustentabilidade na cozinha", "cultura alimentar",
  ],
  estetica: [
    "skincare", "limpeza de pele", "peeling", "botox", "preenchimento",
    "microagulhamento", "laser", "harmonizacao facial", "cuidados diarios",
    "protetor solar", "acne", "manchas", "rejuvenescimento", "colageno",
    "rotina de beleza", "tendencias esteticas",
  ],
  fitness: [
    "treino funcional", "hipertrofia", "periodizacao", "alongamento",
    "mobilidade", "dieta flexivel", "suplementos", "descanso", "overtraining",
    "treino para iniciantes", "crossfit", "cardio vs musculacao",
    "lesoes esportivas", "performance", "motivacao", "metas fitness",
  ],
  geral: [
    "produtividade", "gestao de tempo", "networking", "posicionamento",
    "marketing pessoal", "tendencias do mercado", "inovacao", "tecnologia",
    "atendimento ao cliente", "fidelizacao", "preco vs valor",
    "diferenciacao", "autoridade", "conteudo de valor", "engajamento",
    "presenca digital",
  ],
};

// ─── Fallback Generator ──────────────────────────────────────
function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildThemeFromTemplate(
  template: string,
  tenant: TenantData,
  territorio: TerritorioRow,
  topics: string[],
): string {
  const topic = pickOne(topics);
  const n = pickOne([3, 5, 7]);
  const year = new Date().getFullYear();

  return template
    .replace("{n}", String(n))
    .replace("{persona}", tenant.persona || "profissional")
    .replace("{assunto}", topic)
    .replace("{acao}", `melhorar ${topic}`)
    .replace("{dor}", "gastar muito")
    .replace("{resultado}", "resultados incriveis")
    .replace("{solucao}", topic)
    .replace("{referencia_autoridade}", "os especialistas")
    .replace("{fato_surpreendente}", `${topic} tem impacto direto no seu resultado`)
    .replace("{especialidade}", tenant.nicho || "negocio")
    .replace("{tempo}", "30 dias")
    .replace("{ano}", String(year))
    .replace("{opcao_a}", topic)
    .replace("{opcao_b}", `${topic} tradicional`)
    .replace("{concorrente_generico}", "a concorrencia")
    .replace("{alerta}", "atencao")
    .replace("{estado_antes}", "zero")
    .replace("{estado_depois}", "expert")
    .replace("{erro}", `errar em ${topic}`);
}

function generateEditorialThemes(
  tenant: TenantData,
  territorios: TerritorioRow[],
  _voz: VozRow | null,
  existingTopics: string[],
  quantidade: number,
): ThemeSuggestion[] {
  const nichoKey = Object.keys(NICHO_TOPICS).find(
    (k) => tenant.nicho?.toLowerCase().includes(k),
  ) ?? "geral";
  const topics = NICHO_TOPICS[nichoKey];

  const usedSet = new Set(existingTopics.map((t) => t.toLowerCase()));
  const results: ThemeSuggestion[] = [];
  const usedTemplates = new Set<number>();
  let attempts = 0;

  while (results.length < quantidade && attempts < quantidade * 5) {
    attempts++;
    const templateIdx = Math.floor(Math.random() * HOOK_TEMPLATES.length);
    if (usedTemplates.has(templateIdx) && attempts < quantidade * 3) continue;
    usedTemplates.add(templateIdx);

    const territorio = territorios.length > 0
      ? pickOne(territorios)
      : { codigo: "geral", nome: "Geral", peso: 1 };
    const formato = pickOne(FORMATOS);
    const template = HOOK_TEMPLATES[templateIdx];

    const tema = buildThemeFromTemplate(template, tenant, territorio, topics);

    if (usedSet.has(tema.toLowerCase())) continue;
    usedSet.add(tema.toLowerCase());

    results.push({
      tema,
      territorio: territorio.nome,
      formato: FORMATO_LABELS[formato],
      razao: `Territorio "${territorio.nome}" (peso ${territorio.peso}) + formato ${FORMATO_LABELS[formato]} para ${tenant.persona || tenant.publico}`,
    });
  }

  return results;
}

function generateTrendThemes(
  tenant: TenantData,
  territorios: TerritorioRow[],
  quantidade: number,
): ThemeSuggestion[] {
  const nichoKey = Object.keys(NICHO_TOPICS).find(
    (k) => tenant.nicho?.toLowerCase().includes(k),
  ) ?? "geral";
  const topics = NICHO_TOPICS[nichoKey];
  const year = new Date().getFullYear();

  const trendTemplates = [
    `Tendencia ${year}: {topic} vai mudar o jogo`,
    `O que esta bombando em {topic} agora`,
    `{topic} em ${year}: o que esperar`,
    `A nova onda de {topic} que voce precisa conhecer`,
    `Por que todo mundo esta falando de {topic}`,
    `{topic}: a tendencia que vai dominar ${year}`,
    `O futuro de {topic} ja comecou`,
    `Atualizacao ${year}: {topic} nunca mais sera o mesmo`,
  ];

  const selectedTopics = pickRandom(topics, quantidade);
  return selectedTopics.map((topic) => {
    const territorio = territorios.length > 0
      ? pickOne(territorios)
      : { codigo: "geral", nome: "Geral", peso: 1 };

    return {
      tema: pickOne(trendTemplates).replace("{topic}", topic),
      territorio: territorio.nome,
      formato: FORMATO_LABELS.trend_alert,
      razao: `Tendencia identificada para ${tenant.nicho || "o mercado"} — conteudo de alto engajamento`,
    };
  });
}

function generateIdeaBasedThemes(
  tenant: TenantData,
  territorios: TerritorioRow[],
  ideias: IdeiaRow[],
  quantidade: number,
): ThemeSuggestion[] {
  if (ideias.length === 0) {
    return generateEditorialThemes(tenant, territorios, null, [], quantidade);
  }

  const selectedIdeias = pickRandom(ideias, Math.min(quantidade, ideias.length));
  return selectedIdeias.map((ideia) => {
    const territorio = territorios.length > 0
      ? pickOne(territorios)
      : { codigo: "geral", nome: "Geral", peso: 1 };
    const formato = pickOne(FORMATOS);

    return {
      tema: ideia.tema,
      territorio: territorio.nome,
      formato: FORMATO_LABELS[formato],
      razao: `Baseado na ideia do cliente (prioridade ${ideia.prioridade}) — conteudo alinhado com o que o tenant quer`,
    };
  });
}

// ─── Route Handler ───────────────────────────────────────────
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { tenant_id, modo, quantidade } = body as {
    tenant_id: string;
    modo: GenerateMode;
    quantidade: number;
  };

  if (!tenant_id || !modo || !quantidade) {
    return Response.json(
      { error: "tenant_id, modo and quantidade are required" },
      { status: 400 },
    );
  }

  if (!["editorial", "tendencias", "ideias"].includes(modo)) {
    return Response.json(
      { error: "modo must be editorial, tendencias or ideias" },
      { status: 400 },
    );
  }

  const qty = Math.min(Math.max(1, quantidade), 15);

  // Try pipeline first
  try {
    const result = await pipelineRequest("/themes/generate", {
      tenant_id,
      modo,
      quantidade: qty,
    });
    return Response.json(result);
  } catch {
    // Pipeline unavailable — use fallback generator
  }

  // ─── Fallback: local generation ──────────────────────────
  try {
    const { data: tenant } = await supabase
      .from("tenants")
      .select("nome, nicho, persona, publico, posicionamento, diferencial")
      .eq("id", tenant_id)
      .single();

    if (!tenant) {
      return Response.json({ error: "Tenant not found" }, { status: 404 });
    }

    const { data: territorios } = await supabase
      .from("tenant_territorios")
      .select("codigo, nome, peso")
      .eq("tenant_id", tenant_id)
      .order("peso", { ascending: false });

    const { data: vozArr } = await supabase
      .from("tenant_voz")
      .select("tom, expressoes_tipicas")
      .eq("tenant_id", tenant_id)
      .limit(1);

    const { data: ideias } = await supabase
      .from("ideias")
      .select("tema, prioridade")
      .eq("tenant_id", tenant_id)
      .eq("usado", false)
      .order("prioridade", { ascending: false })
      .limit(20);

    const { data: recentCarousels } = await supabase
      .from("carousels")
      .select("tema, tema_refinado, territorio")
      .eq("tenant_id", tenant_id)
      .order("created_at", { ascending: false })
      .limit(10);

    const tenantData = tenant as TenantData;
    const terrs = (territorios ?? []) as TerritorioRow[];
    const voz = vozArr && vozArr.length > 0 ? (vozArr[0] as VozRow) : null;
    const ideiasData = (ideias ?? []) as IdeiaRow[];
    const existingTopics = (recentCarousels ?? []).map(
      (c: CarouselRow) => c.tema_refinado ?? c.tema,
    );

    let temas: ThemeSuggestion[];

    switch (modo) {
      case "editorial":
        temas = generateEditorialThemes(tenantData, terrs, voz, existingTopics, qty);
        break;
      case "tendencias":
        temas = generateTrendThemes(tenantData, terrs, qty);
        break;
      case "ideias":
        temas = generateIdeaBasedThemes(tenantData, terrs, ideiasData, qty);
        break;
    }

    return Response.json({ temas, source: "fallback" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation error";
    return Response.json({ error: message }, { status: 500 });
  }
}
