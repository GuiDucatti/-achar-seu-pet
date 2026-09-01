# Avistamentos — Fase 17

## Fluxo

Na pagina de detalhe, o botao `Vi esse pet!` abre um formulario com latitude, longitude, descricao e contato opcional. O frontend envia os dados para:

```text
POST /api/pets/{id}/avistamentos/
```

O `id` vem da rota do pet que esta aberto. Ele nao e digitado pelo usuario, evitando associar o avistamento ao cadastro errado.

O backend recebe o pet pela propria URL, valida os limites de latitude e longitude e salva a relacao com `pet=pet` no servidor.

Os registros retornados pela API tambem aparecem na pagina de detalhe em uma timeline, ordenados do mais recente para o mais antigo.
