# Atualização V5.2 — Estoque de 04/08/2026

Esta atualização aplica o retrato da planilha `ESTOQUE04.08.2026(1).xlsx`.

## Resumo conferido

- 1.087 linhas físicas na planilha;
- 977 unidades disponíveis;
- 287 materiais disponíveis;
- 110 unidades do depósito RPAR desconsideradas;
- nenhum item em DEPS ou NREM nesta planilha;
- depósitos 149, EXPO, LOJA e LVUT somados no estoque disponível;
- 9 números de série adicionados e 33 retirados em relação ao estoque anterior;
- saldo líquido reduzido em 24 unidades;
- inclusão do Nintendo Switch OLED Branco e de três Motorola Moto G35 128GB Grafite.

Usuários, senhas, sessões, pedidos, cancelamentos, números de série já retirados e histórico são preservados.

## Como atualizar

1. Não apague a pasta atual.
2. Extraia o ZIP.
3. Copie o conteúdo extraído para a pasta atual do projeto.
4. Escolha **Substituir os arquivos no destino**.
5. Confirme que o arquivo `wrangler.jsonc` continua dentro da pasta.
6. Abra o PowerShell nessa pasta e execute, um por vez:

   `npm install`

   `npx wrangler whoami`

   `npm run db:remote`

   `npm run deploy`

7. Quando a migração perguntar se deseja continuar, digite `y` e pressione Enter.
8. Abra `https://controleestoque.app.br` e pressione `Ctrl + F5`.

O pacote não contém nem substitui o `wrangler.jsonc`. Isso mantém a ligação com o banco atual da Cloudflare.
