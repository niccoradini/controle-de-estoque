# Atualização V4.0 — pedido completo por modelo

Esta versão redesenha a escolha de aparelhos na interface do vendedor:

- um único card por modelo de aparelho;
- expansão do card para escolher memória e cor conforme o saldo disponível;
- seleção opcional de capa compatível por descrição/cor;
- seleção opcional do tipo de película;
- aparelho, capa e película adicionados juntos ao pedido;
- escolha manual somente do IMEI ou série do aparelho na aprovação;
- escolha e baixa automáticas da unidade serializada de capas e películas;
- códigos de capa e película continuam registrados internamente para manter o estoque correto.

## Como atualizar

1. Não apague a pasta atual.
2. Extraia o ZIP.
3. Copie o conteúdo extraído para:

   `C:\Users\nic\Documents\controle-estoque-cloudflare`

4. Escolha **Substituir os arquivos no destino**.
5. Abra o terminal nessa pasta e execute:

   `npm install`

   `npm run deploy`

Esta versão não cria uma nova migração de banco. Portanto, não é necessário executar `npm run db:remote`.

O pacote não substitui o `wrangler.jsonc`. A ligação com o banco atual é mantida, e usuários, estoque, pedidos e histórico existentes são preservados.

Depois da publicação, abra `https://controleestoque.app.br` e pressione `Ctrl + F5`.

## Fluxo de aprovação

Ao aprovar um pedido com aparelho, capa e película, o gerente seleciona somente o IMEI do aparelho. O sistema escolhe automaticamente uma unidade disponível de cada capa e película e registra os respectivos números de série no banco, sem mostrá-los na interface do vendedor.
