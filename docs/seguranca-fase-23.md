# Seguranca basica — Fase 23

## Protecoes implementadas

- `SECRET_KEY` obrigatoria no ambiente e fora do repositorio;
- `DEBUG` controlado por variavel de ambiente;
- `ALLOWED_HOSTS`, CORS e CSRF configuraveis e restritos;
- redirecionamento HTTPS e cookies seguros ativaveis no deploy;
- HSTS configuravel para o dominio publicado;
- `X-Frame-Options: DENY` e protecao contra MIME sniffing;
- throttling basico para usuarios anonimos e autenticados;
- JWT com access token de 30 minutos e refresh token de 1 dia;
- permissoes de edicao limitadas ao autor do pet;
- validacao e limite de tamanho para imagens;
- endereco completo nao exibido na pagina publica.

## Variaveis de producao

No deploy, configure pelo menos:

```env
SECRET_KEY=uma-chave-longa-e-aleatoria
DEBUG=False
ALLOWED_HOSTS=seu-backend.onrender.com
CORS_ALLOWED_ORIGINS=https://seu-frontend.vercel.app
CSRF_TRUSTED_ORIGINS=https://seu-frontend.vercel.app
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True
USE_X_FORWARDED_PROTO=True
```

O throttling atual e uma protecao inicial. Para uma aplicacao publica com mais trafego, o proximo nivel e usar cache compartilhado e regras especificas por endpoint.

## Ponto pendente antes de producao publica

O frontend ainda armazena access e refresh tokens no `localStorage`, uma escolha aceitavel para o MVP de estudo, mas vulneravel caso exista XSS. Antes de uma publicacao com usuarios reais, migrar o refresh token para cookie `HttpOnly`, `Secure` e com politica `SameSite` adequada, mantendo a protecao CSRF correspondente.
