# Roadmap — Achar seu Pet — Fase 2
## Versão Completa / Portfólio

> Este documento define a construção da versão avançada do projeto **Achar seu Pet**, pensada para portfólio e publicação no GitHub.
>
> A versão da faculdade continua sendo um projeto separado, feito em Django tradicional com templates. A Fase 2 usa uma arquitetura diferente: **React no frontend + Django REST Framework no backend + PostgreSQL no Neon**, com comunicação via API.

---

# 1. Objetivo do projeto

Construir uma aplicação web completa para cadastro e busca de pets desaparecidos e encontrados, com:

- autenticação de usuários;
- cadastro e gerenciamento de pets;
- filtros por estado e cidade;
- página de detalhes de cada pet;
- mapa com localização aproximada;
- registro de avistamentos;
- timeline de avistamentos;
- compartilhamento via WhatsApp;
- possibilidade futura de alertas por proximidade;
- deploy real em serviços separados;
- repositório organizado para portfólio.

A prioridade da Fase 2 não é apenas fazer a aplicação funcionar, mas construir um projeto que demonstre conhecimentos de:

- arquitetura frontend/backend desacoplada;
- APIs REST;
- autenticação JWT;
- banco PostgreSQL;
- consumo de APIs externas;
- mapas e geolocalização;
- variáveis de ambiente;
- deploy;
- Git e GitHub;
- organização de projeto profissional.

---

# 2. Arquitetura definida

| Camada | Tecnologia | Hospedagem sugerida |
|---|---|---|
| Frontend | React + Vite | Vercel |
| Backend | Django + Django REST Framework | Render ou Railway |
| Banco | PostgreSQL | Neon |
| Autenticação | JWT | Django REST Framework SimpleJWT |
| CORS | django-cors-headers | Backend |
| Mapa | Leaflet + React Leaflet | Frontend |
| Geocoding | Nominatim / OpenStreetMap | Backend ou serviço intermediário |
| Upload de imagens | serviço externo recomendado | Cloudinary, S3 ou equivalente |
| Versionamento | Git + GitHub | GitHub |

---

# 3. Decisões arquiteturais importantes

## 3.1. Separação entre frontend e backend

O projeto será dividido em duas aplicações independentes.

### Backend

O Django:

- não renderiza páginas HTML para o usuário final;
- não usa templates para a interface principal;
- recebe requisições HTTP;
- valida dados;
- acessa o banco;
- executa regras de negócio;
- devolve respostas em JSON.

Exemplo:

```http
GET /api/pets/
```

Resposta:

```json
[
  {
    "id": 1,
    "nome": "Rex",
    "cidade": "São Paulo",
    "estado": "SP",
    "status": "P"
  }
]
```

### Frontend

O React:

- cria as telas;
- controla navegação;
- captura dados de formulários;
- chama a API;
- exibe os dados recebidos;
- armazena e utiliza o token de autenticação;
- renderiza o mapa.

Essa separação deve ser mantida durante todo o projeto.

---

## 3.2. Não reutilizar diretamente a estrutura da versão Django com templates

A versão antiga pode servir como referência de:

- layout;
- regras de negócio;
- nomes de campos;
- fluxo de telas;
- validações já pensadas.

Porém:

- views Django tradicionais devem ser substituídas por endpoints REST;
- forms Django não serão o mecanismo principal do frontend;
- templates serão substituídos por componentes React;
- autenticação de sessão será substituída por JWT.

---

# 4. Estrutura recomendada do repositório

Para portfólio, a recomendação é usar um **monorepo**.

```text
achar-seu-pet/
│
├── backend/
│   ├── manage.py
│   ├── config/
│   ├── users/
│   ├── pets/
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── .env.example
│   └── README.md
│
├── docs/
│   ├── architecture.md
│   └── api.md
│
├── .gitignore
└── README.md
```

### Por que monorepo?

Para este projeto ele facilita:

- mostrar toda a aplicação em um único GitHub;
- documentar arquitetura no mesmo local;
- criar issues e roadmap centralizados;
- facilitar avaliação por recrutadores.

Backend e frontend ainda continuam sendo aplicações independentes.

---

# 5. Escopo do MVP da Fase 2

Antes das funcionalidades avançadas, deve existir uma versão mínima completa funcionando de ponta a ponta.

## MVP obrigatório

- cadastro de usuário;
- login;
- logout no frontend;
- criação de pet;
- listagem de pets perdidos;
- página de detalhes;
- edição do próprio pet;
- exclusão do próprio pet;
- alteração do status para encontrado;
- listagem de pets encontrados;
- filtros por estado e cidade;
- página Minha Conta;
- upload de foto;
- API em produção;
- frontend em produção;
- PostgreSQL em produção.

Somente após isso iniciar:

- mapa;
- geocoding;
- avistamentos;
- timeline;
- proximidade.

Isso reduz o risco de tentar implementar muitas funcionalidades ao mesmo tempo.

---

# 6. Modelagem de dados

## 6.1. Model Pet

```python
class Pet(models.Model):
    autor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="pets"
    )

    nome = models.CharField(max_length=100)
    foto = models.ImageField(upload_to="pets/")

    especie = models.CharField(
        max_length=20,
        choices=[
            ("cachorro", "Cachorro"),
            ("gato", "Gato"),
        ],
    )

    raca = models.CharField(max_length=100)
    cor = models.CharField(max_length=100)

    sexo = models.CharField(
        max_length=10,
        choices=[
            ("macho", "Macho"),
            ("femea", "Fêmea"),
        ],
    )

    caracteristicas = models.TextField()

    estado = models.CharField(max_length=2)
    cidade = models.CharField(max_length=100)
    endereco_texto = models.CharField(max_length=255)

    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    raio_area_metros = models.PositiveIntegerField(default=400)

    data_desaparecimento = models.DateField()
    descricao = models.TextField()
    contato = models.CharField(max_length=20)

    status = models.CharField(
        max_length=1,
        choices=[
            ("P", "Perdido"),
            ("E", "Encontrado"),
        ],
        default="P",
    )

    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
```

## 6.2. Model Avistamento

```python
class Avistamento(models.Model):
    pet = models.ForeignKey(
        Pet,
        on_delete=models.CASCADE,
        related_name="avistamentos"
    )

    latitude = models.FloatField()
    longitude = models.FloatField()

    descricao = models.TextField(blank=True)
    contato_quem_viu = models.CharField(max_length=100, blank=True)

    criado_em = models.DateTimeField(auto_now_add=True)
```

## 6.3. Possível evolução futura

Posteriormente pode ser adicionado:

```python
usuario = models.ForeignKey(
    User,
    null=True,
    blank=True,
    on_delete=models.SET_NULL
)
```

em `Avistamento`.

Assim um avistamento pode ser associado a um usuário autenticado, sem impedir avistamentos anônimos.

---

# 7. FASE 0 — Preparação do projeto

## Objetivo

Preparar ambiente, repositório e ferramentas antes de começar a programação.

## Passos

### 0.1. Criar pasta principal

```bash
mkdir achar-seu-pet
cd achar-seu-pet
```

### 0.2. Iniciar Git

```bash
git init
```

### 0.3. Criar estrutura inicial

```text
achar-seu-pet/
├── backend/
├── frontend/
├── docs/
└── README.md
```

### 0.4. Criar repositório no GitHub

Nome sugerido:

```text
achar-seu-pet
```

### 0.5. Criar `.gitignore`

Deve ignorar pelo menos:

```text
.env
.venv/
__pycache__/
node_modules/
dist/
media/
```

## O que você deve entender ao finalizar esta fase

- o que é um repositório Git;
- diferença entre projeto local e remoto;
- por que `.env` não deve ir para o GitHub;
- diferença entre backend e frontend.

## Critério de conclusão

A estrutura inicial deve estar no GitHub sem segredos ou arquivos desnecessários.

## Prompt recomendado para a IA

> Estou iniciando o projeto Achar seu Pet Fase 2. Quero montar um monorepo com `backend`, `frontend` e `docs`. Me ensine passo a passo a criar a estrutura inicial, iniciar o Git e montar um `.gitignore` adequado para Django + React. Explique o que cada comando faz antes de me mandar executá-lo. Não avance para Django ainda.

---

# 8. FASE 1 — Criar o backend Django

## Objetivo

Criar a base da API Django.

## Passos

### 1.1. Criar ambiente virtual

Dentro de `backend`:

```bash
python -m venv .venv
```

Ativar o ambiente virtual.

Windows:

```bash
.venv\Scripts\activate
```

Linux/macOS:

```bash
source .venv/bin/activate
```

### 1.2. Instalar dependências iniciais

```bash
pip install django djangorestframework django-cors-headers python-dotenv dj-database-url psycopg[binary] djangorestframework-simplejwt Pillow
```

### 1.3. Criar projeto Django

```bash
django-admin startproject config .
```

### 1.4. Criar apps

Sugestão:

```bash
python manage.py startapp pets
python manage.py startapp users
```

### 1.5. Configurar `INSTALLED_APPS`

Adicionar:

- `rest_framework`;
- `corsheaders`;
- `pets`;
- `users`.

### 1.6. Subir servidor local

```bash
python manage.py runserver
```

## O que você deve entender

- o que é um projeto Django;
- o que é um app Django;
- o que é ambiente virtual;
- por que dependências são instaladas dentro do ambiente;
- papel do `settings.py`;
- papel do `manage.py`.

## Critério de conclusão

A aplicação Django deve iniciar sem erros em ambiente local.

## Prompt recomendado para a IA

> Agora vamos criar somente a fundação do backend Django do Achar seu Pet. Quero usar Django REST Framework. Me explique a diferença entre projeto Django e app Django, depois me passe os comandos um por um. Depois de cada passo, diga o que devo conferir para saber se funcionou. Não crie models ainda.

---

# 9. FASE 2 — Configurar variáveis de ambiente

## Objetivo

Remover segredos e configurações sensíveis do código.

## Variáveis sugeridas

Arquivo `.env` local:

```env
SECRET_KEY=...
DEBUG=True
DATABASE_URL=...
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

Criar também:

```text
.env.example
```

sem valores secretos.

## O que deve ser configurado

- `SECRET_KEY`;
- `DEBUG`;
- `DATABASE_URL`;
- `ALLOWED_HOSTS`;
- `CORS_ALLOWED_ORIGINS`.

## O que você deve entender

- diferença entre configuração e código;
- por que credenciais não podem ser commitadas;
- por que produção e desenvolvimento usam valores diferentes.

## Critério de conclusão

O projeto deve iniciar usando configurações carregadas do ambiente.

## Prompt recomendado para a IA

> Quero configurar variáveis de ambiente no Django antes de conectar ao Neon. Me mostre uma implementação limpa usando `.env`, explique cada variável e crie também um `.env.example`. Avise quais arquivos devem entrar no `.gitignore`.

---

# 10. FASE 3 — Configurar PostgreSQL com Neon

## Objetivo

Trocar SQLite por PostgreSQL.

## Passos

### 3.1. Criar projeto no Neon

Criar banco e copiar a connection string.

Ela normalmente terá estrutura semelhante a:

```text
postgresql://usuario:senha@host/banco?sslmode=require
```

### 3.2. Colocar no `.env`

```env
DATABASE_URL=postgresql://...
```

### 3.3. Configurar Django

Usar `dj-database-url` para ler `DATABASE_URL`.

### 3.4. Testar conexão

```bash
python manage.py migrate
```

## O que você deve entender

- diferença entre SQLite e PostgreSQL;
- o que é uma connection string;
- o que são migrations;
- por que o banco pode estar hospedado em um serviço separado da API.

## Critério de conclusão

As migrations padrão do Django devem ser criadas no PostgreSQL do Neon.

## Prompt recomendado para a IA

> Quero conectar meu Django ao PostgreSQL do Neon usando `DATABASE_URL`. Explique primeiro como Django se conecta ao banco e depois me mostre exatamente o que devo alterar no `settings.py`. Não exponha minha senha no código.

---

# 11. FASE 4 — Criar os models

## Objetivo

Representar os dados principais da aplicação no banco.

Criar:

- `Pet`;
- `Avistamento`.

## Passos

### 4.1. Implementar `Pet`

Começar apenas com os campos do domínio.

### 4.2. Implementar `Avistamento`

Associar a um pet usando `ForeignKey`.

### 4.3. Criar migrations

```bash
python manage.py makemigrations
```

### 4.4. Aplicar migrations

```bash
python manage.py migrate
```

### 4.5. Registrar models no admin

Mesmo que a aplicação final não use templates Django, o admin é útil para desenvolvimento.

### 4.6. Criar superusuário

```bash
python manage.py createsuperuser
```

## O que você deve entender

- model;
- tabela;
- coluna;
- chave estrangeira;
- `on_delete`;
- `related_name`;
- migration.

## Critério de conclusão

Você deve conseguir criar e visualizar pets e avistamentos pelo Django Admin.

## Prompt recomendado para a IA

> Vamos criar os models `Pet` e `Avistamento`. Quero que você explique campo por campo e principalmente `ForeignKey`, `on_delete` e `related_name`. Depois gere o código. Em seguida me ensine a criar e aplicar migrations e testar tudo pelo Django Admin.

---

# 12. FASE 5 — Criar serializers

## Objetivo

Converter objetos Django em JSON e validar dados recebidos pela API.

Criar:

- `PetSerializer`;
- `AvistamentoSerializer`;
- serializers de usuário, se necessário.

## Conceito importante

O serializer funciona como uma camada entre:

```text
JSON recebido
      ↓
Serializer
      ↓
Model Django
      ↓
Banco
```

E no sentido inverso:

```text
Banco
  ↓
Model
  ↓
Serializer
  ↓
JSON
```

## Regras iniciais

O campo `autor` não deve ser livremente escolhido pelo cliente.

O backend deve obter o autor do usuário autenticado.

## Critério de conclusão

Um objeto `Pet` deve poder ser convertido para JSON corretamente.

## Prompt recomendado para a IA

> Agora quero criar os serializers do projeto. Antes do código, me explique por que serializer não é a mesma coisa que model e qual a função de validação dele. Depois crie `PetSerializer` e `AvistamentoSerializer`, evitando que o frontend escolha manualmente o autor do pet.

---

# 13. FASE 6 — Criar a API REST

## Objetivo

Disponibilizar endpoints para o frontend.

## Endpoints mínimos

### Pets

```http
GET    /api/pets/
POST   /api/pets/
GET    /api/pets/{id}/
PATCH  /api/pets/{id}/
DELETE /api/pets/{id}/
```

### Avistamentos

```http
GET  /api/pets/{id}/avistamentos/
POST /api/pets/{id}/avistamentos/
```

## Filtros

Exemplos:

```http
GET /api/pets/?estado=SP
GET /api/pets/?cidade=Campinas
GET /api/pets/?status=P
GET /api/pets/?estado=SP&cidade=Campinas&status=P
```

## Regras de permissão

- qualquer usuário pode listar pets;
- qualquer usuário pode abrir detalhes;
- criar pet exige autenticação;
- editar pet exige ser o autor;
- excluir pet exige ser o autor;
- alterar status exige ser o autor.

## Critério de conclusão

Todos os endpoints principais devem funcionar pelo navegador DRF, Postman ou Insomnia.

## Prompt recomendado para a IA

> Quero transformar os models em uma API REST. Use Django REST Framework e explique se é melhor usar `APIView`, generics ou `ModelViewSet` neste projeto. Depois implemente os endpoints de pets com CRUD, filtros por estado/cidade/status e permissões para impedir que um usuário edite o pet de outro.

---

# 14. FASE 7 — Autenticação JWT

## Objetivo

Permitir autenticação entre React e Django em servidores diferentes.

## Fluxo

```text
Usuário envia email/senha
        ↓
React faz POST no Django
        ↓
Django valida credenciais
        ↓
Django devolve access token + refresh token
        ↓
React envia access token nas próximas requisições
```

Header esperado:

```http
Authorization: Bearer TOKEN
```

## Endpoints sugeridos

```http
POST /api/auth/register/
POST /api/auth/token/
POST /api/auth/token/refresh/
GET  /api/auth/me/
```

## Segurança

Para o primeiro MVP, pode-se utilizar armazenamento simples do token para aprendizado.

Antes da versão final de portfólio, revisar a estratégia de armazenamento de tokens e riscos de XSS.

## Critério de conclusão

Um usuário deve conseguir:

1. criar conta;
2. fazer login;
3. receber token;
4. acessar endpoint autenticado;
5. atualizar o access token usando refresh token.

## Prompt recomendado para a IA

> Agora quero adicionar autenticação JWT usando SimpleJWT. Explique todo o fluxo de access token e refresh token antes de implementar. Crie endpoints de registro, login, refresh e `/me`. Quero entender exatamente o que o React terá que enviar em cada requisição.

---

# 15. FASE 8 — Configurar CORS

## Objetivo

Permitir que o React faça chamadas ao Django estando em outro domínio.

Desenvolvimento:

```text
React:  http://localhost:5173
Django: http://localhost:8000
```

Produção:

```text
React:  https://projeto.vercel.app
Django: https://api-projeto.onrender.com
```

O navegador bloqueia determinadas requisições entre origens diferentes caso o backend não autorize explicitamente.

## Critério de conclusão

Uma chamada `fetch` ou `axios` feita do React deve alcançar a API sem erro de CORS.

## Prompt recomendado para a IA

> Meu frontend React e meu backend Django rodam em portas/domínios diferentes. Explique o que é CORS de forma prática e configure `django-cors-headers` usando variável de ambiente para permitir localhost no desenvolvimento e domínio da Vercel em produção.

---

# 16. FASE 9 — Testar completamente o backend

## Objetivo

Não começar o React com uma API instável.

## Checklist

Testar:

- cadastro;
- login;
- refresh token;
- `/me`;
- criar pet;
- listar pets;
- buscar pet por ID;
- editar próprio pet;
- tentar editar pet de outro usuário;
- excluir próprio pet;
- filtros;
- status perdido/encontrado;
- criar avistamento;
- listar avistamentos.

## Opcional recomendado

Criar testes automatizados posteriormente usando:

```text
pytest
pytest-django
```

## Critério de conclusão

Não avançar para o frontend até o fluxo principal da API estar funcional.

## Prompt recomendado para a IA

> Quero testar o backend antes de criar o React. Monte para mim um roteiro de testes manuais da API, em ordem, incluindo payloads JSON de exemplo e o resultado esperado de cada endpoint. Inclua também testes de permissão e autenticação.

---

# 17. FASE 10 — Criar o frontend React

## Objetivo

Criar a aplicação visual que consumirá a API.

## Criar projeto

Dentro de `frontend`:

```bash
npm create vite@latest .
```

Selecionar:

```text
React
JavaScript
```

ou TypeScript caso queira transformar isso em um objetivo adicional do projeto.

## Dependências sugeridas

```bash
npm install react-router-dom axios leaflet react-leaflet
```

## Estrutura sugerida

```text
src/
├── api/
│   └── api.js
├── components/
├── pages/
├── hooks/
├── context/
├── services/
├── utils/
├── assets/
├── App.jsx
└── main.jsx
```

## O que você deve entender

- componente;
- props;
- state;
- efeito;
- rota;
- chamada HTTP;
- estado global de autenticação.

## Critério de conclusão

React deve iniciar localmente e mostrar uma tela inicial simples.

## Prompt recomendado para a IA

> Agora vamos iniciar o frontend com React + Vite. Quero uma estrutura organizada para um projeto de portfólio, mas sem exagerar na abstração. Me explique o papel de `pages`, `components`, `services`, `api` e `context`, depois crie a estrutura inicial e configure React Router.

---

# 18. FASE 11 — Criar camada de comunicação com API

## Objetivo

Evitar chamadas HTTP espalhadas por todos os componentes.

Criar algo como:

```text
src/api/api.js
```

Exemplo conceitual:

```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});
```

Variável de ambiente:

```env
VITE_API_URL=http://localhost:8000/api
```

## Interceptor

Posteriormente adicionar token:

```text
Authorization: Bearer <access_token>
```

## Critério de conclusão

O React deve conseguir chamar:

```http
GET /api/pets/
```

e mostrar os dados na tela.

## Prompt recomendado para a IA

> Quero criar uma camada central de comunicação com a API usando Axios. Explique por que não é bom espalhar URLs e chamadas HTTP pelos componentes. Depois crie `api.js`, configure `VITE_API_URL` e faça uma primeira chamada GET para listar pets.

---

# 19. FASE 12 — Criar autenticação no React

## Objetivo

Integrar o JWT com a interface.

## Criar

- página Login;
- página Criar Conta;
- `AuthContext` ou solução equivalente;
- função `login`;
- função `logout`;
- função `register`;
- recuperação do usuário atual;
- proteção de rotas.

## Rotas privadas

Exemplos:

```text
/cadastrar-pet
/minha-conta
/meus-pets
```

## Critério de conclusão

Usuário deve conseguir fazer login e continuar autenticado ao navegar entre páginas.

## Prompt recomendado para a IA

> Agora quero integrar a autenticação JWT no React. Crie um `AuthContext`, página de login, registro, logout e rota protegida. Explique cada etapa e mostre como o token chega ao header `Authorization` das requisições.

---

# 20. FASE 13 — Criar telas principais

## Ordem recomendada

### 13.1. Home

Mostrar:

- chamada principal;
- pets perdidos recentes;
- botão para cadastrar pet;
- acesso aos filtros.

### 13.2. Lista de pets perdidos

Rota sugerida:

```text
/pets
```

### 13.3. Detalhe do pet

```text
/pets/:id
```

### 13.4. Pets encontrados

```text
/encontrados
```

### 13.5. Quem Somos

```text
/quem-somos
```

### 13.6. Minha Conta

```text
/minha-conta
```

### 13.7. Cadastro de Pet

```text
/cadastrar-pet
```

### 13.8. Editar Pet

```text
/pets/:id/editar
```

## Critério de conclusão

Todo o MVP deve poder ser utilizado sem mapa ainda.

## Prompt recomendado para a IA

> Quero construir agora as páginas principais do React usando a API já pronta. Vamos fazer uma por vez. Para cada página, primeiro explique quais dados ela precisa buscar, depois monte o componente e por último mostre como testar. Comece pela listagem de pets.

---

# 21. FASE 14 — Upload de imagens

## Objetivo

Permitir foto real dos pets em produção.

## Ponto importante

Evitar depender do disco local do Render/Railway para armazenamento permanente.

Serviços sugeridos:

- Cloudinary;
- Amazon S3;
- Cloudflare R2;
- serviço equivalente.

Para simplificar o portfólio, Cloudinary costuma ser uma escolha conveniente.

## Critério de conclusão

A foto enviada deve continuar disponível depois de novos deploys do backend.

## Prompt recomendado para a IA

> Quero implementar upload de fotos de pets pensando em deploy. Explique por que armazenar as imagens apenas na pasta `media/` do servidor pode ser um problema em hospedagens como Render. Depois me ajude a integrar uma solução de armazenamento externo adequada para Django.

---

# 22. FASE 15 — Geocoding

## Objetivo

Converter uma região digitada pelo usuário em latitude e longitude.

## Exemplo

Entrada:

```text
Rua X, Campinas, SP
```

Saída aproximada:

```text
latitude = -22.90
longitude = -47.06
```

## Fluxo recomendado

```text
React envia endereço/região
        ↓
Django recebe
        ↓
Django consulta serviço de geocoding
        ↓
Django recebe coordenadas
        ↓
Django salva latitude/longitude
```

## Por que preferir o backend para geocoding?

- centraliza regra de negócio;
- facilita trocar de serviço no futuro;
- evita lógica duplicada;
- permite controle de rate limit e cache.

## Nominatim

Usar com responsabilidade e respeitar a política de uso do serviço.

Uma aplicação pública com tráfego relevante pode precisar de:

- cache;
- proxy próprio;
- outro provedor de geocoding.

## Critério de conclusão

Ao cadastrar um pet, latitude e longitude devem ser preenchidas automaticamente quando a localização puder ser encontrada.

## Prompt recomendado para a IA

> Quero adicionar geocoding ao cadastro do pet usando Nominatim/OpenStreetMap. Quero fazer isso no backend. Explique o fluxo completo, boas práticas de User-Agent, tratamento quando nenhum resultado é encontrado e como evitar chamadas desnecessárias ao serviço.

---

# 23. FASE 16 — Mapa com Leaflet

## Objetivo

Mostrar a região aproximada onde o pet desapareceu.

## Dependências

```bash
npm install leaflet react-leaflet
```

## Elementos do mapa

Para cada pet:

1. obter `latitude`;
2. obter `longitude`;
3. obter `raio_area_metros`;
4. desenhar um círculo;
5. colocar a imagem do pet no centro.

Conceito:

```jsx
<Circle
  center={[latitude, longitude]}
  radius={raioAreaMetros}
/>
```

Marcador:

```text
imagem circular do pet
```

## Privacidade

Não mostrar publicamente o endereço completo utilizado pelo usuário caso ele seja sensível.

A interface pode apresentar apenas algo como:

```text
Região aproximada: Cambuí, Campinas - SP
```

## Critério de conclusão

A página de detalhe deve exibir:

- mapa;
- círculo aproximado;
- imagem do pet no centro.

## Prompt recomendado para a IA

> Quero integrar React Leaflet na página de detalhe do pet. Tenho latitude, longitude e raio em metros vindos da API. Quero desenhar um círculo de área aproximada e usar a foto do pet como marcador customizado no centro. Explique primeiro os componentes do Leaflet e depois implemente.

---

# 24. FASE 17 — Botão “Vi esse pet!”

## Objetivo

Permitir o registro de um possível avistamento.

Na página do pet, adicionar:

```text
Vi esse pet!
```

Ao clicar, abrir formulário/modal com:

- localização;
- descrição;
- contato opcional.

## Dados enviados

```json
{
  "latitude": -22.9,
  "longitude": -47.1,
  "descricao": "Vi perto de uma praça",
  "contato_quem_viu": "..."
}
```

## Critério de conclusão

Um novo avistamento deve aparecer na API relacionado ao pet correto.

## Prompt recomendado para a IA

> Quero implementar o botão “Vi esse pet!”. Crie primeiro o endpoint correto no backend para registrar um avistamento associado a um pet. Depois crie no React um modal com formulário. Explique como garantir que o usuário não escolha manualmente o ID do pet errado.

---

# 25. FASE 18 — Timeline de avistamentos

## Objetivo

Mostrar o histórico de avistamentos do pet.

Exemplo:

```text
18/08/2026 - 14:32
Visto próximo à Praça Central

17/08/2026 - 20:10
Possível avistamento na Rua X
```

## Ordem

Mais recente primeiro.

## Opcional

Cada avistamento também pode aparecer no mapa.

## Critério de conclusão

A página do pet deve listar os avistamentos recebidos da API.

## Prompt recomendado para a IA

> Agora quero mostrar os avistamentos na página do pet em formato de timeline. Quero que venham ordenados do mais recente para o mais antigo. Explique se a ordenação deve acontecer no backend ou frontend e implemente da forma mais adequada.

---

# 26. FASE 19 — Compartilhamento no WhatsApp

## Objetivo

Facilitar divulgação de um pet desaparecido.

Criar botão:

```text
Compartilhar no WhatsApp
```

Mensagem sugerida:

```text
Ajude a encontrar o Rex!
Desapareceu em Campinas - SP.
Veja mais informações:
https://seusite.com/pets/12
```

Link:

```text
https://wa.me/?text=...
```

Usar URL encoding.

## Critério de conclusão

O botão deve abrir o WhatsApp com a mensagem já preenchida.

## Prompt recomendado para a IA

> Quero adicionar compartilhamento no WhatsApp na página de detalhe. Gere a mensagem dinamicamente com nome, cidade, estado e URL pública do pet. Explique por que preciso usar `encodeURIComponent`.

---

# 27. FASE 20 — Busca por proximidade

## Objetivo

Comparar coordenadas de pets e avistamentos.

Usar distância geográfica aproximada.

## Fórmula de Haversine

A fórmula calcula a distância entre dois pontos da superfície terrestre usando:

```text
latitude 1
longitude 1
latitude 2
longitude 2
```

## Possível regra

```text
Se um avistamento estiver a menos de 3 km da região do desaparecimento:
marcar como possível correspondência próxima.
```

## Primeira implementação

Não enviar notificações reais ainda.

Criar apenas uma função que retorne:

```json
{
  "distancia_km": 1.7,
  "proximo": true
}
```

## Evolução futura

- email;
- push notification;
- tarefa assíncrona;
- Celery;
- cron job;
- serviço de filas.

## Critério de conclusão

A aplicação deve conseguir identificar programaticamente se dois pontos estão dentro do limite definido.

## Prompt recomendado para a IA

> Quero implementar proximidade usando Haversine, mas sem notificações ainda. Explique a fórmula de forma simples e crie uma função Python reutilizável que calcule a distância em quilômetros entre duas coordenadas. Depois mostre onde essa função deve ficar na estrutura do Django.

---

# 28. FASE 21 — Melhorar filtros e busca

## Objetivo

Tornar a listagem mais útil.

Filtros possíveis:

- estado;
- cidade;
- espécie;
- sexo;
- status;
- data de desaparecimento.

Busca textual futura:

- nome;
- raça;
- características.

## Backend

Avaliar uso de:

```text
django-filter
```

## Critério de conclusão

Filtros devem funcionar pela query string sem lógica duplicada no frontend.

## Prompt recomendado para a IA

> Quero melhorar os filtros da API usando `django-filter`. Quero filtrar pets por estado, cidade, espécie, sexo e status. Explique por que deixar a filtragem no backend é melhor do que baixar todos os pets e filtrar apenas no React.

---

# 29. FASE 22 — Tratamento de erros e UX

## Objetivo

Evitar uma aplicação que só funciona no cenário ideal.

Tratar:

- API offline;
- token expirado;
- login inválido;
- campos obrigatórios;
- imagem inválida;
- pet não encontrado;
- geocoding sem resultado;
- falha no upload;
- falta de permissão;
- erro 500.

No React criar estados como:

```text
loading
error
success
empty
```

## Critério de conclusão

Nenhuma ação importante deve falhar silenciosamente.

## Prompt recomendado para a IA

> Quero revisar o projeto pensando em experiência do usuário. Liste os principais estados de erro e carregamento para cada tela e me ajude a implementar mensagens claras sem esconder os erros técnicos importantes no console durante desenvolvimento.

---

# 30. FASE 23 — Segurança básica

## Objetivo

Preparar o projeto para ficar público.

Checklist:

- `DEBUG=False` em produção;
- `SECRET_KEY` fora do Git;
- `DATABASE_URL` fora do Git;
- CORS restrito;
- `ALLOWED_HOSTS` correto;
- permissões na API;
- validação de upload;
- limite de tamanho de imagem;
- validação de dados;
- rate limiting futuro;
- HTTPS em produção;
- não expor endereço exato sem necessidade.

## Critério de conclusão

Credenciais e configurações sensíveis não devem existir no repositório público.

## Prompt recomendado para a IA

> Faça uma revisão de segurança do meu projeto Django REST + React antes do deploy. Quero uma checklist prática voltada para um projeto de portfólio público, cobrindo JWT, CORS, uploads, variáveis de ambiente, permissões e configurações de produção.

---

# 31. FASE 24 — Testes automatizados

## Objetivo

Demonstrar qualidade técnica no portfólio.

Prioridade de testes backend:

1. criação de pet;
2. autenticação;
3. permissão de edição;
4. filtros;
5. criação de avistamento;
6. Haversine.

Ferramentas sugeridas:

```text
pytest
pytest-django
factory_boy
```

Frontend posteriormente:

```text
Vitest
React Testing Library
```

## Meta inicial

Não buscar 100% de coverage.

Ter testes das regras críticas já melhora muito a qualidade do projeto.

## Prompt recomendado para a IA

> Quero começar os testes automatizados pelo backend. Use pytest + pytest-django. Me ensine a configurar e escreva primeiro testes para criação de pet, autenticação e regra que impede editar o pet de outro usuário.

---

# 32. FASE 25 — Deploy do backend

## Objetivo

Publicar a API.

Opções:

- Render;
- Railway.

## Variáveis de produção

```text
SECRET_KEY
DEBUG=False
DATABASE_URL
ALLOWED_HOSTS
CORS_ALLOWED_ORIGINS
```

Outras variáveis podem existir conforme serviço de imagens.

## Passos gerais

1. conectar GitHub;
2. selecionar pasta `backend`;
3. instalar dependências;
4. rodar migrations;
5. configurar comando de inicialização;
6. configurar variáveis;
7. testar `/api/pets/`.

## Gunicorn

Adicionar servidor WSGI apropriado para produção:

```bash
pip install gunicorn
```

## Critério de conclusão

A API deve possuir uma URL HTTPS pública e responder corretamente.

## Prompt recomendado para a IA

> Quero colocar meu backend Django REST em produção no Render/Railway. Me oriente considerando que ele está dentro da pasta `backend` de um monorepo. Quero os comandos de build/start, migrations, Gunicorn, variáveis de ambiente e uma checklist de teste depois do deploy.

---

# 33. FASE 26 — Deploy do frontend

## Objetivo

Publicar o React na Vercel.

## Variável

```env
VITE_API_URL=https://URL-DO-BACKEND/api
```

## Passos

1. conectar GitHub;
2. selecionar pasta `frontend`;
3. configurar framework Vite;
4. adicionar `VITE_API_URL`;
5. fazer deploy;
6. atualizar CORS do backend com a URL da Vercel.

## Critério de conclusão

Frontend e backend devem funcionar juntos em produção.

## Prompt recomendado para a IA

> Quero publicar meu frontend React/Vite na Vercel. Ele está na pasta `frontend` de um monorepo. Me ensine a configurar root directory, variável `VITE_API_URL` e depois atualizar o CORS do Django para aceitar apenas a URL publicada.

---

# 34. FASE 27 — Teste de produção

## Objetivo

Testar o sistema como usuário real.

## Fluxo obrigatório

1. abrir frontend publicado;
2. criar conta;
3. fazer login;
4. cadastrar pet com foto;
5. verificar geocoding;
6. abrir detalhe;
7. verificar mapa;
8. registrar avistamento;
9. verificar timeline;
10. editar pet;
11. marcar como encontrado;
12. conferir página de encontrados;
13. testar WhatsApp;
14. sair da conta;
15. testar acesso a rota protegida.

## Critério de conclusão

Todo fluxo principal deve funcionar em domínio público.

---

# 35. FASE 28 — Documentação para GitHub

## Objetivo

Transformar o repositório em peça de portfólio.

## README principal

Deve conter:

### Nome

```text
Achar seu Pet
```

### Descrição

Explicar o problema resolvido.

### Screenshots

Adicionar imagens reais da aplicação.

### Funcionalidades

Exemplo:

- autenticação JWT;
- cadastro de pets;
- filtros;
- geocoding;
- mapa interativo;
- avistamentos;
- timeline;
- compartilhamento.

### Stack

```text
React
Vite
Django
Django REST Framework
PostgreSQL
Neon
Leaflet
JWT
Vercel
Render/Railway
```

### Arquitetura

```text
React
  ↓ HTTP/JSON
Django REST API
  ↓
PostgreSQL Neon
```

### Links

- aplicação;
- API;
- frontend;
- documentação.

### Como rodar localmente

Backend e frontend.

### Variáveis de ambiente

Sem valores secretos.

## Critério de conclusão

Uma pessoa que nunca viu o projeto deve conseguir entender:

- o que ele faz;
- como foi construído;
- como rodar;
- quais decisões técnicas foram tomadas.

## Prompt recomendado para a IA

> Quero transformar o README do Achar seu Pet em uma apresentação de portfólio para recrutadores. Não quero um README genérico. Quero explicar problema, solução, arquitetura, funcionalidades, stack, decisões técnicas, screenshots, instalação local e links de produção.

---

# 36. Ordem final recomendada

A sequência completa deve ser:

```text
FASE 0   Preparação
FASE 1   Django base
FASE 2   Variáveis de ambiente
FASE 3   PostgreSQL / Neon
FASE 4   Models
FASE 5   Serializers
FASE 6   API REST
FASE 7   JWT
FASE 8   CORS
FASE 9   Testes manuais backend
FASE 10  React base
FASE 11  Camada da API
FASE 12  Autenticação React
FASE 13  Telas do MVP
FASE 14  Upload de imagens
FASE 15  Geocoding
FASE 16  Leaflet
FASE 17  Avistamentos
FASE 18  Timeline
FASE 19  WhatsApp
FASE 20  Haversine
FASE 21  Filtros avançados
FASE 22  Tratamento de erros
FASE 23  Segurança
FASE 24  Testes automatizados
FASE 25  Deploy backend
FASE 26  Deploy frontend
FASE 27  Teste de produção
FASE 28  README / Portfólio
```

---

# 37. Estratégia recomendada para trabalhar com IA

A IA deve ser utilizada como professora e pair programmer, não apenas como geradora de código.

Em cada etapa use este padrão:

## 1. Peça explicação primeiro

Exemplo:

> Antes de escrever código, explique o que vamos construir e onde isso se encaixa na arquitetura.

## 2. Peça mudanças pequenas

Evite:

> Faça todo o backend.

Prefira:

> Vamos criar somente o model Pet e testar no admin.

## 3. Execute e teste antes de continuar

Depois que a IA gerar código:

```text
copiar
executar
observar resultado
corrigir erros
só então continuar
```

## 4. Sempre envie erros completos

Quando ocorrer um erro, envie:

- comando executado;
- traceback completo;
- arquivo relacionado;
- trecho relevante do código.

Não resuma apenas como:

```text
não funcionou
```

## 5. Peça explicação das correções

Use:

> Explique por que esse erro aconteceu antes de me dar a correção.

## 6. Faça commits por etapa

Exemplos:

```bash
git add .
git commit -m "feat: create pet model"
```

```bash
git commit -m "feat: add jwt authentication"
```

```bash
git commit -m "feat: add pet map"
```

Isso cria um histórico profissional do projeto.

---

# 38. Modelo de prompt padrão para continuar o projeto

Use este template sempre que iniciar uma nova etapa:

```text
Estamos desenvolvendo o projeto Achar seu Pet Fase 2.

Stack:
- React + Vite no frontend
- Django REST Framework no backend
- PostgreSQL no Neon
- JWT
- React Leaflet

Etapa atual:
[COLOCAR A FASE]

O que já está funcionando:
[DESCREVER]

Quero fazer agora:
[DESCREVER UMA ÚNICA TAREFA]

Regras para sua resposta:
1. Explique primeiro o conceito.
2. Diga quais arquivos serão alterados.
3. Faça mudanças pequenas e progressivas.
4. Mostre o código completo apenas dos arquivos necessários.
5. Explique as partes importantes do código.
6. Diga como testar a mudança.
7. Não avance para a próxima funcionalidade até esta estar funcionando.
```

---

# 39. Modelo de prompt para corrigir erros

```text
Estou na Fase [X] do projeto Achar seu Pet.

Objetivo atual:
[DESCREVER]

Comando que executei:
[COMANDO]

Erro completo:
[COLAR TRACEBACK]

Arquivos envolvidos:
[COLAR CÓDIGO]

Quero que você:
1. identifique a causa do erro;
2. explique por que aconteceu;
3. indique a menor correção possível;
4. mostre exatamente quais linhas devo alterar;
5. diga como testar depois da correção.
```

---

# 40. Modelo de prompt para revisão de código

```text
Revise este código do projeto Achar seu Pet.

Quero que você avalie:
- erros;
- segurança;
- organização;
- repetição;
- boas práticas Django/React;
- facilidade de manutenção.

Não reescreva tudo automaticamente.
Primeiro liste os problemas encontrados por prioridade e explique o impacto de cada um.
Depois proponha mudanças incrementais.
```

---

# 41. Marcos do projeto

## Marco 1 — API funcional

Quando:

- login funciona;
- CRUD de pets funciona;
- filtros funcionam;
- permissões funcionam.

## Marco 2 — MVP React funcional

Quando:

- frontend consome API;
- login funciona;
- cadastro funciona;
- listagem funciona;
- detalhe funciona;
- minha conta funciona.

## Marco 3 — Recursos geográficos

Quando:

- geocoding funciona;
- mapa funciona;
- círculo funciona;
- marcador com foto funciona.

## Marco 4 — Avistamentos

Quando:

- usuário registra avistamento;
- timeline funciona;
- proximidade pode ser calculada.

## Marco 5 — Produção

Quando:

- backend está publicado;
- frontend está publicado;
- banco é Neon;
- imagens persistem;
- fluxo completo funciona.

## Marco 6 — Portfólio

Quando:

- README está completo;
- screenshots estão disponíveis;
- arquitetura está documentada;
- repositório está organizado;
- aplicação está pública.

---

# 42. Funcionalidades que devem ficar para depois

Para evitar crescimento descontrolado do escopo, estas funcionalidades não devem bloquear a primeira versão publicada:

- notificações push;
- chat em tempo real;
- reconhecimento de imagem;
- inteligência artificial para comparar fotos;
- aplicativo mobile nativo;
- sistema complexo de mensagens;
- microserviços;
- Kubernetes;
- WebSockets sem necessidade real;
- arquitetura excessivamente distribuída.

Podem entrar em uma Fase 3 futuramente.

---

# 43. Melhorias futuras possíveis — Fase 3

Após a aplicação estar publicada e estável:

- notificações por email;
- notificações por proximidade;
- Celery + Redis;
- tarefas agendadas;
- PostGIS;
- buscas geoespaciais no banco;
- denúncia de anúncio;
- moderação;
- favoritos;
- dashboard administrativo;
- analytics;
- PWA;
- login social;
- testes end-to-end;
- CI/CD com GitHub Actions.

## PostGIS

Caso o projeto cresça, latitude e longitude em `FloatField` podem ser substituídas por recursos geoespaciais reais usando:

```text
PostgreSQL + PostGIS
GeoDjango
```

Para a primeira versão de portfólio, isso não é necessário.

---

# 44. Definição de “projeto concluído”

A Fase 2 pode ser considerada concluída quando:

- a aplicação estiver disponível publicamente;
- React estiver hospedado separadamente do Django;
- Django estiver funcionando como API REST;
- PostgreSQL Neon estiver sendo utilizado;
- autenticação JWT estiver funcional;
- usuário puder cadastrar e gerenciar pets;
- filtros funcionarem;
- fotos funcionarem em produção;
- mapa mostrar área aproximada;
- avistamentos puderem ser registrados;
- timeline estiver funcional;
- compartilhamento pelo WhatsApp funcionar;
- permissões impedirem alterações indevidas;
- principais regras tiverem testes;
- README documentar o projeto;
- código estiver público no GitHub sem credenciais.

---

# 45. Regra principal durante o desenvolvimento

Não tente construir o projeto inteiro em uma única sessão.

Use sempre o ciclo:

```text
ENTENDER
   ↓
IMPLEMENTAR UMA PARTE
   ↓
TESTAR
   ↓
CORRIGIR
   ↓
COMMITAR
   ↓
PASSAR PARA A PRÓXIMA PARTE
```

Esse processo deixa o projeto mais fácil de aprender, depurar e apresentar como portfólio.

---

# 46. Primeiro passo recomendado

Ao iniciar efetivamente a Fase 2, começar pela **FASE 0 — Preparação do projeto**.

Prompt inicial sugerido:

```text
Vamos começar o Achar seu Pet Fase 2 pela Fase 0.

Quero criar a estrutura do monorepo com backend, frontend e docs, iniciar o Git e preparar o .gitignore.

Explique cada comando antes de eu executar.
Não instale Django nem React ainda.
Ao final, me diga exatamente como verificar se a estrutura ficou correta e qual commit devo fazer.
```

