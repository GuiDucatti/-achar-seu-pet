# Revisao final da Fase 2

## Estado atual

O desenvolvimento local da Fase 2 esta concluido. O projeto ainda nao foi enviado ao GitHub nem publicado em uma hospedagem.

## Validacoes concluidas

- Django `check` sem problemas;
- 18 testes automatizados backend passando;
- frontend lint passando;
- frontend build passando;
- API local respondendo;
- CORS local corrigido para as portas 5173 e 5174;
- cinco pets de demonstracao com fotos e coordenadas;
- mapa Leaflet preparado com marcador e area aproximada;
- fluxo local de detalhe, avistamento, edicao e exclusao validado;
- documentacao das fases criada;
- README de portfolio criado.

## Como testar agora

```text
Frontend: http://127.0.0.1:5174/pets
API:      http://127.0.0.1:8000/api/pets/
```

Cadastros de demonstracao: Thor, Mel, Zeus, Nina e Bob.

## Pendencias externas

- testar manualmente todos os fluxos pela interface;
- escolher e autenticar os provedores de hospedagem;
- configurar PostgreSQL de producao;
- configurar armazenamento persistente para imagens;
- publicar o frontend e o backend;
- executar o checklist em dominio HTTPS;
- criar o repositorio GitHub como privado, se desejado;
- adicionar screenshots e links reais ao README.

## Regra de autorizacao

Nenhuma publicacao, deploy ou criacao de repositorio sera feita sem autorizacao explicita do responsavel.
