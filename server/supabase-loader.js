/**
 * supabase-loader.js
 * Loads full tenant context from Supabase for use by agents.
 * Uses service_role key (server-side only, bypasses RLS).
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/root/agencia-netororiz/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function loadTenantContext(tenantId) {
  // Load all tenant data in parallel
  const [
    { data: tenant, error: e1 },
    { data: visual, error: e2 },
    { data: territorios, error: e3 },
    { data: voz, error: e4 },
    { data: horarios, error: e5 },
    { data: integracoes, error: e6 },
    { data: intelligence, error: e7 },
    { data: historico, error: e8 },
    { data: ideias, error: e9 },
  ] = await Promise.all([
    supabase.from('tenants').select('*').eq('id', tenantId).single(),
    supabase.from('tenant_visual').select('*').eq('tenant_id', tenantId).single(),
    supabase.from('tenant_territorios').select('*').eq('tenant_id', tenantId),
    supabase.from('tenant_voz').select('*').eq('tenant_id', tenantId).single(),
    supabase.from('tenant_horarios').select('*').eq('tenant_id', tenantId),
    supabase.from('tenant_integracoes').select('*').eq('tenant_id', tenantId).single(),
    supabase.from('data_intelligence').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(1).single(),
    supabase.from('carousels').select('id, tema, territorio, formato, hook_linha1, status, created_at').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(30),
    supabase.from('ideias').select('*').eq('tenant_id', tenantId).eq('usado', false).order('prioridade', { ascending: false }).limit(20),
  ]);

  if (e1 || !tenant) {
    throw new Error(`Tenant ${tenantId} not found: ${e1?.message || 'no data'}`);
  }

  // Build territories string
  const territoriosStr = (territorios || [])
    .map(t => `${t.codigo} = ${t.nome} (${t.peso}%)`)
    .join(', ');

  // Build horarios string
  const horariosStr = (horarios || [])
    .map(h => `${h.dia} ${h.hora}`)
    .join(', ');

  // Build historico summary
  const historicoStr = (historico || [])
    .map(c => `- ${c.tema} (${c.formato}, ${c.territorio}, ${c.status})`)
    .join('\n');

  // Build ideias list
  const ideiasStr = (ideias || [])
    .map(i => `- ${i.tema} (origem: ${i.origem}, prioridade: ${i.prioridade})`)
    .join('\n');

  return {
    tenant,
    visual: visual || {},
    territorios: territorios || [],
    voz: voz || {},
    horarios: horarios || [],
    integracoes: integracoes || {},
    intelligence: intelligence || null,
    historico: historico || [],
    ideias: ideias || [],

    // Pre-formatted strings for prompt injection
    vars: {
      HANDLE: tenant.handle,
      PERSONA: tenant.persona,
      POSICIONAMENTO: tenant.posicionamento || '',
      PUBLICO: tenant.publico,
      DIFERENCIAL: tenant.diferencial || '',
      NICHO: tenant.nicho,
      TOM: voz?.tom || '',
      PALAVRAS_PROIBIDAS: (voz?.palavras_proibidas || []).join(', '),
      EXPRESSOES_TIPICAS: (voz?.expressoes_tipicas || []).join(' | '),
      ANTI_EXEMPLOS: JSON.stringify(voz?.anti_exemplos || [], null, 2),
      REGRAS_EXTRAS: (voz?.regras_extras || []).join('\n- '),
      VOICE_BANK: voz?.voice_bank_text || '(nao disponivel ainda)',
      TERRITORIOS: territoriosStr,
      TERRITORIOS_COM_PESOS: territoriosStr,
      FREQUENCIA_SEMANAL: String(tenant.frequencia_semanal),
      HORARIOS: horariosStr,
      ESTILO_IMAGEM: visual?.estilo_imagem || '',
      DATA_INTELLIGENCE: intelligence?.report_json ? JSON.stringify(intelligence.report_json) : '(sem dados ainda — primeira semana)',
      HISTORICO: historicoStr || '(sem historico)',
      BANCO_IDEIAS: ideiasStr || '(vazio)',
      HOOKS_QUE_FUNCIONARAM: '(sem dados ainda)',
      HOOKS_QUE_FALHARAM: '(sem dados ainda)',
      TIPOS_SLIDE_PERFORMANCE: '(sem dados ainda)',
      PADROES_COPY: '(sem dados ainda)',
      FORMATOS_PREFERIDOS: 'educativo, polemico, storytelling, checklist, comparativo, trend_alert',
      METRICAS: '(sem dados ainda)',
      DATAS: '',
    }
  };
}

async function saveCarousel(tenantId, carouselData) {
  const { data, error } = await supabase
    .from('carousels')
    .insert({
      tenant_id: tenantId,
      tema: carouselData.tema,
      tema_refinado: carouselData.tema_refinado,
      territorio: carouselData.territorio,
      formato: carouselData.formato,
      hook_linha1: carouselData.hook_linha1,
      hook_linha2: carouselData.hook_linha2,
      tipo_capa: carouselData.tipo_capa,
      slides_json: carouselData.slides,
      caption: carouselData.caption,
      hashtags: carouselData.hashtags,
      status: 'pending_approval',
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to save carousel: ${error.message}`);
  return data;
}

async function saveSlides(carouselId, slides) {
  const rows = slides.map((s, i) => ({
    carousel_id: carouselId,
    slide_number: i + 1,
    tipo: s.tipo,
    data_json: s.data || s,
    imagem_url: s.imagem_url || null,
    png_url: s.png_url || null,
  }));

  const { error } = await supabase.from('carousel_slides').insert(rows);
  if (error) throw new Error(`Failed to save slides: ${error.message}`);
}

async function updateCarouselStatus(carouselId, status) {
  const { error } = await supabase
    .from('carousels')
    .update({ status })
    .eq('id', carouselId);
  if (error) throw new Error(`Failed to update status: ${error.message}`);
}

module.exports = {
  supabase,
  loadTenantContext,
  saveCarousel,
  saveSlides,
  updateCarouselStatus,
};
