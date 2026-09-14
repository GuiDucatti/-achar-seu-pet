# Achar seu Pet

Aplicacao web para ajudar familias a divulgarem pets desaparecidos, encontrarem informacoes por regiao e registrarem avistamentos.

O projeto foi construido como uma aplicacao separada de frontend e backend, com foco em uma experiencia simples para quem procura um animal e em decisoes tecnicas demonstraveis em um portfolio.

## Problema

Quando um pet desaparece, as informacoes costumam ficar espalhadas em grupos e redes sociais. Isso dificulta encontrar anuncios, atualizar o status do animal e organizar pistas de pessoas que o viram.

## Solucao

O Achar seu Pet centraliza o cadastro, a busca e os avistamentos em um fluxo unico:

- o responsavel cadastra o pet com foto e caracteristicas;
- outras pessoas filtram os anuncios por regiao e perfil;
- a pagina de detalhes exibe uma area aproximada no mapa;
- qualquer pessoa pode registrar um avistamento;
- a timeline organiza as pistas e mostra a proximidade estimada;
- o anuncio pode ser compartilhado pelo WhatsApp.

## Interface

![Pagina inicial do Achar seu Pet em desktop](docs/screenshots/home-desktop.webp)

<p align="center">
  <img src="docs/screenshots/pets-perdidos-desktop.webp" alt="Busca e filtros de pets perdidos" width="66%">
  <img src="docs/screenshots/home-mobile.webp" alt="Pagina inicial em um celular" width="25%">
</p>

![Pagina de login do Achar seu Pet](docs/screenshots/login-desktop.webp)

## Funcionalidades

- cadastro e login com JWT;
- renovacao automatica do access token sem repetir requisicoes entre sessoes diferentes;
- cadastro, edicao e exclusao de pets pelo autor;
- upload validado de imagens;
- filtros por status, estado, cidade, especie, sexo, data e texto;
- geocoding de endereco por Nominatim/OpenStreetMap;
- mapa interativo com Leaflet;
- area aproximada para preservar a privacidade do endereco;
- registro de avistamentos com coordenadas e contato opcional;
- timeline de avistamentos em ordem decrescente;
- calculo de distancia por Haversine;
- indicador de avistamento proximo;
- compartilhamento dinamico no WhatsApp;
- estados de carregamento, vazio, sucesso e erro;
- mensagens de erro para API offline, sessao expirada e falta de permissao;
- tratamento de excecoes no React com Error Boundary;
- interface responsiva com identidade visual inspirada na Lobinha.

## Arquitetura

```text
React + Vite
      |
      | HTTP/JSON + multipart
      v
Django REST Framework
      |
      +-- JWT e permissoes por autor
      +-- Geocoding Nominatim
      +-- Upload local de imagens
      v
SQLite local ou PostgreSQL em producao
```

Estrutura principal:

```text
backend/
  config/        configuracao Django, URLs e WSGI
  pets/          models, API, regras geograficas e testes
  users/         cadastro, login JWT e usuario atual
frontend/
  src/pages/     telas da aplicacao
  src/components componentes reutilizaveis
  src/services/  comunicacao com a API
  src/context/   estado de autenticacao
docs/            registro das fases e decisoes tecnicas
```

## Stack

### Frontend

- React 19;
- Vite;
- React Router;
- Axios;
- Leaflet e React Leaflet;
- Framer Motion;
- Lucide React;
- Oxlint.
- Vitest e Testing Library.

### Backend

- Python 3.12;
- Django 5.2 LTS;
- Django REST Framework;
- Simple JWT;
- Pillow;
- django-storages com backend S3;
- PostgreSQL via `DATABASE_URL`;
- Gunicorn para WSGI.

### Qualidade

- GitHub Actions para verificacao automatica de backend e frontend;
- testes Django/DRF;
- testes de componentes React e regras isoladas com `node:test`.

### Servicos planejados

- Neon para PostgreSQL;
- Render ou Railway para a API;
- Vercel para o frontend;
- Cloudflare R2 para imagens persistentes.

## Decisoes tecnicas

### Frontend e backend desacoplados

React cuida da experiencia e Django oferece uma API REST independente. Isso permite evoluir as duas camadas separadamente e demonstra uma arquitetura comum em produtos web.

### Privacidade da localizacao

O endereco completo nao e exibido publicamente. O mapa mostra apenas cidade, estado e um circulo de area aproximada usando as coordenadas do cadastro.

### Proximidade sem dependencia de PostGIS

A primeira versao usa Haversine para calcular distancias entre o desaparecimento e um avistamento. A abordagem e suficiente para o MVP e pode evoluir para PostGIS quando houver necessidade de escala.

### Upload validado

O backend valida extensao, MIME type e tamanho da imagem. Em desenvolvimento,
os arquivos ficam no disco local. Em producao, o projeto usa Cloudflare R2 por
meio da API compativel com S3, evitando perder uploads quando o servidor for
reiniciado ou substituido.

### Falhas visiveis

A interface diferencia carregamento, estado vazio, erro e sucesso. Erros tecnicos continuam no console durante o desenvolvimento, enquanto a pessoa recebe uma mensagem compreensivel.

## Rodar localmente

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

### Frontend

Em outro terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev -- --host 127.0.0.1 --port 5173
```

Se a porta `5173` estiver ocupada, o Vite pode usar `5174`. Essa origem ja esta prevista na configuracao local do backend.

URLs locais:

- frontend: `http://127.0.0.1:5173` ou `http://127.0.0.1:5174`;
- API: `http://127.0.0.1:8000/api`.

### Dados de demonstracao

Para visualizar a busca com pets ficticios, execute depois das migrations:

```bash
cd backend
.venv/bin/python manage.py seed_demo_pets
```

O comando pode ser executado novamente sem duplicar os registros. Os pets e
as localizacoes sao dados de demonstracao e nao representam casos reais.

## Variaveis de ambiente

O projeto usa arquivos `.env` locais, que nao devem ser versionados:

### Backend

```env
SECRET_KEY=uma-chave-secreta
DEBUG=True
DATABASE_URL=sqlite:///db.sqlite3
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
GEOCODING_ENABLED=True
ADDRESS_SUGGESTION_URL=https://photon.komoot.io/api/
NOMINATIM_USER_AGENT=nome-do-projeto-e-contato
MEDIA_STORAGE_BACKEND=local
```

### Frontend

```env
VITE_API_URL=http://127.0.0.1:8000/api
```

Nunca coloque senhas, tokens ou chaves reais no README, no frontend ou no repositorio.

## Testes e qualidade

Backend:

```bash
cd backend
.venv/bin/python manage.py check
.venv/bin/python manage.py makemigrations --check
.venv/bin/python manage.py test
```

Frontend:

```bash
cd frontend
npm test
npm run test:auth
npm run test:location
npm run lint
npm run build
```

Atualmente existem 65 testes backend e 27 testes frontend. A cobertura inclui autenticacao, renovacao JWT e sincronizacao entre abas, rotas protegidas, autocomplete de endereco, integridade e privacidade de coordenadas, criacao de pet, upload, configuracao de storage, permissoes, filtros, avistamentos e calculo de proximidade.

O workflow em `.github/workflows/ci.yml` repete essas verificacoes automaticamente em pushes e pull requests direcionados a `main`.

## Documentacao complementar

- [Creditos das fotografias](CREDITS.md);
- [Identidade visual da Lobinha](docs/identidade-lobinha.md);
- [Upload de imagens](docs/upload-imagens-fase-14.md);
- [Geocoding](docs/geocoding-fase-15.md);
- [Mapa com Leaflet](docs/mapa-leaflet-fase-16.md);
- [Avistamentos](docs/avistamentos-fase-17.md);
- [Busca por proximidade](docs/proximidade-fase-20.md);
- [Tratamento de erros e UX](docs/erros-ux-fase-22.md);
- [Seguranca](docs/seguranca-fase-23.md);
- [Testes automatizados](docs/testes-automatizados-fase-24.md).

## Status do portfolio

Este projeto foi preparado como uma demonstracao de portfolio e nao esta publicado como aplicacao em producao. O repositorio apresenta a arquitetura, as decisoes tecnicas, os testes e os principais fluxos do Achar seu Pet.

O suporte a armazenamento persistente com Cloudflare R2 esta implementado para um futuro deploy. A publicacao da aplicacao depende da configuracao de hospedagem, banco PostgreSQL, bucket R2 e credenciais de producao.

## Proximos passos

- testar manualmente todos os fluxos com calma;
- se desejado, adicionar um video curto da navegacao;
- escolher e adicionar uma licenca para o codigo;
- publicar o repositorio depois da revisao final.
