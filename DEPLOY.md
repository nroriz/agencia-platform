# Deploy — agencia-platform

## Build local e envio pro servidor

```bash
# No PC local (ou CI)
docker build --no-cache \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=http://147.93.15.130:8000 \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key> \
  -t agencia-platform:latest .

# Salvar imagem
docker save agencia-platform:latest | gzip > agencia-platform.tar.gz

# Enviar pro servidor
scp agencia-platform.tar.gz root@147.93.15.130:/tmp/

# No servidor
ssh root@147.93.15.130
docker load < /tmp/agencia-platform.tar.gz
docker stack deploy -c docker-stack.yml agencia
```

## Atualizar

```bash
docker build --no-cache -t agencia-platform:latest .
docker save agencia-platform:latest | gzip > agencia-platform.tar.gz
scp agencia-platform.tar.gz root@147.93.15.130:/tmp/
ssh root@147.93.15.130 "docker load < /tmp/agencia-platform.tar.gz && docker service update --force agencia_agencia-platform"
```

## DNS

Criar registro A: agencia.netororiz.com.br -> 147.93.15.130

## Env vars producao

Definir no docker-stack.yml ou via .env no servidor:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- PIPELINE_API_URL (http://host.docker.internal:3456)
