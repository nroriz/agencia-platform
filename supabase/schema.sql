-- =============================================
-- SCHEMA: Plataforma de Automacao de Conteudo Instagram
-- Multi-tenant com RLS
-- =============================================

-- TENANTS (clientes da plataforma)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  nicho TEXT NOT NULL,
  handle TEXT NOT NULL UNIQUE,
  persona TEXT NOT NULL,
  posicionamento TEXT,
  publico TEXT NOT NULL,
  diferencial TEXT,
  plano TEXT DEFAULT 'starter',
  ativo BOOLEAN DEFAULT true,
  frequencia_semanal INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- CONFIGURACAO VISUAL POR TENANT
CREATE TABLE tenant_visual (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  cor_fundo TEXT DEFAULT '#0a0a0a',
  cor_acento TEXT DEFAULT '#FF4103',
  cor_texto TEXT DEFAULT '#ffffff',
  fonte_headline TEXT DEFAULT 'Plus Jakarta Sans',
  fonte_headline_peso INTEGER DEFAULT 800,
  fonte_numero TEXT DEFAULT 'Bebas Neue',
  fonte_corpo TEXT DEFAULT 'DM Sans',
  fonte_label TEXT DEFAULT 'Space Grotesk',
  logo_url TEXT,
  avatar_url TEXT,
  estilo_imagem TEXT DEFAULT 'Cinematic photograph, shallow depth of field, professional photography, 4:5 portrait orientation, high detail, realistic textures. No text, no letters, no words, no numbers, no watermarks.',
  header_esquerda_a TEXT,
  header_esquerda_b TEXT,
  header_direita TEXT,
  tag_marca TEXT,
  UNIQUE(tenant_id)
);

-- TERRITORIOS DE CONTEUDO
CREATE TABLE tenant_territorios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  peso INTEGER NOT NULL DEFAULT 50
);

-- VOICE & BRAND VOICE
CREATE TABLE tenant_voz (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  tom TEXT NOT NULL,
  palavras_proibidas TEXT[] DEFAULT '{}',
  expressoes_tipicas TEXT[] DEFAULT '{}',
  anti_exemplos JSONB DEFAULT '[]',
  regras_extras TEXT[] DEFAULT '{}',
  voice_bank_text TEXT,
  UNIQUE(tenant_id)
);

-- HORARIOS DE PUBLICACAO
CREATE TABLE tenant_horarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  dia TEXT NOT NULL,
  hora TEXT NOT NULL
);

-- INTEGRACOES
CREATE TABLE tenant_integracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  meta_graph_token TEXT,
  instagram_page_id TEXT,
  aprovacao_canal TEXT DEFAULT 'web',
  aprovacao_chat_id TEXT,
  UNIQUE(tenant_id)
);

-- BANCO DE IDEIAS
CREATE TABLE ideias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  tema TEXT NOT NULL,
  origem TEXT DEFAULT 'manual',
  prioridade INTEGER DEFAULT 0,
  usado BOOLEAN DEFAULT false,
  usado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- CARROSSEIS
CREATE TABLE carousels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  tema TEXT NOT NULL,
  tema_refinado TEXT,
  territorio TEXT,
  formato TEXT,
  hook_linha1 TEXT,
  hook_linha2 TEXT,
  tipo_capa TEXT,
  slides_json JSONB,
  caption TEXT,
  hashtags TEXT[],
  status TEXT DEFAULT 'draft',
  agendado_para TIMESTAMPTZ,
  publicado_em TIMESTAMPTZ,
  meta_post_id TEXT,
  edit_instrucoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- status: draft | pending_approval | approved | scheduled | published | failed

-- SLIDES INDIVIDUAIS
CREATE TABLE carousel_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carousel_id UUID REFERENCES carousels(id) ON DELETE CASCADE,
  slide_number INTEGER NOT NULL,
  tipo TEXT NOT NULL,
  data_json JSONB,
  imagem_url TEXT,
  png_url TEXT
);

-- METRICAS
CREATE TABLE carousel_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carousel_id UUID REFERENCES carousels(id) ON DELETE CASCADE,
  janela TEXT NOT NULL,
  reach INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  profile_visits INTEGER DEFAULT 0,
  follows INTEGER DEFAULT 0,
  save_rate NUMERIC(5,2),
  share_rate NUMERIC(5,2),
  engagement_rate NUMERIC(5,2),
  collected_at TIMESTAMPTZ DEFAULT now()
);

-- janela: '24h' | '48h' | '7d'

-- DATA INTELLIGENCE (relatorio semanal do Data Chief)
CREATE TABLE data_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  periodo TEXT NOT NULL,
  report_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- FILA DE PUBLICACAO
CREATE TABLE publish_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carousel_id UUID REFERENCES carousels(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'queued',
  published_at TIMESTAMPTZ,
  meta_post_id TEXT,
  error_message TEXT
);

-- status: queued | publishing | published | failed

-- USERS
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE,
  email TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'client',
  tenant_id UUID REFERENCES tenants(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- role: 'admin' (tenant_id = null, ve tudo) | 'client' (tenant_id = X, ve so o dele)

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_visual ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_territorios ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_voz ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_horarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_integracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideias ENABLE ROW LEVEL SECURITY;
ALTER TABLE carousels ENABLE ROW LEVEL SECURITY;
ALTER TABLE carousel_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE carousel_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE publish_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE auth_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM users WHERE auth_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- =============================================
-- RLS POLICIES — TENANTS
-- =============================================
CREATE POLICY "Admin ve tudo" ON tenants
  FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Client ve so seu tenant" ON tenants
  FOR SELECT USING (id = get_user_tenant_id());

-- TENANT_VISUAL
CREATE POLICY "Admin ve tudo" ON tenant_visual
  FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Client ve so seu tenant" ON tenant_visual
  FOR ALL USING (tenant_id = get_user_tenant_id());

-- TENANT_TERRITORIOS
CREATE POLICY "Admin ve tudo" ON tenant_territorios
  FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Client ve so seu tenant" ON tenant_territorios
  FOR ALL USING (tenant_id = get_user_tenant_id());

-- TENANT_VOZ
CREATE POLICY "Admin ve tudo" ON tenant_voz
  FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Client ve so seu tenant" ON tenant_voz
  FOR ALL USING (tenant_id = get_user_tenant_id());

-- TENANT_HORARIOS
CREATE POLICY "Admin ve tudo" ON tenant_horarios
  FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Client ve so seu tenant" ON tenant_horarios
  FOR ALL USING (tenant_id = get_user_tenant_id());

-- TENANT_INTEGRACOES
CREATE POLICY "Admin ve tudo" ON tenant_integracoes
  FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Client ve so seu tenant" ON tenant_integracoes
  FOR ALL USING (tenant_id = get_user_tenant_id());

-- IDEIAS
CREATE POLICY "Admin ve tudo" ON ideias
  FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Client ve so seu tenant" ON ideias
  FOR ALL USING (tenant_id = get_user_tenant_id());

-- CAROUSELS
CREATE POLICY "Admin ve tudo" ON carousels
  FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Client ve so seu tenant" ON carousels
  FOR ALL USING (tenant_id = get_user_tenant_id());

-- CAROUSEL_SLIDES (via carousel join)
CREATE POLICY "Admin ve tudo" ON carousel_slides
  FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Client ve so seu tenant" ON carousel_slides
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM carousels c
      WHERE c.id = carousel_slides.carousel_id
      AND c.tenant_id = get_user_tenant_id()
    )
  );

-- CAROUSEL_METRICS
CREATE POLICY "Admin ve tudo" ON carousel_metrics
  FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Client ve so seu tenant" ON carousel_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM carousels c
      WHERE c.id = carousel_metrics.carousel_id
      AND c.tenant_id = get_user_tenant_id()
    )
  );

-- DATA_INTELLIGENCE
CREATE POLICY "Admin ve tudo" ON data_intelligence
  FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Client ve so seu tenant" ON data_intelligence
  FOR ALL USING (tenant_id = get_user_tenant_id());

-- PUBLISH_QUEUE
CREATE POLICY "Admin ve tudo" ON publish_queue
  FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Client ve so seu tenant" ON publish_queue
  FOR ALL USING (tenant_id = get_user_tenant_id());

-- USERS
CREATE POLICY "Admin ve tudo" ON users
  FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "User ve so ele mesmo" ON users
  FOR SELECT USING (auth_id = auth.uid());
