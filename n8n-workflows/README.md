# n8n Workflows - Agencia Platform

## Visao Geral

6 workflows automatizados para orquestrar o pipeline completo da agencia:
editorial -> geracao -> notificacao -> publicacao -> metricas -> intelligence.

## Variaveis de Ambiente (n8n)

Configurar em Settings > Environment Variables no n8n (http://147.93.15.130:5678):

| Variavel | Valor | Descricao |
|----------|-------|-----------|
| `SUPABASE_URL` | `https://api.gorillabarber.com.br` | URL do Supabase REST API |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbG...` | Service role key do Supabase |
| `EXPRESS_PIPELINE_URL` | `http://147.93.15.130:3456` | URL do Express pipeline server |
| `TELEGRAM_BOT_TOKEN` | `(seu token)` | Token do bot Telegram |
| `TELEGRAM_ADMIN_CHAT_ID` | `(seu chat_id)` | Chat ID do admin para notificacoes |

## Como Importar

1. Acesse http://147.93.15.130:5678
2. Va em **Workflows** > **Add Workflow** > **Import from File**
3. Selecione o arquivo JSON desejado
4. Ative o workflow clicando no toggle no canto superior direito
5. Repita para cada workflow

**Ordem recomendada de importacao:**
1. `01-editorial-semanal.json`
2. `02-geracao-batch.json`
3. `03-telegram-notify.json`
4. `04-auto-publish.json`
5. `05-coleta-metricas.json`
6. `06-intelligence-semanal.json`

## Workflows

### 01 - Editorial Semanal
- **Schedule:** Domingo 20:00 BRT (23:00 UTC)
- **Funcao:** Gera 5 temas editoriais por IA para cada tenant ativo e salva na tabela `ideias`
- **Fluxo:** Cron -> GET tenants -> Loop -> Gerar temas (API Next.js) -> Salvar ideias (Supabase) -> Telegram admin

### 02 - Geracao Batch de Carrosseis
- **Schedule:** Segunda 06:00 BRT (09:00 UTC)
- **Funcao:** Pega ideias nao usadas e envia para o pipeline Express gerar carrosseis em batch
- **Fluxo:** Cron -> GET tenants -> Loop -> GET ideias pendentes -> POST pipeline/batch -> Marcar ideias usadas -> Telegram admin
- **Depende de:** Workflow 01 (precisa ter ideias geradas)

### 03 - Telegram Notify Aprovacao
- **Schedule:** A cada 15 minutos
- **Funcao:** Notifica via Telegram os carrosseis pendentes de aprovacao
- **Fluxo:** Cron -> GET carrosseis pending_approval nao notificados -> GET integracao tenant -> Enviar notificacao Telegram -> Marcar como notificado
- **Depende de:** Workflow 02 (precisa ter carrosseis gerados)
- **Requer:** Campo `telegram_notified` (boolean, default false) na tabela `carousels`

### 04 - Auto Publish Instagram
- **Schedule:** A cada 5 minutos
- **Funcao:** Publica automaticamente carrosseis aprovados no Instagram via Meta Graph API
- **Fluxo:** Cron -> GET publish_queue (queued + scheduled_for <= now) -> GET credenciais Meta -> Upload slides -> Criar carousel container -> Publicar -> Atualizar status
- **Depende de:** Carrosseis aprovados na publish_queue
- **Requer:** Token Meta Graph valido na tabela `tenant_integracoes`

### 05 - Coleta de Metricas Instagram
- **Schedule:** A cada 6 horas
- **Funcao:** Coleta metricas (reach, impressions, saved, shares) dos posts publicados em janelas de 24h, 48h e 7d
- **Fluxo:** Cron -> GET carrosseis publicados -> Filtrar janelas de coleta -> GET insights Meta Graph API -> Upsert carousel_metrics
- **Depende de:** Workflow 04 (precisa ter posts publicados com meta_post_id)

### 06 - Intelligence Semanal
- **Schedule:** Domingo 18:00 BRT (21:00 UTC)
- **Funcao:** Gera relatorios de intelligence por tenant via Express pipeline
- **Fluxo:** Cron -> GET tenants -> Loop -> POST pipeline/intelligence -> Salvar data_intelligence -> Telegram admin
- **Depende de:** Workflow 05 (metricas coletadas para analise)

## Diagrama de Dependencias

```
DOM 18h: 06-Intelligence -----> analisa metricas acumuladas
DOM 20h: 01-Editorial --------> gera ideias para a semana
SEG 06h: 02-Geracao Batch ----> consome ideias, gera carrosseis
  cada 15m: 03-Telegram ------> notifica carrosseis pendentes
  cada 5m:  04-Auto Publish --> publica aprovados no Instagram
  cada 6h:  05-Metricas ------> coleta metricas dos publicados
```

## Tabelas Supabase Necessarias

- `tenants` - com campo `ativo` (boolean)
- `ideias` - campos: tenant_id, tema, origem, prioridade, usado
- `carousels` - campos: tenant_id, tema, status, slides_json, caption, hashtags, meta_post_id, publicado_em, telegram_notified
- `publish_queue` - campos: carousel_id, status, scheduled_for, published_at, meta_post_id, error_log
- `tenant_integracoes` - campos: tenant_id, aprovacao_canal, telegram_chat_id, meta_graph_token, instagram_page_id
- `carousel_metrics` - campos: carousel_id, tenant_id, meta_post_id, window, reach, impressions, saved, shares, collected_at
- `data_intelligence` - campos: tenant_id, tipo, dados (jsonb), gerado_em

## Troubleshooting

- **Workflow nao dispara:** Verifique se o toggle esta ativo e se as variaveis de ambiente estao configuradas
- **Erro 401 no Supabase:** Verifique SUPABASE_SERVICE_ROLE_KEY
- **Erro no Meta Graph API:** Token pode ter expirado (dura 60 dias). Renovar via Facebook Developer Console
- **Timeout no pipeline batch:** O Express pode demorar para gerar carrosseis. O timeout esta em 5 minutos
- **Metricas nao coletadas:** Verifica se o post tem meta_post_id e se o token Meta ainda e valido
