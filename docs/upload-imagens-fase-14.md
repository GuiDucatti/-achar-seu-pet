# Upload de imagens — Fase 14

## Estado atual

O cadastro de pet aceita fotos nos formatos JPG, PNG, WebP e GIF. O backend valida:

- tamanho maximo configuravel por `MAX_IMAGE_UPLOAD_SIZE_MB` (5 MB por padrao);
- formato permitido por `ALLOWED_IMAGE_CONTENT_TYPES`, conferido pela extensao;
- integridade basica do arquivo por meio do `ImageField` do Django e do Pillow.

Durante o desenvolvimento local, os arquivos ficam em `backend/media/pets/` e sao servidos em `/media/`. Quando `MEDIA_STORAGE_BACKEND=r2`, o mesmo `ImageField` usa o bucket Cloudflare R2 e retorna URLs publicas HTTPS.

## Por que `media/` nao basta em producao

Diretorios locais de plataformas como Render e Railway podem ser apagados quando o servico e recriado, atualizado ou movido de instancia. O banco continuaria apontando para o nome da imagem, mas o arquivo poderia desaparecer.

Por isso, a versao de producao guarda os arquivos em um bucket Cloudflare R2 por meio do backend S3 do `django-storages`. O banco continua armazenando o nome do objeto e o storage gera sua URL publica, sem depender do disco da aplicacao.

## Configuracao implementada

O backend escolhe o storage por ambiente:

- `MEDIA_STORAGE_BACKEND=local`: disco local para desenvolvimento e CI;
- `MEDIA_STORAGE_BACKEND=r2`: bucket persistente para producao.

Com `DEBUG=False`, o padrao e R2. Se uma credencial obrigatoria estiver ausente, a aplicacao interrompe a inicializacao em vez de usar silenciosamente um disco temporario.

Variaveis necessarias no servico que hospedar o Django:

```env
MEDIA_STORAGE_BACKEND=r2
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_ENDPOINT_URL=https://SEU_ACCOUNT_ID.r2.cloudflarestorage.com
R2_PUBLIC_BASE_URL=https://media.seudominio.com
```

O bucket precisa permitir acesso publico de leitura pelo dominio informado em `R2_PUBLIC_BASE_URL`. Em producao, use um dominio personalizado conectado ao bucket. O endereco `r2.dev` pode ser usado para desenvolvimento e teste inicial, mas a Cloudflare o limita e nao o recomenda para trafego de producao. As credenciais da API devem ter escrita limitada ao bucket do projeto e nunca devem ser adicionadas ao Git.

O comando `seed_demo_pets` tambem usa a interface de storage do Django, portanto as imagens demonstrativas seguem para o mesmo bucket quando executado em producao.

## Arquivos existentes

Arquivos que ja estejam em `backend/media/` nao sao migrados automaticamente. Como o projeto ainda nao foi publicado, os novos uploads podem comecar diretamente no R2. Caso seja necessario preservar arquivos locais no futuro, a migracao deve ser feita de maneira explicita antes de trocar o banco de producao.
