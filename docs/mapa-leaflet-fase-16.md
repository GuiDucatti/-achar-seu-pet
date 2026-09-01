# Mapa com Leaflet — Fase 16

## Implementacao

A pagina de detalhe agora usa `react-leaflet` para mostrar:

- tiles do OpenStreetMap;
- marcador com a foto do pet;
- circulo com o raio aproximado vindo de `raio_area_metros`;
- popup com nome, cidade e estado.

O mapa so e renderizado quando a API retorna latitude e longitude validas. Enquanto o geocoding nao encontrar uma coordenada, a pagina mostra um estado informativo sem quebrar o restante do detalhe.

## Privacidade

O texto completo de `endereco_texto` nao e exibido publicamente no detalhe. A interface mostra apenas cidade e estado, enquanto o mapa representa uma area aproximada.

Os tiles sao carregados do OpenStreetMap e a atribuicao obrigatoria permanece visivel no controle do mapa. Em producao, o uso deve respeitar a politica do provedor de tiles e pode exigir um provedor dedicado conforme o trafego crescer.
