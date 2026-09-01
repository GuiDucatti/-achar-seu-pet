# Conteudo humano e fotografia contextual

## Objetivo

Tornar as principais paginas do Achar seu Pet mais humanas, acolhedoras e
contextuais sem realizar outro redesign global. Fotografias reais e textos
curtos devem ajudar a pessoa a entender a tarefa, tomar uma decisao ou se
sentir acompanhada. Nenhum elemento sera adicionado apenas para preencher
espaco.

## Direcao

O projeto seguira uma abordagem de momentos editoriais calibrados:

- paginas narrativas podem usar fotografias amplas;
- paginas operacionais recebem intervencoes compactas junto da tarefa;
- detalhes e edicao usam a foto real do pet, sem fotografia externa;
- formas graficas seguem a identidade Lobinha: verde, caramelo, azul e papel;
- cada composicao varia conforme a pagina, evitando um banner repetido;
- textos sao concretos, curtos e sem promessas de reencontro.

A referencia visual orienta apenas a relacao entre fotografia, texto, forma e
respiro. Layout, identidade, cores e conteudo permanecem proprios do Lobinha.

## Aplicacao por rota

### Inicio (`/`)

- Substituir o hero atual por uma fotografia real de tutora com cachorro.
- Substituir a imagem narrativa por uma cena domestica real com gato.
- Manter hierarquia, acoes e estrutura existentes.
- Mensagem de apoio: "Prestar atencao no caminho ja e uma forma de ajudar."

### Pets perdidos (`/pets`)

- Adicionar uma composicao compacta no cabecalho, sem criar um hero.
- Usar uma pessoa caminhando com cachorro em um bairro.
- Mensagem: "Comece perto de onde ele foi visto. Ruas e cidades vizinhas
  tambem podem guardar uma pista."
- No celular, a imagem deve permanecer curta e nao empurrar a busca para longe.

### Encontrados (`/encontrados`)

- Diferenciar emocionalmente esta rota da listagem de perdidos.
- Usar uma cena natural de tutor abracando um cachorro.
- Mensagem: "Estes reencontros mostram por que vale a pena registrar,
  compartilhar e continuar olhando."
- A composicao deve ser mais tranquila que um hero e vir antes dos filtros.

### Detalhe do pet (`/pets/:id`)

- Nao adicionar fotografia de banco.
- Tratar a foto do cadastro como o principal momento humano da pagina.
- Proximo das acoes, usar a orientacao: "Reconheceu algum detalhe? Compartilhe
  o anuncio ou registre somente o que voce observou."
- No modal de avistamento, usar uma miniatura do pet e a mensagem: "Descreva
  apenas o que voce observou e indique o local com a maior precisao possivel."

### Cadastrar pet (`/cadastrar-pet`)

- Substituir a imagem lateral atual por uma fotografia real de tutor e pet.
- Manter o stepper e o upload como elementos principais.
- Mensagem: "Uma foto nitida e um detalhe marcante ajudam mais do que uma
  descricao longa."
- No celular, a orientacao deve ficar junto do upload e a fotografia deve ser
  reduzida para nao atrasar a primeira etapa.

### Editar pet (`/pets/:id/editar`)

- Nao adicionar fotografia de banco.
- Manter a foto atual do pet como referencia visual.
- Mensagem: "Mudou a regiao, surgiu uma pista ou ele voltou? Atualize o
  cadastro para ninguem seguir uma informacao antiga."

### Entrar (`/login`)

- Substituir a imagem atual por uma cena real de pessoa com gato em casa.
- Mensagem: "Entre para acompanhar seus cadastros e manter cada informacao
  atualizada."
- Preservar o formulario como foco e evitar texto adicional.

### Criar conta (`/criar-conta`)

- Substituir a imagem atual por uma familia ou casal com um pet em ambiente
  cotidiano.
- Mensagem: "A conta permite publicar uma busca, acompanhar pistas e atualizar
  o anuncio quando algo mudar."

### Minha conta (`/minha-conta`)

- Adicionar um bloco editorial horizontal abaixo dos dados da conta.
- Usar pessoa com gato ou cachorro em casa e links para rotas existentes:
  procurar pets e cadastrar pet.
- Mensagem: "Com sua conta, voce pode iniciar uma busca e manter seus anuncios
  atualizados."

### Quem somos (`/quem-somos`)

- Substituir a fotografia atual por uma familia com cachorro.
- Manter a composicao editorial ampla existente.
- Mensagem: "O Lobinha organiza as informacoes para que quem procura e quem
  viu consigam se encontrar."

## Fotografias aprovadas para implementacao

Todas as imagens abaixo sao do Pexels e aparecem como gratuitas para uso:

- Inicio, hero: `https://www.pexels.com/photo/woman-hugging-her-pet-dog-outdoors-in-sunshine-36354790/`
- Inicio, historia: `https://www.pexels.com/photo/woman-cuddling-with-cat-at-home-14886944/`
- Pets perdidos: `https://www.pexels.com/photo/man-walking-dog-in-peaceful-neighborhood-setting-30346768/`
- Encontrados: `https://www.pexels.com/photo/person-hugging-dog-16575475/`
- Cadastro: `https://www.pexels.com/photo/smiling-woman-hugging-dog-in-nature-5212467/`
- Login: `https://www.pexels.com/photo/crop-glad-woman-cuddling-cute-cat-at-home-6001549/`
- Criar conta: `https://www.pexels.com/photo/man-in-white-shirt-holding-a-cat-at-home-8359720/`
- Minha conta: `https://www.pexels.com/photo/man-holding-a-persian-cat-19190145/`
- Quem somos: `https://www.pexels.com/photo/a-happy-family-sitting-on-the-couch-while-playing-with-their-dog-5998697/`

A licenca vigente deve ser reconfirmada no momento do download. Os creditos de
fotografo, pagina original e fonte serao registrados em `CREDITS.md`, mesmo que
a atribuicao nao seja obrigatoria.

## Implementacao

- Baixar arquivos localmente para `frontend/src/assets/editorial/`.
- Preferir WebP e dimensoes adequadas ao maior uso real.
- Nao carregar imagens remotas em tempo de execucao.
- Criar no maximo componentes pequenos para padroes realmente compartilhados;
  nao forcar todas as composicoes no mesmo componente.
- Preservar rotas, API, autenticacao, mapa, busca, cadastro, upload, status,
  avistamentos e timeline.
- Manter as transicoes existentes e respeitar `prefers-reduced-motion`.

## Acessibilidade e desempenho

- Todo `alt` deve descrever a cena e sua funcao, sem repetir o texto adjacente.
- Imagens decorativas devem usar `alt=""` quando nao acrescentarem informacao.
- Nenhum texto essencial sera desenhado dentro da fotografia.
- Contraste deve permanecer legivel mesmo antes de a imagem carregar.
- Imagens abaixo da primeira dobra devem usar carregamento tardio.
- Recortes precisam preservar pessoas e animais em desktop, tablet e celular.

## Validacao

- Verificar Home, listagens, detalhe, cadastro, edicao, autenticacao, conta e
  Quem somos em desktop, notebook, tablet e celular.
- Confirmar que nenhuma fotografia compete com busca, upload, mapa ou acoes.
- Confirmar ausencia de overflow horizontal, saltos de layout e texto cortado.
- Testar loading, vazio, erro, modal de avistamento e rotas protegidas.
- Fazer uma segunda passada visual e remover qualquer elemento que pareca
  decoracao sem funcao.

## Fora de escopo

- redesign global;
- alteracao de funcionalidades ou regras de negocio;
- novas rotas ou campos de dados;
- depoimentos, numeros ou provas sociais inventadas;
- imagens de banco dentro dos detalhes e da edicao de um pet.
