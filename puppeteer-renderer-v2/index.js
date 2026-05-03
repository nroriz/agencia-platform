const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, 'templates');
const FONTS_DIR = path.join(__dirname, 'fonts');
const OUTPUT_DIR = path.join(__dirname, '..', 'output');

// ============================================================
// FONT LOADING — woff2 files embedded as base64 @font-face
// ============================================================
function loadFontFace(family, file, weight, style = 'normal') {
  const fontPath = path.join(FONTS_DIR, file);
  if (!fs.existsSync(fontPath)) {
    console.warn(`  [fonts] missing: ${fontPath}`);
    return '';
  }
  const b64 = fs.readFileSync(fontPath).toString('base64');
  return `@font-face { font-family: '${family}'; font-weight: ${weight}; font-style: ${style}; src: url(data:font/woff2;base64,${b64}) format('woff2'); }`;
}

const FONT_FACES = [
  loadFontFace('Plus Jakarta Sans', 'plus-jakarta-sans-800.woff2', 800),
  loadFontFace('Bebas Neue', 'bebas-neue-400.woff2', 400),
  loadFontFace('DM Sans', 'dm-sans-400.woff2', 400),
  loadFontFace('DM Sans', 'dm-sans-700.woff2', 700),
  loadFontFace('Space Grotesk', 'space-grotesk-400.woff2', 400),
  loadFontFace('Space Grotesk', 'space-grotesk-500.woff2', 500),
].filter(Boolean).join('\n');

// ============================================================
// CSS VARIABLES — built from tenant_visual record
// ============================================================
function buildCssVars(visual) {
  return `:root {
  --bg: ${visual.cor_fundo || '#0a0a0a'};
  --accent: ${visual.cor_acento || '#FF4103'};
  --text: ${visual.cor_texto || '#ffffff'};
  --font-headline: '${visual.fonte_headline || 'Plus Jakarta Sans'}', sans-serif;
  --font-number: '${visual.fonte_numero || 'Bebas Neue'}', sans-serif;
  --font-body: '${visual.fonte_corpo || 'DM Sans'}', sans-serif;
  --font-label: '${visual.fonte_label || 'Space Grotesk'}', sans-serif;
}`;
}

// ============================================================
// TEXT PROCESSING
// ============================================================
function processHighlights(text) {
  if (!text) return '';
  return String(text).replace(/\*([^*]+)\*/g, '<span class="hl">$1</span>');
}

// ============================================================
// TEMPLATE ENGINE
// ============================================================
function loadTemplate(tipo) {
  const filePath = path.join(TEMPLATES_DIR, `${tipo}.html`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Template not found: ${tipo}.html`);
  }
  return fs.readFileSync(filePath, 'utf-8');
}

function injectVariables(html, vars) {
  let result = html;
  for (const [key, value] of Object.entries(vars)) {
    const placeholder = `{{${key}}}`;
    result = result.split(placeholder).join(value || '');
  }
  return result;
}

function buildSlideHtml(slide, visual, slideNumber, totalSlides) {
  const tipo = slide.tipo;
  let html = loadTemplate(tipo);

  // Common variables
  const commonVars = {
    FONT_FACES: FONT_FACES,
    CSS_VARS: buildCssVars(visual),
    HEADER_LEFT: visual.header_esquerda_a || visual.header_esquerda_b || '',
    HEADER_RIGHT: visual.header_direita || '',
    SLIDE_NUM: slideNumber === 1 ? '' : `${String(slideNumber).padStart(2, '0')}/${String(totalSlides).padStart(2, '0')}`,
    FOOTER_TEXT: visual.tag_marca || '',
    TAG_MARCA: visual.tag_marca || '',
  };

  // Process slide-specific data and apply highlights
  const data = slide.data || {};
  const dataVars = {};
  for (const [key, value] of Object.entries(data)) {
    dataVars[key.toUpperCase()] = processHighlights(value);
  }

  // Handle image
  if (data.imagem_url || slide.imagem_url) {
    const imgSrc = data.imagem_url || slide.imagem_url;
    dataVars['IMAGE_SRC'] = imgSrc;
  }

  // Inject all variables
  html = injectVariables(html, { ...commonVars, ...dataVars });

  return html;
}

// ============================================================
// PUPPETEER RENDERER
// ============================================================
let browserInstance = null;

async function getBrowser() {
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }
  browserInstance = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/chromium-browser',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });
  return browserInstance;
}

async function renderSlide(slideHtml) {
  const browser = await getBrowser();
  const page = await browser.newPage();

  await page.setViewport({
    width: 1080,
    height: 1350,
    deviceScaleFactor: 2,
  });

  await page.setContent(slideHtml, {
    waitUntil: 'networkidle0',
    timeout: 30000,
  });

  // Wait for fonts to load
  await page.evaluate(() => document.fonts.ready);

  const buffer = await page.screenshot({
    type: 'png',
    clip: { x: 0, y: 0, width: 1080, height: 1350 },
  });

  await page.close();
  return buffer;
}

async function renderCarousel(carouselData, visual) {
  const id = carouselData.id || `carousel_${Date.now()}`;
  const slides = carouselData.slides || [];
  const totalSlides = slides.length;
  const outDir = path.join(OUTPUT_DIR, id);

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log(`[renderer-v2] Rendering ${totalSlides} slides for ${id}`);
  const results = [];

  for (let i = 0; i < totalSlides; i++) {
    const slide = slides[i];
    const slideNum = i + 1;

    try {
      console.log(`  [${slideNum}/${totalSlides}] ${slide.tipo}`);
      const html = buildSlideHtml(slide, visual, slideNum, totalSlides);
      const pngBuffer = await renderSlide(html);

      const filename = `slide_${String(slideNum).padStart(2, '0')}_${slide.tipo}.png`;
      const filepath = path.join(outDir, filename);
      fs.writeFileSync(filepath, pngBuffer);

      results.push({
        slide: slideNum,
        tipo: slide.tipo,
        path: filepath,
        filename,
        size: pngBuffer.length,
      });
    } catch (err) {
      console.error(`  [${slideNum}/${totalSlides}] ERROR: ${err.message}`);
      results.push({
        slide: slideNum,
        tipo: slide.tipo,
        error: err.message,
      });
    }
  }

  console.log(`[renderer-v2] Done: ${results.filter(r => !r.error).length}/${totalSlides} slides`);
  return { id, outputDir: outDir, slides: results };
}

async function closeBrowser() {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

// ============================================================
// EXPORTS
// ============================================================
module.exports = {
  renderCarousel,
  renderSlide,
  buildSlideHtml,
  buildCssVars,
  closeBrowser,
  FONT_FACES,
};
