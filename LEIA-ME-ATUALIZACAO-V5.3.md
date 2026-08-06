# Atualização V5.3 — Preços dos aparelhos

Esta atualização adiciona ao sistema a tabela de preços consultada no **Gramcell · Simulador Produtos**, com data de 04/08/2026.

## O que foi incluído

- 42 modelos do estoque vinculados ao simulador;
- nove categorias: Pré, Controle BTL, Controle Entrada, Controle Alto Valor, Pós Individual, Família 2, Família 3, Família 4/5 e Vivo V;
- escolha da categoria do plano antes de adicionar um aparelho;
- preço exato da memória/modelo selecionado;
- parcelamento sem juros conforme as faixas exibidas pelo simulador;
- total dos aparelhos na revisão do pedido;
- preço, categoria e data da tabela preservados no histórico do pedido;
- coluna de preço inicial na consulta gerencial do estoque;
- tablets, relógios e modelos ausentes no simulador identificados como **Preço não disponível**;
- capas e películas permanecem fora do cálculo de preço.

Pedidos antigos continuam válidos e aparecem sem preço. Usuários, senhas, estoque, IMEIs, cancelamentos e histórico são preservados.

## Como atualizar

1. Não apague a pasta atual.
2. Extraia o ZIP.
3. Copie o conteúdo extraído para a pasta atual do projeto.
4. Escolha **Substituir os arquivos no destino**.
5. Confirme que o seu `wrangler.jsonc` continua dentro da pasta.
6. Abra o PowerShell nessa pasta e execute, um por vez:

   `npm install`

   `npx wrangler whoami`

   `npm run db:remote`

   `npm run deploy`

7. Quando a migração perguntar se deseja continuar, digite `y` e pressione Enter.
8. Abra `https://controleestoque.app.br` e pressione `Ctrl + F5`.

O pacote não contém nem substitui o `wrangler.jsonc`, mantendo a ligação com o banco atual da Cloudflare.

## Observação sobre atualização dos preços

Os valores são uma fotografia da tabela de 04/08/2026. Quando o simulador mudar, será necessário gerar uma nova atualização de preços para o sistema.
