/**
 * data-chief.js
 * Phase 7: Runs data intelligence analysis for a tenant.
 * Loads tenant context + carousel metrics for the last 4 weeks,
 * runs data-chief agent, saves report to data_intelligence table.
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { loadTenantContext, supabase } = require('./supabase-loader');
const { validateOutput } = require('./schemas');
const { z } = require('zod');

const AGENTS_DIR = path.join(__dirname, 'agents-v3');
const MAX_RETRIES = 2;

// ============================================================
// DATA CHIEF OUTPUT SCHEMA
// ============================================================
const DataChiefOutput = z.object({
  periodo: z.string(),
  resumo_executivo: z.string(),
  metricas_gerais: z.object({
    total_carrosseis: z.number(),
    media_alcance: z.number(),
    media_engajamento: z.number(),
    melhor_formato: z.string(),
    pior_formato: z.string(),
  }),
  top_posts: z.array(z.object({
    carousel_id: z.string().optional(),
    tema: z.string(),
    formato: z.string(),
    destaque: z.string(),
  })),
  insights: z.array(z.object({
    categoria: z.string(),
    insight: z.string(),
    acao_recomendada: z.string(),
  })),
  recomendacoes_proxima_semana: z.array(z.string()),
  hooks_analysis: z.object({
    melhores: z.array(z.string()),
    piores: z.array(z.string()),
  }).optional(),
});

// ============================================================
// CLAUDE EXEC
// ============================================================
function cleanJson(text) {
  if (!text) return '';
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^\uFEFF/, '').replace(/[\x00-\x09\x0B\x0C\x0E-\x1F]/g, '');
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
  cleaned = cleaned.trim();
  const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (match) cleaned = match[1];
  return cleaned.trim();
}

function claudeExec(prompt, timeout = 180000) {
  const result = execFileSync('claude', ['-p', prompt, '--output-format', 'text'], {
    cwd: '/root/agencia-netororiz',
    timeout,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  return cleanJson(result);
}

// ============================================================
// AGENT RUNNER
// ============================================================
function loadAgentPrompt(agentName) {
  const filePath = path.join(AGENTS_DIR, `${agentName}.txt`);
  return fs.readFileSync(filePath, 'utf-8');
}

function injectVars(template, vars) {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.split(`{{${key}}}`).join(value || '');
  }
  return result;
}

async function runAgent(agentName, schema, vars, retries = MAX_RETRIES) {
  const template = loadAgentPrompt(agentName);
  let prompt = injectVars(template, vars);

  for (let attempt = 0; attempt <= retries; attempt++) {
    console.log(`  [${agentName}] attempt ${attempt + 1}/${retries + 1}`);

    try {
      const raw = claudeExec(prompt, 240000);
      if (!raw || raw.length < 10) {
        console.log(`  [${agentName}] empty/short response (${raw?.length || 0} chars)`);
      } else {
        console.log(`  [${agentName}] response: ${raw.substring(0, 80)}...`);
      }
      const result = validateOutput(schema, raw);

      if (result.success) {
        console.log(`  [${agentName}] OK`);
        return result.data;
      }

      console.log(`  [${agentName}] validation failed: ${result.error}`);
      if (attempt < retries) {
        prompt += `\n\nERRO NA RESPOSTA ANTERIOR: ${result.error}\nCorrija e responda APENAS com JSON valido.`;
      }
    } catch (err) {
      console.log(`  [${agentName}] error: ${err.message}`);
      if (attempt >= retries) throw err;
    }
  }

  throw new Error(`${agentName} failed after ${retries + 1} attempts`);
}

// ============================================================
// LOAD METRICS — carousel metrics for last 4 weeks
// ============================================================
async function loadCarouselMetrics(tenantId) {
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  const { data: carousels, error: e1 } = await supabase
    .from('carousels')
    .select('id, tema, tema_refinado, territorio, formato, hook_linha1, hook_linha2, tipo_capa, status, created_at')
    .eq('tenant_id', tenantId)
    .gte('created_at', fourWeeksAgo.toISOString())
    .in('status', ['published', 'approved', 'pending_approval'])
    .order('created_at', { ascending: false });

  if (e1) {
    console.log(`  [data-chief] Warning: failed to load carousels: ${e1.message}`);
    return { carousels: [], metrics: [] };
  }

  // Load metrics for these carousels
  const carouselIds = (carousels || []).map((c) => c.id);
  let metrics = [];

  if (carouselIds.length > 0) {
    const { data: metricsData, error: e2 } = await supabase
      .from('carousel_metrics')
      .select('*')
      .in('carousel_id', carouselIds);

    if (e2) {
      console.log(`  [data-chief] Warning: failed to load metrics: ${e2.message}`);
    } else {
      metrics = metricsData || [];
    }
  }

  return { carousels: carousels || [], metrics };
}

// ============================================================
// SAVE REPORT
// ============================================================
async function saveReport(tenantId, report) {
  const { data, error } = await supabase
    .from('data_intelligence')
    .insert({
      tenant_id: tenantId,
      report_json: report,
      periodo: report.periodo,
      resumo: report.resumo_executivo,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to save report: ${error.message}`);
  return data;
}

// ============================================================
// MAIN
// ============================================================
async function runDataChief(tenantId) {
  console.log(`\n========================================`);
  console.log(`DATA CHIEF — tenant: ${tenantId}`);
  console.log(`========================================\n`);

  // 1. Load tenant context
  console.log('[1/4] Loading tenant context...');
  const ctx = await loadTenantContext(tenantId);
  console.log(`  Tenant: ${ctx.tenant.nome} (${ctx.tenant.handle})`);

  // 2. Load carousel metrics (last 4 weeks)
  console.log('[2/4] Loading carousel metrics (last 4 weeks)...');
  const { carousels, metrics } = await loadCarouselMetrics(tenantId);
  console.log(`  Carousels found: ${carousels.length}`);
  console.log(`  Metrics records: ${metrics.length}`);

  // Build metrics summary for the agent
  const metricsStr = carousels.map((c) => {
    const m = metrics.find((met) => met.carousel_id === c.id);
    return `- ${c.tema} (${c.formato}, ${c.territorio}) | hook: "${c.hook_linha1}" | status: ${c.status}` +
      (m ? ` | alcance: ${m.alcance || 0}, likes: ${m.likes || 0}, saves: ${m.saves || 0}, shares: ${m.shares || 0}, comments: ${m.comments || 0}` : ' | (sem metricas)');
  }).join('\n');

  // 3. Run data-chief agent
  console.log('[3/4] Running data-chief agent...');
  const vars = {
    ...ctx.vars,
    METRICAS: metricsStr || '(sem dados de metricas ainda)',
    TOTAL_CARROSSEIS: String(carousels.length),
    PERIODO: 'ultimas 4 semanas',
  };
  const report = await runAgent('data-chief', DataChiefOutput, vars);
  console.log(`  Periodo: ${report.periodo}`);
  console.log(`  Insights: ${report.insights.length}`);
  console.log(`  Recomendacoes: ${report.recomendacoes_proxima_semana.length}`);

  // 4. Save to Supabase
  console.log('[4/4] Saving report to Supabase...');
  const saved = await saveReport(tenantId, report);

  console.log(`\n========================================`);
  console.log(`DATA CHIEF COMPLETE`);
  console.log(`Report ID: ${saved.id}`);
  console.log(`Periodo: ${report.periodo}`);
  console.log(`========================================\n`);

  return {
    report_id: saved.id,
    periodo: report.periodo,
    resumo_executivo: report.resumo_executivo,
    metricas_gerais: report.metricas_gerais,
    insights: report.insights,
    recomendacoes: report.recomendacoes_proxima_semana,
    top_posts: report.top_posts,
  };
}

module.exports = { runDataChief, DataChiefOutput };
