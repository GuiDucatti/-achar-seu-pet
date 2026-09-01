# Tratamento de erros e UX — Fase 22

## Implementacao

O frontend agora diferencia os principais estados da aplicacao:

- carregamento;
- lista vazia;
- sucesso;
- validacao de formulario;
- API offline;
- sessao expirada;
- falta de permissao;
- cadastro nao encontrado;
- erro interno do servidor.

As respostas de erro da API sao convertidas em mensagens legiveis por `apiErrors.js`, enquanto o erro original continua no console para facilitar a depuracao durante o desenvolvimento.

O interceptor do Axios remove os tokens e avisa o `AuthProvider` quando recebe `401`. Uma falha inesperada de renderizacao e capturada por `AppErrorBoundary`, que oferece uma acao clara para recarregar a pagina.
