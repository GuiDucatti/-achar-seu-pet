# Geocoding — Fase 15

## Implementacao

O backend consulta o Nominatim/OpenStreetMap usando:

- `endereco_texto`, `cidade`, `estado` e `Brasil` como busca;
- `User-Agent` configuravel por ambiente;
- timeout de 5 segundos por padrao;
- apenas o primeiro resultado brasileiro;
- validacao dos limites de latitude e longitude.

No cadastro, a busca acontece depois que o pet e salvo. Na edicao, ela so acontece quando endereco, cidade ou estado mudam. Assim, uma alteracao de descricao ou status nao gera uma chamada desnecessaria.

Se nao houver resultado, ocorrer um timeout ou o Nominatim estiver indisponivel, o pet continua salvo e as coordenadas permanecem vazias. O mapa pode tratar esse estado como "localizacao nao encontrada".

## Configuracao

```env
GEOCODING_ENABLED=True
NOMINATIM_URL=https://nominatim.openstreetmap.org/search
NOMINATIM_USER_AGENT=AcharSeuPet/1.0 (seu-email@example.com)
GEOCODING_TIMEOUT_SECONDS=5
```

O Nominatim publico deve ser usado com responsabilidade. Em producao, substitua o email do `User-Agent` por um contato real, implemente cache e considere um provedor dedicado se o volume crescer.
