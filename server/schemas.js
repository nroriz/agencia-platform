const { z } = require('zod');

const StrategyOutput = z.object({
  tema_refinado: z.string().max(80),
  territorio: z.string(),
  angulo: z.string().max(120),
  publico_especifico: z.string().max(80),
  dor_central: z.string().max(120),
  por_que_salva: z.string().max(80),
  formato: z.enum(['educativo', 'polemico', 'storytelling', 'checklist', 'comparativo', 'trend_alert']),
  fonte_tendencia: z.string(),
  ideias_relacionadas: z.array(z.string()),
});

const HookItem = z.object({
  linha1: z.string(),
  linha2: z.string(),
  tecnica: z.string(),
  score: z.number().optional(),
});

const HooksOutput = z.object({
  hooks: z.array(HookItem).min(1).max(5),
});

const ArcSlide = z.object({
  slide: z.number().int().min(1).max(10),
  tipo: z.enum([
    'capa_imagem', 'texto_gigante', 'dado_imagem', 'dado_texto',
    'conteudo_imagem', 'lista', 'pergunta', 'citacao',
    'cta_imagem', 'transicao', 'comparativo',
  ]),
  funcao: z.string(),
});

const StoryOutput = z.object({
  arco: z.array(ArcSlide).length(10),
});

const CopySlide = z.object({
  slide: z.number().int().min(1).max(10),
  tipo: z.string(),
  data: z.record(z.string(), z.unknown()),
});

const CopyOutput = z.object({
  slides: z.array(CopySlide).length(10),
  caption: z.string(),
  hashtags: z.array(z.string()),
});

const BrandEditorOutput = z.object({
  status: z.enum(['APROVADO', 'REPROVADO']),
  score: z.number().int().min(0).max(10),
  checklist: z.array(z.object({
    item: z.string(),
    ok: z.boolean(),
  })),
  ajustes: z.array(z.string()).optional(),
});

const VisualPrompt = z.object({
  slide: z.number().int(),
  composicao: z.string(),
  prompt_gemini: z.string(),
});

const VisualOutput = z.object({
  prompts: z.array(VisualPrompt),
});

const PautaItem = z.object({
  dia: z.string(),
  horario: z.string(),
  tema_bruto: z.string(),
  territorio: z.string(),
  formato: z.string(),
  tipo_capa: z.string(),
  justificativa: z.string(),
});

const EditorialOutput = z.object({
  semana: z.string(),
  pauta: z.array(PautaItem),
  banco_ideias_novos: z.array(z.string()).optional(),
});

function validateOutput(schema, raw) {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return { success: true, data: schema.parse(parsed) };
  } catch (err) {
    return {
      success: false,
      error: err.issues ? err.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ') : err.message,
    };
  }
}

module.exports = {
  StrategyOutput,
  HooksOutput,
  StoryOutput,
  CopyOutput,
  BrandEditorOutput,
  VisualOutput,
  EditorialOutput,
  validateOutput,
};
