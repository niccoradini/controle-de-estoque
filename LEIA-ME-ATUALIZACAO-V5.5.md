# Atualização V5.5 — Conferência integral dos preços de aparelhos

Esta atualização corrige a tabela de aparelhos após uma nova conferência completa no **Gramcell · Simulador Produtos**, usando a fotografia exibida em 04/08/2026.

## O que foi conferido

- 42 modelos de aparelhos;
- 9 categorias com preço por aparelho;
- 378 combinações de modelo e plano;
- nome exato do aparelho e categoria exata confirmados antes de aceitar cada valor;
- planos PRÉ, CONTROLE BTL, CONTROLE ENTRADA, CONTROLE ALTO VALOR, PÓS INDIVIDUAL, FAMILIA 2, FAMILIA 3, FAMILIA 4/5 e VIVO V;
- opções B2B 10x e B2B 24x também verificadas, porém o simulador não forneceu preço de aparelho para elas.

Foram encontradas quatro divergências na tabela anterior:

| Aparelho | Plano | Valor incorreto | Valor conferido |
| --- | --- | ---: | ---: |
| iPhone 13 256GB | PRÉ | R$ 6.999,00 | R$ 3.599,00 |
| iPhone 13 256GB | CONTROLE BTL | R$ 6.999,00 | R$ 3.599,00 |
| iPhone 15 256GB | PRÉ | R$ 1.049,00 | R$ 4.799,00 |
| iPhone 15 256GB | CONTROLE BTL | R$ 1.049,00 | R$ 4.799,00 |

Os outros 374 valores estavam iguais ao simulador e foram mantidos.

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

O pacote não contém nem substitui o `wrangler.jsonc`. A migração altera somente os quatro preços listados acima e grava o registro da conferência. Usuários, senhas, estoque, IMEIs, pedidos, cancelamentos e histórico são preservados.
