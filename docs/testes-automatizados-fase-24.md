# Testes automatizados - Fase 24

## Objetivo

Registrar as regras criticas cobertas pelas suites automatizadas antes de qualquer publicacao.

## Backend

Os testes usam `django.test.TestCase` e `rest_framework.test.APIClient` e cobrem:

- criacao de pet com upload valido;
- limite e formato de imagem;
- autenticacao por usuario e por email com JWT;
- cadastro de usuario com senha armazenada com hash;
- acesso protegido da rota `me`;
- permissao do autor para editar o proprio pet;
- bloqueio de edicao por outro usuario;
- bloqueio de criacao sem autenticacao;
- filtros por especie, sexo, texto e data;
- criacao e validacao de avistamentos;
- classificacao de proximidade;
- calculo de distancia com Haversine.
- privacidade dos dados de localizacao e avistamentos;
- integridade do par latitude/longitude e limites geograficos;
- remocao de metadados EXIF sensiveis no upload.

## Como executar

Na raiz do projeto:

```bash
cd backend
.venv/bin/python manage.py check
.venv/bin/python manage.py makemigrations --check
.venv/bin/python manage.py test
```

O comando cria um banco temporario, executa os testes e o remove ao final. Nenhuma informacao e publicada ou enviada para servicos externos durante a suite.

## Frontend

Os testes de componentes usam Vitest e Testing Library. Regras sem dependencia de DOM usam o executor nativo `node:test`.

Cobertura atual:

- estados e redirecionamento de rotas protegidas;
- debounce, cancelamento, erro e teclado no autocomplete de endereco;
- renovacao JWT, concorrencia, isolamento entre sessoes e sincronizacao entre abas;
- validacao da localizacao publica antes de renderizar o mapa.

```bash
cd frontend
npm test
npm run test:auth
npm run test:location
npm run lint
npm run build
```

## Integracao continua

O workflow `.github/workflows/ci.yml` executa as verificacoes de backend e frontend em pushes e pull requests para `main`.

## Proxima evolucao

Depois que o fluxo inteiro for validado manualmente, os cenarios mais importantes podem ganhar testes de integracao adicionais e testes ponta a ponta. O deploy continua pendente ate a configuracao do banco, storage persistente e provedores de hospedagem.
