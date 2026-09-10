# Revisao final da Fase 2

## Estado atual

O projeto esta versionado em um repositorio privado no GitHub e possui integracao continua. A aplicacao ainda nao foi publicada em uma hospedagem.

## Validacoes concluidas

- Django `check` sem problemas;
- 59 testes automatizados backend passando;
- 20 testes frontend passando;
- frontend lint passando;
- frontend build passando;
- verificacoes automaticas configuradas para pushes e pull requests em `main`;
- CORS local corrigido para as portas 5173 e 5174;
- mapa Leaflet usando somente localizacao publica aproximada;
- privacidade de endereco, coordenadas e avistamentos protegida no backend;
- renovacao automatica de JWT com protecao contra concorrencia entre sessoes;
- documentacao das fases criada;
- README de portfolio criado.

## Como testar agora

```text
Frontend: http://127.0.0.1:5173/pets
API:      http://127.0.0.1:8000/api/pets/
```

Se a porta `5173` estiver ocupada, confirme no terminal qual porta alternativa o Vite escolheu.

## Pendencias externas

- testar manualmente todos os fluxos pela interface;
- escolher e autenticar os provedores de hospedagem;
- configurar PostgreSQL de producao;
- configurar armazenamento persistente para imagens;
- publicar o frontend e o backend;
- executar o checklist em dominio HTTPS;
- adicionar screenshots e links reais ao README.

## Regra de autorizacao

Nenhum deploy sera feito sem autorizacao explicita do responsavel.
