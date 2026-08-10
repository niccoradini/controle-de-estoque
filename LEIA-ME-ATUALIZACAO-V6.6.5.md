# Atualização 6.6.5 — estoque de 10/08/2026

Esta versão atualiza o estoque a partir da planilha `estoque10.08.26.xlsx`.

## Resultado da conferência

- 1.171 linhas de estoque recebidas;
- 110 linhas do depósito RPAR excluídas;
- 1.061 unidades disponíveis;
- 291 códigos materiais;
- nenhum item em entrega nos depósitos DEPS ou NREM;
- 21 séries adicionadas e 34 séries removidas em relação ao retrato de 07/08;
- seis materiais novos e dez materiais sem saldo no novo retrato.

## Novos materiais

- `22023893` — OVVI Ventosa Silicone com MagSafe Vermelho;
- `22024574` — OVVI Capa Galaxy S26 Texturizada Magnética Preto;
- `22024579` — OVVI Capa Galaxy S26+ Texturizada Magnética Azul;
- `22024580` — OVVI Capa Galaxy S26 Ultra Texturizada Magnética Azul;
- `22024637` — OVVI Capa Galaxy S26 Ultra Silicone Magnética Roxo;
- `TGMO50152000` — Motorola Moto G56 256GB Grafite.

O Moto G56 e os acessórios sem preço oficial permanecem visíveis na consulta de estoque, mas não são liberados para pedidos até que um valor seja confirmado no simulador.

## Proteções da atualização

- preserva usuários, sessões, pedidos, cancelamentos e auditoria;
- preserva números de série já retirados;
- preserva chips disponíveis que já estejam distribuídos aos vendedores, mesmo quando a série não aparece no novo relatório;
- impede que uma série alocada na carteira de chips seja usada para liberar um pedido pendente;
- mantém RPAR fora do saldo e DEPS/NREM separados como itens em entrega.

Depois do merge na branch `main`, o GitHub cria o backup do D1, aplica a migração `0026`, publica o Worker e valida o endereço oficial automaticamente.
