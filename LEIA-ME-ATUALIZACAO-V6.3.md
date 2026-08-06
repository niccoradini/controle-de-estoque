# Atualização 6.3 — estoque de 05/08/2026

Esta versão atualiza o estoque e os preços dos produtos novos sem apagar usuários, sessões, pedidos, cancelamentos ou histórico.

## Estoque importado

- fonte: `ESTOQUE05.08.2026.txt`;
- 1.183 linhas conferidas e 1.183 números de série únicos;
- 110 unidades do depósito RPAR excluídas;
- 1.073 unidades disponíveis em 293 códigos materiais;
- 108 números de série adicionados e 12 retirados em relação a 04/08;
- nenhum produto em entrega nos depósitos DEPS ou NREM;
- 144 linhas sem depósito no arquivo foram normalizadas para o depósito 149, seguindo o padrão do retrato anterior.

O saldo exibido depois da migração pode ser menor que 1.073 quando um número de série do relatório já estiver vinculado a um pedido liberado. A atualização preserva essa baixa e não devolve o item ao estoque indevidamente.

## Seis novos materiais

| Código material | Produto | Quantidade | Preço |
|---|---|---:|---:|
| `22025161` | Samsung Watch9 Bluetooth 40 mm 32 GB Grafite | 1 | R$ 2.999,00 |
| `TGMO611B2000` | Motorola Moto G47 128 GB Azul-marinho | 1 | tabela por plano já existente |
| `TGSA61762000` | Samsung Galaxy Z Flip8 512 GB Preto | 2 | indisponível no simulador |
| `TGSA61962000` | Samsung Galaxy Z Fold8 512 GB Preto | 2 | indisponível no simulador |
| `TGSA62254000` | Samsung Watch9 LTE 40 mm 32 GB Grafite | 2 | R$ 3.299,00 |
| `YBSC001A4000` | SIM Card 5G avulso | 100 | sem cobrança |

## Conferência no Simulador Produtos

A consulta foi feita em 05/08/2026. O próprio simulador informava **Tabela de produtos: 04/08/2026**.

- Galaxy Watch9 Bluetooth 40 mm: R$ 2.999,00;
- Galaxy Watch9 LTE 40 mm: R$ 3.299,00;
- Moto G47 5G 128 GB: a partir de R$ 949,00 e R$ 1.049,00 na categoria Família 3, valores já presentes no perfil do sistema;
- Galaxy Z Flip8 e Galaxy Z Fold8: nenhum resultado encontrado.

Os dois dobráveis entram no estoque, mas ficam com **Preço não disponível na tabela atual**. O servidor também impede a liberação desses itens sem preço, evitando um pedido com valor zerado ou estimado.

## Instalação

Faça um backup e execute as migrações antes da publicação:

```bash
npm install
npm run db:remote
npm run deploy
```

As novas migrações são:

- `0019_inventory_refresh_2026_08_05.sql`: atualiza materiais, saldos e números de série;
- `0020_pricing_new_products_2026_08_05.sql`: registra Watch9, SIM Card e a auditoria dos itens ainda sem preço.

Após a publicação, abra o sistema e pressione `Ctrl + F5` para carregar a versão 6.3.
