/**
 * squad-pipeline-v3.js
 * Dynamic multi-tenant pipeline: loads context from Supabase,
 * runs 6 agents (strategy → hooks → story → copy → brand-editor → visual-director),
 * generates images with Gemini, renders with Puppeteer v2.
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { loadTenantContext, saveCarousel, saveSlides } = require('./supabase-loader');
const { StrategyOutput, HooksOutput, StoryOutput, CopyOutput, BrandEditorOutput, VisualOutput, validateOutput } = require('./schemas');
const renderer = require('./puppeteer-renderer-v2');

const AGENTS_DIR = path.join(__dirname, 'agents-v3');
const MAX_RETRIES = 2;

// ============================================================
// CLAUDE EXEC
// ============================================================
function cleanJson(text) {
  if (!text) return '';
  let cleaned = text.trim();
  // Remove BOM and invisible chars
  cleaned = cleaned.replace(/^\uFEFF/, '').replace(/[\x00-\x09\x0B\x0C\x0E-\x1F]/g, '');
  // Remove markdown code fences
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
  cleaned = cleaned.trim();
  // Always extract the first JSON object/array from the text
  const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (match) cleaned = match[1];
  return cleaned.trim();
}

function claudeExec(prompt, timeout = 180000, useWebSearch = false) {
  const args = ['-p', prompt, '--output-format', 'text'];
  if (useWebSearch) {
    args.push('--allowedTools', 'mcp__fetch__fetch,WebSearch');
  }
  const result = execFileSync('claude', args, {
    cwd: '/root/agencia-netororiz',
    timeout,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  return cleanJson(result);
}

// ============================================================
// AGENT RUNNER — loads template, injects vars, executes, validates
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

async function runAgent(agentName, schema, extraVars, ctx, options = {}) {
  const { useWebSearch = false, retries = MAX_RETRIES } = options;
  const template = loadAgentPrompt(agentName);
  const vars = { ...ctx.vars, ...extraVars };
  let prompt = injectVars(template, vars);

  for (let attempt = 0; attempt <= retries; attempt++) {
    console.log(`  [${agentName}] attempt ${attempt + 1}/${retries + 1}`);

    try {
      const raw = claudeExec(prompt, 240000, useWebSearch);
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
// GEMINI IMAGE GENERATION
// ============================================================
function callGeminiAPI(prompt) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.GEMINI_API_KEY;
    const payload = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ['image', 'text'],
        imageSizeOptions: { aspectRatio: 'PORTRAIT_4_5' },
      },
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          const parts = json.candidates?.[0]?.content?.parts || [];
          const imgPart = parts.find(p => p.inlineData);
          if (imgPart) {
            resolve(Buffer.from(imgPart.inlineData.data, 'base64'));
          } else {
            reject(new Error('No image in Gemini response'));
          }
        } catch (e) {
          reject(new Error(`Gemini parse error: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function generateImages(visualPrompts, outputDir) {
  console.log(`  [gemini] Generating ${visualPrompts.length} images in parallel...`);
  const results = await Promise.all(
    visualPrompts.map(async (vp) => {
      try {
        const buffer = await callGeminiAPI(vp.prompt_gemini);
        const filename = `gemini_slide_${String(vp.slide).padStart(2, '0')}.png`;
        const filepath = path.join(outputDir, filename);
        fs.writeFileSync(filepath, buffer);
        console.log(`  [gemini] slide ${vp.slide}: OK (${(buffer.length / 1024).toFixed(0)}KB)`);
        return { slide: vp.slide, path: filepath };
      } catch (err) {
        console.log(`  [gemini] slide ${vp.slide}: FAILED — ${err.message}`);
        return { slide: vp.slide, error: err.message };
      }
    })
  );
  return results;
}

// ============================================================
// MAIN PIPELINE
// ============================================================
async function runPipeline(tenantId, tema) {
  console.log(`\n========================================`);
  console.log(`PIPELINE V3 — tenant: ${tenantId}`);
  console.log(`TEMA: ${tema}`);
  console.log(`========================================\n`);

  // 1. Load tenant context
  console.log('[1/8] Loading tenant context...');
  const ctx = await loadTenantContext(tenantId);
  console.log(`  Tenant: ${ctx.tenant.nome} (${ctx.tenant.handle})`);

  // 2. Strategy Agent (with web search)
  console.log('[2/8] Strategy Agent...');
  const strategy = await runAgent('strategy', StrategyOutput, { TEMA_BRUTO: tema }, ctx, { useWebSearch: true });
  console.log(`  Tema refinado: ${strategy.tema_refinado}`);
  console.log(`  Formato: ${strategy.formato}`);

  // 3. Hormozi Hooks
  console.log('[3/8] Hormozi Hooks...');
  const hooks = await runAgent('hormozi-hooks', HooksOutput, {
    TEMA_REFINADO: strategy.tema_refinado,
    ANGULO: strategy.angulo,
    DOR_CENTRAL: strategy.dor_central,
    FORMATO: strategy.formato,
  }, ctx);
  const bestHook = hooks.hooks[0];
  console.log(`  Best hook: ${bestHook.linha1} / ${bestHook.linha2}`);

  // 4. Story Architect
  console.log('[4/8] Story Architect...');
  const story = await runAgent('story-architect', StoryOutput, {
    TEMA_REFINADO: strategy.tema_refinado,
    FORMATO: strategy.formato,
    ANGULO: strategy.angulo,
    DOR_CENTRAL: strategy.dor_central,
    HOOK_LINHA1: bestHook.linha1,
    HOOK_LINHA2: bestHook.linha2,
  }, ctx);
  console.log(`  Arc: ${story.arco.map(s => s.tipo).join(' → ')}`);

  // 5. Copy Master
  console.log('[5/8] Copy Master...');
  const copy = await runAgent('copy-master', CopyOutput, {
    TEMA_REFINADO: strategy.tema_refinado,
    FORMATO: strategy.formato,
    ANGULO: strategy.angulo,
    DOR_CENTRAL: strategy.dor_central,
    HOOK_LINHA1: bestHook.linha1,
    HOOK_LINHA2: bestHook.linha2,
    ARCO: JSON.stringify(story.arco),
  }, ctx);
  console.log(`  Caption: ${copy.caption.substring(0, 60)}...`);

  // 6. Brand Editor
  console.log('[6/8] Brand Editor...');
  const brand = await runAgent('brand-editor', BrandEditorOutput, {
    SLIDES_JSON: JSON.stringify(copy.slides, null, 2),
    CAPTION: copy.caption,
    ARCO: JSON.stringify(story.arco),
  }, ctx);
  console.log(`  Score: ${brand.score}/10 — ${brand.status}`);

  if (brand.status === 'REPROVADO' && brand.score >= 3 && brand.ajustes && brand.ajustes.length > 0) {
    console.log('  [RETRY] Brand editor rejected, retrying copy...');
    const retryVars = {
      TEMA_REFINADO: strategy.tema_refinado,
      FORMATO: strategy.formato,
      ANGULO: strategy.angulo,
      DOR_CENTRAL: strategy.dor_central,
      HOOK_LINHA1: bestHook.linha1,
      HOOK_LINHA2: bestHook.linha2,
      ARCO: JSON.stringify(story.arco),
      AJUSTES_BRAND_EDITOR: brand.ajustes.join('\n- '),
    };
    const copyRetry = await runAgent('copy-master', CopyOutput, retryVars, ctx);
    Object.assign(copy, copyRetry);
    console.log('  [RETRY] Copy rewritten');
  }

  // 7. Visual Director
  console.log('[7/8] Visual Director...');
  const slidesWithImage = copy.slides.filter(s =>
    ['capa_imagem', 'dado_imagem', 'conteudo_imagem', 'cta_imagem'].includes(s.tipo)
  );
  const visual = await runAgent('visual-director', VisualOutput, {
    SLIDES_COM_IMAGEM: JSON.stringify(slidesWithImage.map(s => ({
      slide: s.slide,
      tipo: s.tipo,
      texto_principal: Object.values(s.data)[0],
    }))),
  }, ctx);

  // Generate images with Gemini
  const carouselId = `carousel_${Date.now()}`;
  const outputDir = path.join('/root/agencia-netororiz/output', carouselId);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const images = await generateImages(visual.prompts, outputDir);

  // Build image map
  const imageMap = {};
  for (const img of images) {
    if (img.path) {
      imageMap[img.slide] = `file://${img.path}`;
    }
  }

  // Inject images into slides
  const slidesForRender = copy.slides.map(s => {
    const slideData = { ...s, data: { ...s.data } };
    if (imageMap[s.slide]) {
      slideData.data.imagem_url = imageMap[s.slide];
      slideData.imagem_url = imageMap[s.slide];
    }
    return slideData;
  });

  // 8. Render with Puppeteer v2
  console.log('[8/8] Rendering slides...');
  const renderResult = await renderer.renderCarousel(
    { id: carouselId, slides: slidesForRender },
    ctx.visual
  );

  // Save to Supabase
  console.log('[SAVE] Saving to Supabase...');
  const savedCarousel = await saveCarousel(tenantId, {
    tema,
    tema_refinado: strategy.tema_refinado,
    territorio: strategy.territorio,
    formato: strategy.formato,
    hook_linha1: bestHook.linha1,
    hook_linha2: bestHook.linha2,
    tipo_capa: 'A',
    slides: copy.slides,
    caption: copy.caption,
    hashtags: copy.hashtags,
  });

  // Save individual slides with PNG paths
  const slidesWithPng = copy.slides.map((s, i) => ({
    ...s,
    imagem_url: imageMap[s.slide] || null,
    png_url: renderResult.slides[i]?.path || null,
  }));
  await saveSlides(savedCarousel.id, slidesWithPng);

  console.log(`\n========================================`);
  console.log(`PIPELINE V3 COMPLETE`);
  console.log(`Carousel ID: ${savedCarousel.id}`);
  console.log(`Status: pending_approval`);
  console.log(`Output: ${outputDir}`);
  console.log(`========================================\n`);

  return {
    carousel_id: savedCarousel.id,
    tema_refinado: strategy.tema_refinado,
    formato: strategy.formato,
    hook: bestHook,
    brand_score: brand.score,
    slides_count: renderResult.slides.filter(s => !s.error).length,
    output_dir: outputDir,
    render_results: renderResult.slides,
  };
}

module.exports = { runPipeline };
