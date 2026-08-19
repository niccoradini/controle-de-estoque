# Atualização 6.8.3 — estoque de 19/08/2026

Esta versão atualiza o retrato do estoque com base na planilha `ESTOQUE19.08.xlsx`.

## Regras aplicadas

- `DEPS`: item disponível em loja;
- `DEPS NREM`: item em entrega;
- `LIDI` e `LIDI NREM`: não entram no saldo disponível nem no saldo em entrega.

## Resultado

- 1.089 unidades disponíveis em loja;
- 58 unidades em entrega;
- 301 materiais diferentes;
- 7 unidades com status LIDI separadas do saldo;
- 1.154 números de série únicos na planilha de origem.

## Segurança da atualização

A migração `0041_inventory_refresh_2026_08_19.sql` preserva usuários, sessões,
pedidos, cancelamentos, notícias, preços, códigos de registro e histórico. Os
números de série já existentes mantêm seus registros; somente novas unidades
recebem novos códigos `#xxx`.
