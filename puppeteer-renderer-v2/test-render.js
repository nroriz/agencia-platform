/**
 * Test script — renders 3 sample slides using tenant_001 visual config.
 * Usage: node test-render.js
 */
const { renderCarousel, closeBrowser } = require('./index');

// tenant_001 visual (from Supabase seed)
const visual = {
  cor_fundo: '#0a0a0a',
  cor_acento: '#FF4103',
  cor_texto: '#ffffff',
  fonte_headline: 'Plus Jakarta Sans',
  fonte_headline_peso: 800,
  fonte_numero: 'Bebas Neue',
  fonte_corpo: 'DM Sans',
  fonte_label: 'Space Grotesk',
  logo_url: null,
  avatar_url: null,
  header_esquerda_a: 'GESTAO & ESTRATEGIA',
  header_esquerda_b: 'JURIDICO & TRIBUTARIO',
  header_direita: '@NETORORIZ.GESTAOBARBER',
  tag_marca: '@netororiz',
};

const testCarousel = {
  id: 'test_v2_' + Date.now(),
  slides: [
    {
      tipo: 'capa_imagem',
      data: {
        gancho_linha1: 'VOCE *PERDE* DINHEIRO',
        gancho_linha2: 'TODA *SEMANA*',
        subtitulo: 'E provavelmente nem sabe quanto',
        imagem_url: 'https://images.unsplash.com/photo-1585747860019-8e8ece18a032?w=1080&q=80',
      },
    },
    {
      tipo: 'texto_gigante',
      data: {
        texto: 'O *CAIXA* NAO MENTE',
      },
    },
    {
      tipo: 'dado_texto',
      data: {
        label: 'PREJUIZO MENSAL',
        numero: 'R$1.200',
        corpo: 'E o que um dono de barbearia perde por mes quando nao controla os numeros basicos.',
      },
    },
    {
      tipo: 'lista',
      data: {
        titulo: 'OS *4* NUMEROS QUE VOCE PRECISA SABER',
        item1: 'Ticket medio por cliente',
        item2: 'Taxa de retorno mensal',
        item3: 'Custo por corte real',
        item4: 'Margem de lucro liquida',
      },
    },
    {
      tipo: 'pergunta',
      data: {
        pergunta: 'QUANTO *SOBRA* NO SEU CAIXA TODO MES?',
      },
    },
    {
      tipo: 'conteudo_imagem',
      data: {
        titulo: 'FAZ A *CONTA* COMIGO',
        corpo: '20 cortes por dia. R$3 de prejuizo em cada. No fim do mes, *R$1.200* jogados fora.',
        imagem_url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1080&q=80',
      },
    },
    {
      tipo: 'transicao',
      data: {
        texto: 'MAS TEM *SOLUCAO*',
      },
    },
    {
      tipo: 'citacao',
      data: {
        citacao: 'Eu perdi R$4.800 em 3 meses porque nao sabia esse numero.',
        autor: 'NETO RORIZ',
      },
    },
    {
      tipo: 'comparativo',
      data: {
        label_a: 'SEM CONTROLE',
        valor_a: 'R$3 de prejuizo por corte',
        label_b: 'COM CONTROLE',
        valor_b: 'R$12 de lucro por corte',
      },
    },
    {
      tipo: 'cta_imagem',
      data: {
        titulo: 'QUER PARAR DE *PERDER* DINHEIRO?',
        corpo: 'Siga para mais conteudo pratico sobre gestao de barbearia.',
        cta_text: 'SEGUIR @NETORORIZ',
        imagem_url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=1080&q=80',
      },
    },
  ],
};

(async () => {
  try {
    console.log('Starting test render...');
    const result = await renderCarousel(testCarousel, visual);
    console.log('\nResults:');
    for (const s of result.slides) {
      if (s.error) {
        console.log(`  Slide ${s.slide} (${s.tipo}): ERROR — ${s.error}`);
      } else {
        console.log(`  Slide ${s.slide} (${s.tipo}): OK — ${(s.size / 1024).toFixed(0)}KB → ${s.filename}`);
      }
    }
    console.log(`\nOutput: ${result.outputDir}`);
  } catch (err) {
    console.error('Fatal:', err);
  } finally {
    await closeBrowser();
  }
})();
