# Compartilhamento no WhatsApp — Fase 19

## Implementacao

A pagina de detalhe gera uma mensagem com o nome do pet, cidade, estado e URL atual:

```text
Ajude a encontrar o Rex!
Desapareceu em Campinas - SP.
Veja mais informacoes:
https://site/pets/12
```

O link usa o formato `https://wa.me/?text=...` e `encodeURIComponent` para transformar espacos, quebras de linha e caracteres especiais em uma URL valida. Ele abre em uma nova aba com a mensagem pronta para envio.
