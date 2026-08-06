# Atualização V5.4 — Preços de todo o estoque

Esta atualização amplia a tabela consultada em **Gramcell · Simulador Produtos** para todos os produtos do estoque de 04/08/2026.

## O que foi incluído

- cobertura dos 287 códigos materiais presentes na planilha atual;
- 64 materiais de celulares com preços por categoria de plano;
- 223 materiais com preço fixo;
- preços de capas e das seis películas;
- preços de notebooks, TVs, caixas de som, cabos, carregadores e acessórios diversos;
- preço visível nos cards da loja, nos seletores de capa e película e na consulta gerencial;
- carrinho e revisão com o total completo do pedido;
- histórico com o valor unitário de cada item e o total registrado no momento da venda;
- pedidos apenas de acessórios podem ser enviados sem selecionar uma categoria de plano;
- SIM Cards identificados como **Sem cobrança**.

Quando um código novo ainda não aparece literalmente no simulador, o cadastro registra qual produto equivalente foi usado como referência. Isso evita esconder aproximações e facilita a próxima atualização da tabela.

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

O pacote não contém nem substitui o `wrangler.jsonc`, mantendo a ligação com o banco atual da Cloudflare. Usuários, senhas, estoque, IMEIs, pedidos, cancelamentos e histórico são preservados.

## Data da tabela

Os valores são uma fotografia de 04/08/2026. Quando o simulador mudar, será necessário gerar outra atualização para manter os preços do sistema sincronizados.
