# Timeline de avistamentos — Fase 18

## Implementacao

A pagina de detalhe usa os avistamentos enviados pela API e os apresenta em uma timeline:

- mais recente primeiro;
- data e hora do registro;
- descricao do avistamento;
- coordenadas informadas;
- contato, quando fornecido.

Quando um novo avistamento e criado, ele entra imediatamente no inicio da timeline. A ordenacao tambem e refeita no frontend como protecao adicional, enquanto o backend mantem a ordenacao padrao por `-criado_em`.

Quando nao existem registros, a pagina mostra um estado vazio e mantem disponivel o botao para cadastrar o primeiro avistamento.
