# BRIEFING PARA EXECUCAO AUTONOMA — V5.1

## QUEM VOCE E E O QUE VAI FAZER

Voce e o Claude Code implementando a evolucao V5.1 de um SaaS de automacao de carrosseis Instagram. O V4 ja esta completo e deployado. Seu trabalho agora e executar as 10 fases do V5.1 em ordem, comecando pela Fase 1.

O briefing tecnico completo esta em:
`BRIEFING_V5_1_ATUALIZADO.md` (na raiz do projeto)

A memoria do projeto esta em:
`next_steps.md` (na pasta memory do projeto)

Leia os DOIS arquivos antes de comecar qualquer coisa.

---

## PERMISSOES — LEIA COM ATENCAO

Voce tem permissao TOTAL para:

- Criar, editar, deletar qualquer arquivo do projeto `agencia-platform`
- Rodar npm install, npm run build, qualquer comando npm
- Fazer SSH no servidor (`ssh root@147.93.15.130`) e executar comandos
- Editar arquivos no servidor (`/root/agencia-netororiz/`)
- Rodar SQL no Supabase (CREATE TABLE, ALTER TABLE, INSERT, UPDATE, etc.)
- Criar buckets no Supabase Storage
- Fazer docker build, docker save, docker load, docker service update
- Reiniciar PM2 processes (pm2 restart agencia-api, pm2 restart telegram-bot)
- Instalar pacotes npm (archiver, sharp, node-vibrant, colorthief, etc.)
- Criar novos arquivos, pastas, templates HTML, componentes React
- Fazer SCP de arquivos para o servidor
- Modificar api-server.js, telegram-bot.js, squad-pipeline-v3.js, schemas.js
- Rodar testes, curl, verificacoes de health check

NAO PERGUNTE antes de fazer nenhuma dessas acoes. EXECUTE direto.
A unica coisa que voce NAO deve fazer e deletar dados de producao ou derrubar services que nao sejam do projeto agencia.

---

## COMO DEPLOYAR (toda vez que mudar algo no frontend)

```bash
# 1. Build local
cd "C:\Users\User\OneDrive\Documentos\Claude\Projects\Tráfego Pago\agencia-platform"
docker build --no-cache -t agencia-platform .

# 2. Exportar
docker save agencia-platform:latest | gzip > /tmp/agencia-platform.tar.gz

# 3. Enviar pro servidor
scp /tmp/agencia-platform.tar.gz root@147.93.15.130:/tmp/

# 4. No servidor: carregar e atualizar
ssh root@147.93.15.130 "docker load < /tmp/agencia-platform.tar.gz && docker service update --force agencia_agencia-platform"
```

Para mudancas no servidor (api-server.js, pipeline, telegram-bot, etc.):
```bash
ssh root@147.93.15.130 "pm2 restart agencia-api"
ssh root@147.93.15.130 "pm2 restart telegram-bot"
```

---

## COMO RODAR SQL NO SUPABASE

```bash
ssh root@147.93.15.130 "docker exec -i supabase-db psql -U postgres -d postgres -c \"SUA QUERY AQUI\""
```

Ou para scripts maiores:
```bash
ssh root@147.93.15.130 "docker exec -i supabase-db psql -U postgres -d postgres" <<'SQL'
CREATE TABLE ...;
ALTER TABLE ...;
SQL
```

---

## O QUE DEVE ESTAR FUNCIONANDO AO FINAL DE CADA FASE

### FASE 1 — Estabilizar Motor

**1.1 Supabase Storage:**
- [ ] 4 buckets criados: `tenant-assets`, `carousel-renders`, `gemini-images`, `studio-outputs`
- [ ] Buckets com policy: public read, authenticated write
- [ ] Puppeteer renderer salva PNGs no bucket `carousel-renders` (nao mais no filesystem)
- [ ] `carousel_slides.png_url` contem URL publica do Supabase Storage (nao `file:///`)
- [ ] Frontend exibe imagens dos slides corretamente via URL do Storage
- TESTE: Rodar pipeline pra 1 tema → verificar que slides aparecem com URL do Storage → abrir URL no browser → imagem carrega

**1.2 Gemini corrigido:**
- [ ] Debugar por que 0/4 imagens sao geradas (checar API key, rate limit, formato resposta)
- [ ] Implementar fallback 4 niveis (retry simplificado → foto banco → slide sem imagem → gradiente)
- [ ] Pipeline roda sem travar mesmo se Gemini falhar
- TESTE: Rodar pipeline → pelo menos fallback funciona → pipeline completa sem erro

**1.3 Brand Editor reescrito:**
- [ ] Prompt em `/root/agencia-netororiz/server/agents-v3/brand-editor.txt` reescrito com checklist 10 itens
- [ ] Threshold 8/10 pra APROVAR (nao mais 0/10 aprovando tudo)
- [ ] Output Zod validado: `{ status, score, checklist, ajustes }`
- TESTE: Rodar pipeline → Brand Editor da score real (nao 0/10) → reprova se conteudo fraco

**1.4 Telegram integrado com Supabase:**
- [ ] Callback aprovacao faz UPDATE no Supabase (nao salva em JSON)
- [ ] Callback rejeicao faz UPDATE no Supabase
- [ ] Arquivo `decisions.json` removido ou ignorado
- TESTE: Enviar carousel pro Telegram → clicar aprovar → verificar que status mudou no Supabase

**1.5 Tabela cron_logs:**
- [ ] Tabela criada com RLS (admin full access)
- [ ] Campos: id, job_name, tenant_id, started_at, finished_at, status, result_json, error_message
- TESTE: INSERT manual → SELECT funciona → RLS bloqueia client

**1.6 Cron endpoints:**
- [ ] POST /cron/weekly-plan funciona (gera temas + drafts)
- [ ] POST /cron/weekly-pipeline funciona (roda pipeline pra drafts)
- [ ] POST /cron/daily-metrics funciona (placeholder se Instagram nao conectado)
- [ ] POST /cron/weekly-report funciona (Data Chief + log)
- [ ] Cada endpoint cria entry em cron_logs no inicio e atualiza no final
- TESTE: curl cada endpoint → cron_logs tem registros → status success ou failed com detalhes

**TESTE FINAL FASE 1:**
Rodar pipeline completo (POST /pipeline/start) → carousel criado no Supabase com slides que tem URLs do Storage → imagens visiveis no frontend → Brand Editor com score real → cron endpoints respondem

---

### FASE 2 — Download + Aprovacao Melhorada

**2.1 Download ZIP:**
- [ ] Rota API `/api/carousel/[id]/download` gera ZIP
- [ ] ZIP contem: slide_01.png a slide_10.png + caption.txt + hashtags.txt + info.json
- [ ] Usa `archiver` (npm install archiver)
- TESTE: Chamar rota com ID de carousel real → ZIP baixa → abrir → todos os arquivos presentes

**2.2 Botoes de download no frontend:**
- [ ] Botao "Baixar Carrossel Completo" na pagina de detalhe do carousel
- [ ] Botao download individual em cada slide
- [ ] Botao "Copiar Caption" → copia pro clipboard
- [ ] Botao "Copiar Hashtags" → copia pro clipboard
- [ ] Botoes aparecem tanto no admin quanto no client
- TESTE: Abrir detalhe de um carousel → clicar cada botao → ZIP baixa, caption copia, hashtag copia

**2.3 Status downloaded:**
- [ ] Novo status "downloaded" no fluxo (apos approved)
- [ ] Registra quando cliente baixou (nao impede re-download)
- TESTE: Baixar carousel → status muda pra downloaded no banco

**DEPLOY:** Build + deploy do frontend apos essa fase

---

### FASE 3 — Workspace por Empresa

**3.1 Pagina /admin/tenants/[id]:**
- [ ] Pagina com 11 tabs funcionando
- [ ] Tab Geral: form editavel com campos do tenant → botao salvar funciona
- [ ] Tab Territorios: CRUD com sliders de peso → total = 100%
- [ ] Tab Horarios: grade semanal com toggles e inputs de horario
- [ ] Tab Voz: textarea tom, chips palavras proibidas, chips expressoes
- [ ] Tab Visual: color pickers, select fontes, upload logo/avatar → preview ao vivo
- [ ] Tab Integracoes: campos token + botao testar
- [ ] Tab Ideias: tabela com + Adicionar
- [ ] Tab Midia: placeholder (implementa na Fase 5)
- [ ] Tab Estudio: placeholder (implementa na Fase 6)
- [ ] Tab Carrosseis: lista filtrada pelo tenant
- [ ] Tab Metricas: metricas filtradas pelo tenant
- TESTE: Navegar pra /admin/tenants/[id] → cada tab carrega → editar dados → salvar → recarregar → dados persistiram

**3.2 SlidePreview:**
- [ ] Componente renderiza slide de exemplo em CSS puro (sem Puppeteer)
- [ ] Atualiza ao vivo quando muda cores/fontes
- TESTE: Tab Visual → mudar cor → preview atualiza instantaneamente

**3.3 Navegacao:**
- [ ] Lista de tenants tem botao "Ver" que leva pro workspace
- [ ] Sidebar mostra nome do tenant quando dentro do workspace
- TESTE: /admin/tenants → clicar Ver → /admin/tenants/[id] → sidebar mostra tenant

**DEPLOY** apos essa fase

---

### FASES 4-10

Seguir o `BRIEFING_V5_1_ATUALIZADO.md` para detalhes de cada fase.
A mesma logica se aplica: implementar → testar tudo → deployar → confirmar funcionando.

---

## REGRAS TECNICAS IMPORTANTES

1. **shadcn/ui v4**: Usa `render` prop, NAO `asChild`. Se usar asChild vai quebrar.
2. **Next.js 16**: Leia `node_modules/next/dist/docs/` antes de usar APIs novas. `params` e `searchParams` sao Promises agora.
3. **TypeScript strict**: Sem `any`. Tipar tudo.
4. **Server Components** por padrao. Client Components so com `"use client"`.
5. **Supabase RLS**: Toda query deve respeitar RLS. Admin ve tudo, client ve so o proprio tenant.
6. **NAO instalar**: Prisma, Drizzle, NextAuth, Auth.js, Material UI, Chakra, Chart.js, D3.
7. **Docker**: NAO mexer em containers que nao sejam do projeto agencia.
8. **Rede**: SD_Net e a rede Docker Swarm. Traefik e o reverse proxy.
9. **SUPABASE_INTERNAL_URL**: `http://147.93.15.130:54321` (server-to-server dentro do Docker)
10. **NEXT_PUBLIC_SUPABASE_URL**: `https://api.gorillabarber.com.br` (browser)

## METODOLOGIA

Para CADA fase:
1. Implementar todo o codigo
2. Fazer build local (verificar que compila sem erros)
3. Deployar no servidor
4. Testar TODAS as funcionalidades da fase no browser/terminal
5. Se algo falhar: corrigir → rebuild → redeploy → retestar
6. So avancar pra proxima fase quando TUDO da fase atual funcionar

NAO pule etapas. NAO deixe coisas quebradas pra "resolver depois".
Se uma funcionalidade depende de algo do servidor, faca SSH e configure.
Se precisa criar tabela, crie via SQL direto no Supabase.
Se precisa instalar pacote no servidor, instale.

Seja autonomo. Execute tudo. Teste tudo. Documente o que fez ao final.
