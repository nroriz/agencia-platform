-- ═══════════════════════════════════
-- ETAPA 1: Tabela tenant_brand_dna
-- ═══════════════════════════════════

CREATE TABLE IF NOT EXISTS tenant_brand_dna (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
  dna jsonb NOT NULL DEFAULT '{}',
  archetype text NOT NULL DEFAULT 'editorial-dark',
  source text NOT NULL DEFAULT 'manual',
  confidence numeric(3,2) DEFAULT 1.0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tenant_brand_dna ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_all" ON tenant_brand_dna FOR ALL USING (true);

-- ═══════════════════════════════════
-- SEED: @netororiz.gestaobarber
-- ═══════════════════════════════════

INSERT INTO tenant_brand_dna (tenant_id, dna, archetype, source, confidence)
SELECT id,
  '{
    "paleta": {
      "fundo": "#0A0A0A",
      "acento": "#FF4103",
      "texto": "#FFFFFF",
      "texto_dim": "#7A8B9A",
      "offwhite": "#E8ECF0",
      "card": "#0D1820",
      "border": "#1A2D3D",
      "footer": "#050505",
      "alerta": "#E81224",
      "corpo": "#E8ECF0"
    },
    "tipografia": {
      "headline": { "family": "Unbounded", "weight": 900 },
      "sub_headline": { "family": "Sora", "weight": 700 },
      "corpo": { "family": "Inter", "weight": 400 },
      "numero": { "family": "JetBrains Mono", "weight": 700 },
      "label": { "family": "Inter", "weight": 400 },
      "citacao": { "family": "Source Serif 4", "weight": 700 },
      "alerta": { "family": "Permanent Marker", "weight": 400 }
    },
    "editorial_rules": {
      "tom": "Direto, verdade na cara, dados concretos. Sem enrolacao, sem coachismo.",
      "palavras_proibidas": ["jornada", "transformacao", "mindset", "escalar", "monetizar", "hackear", "destravar", "mentalidade"],
      "expressoes_tipicas": ["Na pratica funciona assim", "Faz a conta comigo", "O caixa nao mente", "Dos dois lados do balcao"],
      "densidade": "alta",
      "tipos_slide_preferidos": ["texto_gigante", "dado_texto", "lista", "pergunta", "capa_imagem"],
      "tipos_slide_evitar": ["antes_depois", "citacao"],
      "max_slides_com_foto": 5
    },
    "photo_style": {
      "anchor_prompt": "Cinematic editorial photograph, dark moody lighting with deep blue shadows and warm orange accent lights, Brazilian barbershop setting, shallow depth of field, professional photography, 4:5 aspect ratio portrait orientation. No text, no letters, no words, no watermarks in the image.",
      "lighting": "cinematic-dark",
      "dominance": 0.7
    },
    "decorative": {
      "grain": true,
      "shapes": false,
      "gradient_style": "to-bottom"
    },
    "branding": {
      "handle": "@netororiz.gestaobarber",
      "slogan": "Gestao & Estrategia para Barbearias",
      "logo_opacity": 0.8
    }
  }'::jsonb,
  'editorial-dark',
  'seed',
  1.0
FROM tenants
WHERE handle = 'netororiz.gestaobarber'
ON CONFLICT (tenant_id) DO NOTHING;
