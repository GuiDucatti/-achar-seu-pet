# Busca por proximidade — Fase 20

## Implementacao

O backend usa a formula de Haversine para comparar a regiao do pet com cada avistamento. A resposta de cada avistamento inclui:

```json
{
  "distancia_km": 1.7,
  "proximo": true
}
```

O limite padrao e de 3 km e pode ser alterado por `PROXIMITY_THRESHOLD_KM`. Se o pet ainda nao tiver coordenadas, a distancia fica `null` e `proximo` fica `false`.

Na timeline, uma distancia dentro do limite aparece como possivel correspondencia proxima. Esta fase nao envia notificacoes; ela apenas calcula e apresenta o resultado.
