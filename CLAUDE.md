@AGENTS.md

# CLAUDE.md — Plataforma de Automacao de Conteudo Instagram

## Projeto
Plataforma multi-tenant que automatiza criacao, publicacao e analise de carrosseis Instagram.
Frontend (painel admin + painel cliente) + Backend (pipeline de 8 agentes IA).

## Stack
- Next.js 14+ (App Router) com TypeScript
- Tailwind CSS + shadcn/ui pra UI
- Supabase (PostgreSQL + Auth + RLS + Realtime) — ja roda no servidor
- Express porta 3456 (motor dos agentes — projeto separado, comunicacao via HTTP)
- Puppeteer (renderizacao de slides HTML → PNG)
- Docker Swarm + Traefik (deploy)
- Rede Docker: SD_Net

## Regras obrigatorias
- Server Components por padrao. Client Components ("use client") so quando necessario.
- Supabase Client pra banco — NAO usar Prisma, Drizzle ou outro ORM.
- Supabase Auth pra autenticacao — NAO usar NextAuth ou Auth.js.
- Toda query DEVE respeitar RLS (Row Level Security por tenant_id).
- shadcn/ui pra componentes — NAO instalar Material UI, Chakra, Mantine ou outras libs.
- Recharts pra graficos — NAO instalar Chart.js, D3, Plotly.
- TypeScript strict. Sem any.
- .env.local pra dev. Em prod, env vars injetadas via Docker.
- NUNCA rodar comandos Docker genericos que afetem outros containers do servidor.
- Deploy: docker build --no-cache → docker service update --force.

## Estrutura de roles
- ADMIN: ve todos os tenants. Gerencia agencia inteira. tenant_id = null no user.
- CLIENT: ve so o proprio tenant. Aprova carrosseis, ve metricas, edita preferencias.

## Comunicacao Frontend ↔ Pipeline
- API routes do Next.js (/app/api/) chamam Express (porta 3456) internamente.
- Express endpoints:
  POST /pipeline/start { tenant_id, tema }
  POST /pipeline/batch { tenant_id, temas[] }
  POST /pipeline/approve { tenant_id, carousel_id }
  POST /pipeline/edit { tenant_id, carousel_id, instrucoes }
  GET /health

## Deploy
- Mesmo padrao do gorilla-barber e painel barbearia seu dino.
- Dockerfile multi-stage (deps → build → runner).
- docker-stack.yml com labels Traefik.
- Rede SD_Net.
