# Busca regional e dados de demonstracao

## Contexto

O Achar seu Pet ja permite listar publicamente pets perdidos e encontrados, filtrar por cidade e estado e guardar coordenadas aproximadas dos cadastros. O backend tambem possui uma implementacao testada da formula de Haversine, atualmente usada apenas para comparar avistamentos com a regiao de um pet.

Esta mudanca adiciona duas capacidades relacionadas:

1. dados ficticios claramente identificados para testar as telas de perdidos e encontrados;
2. uma busca publica por proximidade que encontre animais na cidade do visitante e em cidades vizinhas.

## Objetivos

- Permitir que qualquer visitante procure animais em um raio de 10, 25, 50 ou 100 km.
- Usar 50 km como raio inicial.
- Aceitar a localizacao do navegador ou uma cidade e UF informadas manualmente.
- Ordenar os resultados do mais proximo ao mais distante.
- Preservar todos os filtros atuais de status, texto, especie, sexo e data.
- Manter cidade e estado como fallback quando a busca por raio nao puder ser resolvida.
- Criar registros de teste perdidos e encontrados, com cachorros e gatos, fotos e coordenadas.
- Identificar todo registro ficticio como `Cadastro de demonstracao`.

## Nao objetivos

- Nao enviar alertas ou notificacoes por proximidade.
- Nao executar buscas continuamente em segundo plano.
- Nao armazenar a localizacao do visitante.
- Nao afirmar que um animal ficticio foi encontrado por meio da plataforma.
- Nao substituir a listagem atual nem transformar a pagina em uma experiencia centrada no mapa.
- Nao instalar um banco espacial ou GeoDjango nesta etapa.

## Experiencia de busca

### Entrada

O bloco principal de localizacao usara a mensagem:

> Coloque sua regiao para ver animais perto de voce.

Ele apresentara duas entradas:

- `Usar minha localizacao`, que solicita a permissao nativa do navegador;
- cidade e UF, acompanhadas da acao `Usar esta regiao`.

O raio sera um controle segmentado com 10, 25, 50 e 100 km. A opcao inicial sera 50 km.

### Regiao ativa

Depois que a origem for resolvida, a interface mostrara um resumo como:

`Perto de Birigui, SP - ate 50 km`

ou:

`Perto da sua localizacao - ate 50 km`

Cada resultado com coordenadas mostrara a distancia aproximada, por exemplo `12 km de voce`. Resultados serao ordenados por distancia e, em caso de empate, pelos cadastros mais recentes.

Os filtros de texto, especie, sexo e data continuarao atualizando os resultados. Enquanto uma regiao estiver ativa, esses filtros serao enviados ao endpoint de proximidade. Ao remover a regiao, a pagina voltara a usar a listagem publica existente.

### Permissao negada ou indisponivel

Se o navegador negar a localizacao, a interface nao tratara isso como erro fatal. Ela mostrara uma mensagem curta e mantera cidade e UF disponiveis.

Se a cidade informada nao puder ser geocodificada, o frontend repetira a busca usando os filtros comuns de cidade e UF. Nesse estado, a interface explicara que esta mostrando apenas os registros da cidade informada, sem prometer cidades vizinhas ou distancia.

### Privacidade

- Coordenadas do navegador serao arredondadas para tres casas decimais antes do envio, aproximadamente 110 metros de precisao.
- A busca usara uma requisicao `POST`, evitando colocar coordenadas na URL e no historico do navegador.
- A origem nao sera salva no banco de dados.
- O frontend manterá a origem apenas no estado da pagina durante a sessao atual.

## API de proximidade

### Endpoint

Adicionar uma acao publica ao `PetViewSet`:

```http
POST /api/pets/proximos/
```

Exemplo com localizacao do navegador:

```json
{
  "latitude": -21.288,
  "longitude": -50.340,
  "raio_km": 50,
  "status": "P",
  "especie": "cachorro",
  "busca": "coleira azul"
}
```

Exemplo com cidade:

```json
{
  "cidade_origem": "Birigui",
  "estado_origem": "SP",
  "raio_km": 50,
  "status": "P"
}
```

### Validacao

- Latitude deve estar entre -90 e 90.
- Longitude deve estar entre -180 e 180.
- Latitude e longitude devem ser informadas juntas.
- Cidade exige uma UF com duas letras.
- `raio_km` deve ser um dos valores 10, 25, 50 ou 100.
- Os filtros de status, especie, sexo e data devem respeitar as escolhas existentes no modelo.
- Uma origem por coordenadas tem prioridade quando os dois formatos forem enviados.

### Resposta

```json
{
  "origem": {
    "tipo": "cidade",
    "rotulo": "Birigui, SP",
    "raio_km": 50
  },
  "resultados": [
    {
      "id": 1,
      "nome": "Lua",
      "cidade": "Bilac",
      "estado": "SP",
      "distancia_km": 18.4
    }
  ]
}
```

O serializer de pets recebera um campo somente leitura `distancia_km`. Fora da busca regional, o campo sera sempre `null`, mantendo um contrato estavel.

### Calculo

O backend reutilizara `haversine_distance_km`. Como o projeto usa SQLite localmente e o volume atual e pequeno, nao sera introduzido um banco espacial.

O fluxo sera:

1. aplicar os filtros comuns ao queryset;
2. ignorar na busca regional registros sem latitude ou longitude;
3. reduzir candidatos por uma caixa geografica aproximada;
4. calcular a distancia Haversine dos candidatos;
5. manter somente distancias dentro do raio;
6. ordenar por distancia e data de criacao.

A caixa geografica evita calcular a distancia para registros claramente distantes e prepara a implementacao para um volume maior sem adicionar infraestrutura prematura.

### Geocoding da cidade

Quando a origem for cidade e UF, o backend reutilizara o cliente Nominatim existente com endereco vazio. O resultado podera usar o cache padrao do Django por cidade/UF para reduzir chamadas repetidas.

Se o geocoding estiver desativado, falhar ou nao encontrar a cidade, a API respondera com HTTP 400 e o corpo abaixo. O frontend entao executara o fallback exato por cidade/UF na listagem atual.

```json
{
  "codigo": "regiao_nao_encontrada",
  "detail": "Nao foi possivel localizar a cidade informada."
}
```

## Dados de demonstracao

### Modelo

Adicionar ao modelo `Pet`:

```python
is_demo = models.BooleanField(default=False)
```

O campo sera somente leitura para usuarios comuns na API. Apenas o comando de demonstracao e o admin poderao defini-lo diretamente.

### Carga repetivel

Criar o comando:

```bash
python manage.py seed_demo_pets
```

O comando usara `update_or_create` e um usuario tecnico de demonstracao para poder ser executado varias vezes sem duplicar registros. Ele nao removera cadastros criados por usuarios.

A carga tera exatamente dez registros:

- perdidos: Thor (cachorro/Birigui), Mel (cachorro/Aracatuba), Lua (gato/Bilac), Chico (cachorro/Coroados), Amora (gato/Penapolis) e Frida (gato/Birigui);
- encontrados: Zeus (cachorro/Birigui), Nina (cachorro/Aracatuba), Salem (gato/Bilac) e Bob (cachorro/Coroados);
- coordenadas coerentes com cada cidade;
- datas, racas, cores e caracteristicas variadas;
- fotos locais apropriadas ao animal;
- contato nao acionavel, como `Nao disponivel`.

O comando reutilizara e atualizara os cinco registros conhecidos do usuario tecnico `demo-local` quando eles existirem e criara os cinco restantes. Nenhum cadastro pertencente a outro usuario sera alterado ou removido.

Os registros encontrados apenas terao status `E`. Nenhum texto dira que foram encontrados por meio do Achar seu Pet.

### Identificacao visual

`PetCard` e `PetDetailPage` mostrarao o selo discreto `Cadastro de demonstracao` quando `is_demo` for verdadeiro. O selo sera informativo, sem competir com o status perdido/encontrado.

Na pagina de detalhe, o contato de demonstracao nao sera transformado em uma acao de telefone. A interface manterá claro que aquele registro existe para testar o produto.

## Componentes e responsabilidades

- `PetViewSet`: recebe e valida a busca regional, aplica filtros e devolve resultados ordenados.
- `proximity.py`: concentra caixa geografica e calculo de distancia, sem conhecer HTTP.
- `PetSerializer`: expoe `is_demo` e `distancia_km` como leitura.
- `petService.js`: adiciona `listNearbyPets` sem alterar `listPets`.
- `PetsPage`: controla origem, permissao, raio, fallback e filtros progressivos.
- `PetCard`: apresenta distancia e selo de demonstracao.
- `PetDetailPage`: apresenta o selo e contato seguro de demonstracao.
- `seed_demo_pets`: cria ou atualiza somente a carga ficticia conhecida.

## Estados e recuperacao

- Localizacao sendo obtida: botao desabilitado e mensagem `Buscando sua regiao...`.
- Permissao negada: orientar o uso de cidade e UF.
- Navegador sem geolocation: oferecer diretamente cidade e UF.
- Regiao nao encontrada: executar fallback exato e explicar o limite.
- Nenhum pet no raio: sugerir ampliar para o proximo raio disponivel.
- API indisponivel: manter o estado de erro e a acao de tentar novamente ja existentes.
- Pet sem coordenadas: nao incluir na resposta regional; ele continua aparecendo na busca comum.

## Acessibilidade e mobile

- A permissao de localizacao so sera solicitada apos uma acao explicita.
- O controle de raio usara botoes com `aria-pressed` e foco visivel.
- Mudancas de regiao, loading e quantidade de resultados serao anunciadas com `aria-live`.
- Cidade e UF manterao labels reais, mesmo quando visualmente compactas.
- No celular, a acao de localizacao e a regiao digitada ficarao antes dos filtros avancados.
- Nenhum resultado dependera apenas de cor ou posicao para comunicar distancia/status.

## Testes

### Backend

- calcula distancia conhecida com Haversine;
- retorna apenas pets dentro de 10, 25, 50 e 100 km;
- ordena por distancia;
- combina proximidade com status, especie, sexo, data e texto;
- rejeita coordenadas e raios invalidos;
- resolve cidade e UF por geocoding simulado;
- retorna `regiao_nao_encontrada` quando o geocoding falha;
- mantem a busca regional publica;
- preserva a criacao de pets somente para autenticados;
- comando de demonstracao e idempotente;
- registros comuns continuam com `is_demo=False`.

### Frontend

- envia coordenadas arredondadas apos permissao;
- nao solicita permissao antes do clique;
- alterna os raios permitidos;
- usa cidade/UF quando geolocation falha;
- volta para filtro exato quando o backend nao resolve a regiao;
- atualiza resultados ao mudar filtros;
- mostra distancia apenas quando fornecida;
- mostra selo somente em cadastros de demonstracao;
- preserva loading, vazio, erro e tentar novamente;
- funciona em 1440 px, 768 px e 390 px sem overflow.

## Criterios de aceite

- Um visitante em Birigui consegue ativar sua localizacao e ver pets de cidades vizinhas dentro de 50 km.
- Um visitante que nega permissao consegue digitar Birigui/SP e obter a mesma categoria de busca regional.
- O visitante consegue trocar o raio para 10, 25 ou 100 km.
- Resultados regionais apresentam distancia e ordenacao coerentes.
- As paginas publicas exibem exemplos perdidos e encontrados.
- Todo exemplo ficticio possui identificacao visivel de demonstracao.
- Nenhuma mensagem atribui reencontros ficticios ao site.
- Rotas, autenticacao, cadastro, mapa, status, avistamentos e timeline continuam funcionando.
