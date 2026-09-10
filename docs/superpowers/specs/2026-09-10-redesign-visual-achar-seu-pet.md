# Redesign visual do Achar seu Pet

## Direcao

Adaptar a referencia para uma interface editorial de busca local: fotografias
reais, papel claro, verde profundo, caramelo para acao e azul para geografia.
A referencia orienta ritmo e composicao, mas nao sera copiada literalmente.

O produto continua sendo uma ferramenta de busca e apoio comunitario. Nao serao
inventadas metricas, depoimentos, provedores de login ou novas regras de negocio.

## Escopo por rota

- Inicio: hero fotografico com CTA de cadastro e busca, sinais reais da rede,
  pets recentes e historia curta sobre foto, bairro e pista.
- Pets perdidos e encontrados: cabecalho editorial compacto, busca e filtros
  escaneaveis, cards em tres colunas no desktop e uma no celular.
- Quem somos: composicao assimetrica com fotografia real, manifesto curto e
  principios concretos da plataforma.
- Entrar e criar conta: painel fotografico contextual e formulario atual,
  sem alterar autenticacao.
- Minha conta: painel operacional com dados reais e atalhos ja existentes,
  sem estatisticas fabricadas.
- Cadastrar e editar pet: formulario, upload, endereco e feedback preservados,
  com hierarquia visual e imagem lateral moderada.
- Detalhe do pet: foto de reconhecimento, contato, compartilhamento, mapa,
  avistamentos e acoes do tutor preservados.

## Regras de implementacao

- Usar as fotografias reais ja licenciadas do Pexels quando adequadas; buscar
  alternativas na mesma fonte apenas quando uma composicao exigir outra imagem.
- Armazenar imagens localmente em WebP e manter fontes em `CREDITS.md`.
- Preservar rotas, API, autenticacao, filtros, mapa, avistamentos e contratos
  de dados existentes.
- Manter o header compacto e substituir a pata pela mascote existente quando
  ela estiver disponivel no projeto, sem redesenhar a estrutura da navegacao.
- Usar tipografia Newsreader para significado e Outfit para acao e metadados.
- Manter cantos compactos, divisores leves e sombras discretas.
- Garantir mobile em torno de 390px, tablet em torno de 768px e desktop em
  torno de 1440px, sem overflow ou texto cortado.
- Usar movimento apenas para feedback funcional e uma entrada curta por grupo;
  respeitar `prefers-reduced-motion`.

## Validacao

Executar lint, testes e build existentes. Revisar visualmente as rotas
principais em desktop, tablet e mobile, incluindo menu, formularios, busca,
modal de avistamento, mapa e estados de erro/loading. Rodar o detector manual
do Impeccable nos arquivos alterados e revisar o diff antes de qualquer push.
