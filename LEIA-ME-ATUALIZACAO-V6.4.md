# Atualização 6.4 — operação do Estoquista

Esta versão amplia a rotina do Estoquista sem liberar funções administrativas.

## O que mudou

- o Estoquista passa a iniciar em um painel operacional próprio;
- o painel mostra disponibilidade, reservas, materiais sem saldo e pedidos para separar;
- a tela **Conferir estoque** apresenta preço, código material, saldo físico, reservado, disponível e itens em entrega;
- aparelhos com preço por plano podem ser consultados pela categoria exata;
- o Estoquista pode cancelar pedidos pendentes ou liberados;
- o cancelamento de pedido liberado devolve automaticamente quantidades e IMEIs ao estoque;
- o histórico registra o usuário, o perfil Estoquista, o saldo restaurado e os itens devolvidos;
- Vendedores e Estoquistas recebem uma versão simples do Alinhamento, com leitura aproximada de 5 minutos;
- a Central de Alinhamento completa continua disponível somente para o Gerente.

## Permissões preservadas

O Estoquista **não** pode criar pedidos, ajustar o saldo manualmente, administrar usuários nem consultar a auditoria gerencial. Essas regras são verificadas no Worker, e não apenas escondidas na tela.

## Banco de dados

Esta versão não cria uma nova migração. O banco D1 atual, os usuários, os pedidos e o estoque são preservados.

## Como validar e publicar

Na pasta do projeto, execute:

```bash
npm install
npm run check
npm test
npx wrangler deploy --dry-run
npx wrangler deploy --keep-vars
```

O resultado esperado dos testes é:

```text
tests 16
pass 16
fail 0
```

Depois da publicação, abra `https://controleestoque.app.br` e pressione `Ctrl + F5`.

## Conferência recomendada

1. Entre com um usuário Estoquista.
2. Confira se aparecem **Visão do estoque**, **Conferir estoque**, **Pedidos para separar** e **Alinhamento rápido**.
3. Abra **Conferir estoque**, escolha uma categoria de plano e confirme um preço de aparelho.
4. Em um pedido de teste, use **Cancelar e devolver ao estoque**.
5. Confira se o pedido ficou cancelado e se a quantidade voltou ao estoque.
6. Entre como Gerente e confirme o registro no Histórico.
