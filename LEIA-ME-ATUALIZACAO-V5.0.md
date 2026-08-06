# Atualização V5.0 — Estoquista, IMEI automático e painel gerencial

Esta atualização inclui:

- estoque atualizado pela planilha `att.xlsx`;
- 1.001 unidades disponíveis na origem e 110 linhas RPAR excluídas;
- suporte a DEPS e NREM como estoque em entrega, sem somar ao disponível;
- perfil Estoquista com acesso somente aos pedidos;
- pedidos liberados automaticamente, sem aprovação do gerente;
- escolha automática de IMEI ou número de série;
- painel gerencial com gráficos, produtos em falta, saldo baixo, itens em entrega e acessos recentes;
- histórico detalhado das escolhas de produtos e das liberações automáticas.

Na planilha enviada não existem linhas DEPS ou NREM. Por isso, o painel mostrará zero em entrega nesta atualização. Quando uma próxima planilha contiver esses depósitos, o sistema estará preparado para exibi-los separadamente.

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
- pedidos antigos;
- números de série já retirados;
- histórico.

O pacote não contém nem substitui o `wrangler.jsonc`, mantendo a ligação com o banco atual.

## Novo fluxo de pedido

1. O vendedor escolhe o aparelho, a memória, a cor e, se desejar, capa e película.
2. Ao confirmar, o sistema confere o saldo.
3. O sistema escolhe automaticamente os números de série.
4. O pedido é liberado e o estoque recebe a baixa numa única operação.
5. O vendedor e o Estoquista já veem o IMEI do aparelho.

Capas e películas continuam com baixa serializada no banco, mas seus números internos não são exibidos na tela de separação.

## Criar um Estoquista

1. Entre como gerente.
2. Abra `Usuários`.
3. Clique em `Novo usuário`.
4. Selecione o perfil `Estoquista`.
5. Informe nome, e-mail e senha provisória.

Depois de trocar a senha provisória, esse usuário verá somente `Pedidos para separar`.
