/**
 * editorial-planner.js
 * Phase 5: Generates weekly editorial plan (pauta) for a tenant.
 * Loads tenant context, runs editorial-planner agent, validates output,
 * saves each scheduled theme as a draft carousel entry in Supabase.
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { loadTenantContext, supabase } = require('./supabase-loader');
const { EditorialOutput, validateOutput } = require('./schemas');

const AGENTS_DIR = path.join(__dirname, 'agents-v3');
const MAX_RETRIES = 2;

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
// SAVE PAUTA — creates draft carousel entries for each scheduled theme
// ============================================================
async function savePauta(tenantId, editorial) {
  const rows = editorial.pauta.map((item) => ({
    tenant_id: tenantId,
    tema: item.tema_bruto,
    territorio: item.territorio,
    formato: item.formato,
    tipo_capa: item.tipo_capa,
    scheduled_date: item.dia,
    scheduled_time: item.horario,
    status: 'draft',
    editorial_week: editorial.semana,
    justificativa: item.justificativa,
  }));

  const { data, error } = await supabase
    .from('carousels')
    .insert(rows)
    .select();

  if (error) throw new Error(`Failed to save pauta: ${error.message}`);

  // Save new ideas to banco de ideias if any
  if (editorial.banco_ideias_novos && editorial.banco_ideias_novos.length > 0) {
    const ideiaRows = editorial.banco_ideias_novos.map((tema) => ({
      tenant_id: tenantId,
      tema,
      origem: 'editorial-planner',
      prioridade: 5,
      usado: false,
    }));

    const { error: ideiaError } = await supabase.from('ideias').insert(ideiaRows);
    if (ideiaError) {
      console.log(`  [editorial-planner] Warning: failed to save ideas: ${ideiaError.message}`);
    }
  }

  return data;
}

// ============================================================
// MAIN
// ============================================================
async function runEditorialPlanner(tenantId) {
  console.log(`\n========================================`);
  console.log(`EDITORIAL PLANNER — tenant: ${tenantId}`);
  console.log(`========================================\n`);

  // 1. Load tenant context
  console.log('[1/3] Loading tenant context...');
  const ctx = await loadTenantContext(tenantId);
  console.log(`  Tenant: ${ctx.tenant.nome} (${ctx.tenant.handle})`);

  // 2. Run editorial-planner agent
  console.log('[2/3] Running editorial-planner agent...');
  const editorial = await runAgent('editorial-planner', EditorialOutput, ctx.vars);
  console.log(`  Semana: ${editorial.semana}`);
  console.log(`  Itens na pauta: ${editorial.pauta.length}`);
  editorial.pauta.forEach((item, i) => {
    console.log(`    ${i + 1}. ${item.dia} ${item.horario} — ${item.tema_bruto} (${item.formato})`);
  });

  // 3. Save to Supabase
  console.log('[3/3] Saving pauta to Supabase...');
  const saved = await savePauta(tenantId, editorial);

  console.log(`\n========================================`);
  console.log(`EDITORIAL PLANNER COMPLETE`);
  console.log(`Week: ${editorial.semana}`);
  console.log(`Items saved: ${saved.length}`);
  console.log(`New ideas: ${editorial.banco_ideias_novos?.length || 0}`);
  console.log(`========================================\n`);

  return {
    semana: editorial.semana,
    pauta: editorial.pauta,
    carousel_ids: saved.map((c) => c.id),
    banco_ideias_novos: editorial.banco_ideias_novos || [],
  };
}

module.exports = { runEditorialPlanner };
