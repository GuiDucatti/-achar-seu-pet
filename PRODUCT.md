# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Pessoas que perderam um pet e precisam organizar uma busca local, além de pessoas da comunidade que podem reconhecer um animal ou registrar um avistamento.

## Product Purpose

O Achar seu Pet centraliza cadastros, buscas por regiao, mapas aproximados e avistamentos para aumentar a chance de um pet voltar para casa. O sucesso e uma busca mais clara para quem perdeu o animal e uma forma simples de ajudar para quem encontrou uma pista.

## Positioning

O produto junta o cadastro original com um historico geolocalizado de pistas, mantendo a area do desaparecimento aproximada para equilibrar utilidade e privacidade.

## Operating Context

A aplicacao e usada principalmente em situacoes urgentes e no celular, mas tambem precisa funcionar bem em telas maiores para consultas, cadastro e acompanhamento de historicos.

## Capabilities and Constraints

- cadastro e login com JWT;
- cadastro, edicao e exclusao de pets pelo autor;
- upload validado de imagens;
- filtros por status, estado, cidade, especie, sexo, data e texto;
- geocoding por Nominatim/OpenStreetMap;
- mapa Leaflet com area aproximada;
- registro de avistamentos com coordenadas e contato opcional;
- timeline ordenada por data e calculo de proximidade;
- compartilhamento por WhatsApp;
- estados de carregamento, vazio, sucesso e erro;
- React 19, Vite, React Router, Axios, Leaflet, Framer Motion, Lucide React e Oxlint;
- backend Django REST Framework, com frontend e backend desacoplados;
- o endereco completo nao deve ser exibido publicamente;

## Brand Commitments

O nome e Achar seu Pet. A identidade existente foi inspirada na Lobinha, uma cachorra caramela e branca com olhos azuis. O produto deve preservar um tom humano, reconfortante e cuidadoso, sem fabricar numeros, depoimentos ou garantias de reencontro.

## Evidence on Hand

- fotografias editoriais locais em `frontend/src/assets/editorial/`, com fontes registradas em `CREDITS.md`;
- cadastro real de demonstracao no backend;
- documentacao funcional nas fases dentro de `docs/`;
- o projeto nao possui depoimentos, metricas publicas ou provas comerciais para serem inventadas.

## Product Principles

- Uma pista pequena merece um caminho claro.
- A urgencia da busca nao deve sacrificar a privacidade.
- Quem ajuda precisa entender o que fazer sem aprender a ferramenta.
- A informacao deve ser escaneavel no celular e confiavel em telas maiores.
- Cada estado da interface deve tratar a pessoa com cuidado.

## Accessibility & Inclusion

Preservar HTML semantico, labels associados, foco visivel, contraste adequado, areas de toque confortaveis, navegacao por teclado, mensagens compreensiveis e suporte a `prefers-reduced-motion`.

<!--
Assumptions inferred from the explicit redesign brief and the existing README/docs:
- the primary operating context is local, urgent and often mobile;
- the current Lobinha identity remains binding;
- no commercial claims or social proof should be introduced.
-->
