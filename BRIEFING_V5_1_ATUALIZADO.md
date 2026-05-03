# BRIEFING V5.1 — SaaS Self-Service (Atualizado)

> Evolução do V5 com 3 mudanças:
> 1. Publicação automática REMOVIDA (só métricas por leitura)
> 2. Gerador de imagem avulsa → Estúdio Visual completo (melhoria de foto, composição, criação)
> 3. Download de carrosséis como entrega principal

---

## ESTADO ATUAL (confirmado pelo Claude Code)

### Funcionando ✅
- SaaS frontend: 12 telas admin + 6 telas client (Next.js + shadcn/ui)
- Auth: Supabase Auth + middleware + RLS (admin/client roles)
- Pipeline V3: 6 agentes end-to-end (Strategy → Hooks → Story → Copy → Brand → Visual → Gemini → Puppeteer → Supabase)
- Puppeteer renderer: 11 templates inline, gera 10/10 PNGs
- Supabase: 13 tabelas com RLS + tenant_001 com dados reais
- Telegram bot: online (@Nati_abot)
- n8n: rodando, sem workflows conectados

### Precisa corrigir 🔧
- Storage: PNGs em filesystem local, não acessíveis via web
- Gemini: 0/4 imagens (API falhando)
- Brand Editor: score 0/10, prompt precisa reescrita
- Telegram: salva decisões em JSON local, não no Supabase

### Não existe ❌
- Página /admin/tenants/[id]
- Cron endpoints no Express
- Supabase Storage buckets
- Tabela cron_logs
- Onboarding self-service
- Media Library
- Estúdio Visual
- Extração de paleta da logo
- Download de carrosséis
- Extração de métricas Instagram (leitura)

---

## PARTE 1 — ESTABILIZAR O MOTOR

### 1.1 Migrar Storage → Supabase Storage

Buckets:
```
tenant-assets       → logos, avatares, fotos do negócio, áudios voice bank
carousel-renders    → PNGs dos carrosséis gerados
gemini-images       → imagens geradas pelo Gemini
studio-outputs      → imagens avulsas do Estúdio Visual
```

Paths:
```
tenant-assets/{tenant_id}/logo.png
tenant-assets/{tenant_id}/avatar.png
tenant-assets/{tenant_id}/media/{categoria}/{filename}
tenant-assets/{tenant_id}/audio/{filename}.webm

carousel-renders/{carousel_id}/slide_01.png ... slide_10.png

studio-outputs/{tenant_id}/{timestamp}_{tipo}.png
```

Alterações:
- Puppeteer: após gerar PNG, upload pro Supabase Storage
- Salvar URL pública em carousel_slides.png_url
- Frontend: trocar file:/// pra URLs do Storage
- Bucket policies: public read, authenticated write

### 1.2 Corrigir Gemini

Debugar 0/4 imagens. Implementar fallback:
```
Nível 1: retry 1x com prompt simplificado
Nível 2: foto do banco de mídia do tenant (quando existir)
Nível 3: converter slide com imagem → slide sem imagem
Nível 4: gradiente escuro
```

### 1.3 Reescrever Brand Editor

```
Checklist 10 itens. Threshold 8/10 pra APROVAR.
1. Tom alinhado com brand voice?
2. Dados concretos presentes?
3. Palavras proibidas ausentes?
4. Limites de palavras/chars respeitados?
5. Max 2 destaques por slide?
6. CTA sem urgência falsa?
7. Arco narrativo coerente?
8. Slide 2 funciona como hook independente?
9. Pelo menos 1 open loop entre slides 3-7?
10. CTA final específico e acionável?

Score < 8 = REPROVAR com ajustes específicos. SER RIGOROSO.
```

### 1.4 Integrar Telegram com Supabase

Callback aprovação → UPDATE carousels SET status = 'approved'
Callback rejeição → UPDATE carousels SET status = 'rejected'
Callback edição → UPDATE carousels SET status = 'editing', edit_instrucoes = '...'
Remover decisions.json local.

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

```
POST /cron/weekly-plan       → gerar temas + criar drafts
POST /cron/weekly-pipeline   → rodar pipeline pra drafts da semana
POST /cron/daily-metrics     → coletar métricas (Instagram Insights, só leitura)
POST /cron/weekly-report     → Data Chief + relatório Telegram
```

NOTA: NÃO existe endpoint de publicação. O sistema gera e o cliente baixa pra postar manualmente.

---

## PARTE 2 — FEATURES SAAS

### 2.1 Workspace por Empresa

Rota: `/admin/tenants/[id]`

Tabs:
```
[Geral] [Territórios] [Horários] [Voz] [Visual] [Integrações] [Ideias] [Mídia] [Estúdio] [Carrosséis] [Métricas]
```

**Tab Geral:** form editável (nome, nicho, handle, persona, posicionamento, publico, diferencial, plano, frequencia). Botão salvar.

**Tab Territórios:** tabela CRUD. Nome, código, peso (slider). Total = 100%. Botão + Adicionar.

**Tab Horários:** grade semanal. Dia: toggle ativo/inativo + input horário. "X posts/semana configurados."

**Tab Voz:** textarea tom, chips palavras_proibidas, chips expressoes_tipicas, editor anti_exemplos, textarea voice_bank. Botão "Gravar áudio" → Whisper → preenche.

**Tab Visual:** color pickers (fundo, acento, texto), selects fontes, upload logo/avatar → Supabase Storage, campo estilo_imagem, campos header. PREVIEW AO VIVO: slide de exemplo renderizado em CSS puro que atualiza conforme muda configs.

**Tab Integrações:** 
- Instagram (só leitura): token + page_id + botão "Testar Conexão" → testa se consegue puxar métricas
- Telegram: canal + chat_id + botão "Testar Envio"
- Google Drive: botão conectar + selecionar pasta (futuro)

**Tab Ideias:** tabela ideias do tenant. Colunas: tema, origem, prioridade, usado. + Adicionar.

**Tab Mídia:** Media Library (ver seção 2.4).

**Tab Estúdio:** Estúdio Visual (ver seção 2.5).

**Tab Carrosséis:** lista carrosséis do tenant.

**Tab Métricas:** métricas do tenant.

### 2.2 Onboarding Self-Service

Rota: `/onboarding` (após criar conta, antes de ter tenant)

Wizard 7 steps com progress bar.

**STEP 1 — Sua Empresa**
```
- Nome do negócio (input)
- Nicho (select: barbearia, salão, clínica, restaurante, personal, advocacia, contabilidade, e-commerce, outro + campo livre)
- @ do Instagram (input, valida formato)
- Cidade/Estado
- "Descreva seu negócio em 2-3 frases" (textarea)

→ INSERT tenants
```

**STEP 2 — Sua Marca Visual**
```
- Upload logo (drag-and-drop, PNG/SVG/JPG)
  → Supabase Storage: tenant-assets/{id}/logo.png
  → Extrai paleta automaticamente:
    Frontend: Vibrant.js
    import Vibrant from 'node-vibrant';
    const palette = await Vibrant.from(imageUrl).getPalette();
    // Retorna: Vibrant, Muted, DarkVibrant, DarkMuted, LightVibrant, LightMuted
  → Mostra: "Cores da sua logo:" + swatches clicáveis
  → Cada cor selecionável como acento ou fundo

- "Usa outras cores além da logo?"
  → Se sim: color picker adicional
  → Caso barbearia com logo P&B mas acento laranja

- Cor de fundo: default #0a0a0a (pode mudar)
- Cor de acento: da paleta ou custom
- Cor de texto: default #ffffff

- Fontes: 4 combos com preview:
  1. Plus Jakarta Sans + DM Sans (moderno)
  2. Montserrat + Inter (clássico)
  3. Bebas Neue + Space Grotesk (impactante)
  4. Custom (selects livres)

- PREVIEW AO VIVO: slide exemplo atualiza com cores e fontes em tempo real (CSS puro, sem Puppeteer)

→ INSERT/UPDATE tenant_visual
```

**STEP 3 — Sua Voz**
```
- "Como você fala com seus clientes?"
  ○ Direto e prático
  ○ Acolhedor e explicativo
  ○ Técnico e preciso
  ○ Casual e descontraído
  ○ Outro (textarea)

- Palavras proibidas:
  → Sugestões por nicho pré-carregadas
  → Chip input (adiciona/remove)

- Expressões típicas:
  → "Escreva 3-5 frases que você usa no dia a dia"
  → Chip input

- Voice Bank (opcional):
  → Gravar áudio no browser (MediaRecorder API)
  → 1-3 áudios de 1 min
  → Upload → Whisper transcreve → salva
  → Alternativa: "Enviar por WhatsApp depois"

- Calibração de tom:
  → IA gera 3 frases de exemplo no tom escolhido
  → Cliente marca "✅ Isso sou eu" / "❌ Não sou eu"
  → Respostas viram anti-exemplos

→ INSERT/UPDATE tenant_voz
```

**STEP 4 — Seu Conteúdo**
```
- Territórios (sugestões por nicho):
  Barbearia: precificação, gestão, atendimento, marketing, tendências
  Odontologia: procedimentos, mitos, cuidados, prevenção
  Restaurante: CMV, ficha técnica, delivery, atendimento
  Personal: treino, nutrição, motivação, resultados
  → Seleciona + slider de peso (total = 100%)

- Frequência: 3x | 5x | 7x por semana
- Horários: sugestão por nicho ou "sistema decide"

→ INSERT tenant_territorios + tenant_horarios
```

**STEP 5 — Suas Fotos**
```
- Upload múltiplo (drag-and-drop, JPG/PNG/WEBP)
  → Supabase Storage: tenant-assets/{id}/media/upload/
  → IA categoriza: ambiente, equipe, produto, serviço, detalhe
  → Preview em grid com badge categoria
  → Corrigir categoria com clique

- OU conectar Google Drive (OAuth → selecionar pasta → importar)

- Mínimo sugerido: 5 fotos
- "Essas fotos serão usadas nos seus carrosséis e no Estúdio"

→ Fotos no Storage + metadata em tenant_media
```

**STEP 6 — Conectar Instagram (só leitura)**
```
- "Conecte seu Instagram pra acompanhar métricas"
- Botão "Conectar" → OAuth Meta (permissões de LEITURA apenas):
  instagram_basic, instagram_manage_insights, pages_show_list
  NÃO pede: instagram_content_publish
- Salva token + page_id em tenant_integracoes
- Mostra: "✅ Conectado — vamos acompanhar suas métricas"

- Se não quiser: "Pular — você pode conectar depois"
  → Sistema funciona normalmente, só não coleta métricas

NOTA: A plataforma NÃO publica automaticamente.
O cliente baixa os PNGs e posta manualmente.
```

**STEP 7 — Preview e Confirmação**
```
- Gera 1 carrossel exemplo com dados do onboarding
  → Ou preview estático com dados fictícios (mais rápido)
- Slides em carrossel interativo (swipe)
- Caption abaixo

- "Gostou? Seu primeiro carrossel real será gerado automaticamente."
- Botão "Confirmar e Começar"
  → Ativa tenant
  → Redireciona pro dashboard client
  → Trigger Editorial Planner gerar primeira pauta
```

### 2.3 Download de Carrosséis

Principal forma de entrega. O cliente aprova e baixa.

Na tela de aprovação e na tela de detalhe do carrossel:

```
Botões de download:
  [⬇ Baixar Carrossel Completo]  → ZIP contendo:
    slide_01.png a slide_10.png (1080x1350, sRGB)
    caption.txt (texto da caption)
    hashtags.txt (lista de hashtags)
    info.json (tema, território, formato, data)

  [⬇ Baixar Slide Individual]    → clica no slide → baixa PNG único

  [📋 Copiar Caption]            → copia caption pro clipboard
  [📋 Copiar Hashtags]           → copia hashtags pro clipboard
```

Implementação:
```javascript
// API route: /api/carousel/[id]/download
// Gera ZIP no servidor com archiver (npm install archiver)
import archiver from 'archiver';

export async function GET(req, { params }) {
  const carousel = await getCarousel(params.id);
  const slides = await getSlides(params.id);
  
  const archive = archiver('zip');
  
  for (const slide of slides) {
    // Baixar PNG do Supabase Storage
    const buffer = await downloadFromStorage(slide.png_url);
    archive.append(buffer, { name: `slide_${slide.slide_number.toString().padStart(2,'0')}.png` });
  }
  
  archive.append(carousel.caption, { name: 'caption.txt' });
  archive.append(carousel.hashtags.join('\n'), { name: 'hashtags.txt' });
  archive.append(JSON.stringify({
    tema: carousel.tema,
    territorio: carousel.territorio,
    formato: carousel.formato,
    data_geracao: carousel.created_at
  }, null, 2), { name: 'info.json' });
  
  archive.finalize();
  return new Response(archive, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${carousel.tema.substring(0,30)}.zip"`
    }
  });
}
```

Status do carrossel ajustado:
```
draft → pending_approval → approved → downloaded
                        → rejected
                        → editing
```

O status "downloaded" é informativo — registra que o cliente baixou. Não impede novo download.

### 2.4 Media Library

Tabela:
```sql
CREATE TABLE tenant_media (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  filename text NOT NULL,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  categoria text DEFAULT 'upload',
  mime_type text,
  size_bytes integer,
  width integer,
  height integer,
  ai_description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tenant_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full" ON tenant_media FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Client own" ON tenant_media FOR ALL USING (tenant_id = get_user_tenant_id());
```

Categorias: ambiente, equipe, produto, servico, detalhe, upload, studio (geradas no estúdio).

Componente MediaLibrary (reutilizado em onboarding step 5, tab Mídia, /client/fotos):
- Grid de fotos com badge de categoria
- Upload drag-and-drop múltiplo
- Categorização automática via IA pós-upload
- Recategorizar manualmente (dropdown)
- Deletar
- Filtro por categoria
- Contador: "12 ambiente, 8 equipe, 5 produto..."

Integração com pipeline:
```javascript
// Visual Director checa banco antes de gerar Gemini
const media = await supabase
  .from('tenant_media')
  .select('*')
  .eq('tenant_id', tenantId)
  .eq('categoria', categoriaRelevante)
  .order('created_at', { ascending: false });

if (media.data.length > 0) {
  // Usar foto real
  slide.imagem_url = media.data[0].public_url;
  slide.imagem_fonte = 'banco_cliente';
} else {
  // Gerar com Gemini
  slide.imagem_fonte = 'gemini';
}
```

### 2.5 Estúdio Visual

Três modos de operação num mesmo espaço:

Rota admin: `/admin/tenants/[id]` tab Estúdio
Rota client: `/client/estudio`

#### MODO 1: Melhorar Foto

O cliente sobe uma foto e o sistema melhora com a identidade visual dele.

```
Interface:
┌────────────────────┐  ┌──────────────────────────┐
│                    │  │  AJUSTES                  │
│    [PREVIEW]       │  │                           │
│    foto com        │  │  ☑ Auto-enhance           │
│    ajustes ao vivo │  │  ☑ Color grading da marca │
│                    │  │  ☐ Remover fundo          │
│                    │  │                           │
│                    │  │  Brilho:    ───●──── +20  │
│                    │  │  Contraste: ──●───── +10  │
│                    │  │  Saturação: ───●──── +15  │
│                    │  │  Nitidez:   ────●─── +5   │
│                    │  │                           │
│                    │  │  Formato: ○1:1 ●4:5 ○9:16 │
│                    │  │  Crop: [Auto] [Manual]    │
│                    │  │                           │
└────────────────────┘  │  [⬇ Baixar]              │
                        │  [💾 Salvar no banco]     │
                        └──────────────────────────┘
```

Funcionalidades:
- **Auto-enhance:** ajuste automático de brilho, contraste, saturação, nitidez via Sharp (Node.js)
- **Color grading da marca:** aplica a paleta do tenant sobre a foto. Implementação via Sharp com preset:
  ```javascript
  // Endpoint: POST /api/studio/enhance
  import sharp from 'sharp';
  
  async function enhancePhoto(inputBuffer, tenantVisual) {
    let image = sharp(inputBuffer);
    
    // Auto-enhance
    image = image
      .normalize()           // ajusta levels
      .sharpen({ sigma: 1 }) // nitidez leve
      .modulate({
        brightness: 1.05,    // +5% brilho
        saturation: 1.1      // +10% saturação
      });
    
    // Color grading da marca: tint sutil na direção da cor de acento
    const accentRGB = hexToRgb(tenantVisual.cor_acento);
    image = image.tint({
      r: Math.round(accentRGB.r * 0.1),
      g: Math.round(accentRGB.g * 0.1),
      b: Math.round(accentRGB.b * 0.1)
    });
    
    return image.toBuffer();
  }
  ```
- **Remover fundo:** via API (remove.bg ou modelo local rembg)
- **Crop inteligente:** recorta no melhor enquadramento pro formato escolhido
- **Sliders manuais:** o cliente ajusta brilho/contraste/saturação/nitidez se quiser
- **Preview ao vivo:** sliders atualizam preview em tempo real (CSS filters no browser pra preview, Sharp no server pra output final)

Preview via CSS (rápido, no browser):
```css
.preview-image {
  filter: brightness({{brilho}}) contrast({{contraste}}) saturate({{saturacao}});
}
```

Output final via Sharp (qualidade, no servidor):
```
POST /api/studio/enhance
Body: { tenant_id, image_url, adjustments: { brightness, contrast, saturation, sharpness, color_grade, remove_bg, crop_format } }
Response: { output_url: "..." } (salvo no Supabase Storage: studio-outputs/)
```

#### MODO 2: Foto + Texto (Composição)

O cliente sobe uma foto e adiciona elementos da marca por cima.

```
Templates de composição:
├── overlay_simples    → foto + título + subtítulo embaixo
├── overlay_centralizado → foto + texto centralizado com fundo semi-transparente
├── moldura_marca      → foto com bordas nas cores do tenant + logo
├── antes_depois       → 2 fotos lado a lado com labels
├── grid_2x2          → 4 fotos organizadas num grid
├── badge             → foto + badge no canto ("NOVO", "PROMO", "VIP")
├── story             → mesma composição adaptada pra 1080x1920
└── custom            → template do banco de templates do tenant (se tiver)
```

```
Interface:
┌────────────────────┐  ┌──────────────────────────┐
│                    │  │  COMPOSIÇÃO               │
│    [PREVIEW]       │  │                           │
│    foto + texto    │  │  Template: [▼ Overlay    ]│
│    + logo          │  │                           │
│    ao vivo         │  │  Texto principal:         │
│                    │  │  [Degradê clássico      ] │
│                    │  │                           │
│                    │  │  Subtítulo:               │
│                    │  │  [Barbearia Bora que Bora]│
│                    │  │                           │
│                    │  │  ☑ Mostrar logo           │
│                    │  │  ☑ Aplicar color grading  │
│                    │  │  Posição: [▼ embaixo     ]│
│                    │  │  Formato: ○1:1 ●4:5 ○9:16│
│                    │  │                           │
└────────────────────┘  │  [⬇ Baixar]              │
                        │  [💾 Salvar no banco]     │
                        └──────────────────────────┘
```

Renderização via Puppeteer: mesma lógica dos carrosséis. Template HTML com variáveis CSS do tenant + variáveis de conteúdo + imagem do cliente.

```
POST /api/studio/compose
Body: { 
  tenant_id, 
  template: "overlay_simples", 
  formato: "4:5",
  image_url: "...", 
  data: { titulo, subtitulo, show_logo, color_grade, posicao }
}
Response: { output_url: "..." }
```

#### MODO 3: Criar do Zero (sem foto)

Gerar imagem com visual da marca a partir de texto.

```
Tipos:
├── aviso          → "FECHADOS [DATA] — [MOTIVO]"
├── frase          → frase impactante + autor (opcional)
├── promocao       → título + descrição + preço + CTA
├── informacao     → dado/novidade + visual
├── preco_servico  → lista de serviços com valores
├── horario        → grade de horários da semana
└── personalizado  → texto livre + visual da marca
```

```
Interface:
  Tipo: [▼ Aviso de fechamento]

  Campos dinâmicos por tipo:
  (aviso)     → Data, Motivo, Mensagem opcional
  (frase)     → Texto, Autor
  (promocao)  → Título, Descrição, Preço original, Preço promo, CTA
  (informacao)→ Título, Corpo
  (preco)     → Nome serviço 1 + preço, Nome 2 + preço, ...
  (horario)   → Grade seg-dom com horários
  (custom)    → Textarea livre

  Formato: ○1:1 ●4:5 ○9:16

  [PREVIEW ao vivo]

  [⬇ Baixar] [💾 Salvar no banco]
```

Templates HTML:
```
/templates/single/
  aviso_1x1.html
  aviso_4x5.html
  aviso_9x16.html
  frase_1x1.html
  frase_4x5.html
  ...etc (tipo × formato)
```

Mesma lógica: variáveis CSS do tenant + conteúdo. Puppeteer renderiza.

```
POST /api/studio/create
Body: { tenant_id, tipo, formato, data: { ... } }
Response: { output_url: "..." }
```

#### Salvamento no banco de mídia

Toda imagem gerada no Estúdio pode ser salva no banco do tenant:

```javascript
// Ao clicar "Salvar no banco"
await supabase.from('tenant_media').insert({
  tenant_id,
  filename: `studio_${Date.now()}.png`,
  storage_path: outputPath,
  public_url: outputUrl,
  categoria: 'studio',
  mime_type: 'image/png',
  // width, height extraídos do output
});
```

Essa imagem fica disponível pro pipeline usar em carrosséis futuros.

### 2.6 Banco de Templates

Templates são HTML renderizáveis pelo Puppeteer. 3 níveis:

```
TEMPLATES
├── Globais (vêm com a plataforma)
│   ├── carousel/           ← 11 tipos de slide
│   │   ├── capa_imagem.html
│   │   ├── texto_gigante.html
│   │   └── ...
│   └── single/             ← tipos de imagem avulsa
│       ├── aviso.html
│       ├── frase.html
│       └── ...
│
├── Por nicho (desbloqueados pelo nicho do tenant)
│   ├── barbearia/
│   │   ├── antes_depois_corte.html
│   │   └── preco_servico.html
│   ├── restaurante/
│   │   ├── prato_do_dia.html
│   │   └── cardapio.html
│   └── ...
│
└── Por tenant (exclusivos)
    └── {tenant_id}/
        └── meu_template.html
```

Tabela:
```sql
CREATE TABLE templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  tipo text NOT NULL,          -- 'carousel_slide' | 'single'
  subtipo text,                -- 'capa_imagem', 'aviso', 'overlay', etc.
  escopo text DEFAULT 'global', -- 'global' | 'nicho' | 'tenant'
  nicho text,                  -- se escopo='nicho': qual nicho
  tenant_id uuid REFERENCES tenants(id), -- se escopo='tenant'
  html_path text,              -- path no storage ou inline
  preview_url text,            -- thumbnail de preview
  variaveis jsonb,             -- lista de variáveis aceitas
  formatos text[] DEFAULT '{4:5}', -- formatos disponíveis
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

No Estúdio, o cliente vê os templates disponíveis (globais + do nicho dele + exclusivos) com preview. Pode favoritar os que mais usa.

Futuro: admin ou cliente pode enviar referência visual (screenshot) → IA analisa → Claude Code converte em HTML/CSS → novo template.

### 2.7 Referências Visuais

O cliente sobe screenshots de posts que gosta (de qualquer perfil). A IA analisa e extrai padrão:

```
Upload referência → Claude Vision ou Gemini Vision analisa:
  - Paleta de cores dominante
  - Estilo tipográfico (bold/leve, serif/sans, uppercase)
  - Proporção imagem vs texto
  - Complexidade visual (minimalista vs elaborado)
  - Mood (escuro/claro, cinematográfico/clean)

Resultado:
  "Baseado nas suas referências, seu estilo é:
   fundo escuro, tipografia bold uppercase,
   imagens cinematográficas com pouca saturação,
   layout minimalista com bastante respiro."

Botão "Aplicar esse estilo" → atualiza tenant_visual.estilo_imagem
```

Tabela:
```sql
CREATE TABLE tenant_referencias (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  analise_json jsonb,
  created_at timestamptz DEFAULT now()
);
```

### 2.8 Extração de Métricas (só leitura)

Conexão Instagram com permissões de LEITURA apenas:
```
Permissões OAuth: instagram_basic, instagram_manage_insights, pages_show_list
NÃO pede: instagram_content_publish
```

O que coleta por carrossel publicado (o cliente informa o post ID ou a plataforma tenta match por data/horário):

```
reach, impressions, saves, shares, comments, likes, profile_visits, follows
```

Implementação via n8n:
```
Workflow "Coleta de Métricas":
  Trigger: cron diário 06h
  → Para cada tenant com Instagram conectado
  → Query carousels publicados nos últimos 7 dias que têm meta_post_id
  → GET /{media_id}/insights via Meta Insights API (token do tenant)
  → INSERT carousel_metrics (janela: 24h, 48h ou 7d conforme idade)
```

O meta_post_id pode ser preenchido:
- Manualmente pelo cliente (cola o link do post no painel)
- Semi-automático: sistema lista posts recentes via API e o cliente faz match

Data Chief analisa normalmente com os dados coletados.

---

## PARTE 3 — AJUSTES NO FRONTEND EXISTENTE

### 3.1 Admin: Navegação por Empresa

Lista tenants (/admin/tenants): cards com logo, handle, status, plano, métricas resumidas. Botão "Ver" → /admin/tenants/[id] (workspace).

Sidebar: quando dentro de /admin/tenants/[id]/*, mostrar nome+handle do tenant como contexto.

### 3.2 Client: Telas Novas

```
/client/estudio    → Estúdio Visual (3 modos)
/client/fotos      → Media Library
/client/marca      → Editar visual + voz (mesmos componentes das tabs do workspace admin)
/client/ideias     → Sugerir temas + ver banco
/client/downloads  → Histórico de downloads com re-download
```

### 3.3 Client: Ajustes nas Telas Existentes

**Dashboard (/client):**
- Adicionar: carrosséis prontos pra download (badge com contador)
- Adicionar: preview dos próximos temas da semana
- Adicionar: métricas resumidas (se Instagram conectado)

**Aprovação (/client/aprovacao):**
- Adicionar: botões de download (ZIP + individual + copiar caption)
- Workflow: aprovar → baixar → postar manualmente
- Status "downloaded" quando baixou

**Carrossel detalhe (/client/carrosseis/[id]):**
- Adicionar: botões download
- Adicionar: copiar caption e hashtags
- Mostrar métricas do post (se Instagram conectado e meta_post_id preenchido)

### 3.4 Landing Page + Signup

```
/ (público)        → landing page explicando o produto
/signup            → email + senha → cria user Supabase Auth role='client'
/onboarding        → wizard 7 steps
/login             → já existe
```

---

## FASES DE IMPLEMENTAÇÃO

```
FASE 1 — Estabilizar motor (3-4 dias)
  ├ 1.1 Supabase Storage (buckets + upload + URLs)
  ├ 1.2 Corrigir Gemini + fallback
  ├ 1.3 Reescrever Brand Editor
  ├ 1.4 Telegram → Supabase
  ├ 1.5 Tabela cron_logs
  └ 1.6 Cron endpoints (sem publicação)

FASE 2 — Download + aprovação melhorada (2 dias)
  ├ 2.1 API /api/carousel/[id]/download (ZIP)
  ├ 2.2 Botões download na aprovação e detalhe
  ├ 2.3 Copiar caption/hashtags
  └ 2.4 Status "downloaded"

FASE 3 — Workspace por empresa (3-4 dias)
  ├ 3.1 /admin/tenants/[id] com todas as tabs
  ├ 3.2 Componente SlidePreview (CSS puro)
  ├ 3.3 Upload logo/avatar → Storage
  ├ 3.4 Navegação admin (entrar no workspace)
  └ 3.5 Telas planejamento, logs

FASE 4 — Onboarding self-service (4-5 dias)
  ├ 4.1 Wizard 7 steps + progress bar
  ├ 4.2 Extração paleta logo (Vibrant.js)
  ├ 4.3 Gravação áudio browser (MediaRecorder) + Whisper
  ├ 4.4 Calibração tom via IA
  ├ 4.5 Sugestões territórios por nicho
  └ 4.6 Landing page + signup

FASE 5 — Media Library (2-3 dias)
  ├ 5.1 Tabela tenant_media + RLS
  ├ 5.2 Componente MediaLibrary
  ├ 5.3 Categorização IA pós-upload
  ├ 5.4 Integração com Visual Director
  └ 5.5 Tab Mídia + /client/fotos

FASE 6 — Estúdio Visual (5-7 dias)
  ├ 6.1 Modo 1: Melhorar foto (Sharp + CSS filters preview)
  ├ 6.2 Modo 2: Foto + texto (templates composição + Puppeteer)
  ├ 6.3 Modo 3: Criar do zero (templates single + Puppeteer)
  ├ 6.4 Salvar no banco de mídia
  ├ 6.5 Endpoints API /api/studio/*
  └ 6.6 Tab Estúdio + /client/estudio

FASE 7 — Templates + Referências (3 dias)
  ├ 7.1 Tabela templates + banco de templates
  ├ 7.2 Templates por nicho (barbearia, restaurante, etc.)
  ├ 7.3 Upload de referência visual + análise IA
  ├ 7.4 Tabela tenant_referencias
  └ 7.5 Interface de seleção de templates no Estúdio

FASE 8 — Métricas Instagram (2-3 dias)
  ├ 8.1 OAuth Meta (só leitura)
  ├ 8.2 Step 6 onboarding (conectar)
  ├ 8.3 Coleta métricas via n8n (cron diário)
  ├ 8.4 Match post ID (manual ou semi-automático)
  └ 8.5 Data Chief + relatório semanal

FASE 9 — Telas client + polish (3-4 dias)
  ├ 9.1 /client/estudio, /client/fotos, /client/marca, /client/ideias
  ├ 9.2 Ajustar dashboard, aprovação, métricas client
  ├ 9.3 /client/downloads (histórico)
  ├ 9.4 Mobile responsive
  └ 9.5 Loading states, error handling, toasts

FASE 10 — Google Drive (2 dias, opcional)
  ├ 10.1 OAuth2 Google
  ├ 10.2 Listar pastas + selecionar
  ├ 10.3 Importar → Storage → categorizar
  └ 10.4 Sync semanal via n8n

TOTAL ESTIMADO: ~30-38 dias
```

---

## FLUXO COMPLETO DO CLIENTE

```
1. Acessa site → vê landing page
2. Cria conta (email + senha)
3. Onboarding 7 steps (~10 min)
4. Vê carrossel de exemplo
5. Confirma → sistema ativa

CICLO SEMANAL:
6. Domingo: recebe pauta → aprova em 2 min
7. Domingo noite: carrosséis gerados
8. Segunda: recebe notificação → revisa → aprova → BAIXA ZIP
9. Posta manualmente no Instagram
10. Sistema coleta métricas (se Instagram conectado)
11. Próximo domingo: Data Chief analisa → pauta melhorada

A QUALQUER MOMENTO:
- Abre Estúdio → melhora foto, cria composição, gera imagem avulsa
- Sobe novas fotos no banco
- Sugere temas
- Baixa carrosséis anteriores

Participação semanal: ~10 minutos
(5 min aprovar + 5 min postar manualmente)
```

---

## NOTA SOBRE PUBLICAÇÃO AUTOMÁTICA

A publicação via Meta Graph API fica como fase futura, fora deste escopo. Quando implementar:
- Adicionar permissão instagram_content_publish no OAuth
- Criar endpoint POST /publish/now e POST /cron/daily-publish
- Criar tabela publish_queue com agendamento
- Workflow n8n de publicação diária
- Reduz participação do cliente de 10 min pra 5 min (só aprovar)
