# Testes Backend - Fase 9

Este roteiro valida o fluxo principal da API antes de iniciar o frontend React.

## Base URL local

```text
http://127.0.0.1:8000/api
```

## Autenticacao

### 1. Cadastro

```http
POST /api/auth/register/
```

Payload:

```json
{
  "username": "usuario_teste",
  "email": "usuario@example.com",
  "password": "senha-forte-123"
}
```

Resultado esperado: `201 Created`.

### 2. Login

```http
POST /api/auth/token/
```

Payload:

```json
{
  "username": "usuario@example.com",
  "password": "senha-forte-123"
}
```

Resultado esperado: `200 OK` com `access` e `refresh`.

### 3. Usuario atual

```http
GET /api/auth/me/
```

Header:

```http
Authorization: Bearer <access_token>
```

Resultado esperado: `200 OK` com dados do usuario autenticado.

### 4. Refresh token

```http
POST /api/auth/token/refresh/
```

Payload:

```json
{
  "refresh": "<refresh_token>"
}
```

Resultado esperado: `200 OK` com novo `access`.

## Pets

### 5. Listar pets sem login

```http
GET /api/pets/
```

Resultado esperado: `200 OK`.

### 6. Criar pet sem login

```http
POST /api/pets/
```

Resultado esperado: `401 Unauthorized`.

### 7. Criar pet autenticado

```http
POST /api/pets/
```

Header:

```http
Authorization: Bearer <access_token>
```

Usar `multipart/form-data` por causa do campo `foto`.

Campos esperados:

```text
nome
foto
especie
raca
cor
sexo
caracteristicas
estado
cidade
endereco_texto
data_desaparecimento
descricao
contato
```

Resultado esperado: `201 Created`.

### 8. Buscar pet por ID

```http
GET /api/pets/{id}/
```

Resultado esperado: `200 OK`.

### 9. Filtros

```http
GET /api/pets/?estado=SP
GET /api/pets/?cidade=Campinas
GET /api/pets/?status=P
```

Resultado esperado: `200 OK`.

### 10. Editar proprio pet

```http
PATCH /api/pets/{id}/
```

Header:

```http
Authorization: Bearer <access_token_do_autor>
```

Payload:

```json
{
  "status": "E"
}
```

Resultado esperado: `200 OK`.

### 11. Tentar editar pet de outro usuario

```http
PATCH /api/pets/{id}/
```

Header:

```http
Authorization: Bearer <access_token_de_outro_usuario>
```

Resultado esperado: `403 Forbidden`.

### 12. Tentar excluir pet de outro usuario

```http
DELETE /api/pets/{id}/
```

Resultado esperado: `403 Forbidden`.

### 13. Excluir proprio pet

```http
DELETE /api/pets/{id}/
```

Header:

```http
Authorization: Bearer <access_token_do_autor>
```

Resultado esperado: `204 No Content`.

## Avistamentos

### 14. Criar avistamento

```http
POST /api/pets/{id}/avistamentos/
```

Payload:

```json
{
  "latitude": -22.9,
  "longitude": -47.06,
  "descricao": "Visto perto do centro",
  "contato_quem_viu": "Maria"
}
```

Resultado esperado: `201 Created`.

### 15. Listar avistamentos

```http
GET /api/pets/{id}/avistamentos/
```

Resultado esperado: `200 OK`.

## Resultado da bateria automatizada manual

Executado em `2026-08-28` com `rest_framework.test.APIClient`.

```text
OK: cadastro: esperado=201 recebido=201
OK: cadastro com email duplicado: esperado=400 recebido=400
OK: login JWT por email: esperado=200 recebido=200
OK: /me autenticado: esperado=200 recebido=200
OK: refresh token: esperado=200 recebido=200
OK: listar pets anonimo: esperado=200 recebido=200
OK: criar pet anonimo bloqueado: esperado=401 recebido=401
OK: criar pet autenticado: esperado=201 recebido=201
OK: buscar pet por id: esperado=200 recebido=200
OK: filtro por estado: esperado=200 recebido=200
OK: filtro por cidade: esperado=200 recebido=200
OK: filtro por status perdido: esperado=200 recebido=200
OK: editar proprio pet/status encontrado: esperado=200 recebido=200
OK: editar pet de outro usuario bloqueado: esperado=403 recebido=403
OK: excluir pet de outro usuario bloqueado: esperado=403 recebido=403
OK: criar avistamento anonimo: esperado=201 recebido=201
OK: listar avistamentos: esperado=200 recebido=200
OK: excluir proprio pet: esperado=204 recebido=204
```
