# Deploy do backend - Fase 25

## Status

Preparacao local concluida. A API ainda nao foi publicada e nenhum servico externo foi conectado.

## O que foi preparado

- `gunicorn` adicionado ao `backend/requirements.txt`;
- `STATIC_ROOT` configurado para permitir `collectstatic`;
- storage persistente Cloudflare R2 configurado para uploads;
- `backend/Procfile` criado com o comando WSGI;
- variaveis de producao e checklist registradas abaixo.

## Configuracao sugerida

No servico escolhido, configurar o diretorio raiz como `backend`.

Build command:

```bash
pip install -r requirements.txt
python manage.py collectstatic --noinput
python manage.py migrate --noinput
```

Start command:

```bash
gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
```

O `Procfile` ja registra o mesmo start command para plataformas que o reconhecem automaticamente.

## Variaveis necessarias

```text
SECRET_KEY=<valor-secreto-longo-e-unico>
DEBUG=False
DATABASE_URL=<url-do-postgresql>
ALLOWED_HOSTS=<dominio-do-backend>
CORS_ALLOWED_ORIGINS=<url-do-frontend>
CSRF_TRUSTED_ORIGINS=<url-do-frontend>
GEOCODING_ENABLED=True
NOMINATIM_USER_AGENT=<identificacao-do-projeto-e-contato>
MEDIA_STORAGE_BACKEND=r2
R2_ACCESS_KEY_ID=<credencial limitada ao bucket>
R2_SECRET_ACCESS_KEY=<segredo>
R2_BUCKET_NAME=<nome-do-bucket>
R2_ENDPOINT_URL=https://<account-id>.r2.cloudflarestorage.com
R2_PUBLIC_BASE_URL=https://media.<seu-dominio>
```

As configuracoes de HTTPS, HSTS e cookies seguros da Fase 23 tambem devem ser ativadas no ambiente de producao.

## Pendencias antes de publicar

- escolher Render ou Railway;
- provisionar PostgreSQL de producao;
- criar o bucket R2 e conectar um dominio personalizado para as imagens;
- preencher as variaveis sem coloca-las no repositorio;
- testar migrations em banco de homologacao;
- executar o fluxo completo manualmente;
- autorizar explicitamente o deploy.

## Regra de publicacao

Esta etapa apenas prepara os arquivos. O deploy fica bloqueado ate que o responsavel teste o site inteiro e autorize a publicacao de forma explicita.
