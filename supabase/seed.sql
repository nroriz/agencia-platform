-- =============================================
-- SEED: Tenant 001 — @netororiz.gestaobarber
-- =============================================

-- Gerar UUID fixo pra referencia
DO $$
DECLARE
  t_id UUID := gen_random_uuid();
BEGIN

-- TENANT
INSERT INTO tenants (id, nome, nicho, handle, persona, posicionamento, publico, diferencial, plano, frequencia_semanal)
VALUES (
  t_id,
  'Neto Roriz - Gestao Barber',
  'barbearia',
  '@netororiz.gestaobarber',
  'Neto Roriz, advogado OAB/GO 61.516 + dono de barbearia ha 10+ anos em Inhumas/GO',
  'Dos Dois Lados do Balcao',
  'donos de barbearia brasileiros, 25-45 anos, maioria MEI ou pequena empresa',
  'advogado que tambem e dono de barbearia — fala com propriedade dos dois lados',
  'full',
  5
);

-- VISUAL
INSERT INTO tenant_visual (tenant_id, cor_acento, header_esquerda_a, header_esquerda_b, header_direita, tag_marca)
VALUES (
  t_id,
  '#FF4103',
  'GESTAO & ESTRATEGIA',
  'JURIDICO & TRIBUTARIO',
  '@NETORORIZ.GESTAOBARBER',
  '@netororiz'
);

-- TERRITORIOS
INSERT INTO tenant_territorios (tenant_id, codigo, nome, peso) VALUES
  (t_id, 'A', 'gestao e precificacao', 67),
  (t_id, 'B', 'juridico e tributario', 33);

-- VOZ
INSERT INTO tenant_voz (tenant_id, tom, palavras_proibidas, expressoes_tipicas, anti_exemplos, regras_extras)
VALUES (
  t_id,
  'direto, pratico, como papo entre donos no balcao. Dados concretos sempre. Frases curtas.',
  ARRAY['jornada','transformacao','mindset','proximo nivel','escalar','monetizar','hackear','destravar','mentalidade','empoderar','potencializar'],
  ARRAY['Faz a conta comigo:','Eu vejo isso todo dia na minha barbearia','Nao e opiniao, e numero','O caixa nao mente','Na pratica funciona assim:','Dos dois lados do balcao'],
  '[
    {"errado": "Transforme sua precificacao e alcance resultados extraordinarios.", "certo": "Faz a conta: R$45 menos R$38 da R$7. Teu lucro e menor que o cafe do balcao."},
    {"errado": "Entenda a importancia de uma gestao financeira eficiente.", "certo": "20 cortes por dia. R$3 de prejuizo em cada. No fim do mes, R$1.200 jogados fora."},
    {"errado": "Potencialize seus resultados com estrategias de crescimento.", "certo": "Eu perdi R$4.800 em 3 meses porque nao sabia esse numero."}
  ]'::jsonb,
  ARRAY['dado antes de conselho','primeira frase ja e conteudo, nao introducao','jargao juridico explicado em linguagem simples','informar, nao motivar','frases curtas (max 15 palavras)','perguntas retoricas com numeros concretos','mencionar minha barbearia max 1x por carrossel']
);

-- HORARIOS
INSERT INTO tenant_horarios (tenant_id, dia, hora) VALUES
  (t_id, 'seg', '08:00'),
  (t_id, 'ter', '18:00'),
  (t_id, 'qua', '08:00'),
  (t_id, 'qui', '18:00'),
  (t_id, 'sex', '08:00');

-- INTEGRACOES (placeholder)
INSERT INTO tenant_integracoes (tenant_id, aprovacao_canal, aprovacao_chat_id)
VALUES (t_id, 'telegram', '143677634');

END $$;
