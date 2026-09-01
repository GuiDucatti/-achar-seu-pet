# Testes automatizados - Fase 24

## Objetivo

Registrar as regras criticas cobertas pela suite automatizada do backend antes de qualquer publicacao.

## Cobertura atual

Os testes usam `django.test.TestCase` e `rest_framework.test.APIClient` e cobrem:

- criacao de pet com upload valido;
- limite e formato de imagem;
- autenticacao por usuario e por email com JWT;
- cadastro de usuario com senha armazenada com hash;
- acesso protegido da rota `me`;
- permissao do autor para editar o proprio pet;
- bloqueio de edicao por outro usuario;
- bloqueio de criacao sem autenticacao;
- filtros por especie, sexo, texto e data;
- criacao e validacao de avistamentos;
- classificacao de proximidade;
- calculo de distancia com Haversine.

## Como executar

Na raiz do projeto:

```bash
cd backend
../.venv/bin/python manage.py test
```

O comando cria um banco temporario, executa os testes e o remove ao final. Nenhuma informacao e publicada ou enviada para servicos externos durante a suite.

## Proxima evolucao

Depois que o fluxo inteiro for validado manualmente, podemos adicionar testes de interface com Vitest e React Testing Library. O deploy continua bloqueado ate a autorizacao explicita do responsavel pelo projeto.
