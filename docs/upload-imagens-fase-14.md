# Upload de imagens — Fase 14

## Estado atual

O cadastro de pet aceita fotos nos formatos JPG, PNG, WebP e GIF. O backend valida:

- tamanho maximo configuravel por `MAX_IMAGE_UPLOAD_SIZE_MB` (5 MB por padrao);
- formato permitido por `ALLOWED_IMAGE_CONTENT_TYPES`, conferido pela extensao;
- integridade basica do arquivo por meio do `ImageField` do Django e do Pillow.

Durante o desenvolvimento local, os arquivos ficam em `backend/media/pets/` e sao servidos em `/media/`.

## Por que `media/` nao basta em producao

Diretorios locais de plataformas como Render e Railway podem ser apagados quando o servico e recriado, atualizado ou movido de instancia. O banco continuaria apontando para o nome da imagem, mas o arquivo poderia desaparecer.

Por isso, a versao de producao deve guardar os arquivos em um storage persistente externo, como Cloudinary, Amazon S3 ou Cloudflare R2. O backend deve salvar no banco a URL retornada pelo provider, e nao depender do disco local da aplicacao.

## Proximo passo de producao

Para este projeto de portfolio, Cloudinary e uma opcao simples para comecar. A integracao ainda depende da escolha do provider e das credenciais da conta. Depois da escolha, as variaveis serao adicionadas ao ambiente de deploy, por exemplo:

```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

A configuracao atual deixa o upload local funcional e validado, mas o criterio de persistencia apos um deploy ainda fica pendente ate a integracao com um storage externo.
