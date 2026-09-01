# Deploy do frontend - Fase 26

## Status

Preparacao local concluida. O frontend ainda nao foi publicado e nenhuma conta externa foi conectada.

## O que foi preparado

- `VITE_API_URL` permanece configuravel por ambiente;
- `frontend/vercel.json` permite acessar diretamente as rotas do React Router;
- `index.html` recebeu titulo, idioma, descricao e cor de tema;
- `frontend/README.md` registra desenvolvimento e build.

## Configuracao sugerida na Vercel

Ao criar o projeto, usar:

```text
Root Directory: frontend
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
```

Variavel de ambiente de producao:

```text
VITE_API_URL=https://URL-DO-BACKEND/api
```

O valor deve ser a URL HTTPS real da API, sem barra no final e com o caminho `/api`.

## Ajuste necessario no backend

Depois que uma URL de frontend for escolhida, ela deve ser adicionada em:

```text
CORS_ALLOWED_ORIGINS=https://URL-DO-FRONTEND
CSRF_TRUSTED_ORIGINS=https://URL-DO-FRONTEND
```

As origens locais nao devem ser removidas enquanto o desenvolvimento local continuar sendo usado.

## Pendencias antes de publicar

- finalizar e testar o backend em ambiente de homologacao;
- definir a URL HTTPS do backend;
- definir a URL HTTPS do frontend;
- atualizar CORS/CSRF com origens exatas;
- configurar `VITE_API_URL` sem expor segredos no frontend;
- testar rotas diretas, login, upload, mapa, avistamentos e logout;
- autorizar explicitamente a publicacao.

## Regra de publicacao

Esta etapa somente prepara a configuracao. Nenhum deploy foi executado e a publicacao continua bloqueada ate o teste completo do responsavel e sua autorizacao explicita.
