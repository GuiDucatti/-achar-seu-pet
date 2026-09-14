# Achar seu Pet - Frontend

Interface React/Vite do Achar seu Pet. O frontend consome a API REST do Django
e concentra navegacao, autenticacao, formularios, busca regional e mapa.

Consulte o [README principal](../README.md) para conhecer a arquitetura, as
funcionalidades e o processo completo de configuracao do projeto.

## Requisitos

- Node.js 22;
- npm.

## Desenvolvimento local

```bash
npm install
npm run dev
```

Copie `.env.example` para `.env` e configure `VITE_API_URL` para apontar para a
API Django. O valor local padrao e `http://127.0.0.1:8000/api`.

## Scripts

```bash
npm test
npm run test:auth
npm run test:location
npm run lint
npm run build
```

`npm test` executa os testes de componentes com Vitest. Os outros dois testes
cobrem regras isoladas de autenticacao e localizacao com `node:test`. O build
de producao e gerado em `dist/`.
