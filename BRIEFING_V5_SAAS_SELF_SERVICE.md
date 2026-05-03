# BRIEFING V5 — Evolução pra SaaS Self-Service

> Contexto: O Claude Code já construiu a fundação (pipeline V3 + frontend 18 telas + Supabase 13 tabelas + auth/RLS). Este documento define as próximas etapas pra transformar em SaaS completo onde o cliente entra, se cadastra sozinho e opera.

---

## ESTADO ATUAL (confirmado)

### Funcionando ✅
- SaaS frontend: 12 telas admin + 6 telas client (Next.js + shadcn/ui)
- Auth: Supabase Auth + middleware + RLS (admin/client roles)
- Pipeline V3: 6 agentes end-to-end (Strategy → Hooks → Story → Copy → Brand → Visual → Gemini → Puppeteer → Supabase)
- Puppeteer renderer: 11 templates HTML inline no index.js, gera 10/10 PNGs
- Supabase: 13 tabelas com RLS + tenant_001 (@netororiz) com dados reais
- Telegram bot: online (@Nati_abot), recebe callbacks de botões
- n8n: rodando, sem workflows conectados ao SaaS

### Precisa corrigir 🔧
- Storage: PNGs em filesystem local (`file:///root/...`), não acessíveis via web
- Gemini: 0/4 imagens geradas (API falhando)
- Brand Editor: score 0/10, prompt precisa reescrita
- Telegram: salva decisões em JSON local, não no Supabase
- Admin: não tem navegação por empresa (vê tudo junto)

### Não existe ❌
- Página `/admin/tenants/[id]` (config por tenant)
- Cron endpoints no Express
- Publicação via Meta Graph API
- Workflows n8n conectados
- Supabase Storage buckets
- Tabela cron_logs
- Onboarding self-service
- Media library
- Gerador de imagem avulsa
- Extração de paleta da logo

---

## PARTE 1 — ESTABILIZAR O MOTOR

Resolver os problemas que impedem o sistema de funcionar em produção. Sem isso, nada do SaaS funciona.

### 1.1 Migrar Storage → Supabase Storage

Criar buckets no Supabase Storage:

```
Buckets:
  tenant-assets     → logos, avatares, fotos do negócio (por tenant)
  carousel-renders  → PNGs gerados pelo Puppeteer (por carousel_id)
  gemini-images     → imagens geradas pelo Gemini (reusáveis)
```

Estrutura de paths:

```
tenant-assets/{tenant_id}/logo.png
tenant-assets/{tenant_id}/avatar.png
tenant-assets/{tenant_id}/media/{categoria}/{filename}

carousel-renders/{carousel_id}/slide_01.png
carousel-renders/{carousel_id}/slide_02.png
...

gemini-images/{carousel_id}/gemini_slide_01.png
```

Alterações necessárias:
- Puppeteer renderer: após gerar PNG, fazer upload pro Supabase Storage via `supabase.storage.from('carousel-renders').upload()`
- Salvar URL pública no `carousel_slides.png_url` (Supabase Storage gera URL pública)
- Frontend: trocar referências de `file:///` pra URLs do Supabase Storage
- Configurar bucket policies: `carousel-renders` público (read), `tenant-assets` público (read), write apenas autenticado

### 1.2 Corrigir Gemini

Debugar por que 0/4 imagens estão sendo geradas. Possíveis causas:
- API key inválida ou expirada
- Rate limit do free tier excedido
- Prompt muito longo (Gemini tem limite)
- Formato de resposta mudou

Implementar fallback robusto:
```
Nível 1: retry 1x com prompt simplificado (remover detalhes, manter só anchor + cena)
Nível 2: usar foto do banco de mídia do tenant (quando existir)
Nível 3: converter slide com imagem → slide sem imagem (dado_imagem → dado_texto)
Nível 4: gradiente escuro como último recurso
```

### 1.3 Reescrever Brand Editor

O prompt atual aprova tudo (score 0/10). Substituir pelo prompt do briefing V4:

```
Editor de marca do perfil {{HANDLE}}.
Checklist 10 itens. Threshold: 8/10 pra APROVAR.

1. Tom alinhado com brand voice?
2. Dados concretos presentes?
3. Palavras proibidas ausentes?
4. Limites de palavras/chars respeitados?
5. Max 2 *destaques* por slide?
6. CTA sem urgência falsa?
7. Arco narrativo coerente?
8. Slide 2 funciona como hook independente?
9. Pelo menos 1 open loop entre slides 3-7?
10. CTA final específico e acionável?

Score < 8 = REPROVAR com lista de ajustes específicos.
NÃO aprovar por default. SER RIGOROSO.

Output: { status: "APROVADO" | "AJUSTES", score: "X/10", checklist: [...], ajustes: [...] }
```

### 1.4 Integrar Telegram com Supabase

Migrar de `decisions.json` pra Supabase:

- Callback de aprovação: `UPDATE carousels SET status = 'approved' WHERE id = X`
- Callback de rejeição: `UPDATE carousels SET status = 'rejected' WHERE id = X`
- Callback de edição: `UPDATE carousels SET status = 'editing', edit_instrucoes = '...' WHERE id = X`
- Remover dependência do arquivo JSON local

### 1.5 Criar tabela cron_logs

```sql
CREATE TABLE IF NOT EXISTS cron_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_name text NOT NULL,
  tenant_id uuid REFERENCES tenants(id),
  started_at timestamptz DEFAULT now(),
  finished_at timestamptz,
  status text DEFAULT 'running',
  result_json jsonb,
  error_message text
);

ALTER TABLE cron_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access cron_logs" ON cron_logs
  FOR ALL USING (get_user_role() = 'admin');
```

### 1.6 Criar Cron Endpoints no Express

Adicionar ao api-server.js:

```
POST /cron/weekly-plan       → gerar temas + criar drafts (por tenant ou todos)
POST /cron/weekly-pipeline   → rodar pipeline pra drafts da semana
POST /cron/daily-publish     → publicar agendados (publish_queue WHERE scheduled_for <= now())
POST /cron/daily-metrics     → coletar métricas dos últimos 7 dias
POST /cron/weekly-report     → Data Chief + relatório Telegram
```

Cada endpoint:
1. Recebe `{ tenant_id? }` — se vazio, roda pra todos os tenants ativos
2. Cria entry em `cron_logs` no início (status: 'running')
3. Executa a lógica
4. Atualiza `cron_logs` no final (status: 'success' ou 'failed', com result_json ou error_message)

---

## PARTE 2 — FEATURES SAAS

### 2.1 Workspace por Empresa (Admin)

Criar página `/admin/tenants/[id]` como hub central do tenant.

Rota: `/admin/tenants/[id]`

Layout: Header com logo+nome+handle do tenant + tabs de navegação.

Tabs:
```
[Geral] [Territórios] [Horários] [Voz] [Visual] [Integrações] [Ideias] [Mídia] [Carrosséis] [Métricas]
```

**Tab Geral:** form editável com campos do tenant (nome, nicho, handle, persona, posicionamento, publico, diferencial, plano, frequencia). Botão salvar → UPDATE tenants.

**Tab Territórios:** tabela CRUD. Colunas: nome, código, peso. Slider pra peso. Total deve somar 100%. Botão + Adicionar.

**Tab Horários:** grade semanal. Cada dia: toggle ativo/inativo + input horário. Mostra "X posts/semana configurados".

**Tab Voz:** textarea pra tom, chips editáveis pra palavras_proibidas e expressoes_tipicas, JSON editor pra anti_exemplos, textarea pra voice_bank_text. Botão "Gravar áudio" → Whisper transcreve → preenche voice_bank.

**Tab Visual:** color pickers (cor_fundo, cor_acento, cor_texto), selects de fontes, upload logo/avatar (→ Supabase Storage), campo estilo_imagem, campos header_esquerda_a/b e header_direita. PREVIEW AO VIVO: componente que renderiza 1 slide de exemplo com as configurações atuais (renderizado no browser, não precisa Puppeteer — pura HTML/CSS com as variáveis).

**Tab Integrações:** campos Meta Graph token e Instagram Page ID com botão "Testar Conexão". Campos Telegram canal e chat_id com botão "Testar Envio". Status de cada integração (✅ Conectado / ⚠️ Não configurado / ❌ Erro).

**Tab Ideias:** tabela de ideias do tenant. Colunas: tema, origem (manual/ia/performance), prioridade, usado. Botão + Adicionar ideia. Filtros por origem e status.

**Tab Mídia:** Media Library do tenant (ver seção 2.3).

**Tab Carrosséis:** lista de carrosséis do tenant (filtro do que já existe em /admin/carrosseis, mas pré-filtrado pelo tenant).

**Tab Métricas:** métricas do tenant (filtro do que já existe em /admin/metricas, mas pré-filtrado).

Navegação do admin: Na lista de tenants (`/admin/tenants`), o botão "Ver" leva pra `/admin/tenants/[id]`. O admin "entra" na empresa e opera de dentro. Sidebar pode mostrar o nome do tenant ativo quando estiver dentro de um workspace.

### 2.2 Onboarding Self-Service

O cliente acessa o site, cria conta, e faz onboarding guiado em 7 steps. Ao final, o tenant está completo no Supabase e o primeiro carrossel pode ser gerado.

Rota: `/onboarding` (acessível após criar conta, antes de ter tenant associado)

**Componente: wizard com steps, progress bar, botões Voltar/Próximo/Concluir.**

```
STEP 1 — Sua Empresa
  - Nome do negócio (input text)
  - Nicho (select com opções: barbearia, salão, clínica odontológica, 
    restaurante, personal trainer, advocacia, contabilidade, 
    e-commerce, outro + campo livre)
  - @ do Instagram (input text, validação formato)
  - Cidade/Estado (input text ou select)
  - Sobre o negócio (textarea: "Descreva seu negócio em 2-3 frases")
  
  → Ao avançar: INSERT tenants com dados básicos

STEP 2 — Sua Marca Visual
  - Upload de logo (drag-and-drop ou click, aceita PNG/SVG/JPG)
    → Upload pro Supabase Storage: tenant-assets/{tenant_id}/logo.png
    → Extrair paleta de cores automaticamente:
      
      Usar biblioteca 'colorthief' (npm install colorthief):
      const ColorThief = require('colorthief');
      const palette = await ColorThief.getPalette(logoPath, 5);
      // Retorna array de [R, G, B] das 5 cores dominantes
      
      OU no frontend com Vibrant.js:
      import Vibrant from 'node-vibrant';
      const palette = await Vibrant.from(imageUrl).getPalette();
      // Retorna: Vibrant, Muted, DarkVibrant, DarkMuted, LightVibrant, LightMuted
    
    → Mostrar: "Detectamos essas cores na sua logo:" + swatches visuais
    → Cada cor é clicável pra selecionar como primária ou acento
  
  - Pergunta: "Você usa outras cores além das que estão na logo?"
    → Se sim: color picker adicional
    → Importante: explicar o caso (ex: "Minha logo é preto e branco 
      mas minha cor principal é laranja")
  
  - Cor de fundo: default #0a0a0a (escuro), com opção de mudar
  - Cor de acento: selecionada da paleta ou custom
  - Cor de texto: default #ffffff
  
  - Fontes: 3-4 combos pré-selecionados com preview visual:
    Combo 1: Plus Jakarta Sans + DM Sans (moderno, limpo)
    Combo 2: Montserrat + Inter (clássico, versátil)
    Combo 3: Bebas Neue + Space Grotesk (impactante, bold)
    Combo 4: Custom (selects livres)
  
  - PREVIEW AO VIVO: slide de exemplo que atualiza conforme o cliente 
    muda cores e fontes. Renderizado no browser com CSS puro, 
    não precisa chamar Puppeteer.
  
  → Ao avançar: INSERT/UPDATE tenant_visual

STEP 3 — Sua Voz
  - "Como você fala com seus clientes?" 
    → Radio buttons com exemplos:
      ○ Direto e prático ("Faz a conta: R$45 menos R$38...")
      ○ Acolhedor e explicativo ("Vou te explicar como funciona...")
      ○ Técnico e preciso ("A taxa de retenção média do setor é...")
      ○ Casual e descontraído ("Bora lá, vou te mostrar um trick...")
      ○ Outro (textarea livre)
  
  - Palavras proibidas: 
    → Sugestões por nicho pré-carregadas (ex: barbearia → "jornada, mindset, escalar")
    → Cliente remove as que não concordam e adiciona as dele
    → Chip input (adiciona/remove com X)
  
  - Expressões típicas:
    → Campo livre, chip input
    → Sugestão: "Escreva 3-5 frases que você usa no dia a dia com clientes"
  
  - Voice Bank (opcional neste step):
    → Botão "Gravar áudio" (usa MediaRecorder API do browser)
    → Grava 1-3 áudios de 1 min
    → Upload pro Supabase Storage: tenant-assets/{tenant_id}/audio/
    → Whisper transcreve → salva em tenant_voz.voice_bank_text
    → Alternativa: "Enviar por WhatsApp depois" (link/QR)
  
  - Calibração de tom (gerado pela IA):
    → Sistema gera 3 frases de exemplo no tom selecionado
    → Cliente marca: "✅ Isso sou eu" ou "❌ Não faria assim"
    → Respostas viram anti-exemplos no tenant_voz
  
  → Ao avançar: INSERT/UPDATE tenant_voz

STEP 4 — Seu Conteúdo
  - Territórios: "Sobre o que você quer falar?"
    → Sugestões por nicho:
      Barbearia: precificação, gestão financeira, atendimento, marketing, tendências
      Odontologia: procedimentos, mitos e verdades, cuidados, prevenção
      Restaurante: CMV, ficha técnica, delivery, atendimento
      Personal: treino, nutrição, motivação, resultados
    → Cliente seleciona os que quer + pode adicionar custom
    → Slider de peso pra cada território (total = 100%)
  
  - Frequência: quantos posts por semana?
    → 3x/semana (Starter)
    → 5x/semana (Pro)  
    → 7x/semana (Full)
    → Visual mostra quais dias e horários sugeridos
  
  - Horários:
    → Default sugerido pelo sistema por nicho
    → Cliente pode ajustar (grade semanal com toggles)
    → Ou: "Deixar o sistema decidir" (Data Chief otimiza depois)
  
  → Ao avançar: INSERT tenant_territorios + tenant_horarios

STEP 5 — Suas Fotos
  - Upload de fotos do negócio:
    → Drag-and-drop múltiplo (aceita JPG/PNG/WEBP)
    → Upload pro Supabase Storage: tenant-assets/{tenant_id}/media/upload/
    → IA categoriza automaticamente após upload:
      Usar Claude Vision ou Gemini Vision:
      "Categorize esta foto em: ambiente, equipe, produto, serviço, detalhe"
      → Move pro path correto: tenant-assets/{tenant_id}/media/{categoria}/
    → Preview em grid com badge de categoria
    → Cliente pode corrigir categoria manualmente
  
  - OU conectar Google Drive:
    → Botão "Conectar Google Drive"
    → OAuth2 flow → selecionar pasta
    → Sistema importa fotos, categoriza, salva no Supabase Storage
    → Opção de sync automático periódico (workflow n8n)
  
  - Mínimo sugerido: 5 fotos. Máximo: 50 no plano Starter, ilimitado no Pro/Full.
  
  - Explicação: "Essas fotos serão usadas nos seus carrosséis. 
    Quando o sistema criar um post sobre [território], ele vai 
    preferir usar suas fotos reais em vez de imagens geradas por IA."
  
  → Ao avançar: fotos salvas no Storage + metadata no banco

STEP 6 — Conectar Instagram
  - Botão "Conectar com Instagram"
    → OAuth Meta Graph API (Facebook Login for Business)
    → Permissões: pages_show_list, instagram_basic, instagram_content_publish
    → Salva access_token + instagram_page_id em tenant_integracoes
    → Mostra: "✅ Conectado como @handle — X seguidores"
  
  - Se não quiser conectar agora:
    → "Pular — você pode conectar depois nas configurações"
    → Sistema funciona normalmente, só não publica automaticamente
    → Cliente baixa os PNGs e posta manualmente

STEP 7 — Preview e Confirmação
  - Sistema gera 1 carrossel de exemplo usando todos os dados do onboarding:
    → Chama POST /pipeline/start { tenant_id, tema: [tema sugerido pelo nicho] }
    → Ou renderiza preview estático com dados fictícios (mais rápido)
  
  - Mostra os 10 slides em carrossel interativo (swipe)
  - Mostra a caption gerada
  
  - "Gostou? Seu primeiro carrossel real será gerado automaticamente."
  
  - Botão "Confirmar e Começar"
    → Marca tenant como ativo
    → Redireciona pro dashboard client
    → Trigger pro Editorial Planner gerar a primeira pauta
```

Tabela nova pra media library:

```sql
CREATE TABLE tenant_media (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  filename text NOT NULL,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  categoria text DEFAULT 'upload',
  -- categorias: 'ambiente', 'equipe', 'produto', 'servico', 'detalhe', 'upload'
  mime_type text,
  size_bytes integer,
  width integer,
  height integer,
  ai_description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tenant_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access" ON tenant_media FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Client own tenant" ON tenant_media FOR ALL USING (tenant_id = get_user_tenant_id());
```

### 2.3 Media Library

Componente reutilizado em:
- Tab "Mídia" no workspace do admin (`/admin/tenants/[id]`)
- Página "Suas Fotos" no painel client (`/client/fotos`)
- Step 5 do onboarding

Funcionalidades:
- Grid de fotos com badge de categoria
- Upload drag-and-drop (múltiplo)
- Categorização automática via IA pós-upload
- Recategorizar manualmente (dropdown no card da foto)
- Deletar foto
- Filtro por categoria
- Contador por categoria ("12 ambiente, 8 equipe, 5 produto...")

Integração com pipeline:
O Visual Director, antes de gerar prompt Gemini, checa se existe foto real na categoria relevante:
```javascript
// No Visual Director, antes de gerar prompt:
const tenantMedia = await supabase
  .from('tenant_media')
  .select('*')
  .eq('tenant_id', tenantId)
  .eq('categoria', categoriaDoSlide);

if (tenantMedia.length > 0) {
  // Usar foto real em vez de gerar com Gemini
  slide.imagem_url = tenantMedia[random].public_url;
  slide.imagem_fonte = 'banco_cliente';
} else {
  // Gerar com Gemini normalmente
  slide.imagem_fonte = 'gemini';
}
```

### 2.4 Gerador de Imagem Avulsa

Além de carrosséis (10 slides), o cliente às vezes quer 1 imagem só:
- Aviso de feriado/fechamento
- Frase/citação
- Promoção
- Informação (horário novo, endereço, etc.)
- Foto com texto overlay

Rota admin: `/admin/tenants/[id]/imagem-avulsa`
Rota client: `/client/imagem-avulsa`

Interface:
```
1. Tipo (select): aviso, frase, promocao, informacao, foto_overlay
2. Formato (select): 1080x1080 (quadrado), 1080x1350 (retrato)
3. Campos dinâmicos por tipo:
   - aviso: titulo, data, motivo
   - frase: texto, autor (opcional)
   - promocao: titulo, descricao, preco, cta
   - informacao: titulo, corpo
   - foto_overlay: upload foto, texto overlay, posição do texto
4. Preview ao vivo (CSS puro, atualiza em tempo real)
5. Botões: "Gerar com IA" (Puppeteer render) / "Download PNG" / "Agendar publicação"
```

Templates HTML adicionais (1080x1080 e 1080x1350):
```
/templates/single/
  aviso.html
  frase.html
  promocao.html
  informacao.html
  foto_overlay.html
```

Mesma lógica do Puppeteer: variáveis CSS do tenant + variáveis de conteúdo. Mesmo renderer, endpoint diferente:

```
POST /render/single
Body: { tenant_id, tipo, formato, data: { titulo, corpo, ... }, imagem_url? }
Response: { png_url: "..." }
```

### 2.5 Preview ao Vivo (componente reutilizável)

Componente React que renderiza um slide de exemplo usando APENAS CSS no browser. Não chama Puppeteer — é preview instantâneo.

```tsx
// components/slide-preview.tsx
"use client"

interface SlidePreviewProps {
  corFundo: string;
  corAcento: string;
  corTexto: string;
  fonteHeadline: string;
  fontCorpo: string;
  titulo?: string;
  corpo?: string;
  imagemUrl?: string;
  tipo: 'capa' | 'dado' | 'texto_gigante' | 'lista';
}

export function SlidePreview({ corFundo, corAcento, ... }: SlidePreviewProps) {
  return (
    <div 
      className="w-[270px] h-[337px] rounded-lg overflow-hidden relative"
      style={{ 
        backgroundColor: corFundo,
        '--accent': corAcento,
        '--text': corTexto,
        fontFamily: fonteHeadline
      } as React.CSSProperties}
    >
      {/* Renderiza layout do tipo selecionado em miniatura */}
    </div>
  )
}
```

Usado em:
- Step 2 do onboarding (preview de marca)
- Tab Visual do workspace admin
- Gerador de imagem avulsa

### 2.6 Google Drive Integration

OAuth2 flow com Google APIs:

```
1. Botão "Conectar Google Drive" no onboarding ou configurações
2. OAuth2 redirect → Google consent → callback com code
3. Trocar code por access_token + refresh_token
4. Salvar tokens em tenant_integracoes (novos campos: gdrive_token, gdrive_refresh, gdrive_folder_id)
5. Listar pastas → cliente seleciona qual pasta sincronizar
6. Importar fotos da pasta → Supabase Storage → tenant_media → categorizar via IA
7. Workflow n8n opcional: sync semanal (puxa fotos novas da pasta)
```

Campos adicionais em tenant_integracoes:
```sql
ALTER TABLE tenant_integracoes ADD COLUMN gdrive_access_token TEXT;
ALTER TABLE tenant_integracoes ADD COLUMN gdrive_refresh_token TEXT;
ALTER TABLE tenant_integracoes ADD COLUMN gdrive_folder_id TEXT;
```

---

## PARTE 3 — AJUSTES NO FRONTEND EXISTENTE

### 3.1 Admin: Navegação por Empresa

A lista de tenants (`/admin/tenants`) já existe. Ajustar:
- Botão "Ver" leva pra `/admin/tenants/[id]` (workspace)
- Cards com logo do tenant (quando tiver Supabase Storage)
- Badge de status (ativo/inativo) e plano
- Métricas resumidas no card (carrosséis do mês, save rate médio)

Sidebar: quando admin está dentro de `/admin/tenants/[id]/*`, mostrar nome do tenant no header da sidebar como contexto.

### 3.2 Client: Telas Novas

**`/client/marca`** — Minha Marca
- Mesmo componente das tabs Visual + Voz do workspace admin
- Mas editável pelo próprio cliente
- Preview ao vivo do slide

**`/client/ideias`** — Sugerir Temas
- Lista de ideias do tenant (filtro: só as dele via RLS)
- Botão "+ Sugerir tema" (INSERT ideias com origem='manual_client')
- Indicação de quais já foram usados

**`/client/fotos`** — Minhas Fotos
- Media Library filtrada pelo tenant dele
- Upload + categorização
- Mesmo componente da tab Mídia do admin

**`/client/imagem-avulsa`** — Criar Imagem
- Gerador de imagem avulsa
- Preview + download + agendar

### 3.3 Landing Page / Signup

Rota: `/` (público, sem auth)

- Landing page simples explicando o produto
- Botão "Criar conta grátis" → `/signup`
- Signup: email + senha → cria user no Supabase Auth com role='client'
- Após signup: redireciona pro `/onboarding`
- Após onboarding completo: redireciona pro `/client`

---

## FASES DE IMPLEMENTAÇÃO

```
FASE 1 — Estabilizar motor (3-4 dias)
  ├ 1.1 Migrar storage → Supabase Storage (buckets + upload + URLs)
  ├ 1.2 Debugar e corrigir Gemini (+ fallback robusto)
  ├ 1.3 Reescrever prompt Brand Editor
  ├ 1.4 Integrar Telegram com Supabase (remover JSON local)
  ├ 1.5 Criar tabela cron_logs
  └ 1.6 Criar cron endpoints no Express

FASE 2 — Workspace por empresa (3-4 dias)
  ├ 2.1 Página /admin/tenants/[id] com todas as tabs
  ├ 2.2 Componente SlidePreview (preview ao vivo CSS puro)
  ├ 2.3 Upload de logo/avatar pro Supabase Storage
  ├ 2.4 Ajustar navegação admin (entrar no workspace)
  └ 2.5 Telas /admin/planejamento, /admin/publicacao, /admin/logs

FASE 3 — Onboarding self-service (4-5 dias)
  ├ 3.1 Wizard 7 steps com progress bar
  ├ 3.2 Extração de paleta da logo (Vibrant.js ou ColorThief)
  ├ 3.3 Gravação de áudio no browser (MediaRecorder API) + Whisper
  ├ 3.4 Calibração de tom via IA (gera frases, cliente avalia)
  ├ 3.5 Sugestões de territórios por nicho
  └ 3.6 Landing page + signup + redirect pro onboarding

FASE 4 — Media Library (2-3 dias)
  ├ 4.1 Tabela tenant_media + RLS
  ├ 4.2 Componente MediaLibrary (grid + upload + categorização)
  ├ 4.3 Categorização automática via IA pós-upload
  ├ 4.4 Integração com Visual Director (preferir foto real)
  └ 4.5 Tab Mídia no workspace + /client/fotos

FASE 5 — Gerador de imagem avulsa (2-3 dias)
  ├ 5.1 Templates HTML single (5 tipos × 2 formatos)
  ├ 5.2 Endpoint POST /render/single
  ├ 5.3 Interface com campos dinâmicos + preview ao vivo
  ├ 5.4 Download PNG + opção agendar publicação
  └ 5.5 Telas admin + client

FASE 6 — Publicação + Métricas (3-4 dias)
  ├ 6.1 Meta Graph API (OAuth + publicação de carousel album)
  ├ 6.2 Step 6 do onboarding (conectar Instagram)
  ├ 6.3 Workflows n8n (5 crons conectados ao Express)
  ├ 6.4 Coleta de métricas automática
  └ 6.5 Tela /admin/publicacao + /admin/logs

FASE 7 — Google Drive (2 dias)
  ├ 7.1 OAuth2 Google APIs
  ├ 7.2 Listar pastas + selecionar
  ├ 7.3 Importar fotos → Storage → categorizar
  └ 7.4 Workflow n8n sync semanal (opcional)

FASE 8 — Telas client novas (2-3 dias)
  ├ 8.1 /client/marca
  ├ 8.2 /client/ideias
  ├ 8.3 /client/fotos
  ├ 8.4 /client/imagem-avulsa
  └ 8.5 Ajustar dashboard + aprovação + métricas client

TOTAL ESTIMADO: ~22-28 dias adicionais
```

---

## FLUXO COMPLETO DO CLIENTE (quando tudo estiver pronto)

```
1. Cliente acessa o site → vê landing page
2. Cria conta → email + senha
3. Faz onboarding (7 steps, ~10 minutos)
4. Recebe primeiro carrossel de exemplo
5. Confirma → sistema ativa ciclo semanal
6. Todo domingo: recebe pauta → aprova em 2 minutos
7. Todo domingo noite: carrosséis são gerados
8. Seg-sex: publicados automaticamente
9. Métricas coletadas → sistema aprende → próxima semana melhor
10. A qualquer momento: cria imagem avulsa, sobe fotos, sugere temas

Participação semanal do cliente: ~5 minutos
```
