# Atualização V5.1 — Cancelamento gerencial de pedidos

Esta atualização acrescenta ao painel do gerente a opção **Cancelar e devolver ao estoque**.

Ao confirmar o cancelamento de um pedido já liberado, o sistema:

- altera o pedido para `Cancelado`;
- devolve todas as quantidades ao saldo disponível;
- libera novamente os IMEIs e números de série escolhidos;
- mantém no pedido gerencial a relação dos números de série que haviam sido utilizados;
- registra no histórico quem cancelou, quais produtos voltaram e quais números de série foram liberados.

Vendedores não podem cancelar um pedido que já foi liberado. O perfil Estoquista continua somente com acesso de consulta aos pedidos.

## Como atualizar

1. Não apague a pasta atual.
2. Extraia o ZIP.
3. Copie o conteúdo extraído para:

   `C:\Users\nic\Documents\controle-estoque-cloudflare`

4. Escolha **Substituir os arquivos no destino**.
5. Abra o terminal nessa pasta e execute, um por vez:

   `npm install`

   `npm run db:remote`

   `npm run deploy`

6. Quando a migração perguntar se deseja continuar, digite `y` e pressione Enter.
7. Abra `https://controleestoque.app.br` e pressione `Ctrl + F5`.

## O que será preservado

- usuários e senhas;
- sessões atuais;
- estoque atual;
- pedidos existentes;
- números de série já retirados;
- histórico completo.

O pacote não contém nem substitui o `wrangler.jsonc`, mantendo a ligação com o banco atual.

## Como cancelar

1. Entre com um acesso de Gerente.
2. Abra `Pedidos`.
3. Localize um pedido liberado.
4. Clique em **Cancelar e devolver ao estoque**.
5. Confira o aviso e confirme.

O pedido passará para a aba `Cancelados`, e os itens ficarão disponíveis novamente para novos pedidos.
