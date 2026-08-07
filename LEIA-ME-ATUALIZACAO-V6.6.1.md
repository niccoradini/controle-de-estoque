# Atualização 6.6.1 — cadastro de chips pelos 6 últimos dígitos

Esta atualização substitui o leitor de código de barras pelo cadastro assistido e mantém intactos usuários, pedidos, estoque e histórico já existentes.

## Novo fluxo do Gerente

1. Abra **Chips** e clique em **Cadastrar chip**.
2. Escolha o vendedor responsável.
3. Na lista, selecione um material de SIM card disponível.
4. Digite somente os **6 últimos números** do ICCID impresso no chip.
5. Se houver uma única correspondência, o sistema a seleciona automaticamente.
6. Se houver mais de uma, compare os ICCIDs completos e escolha a opção correta.
7. Confirme o cadastro.

A lista não mostra produtos sem saldo nem séries já distribuídas, vendidas, retiradas ou reservadas em pedidos. Depois do cadastro, material e ICCID ficam protegidos; a ação **Transferir** altera somente o vendedor responsável.

## Proteções adicionadas

- somente o Gerente consulta materiais e correspondências de ICCID;
- a busca exige exatamente seis dígitos e usa parâmetros preparados;
- o ICCID completo é obtido do estoque, não é aceito diretamente do navegador;
- o servidor confere novamente a disponibilidade no instante do cadastro;
- o banco impede que a mesma série seja atribuída a uma carteira e a um pedido comum;
- registros manuais antigos permanecem preservados no histórico;
- a câmera foi desativada na política de permissões do site.

## Banco de dados

`0025_chip_suffix_lookup.sql` adiciona três proteções:

- todo novo chip precisa corresponder a uma série de SIM card disponível;
- reabertura e restauração validam novamente a série conciliada;
- pedidos comuns não podem selecionar um chip disponível já atribuído a vendedor.

## Ordem segura de publicação

Na pasta nova do projeto, execute:

```bash
npm install
npm run check
npm test
npx wrangler deploy --dry-run --keep-vars
npx wrangler d1 export controle-estoque-db --remote --output backup-controle-estoque-2026-08-07-v661.sql
npx wrangler d1 migrations list controle-estoque-db --remote
npx wrangler d1 migrations apply controle-estoque-db --remote
npx wrangler deploy --keep-vars
```

Quando a migração perguntar se deseja continuar, confirme com `y`.

## Conferência depois da publicação

1. Entre como Gerente e abra **Chips**.
2. Confirme que aparecem os cinco materiais de SIM card com seus saldos livres.
3. Selecione um material e informe seis dígitos finais de um chip real.
4. Confira a seleção automática ou a lista de correspondências.
5. Cadastre para um vendedor e confirme que o saldo livre daquele material diminuiu.
6. Use **Transferir** e confirme que material e ICCID não podem ser alterados.
7. Entre como Vendedor, registre uma venda e confira a baixa normal no estoque.
8. Pressione `Ctrl + F5` se o navegador ainda mostrar a tela anterior.
