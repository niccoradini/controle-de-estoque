# Atualização 6.6 — Chips e estoque de 07/08

Esta versão cria o controle individual de chips por vendedor e atualiza o retrato do estoque sem apagar usuários, pedidos ou histórico.

## O que mudou

- nova aba **Chips** para Gerente e Vendedores;
- cada vendedor pode manter até 10 chips com situação **Disponível**;
- chips vendidos permanecem no histórico e deixam de ocupar uma das 10 vagas;
- vendedor consulta material e ICCID completo e registra data da venda e número cadastrado;
- vendedor só pode dar baixa nos chips da própria carteira;
- Gerente consulta todas as carteiras e os indicadores por vendedor;
- Gerente cadastra, edita, transfere, retira, restaura e corrige uma venda;
- cadastro por leitor USB/Bluetooth, digitação ou câmera do celular quando o navegador oferece `BarcodeDetector`;
- ICCID é único e fica armazenado como texto para preservar todos os dígitos;
- quando o código lido corresponde a uma série da planilha, o chip fica conciliado com o estoque;
- chips disponíveis nas carteiras são reservados e não podem ser escolhidos por um pedido comum;
- a venda baixa a série vinculada e a correção devolve a unidade ao estoque;
- vendedor com chip disponível não pode ser desativado, excluído ou ter o perfil alterado até o Gerente transferir ou retirar os chips da carteira;
- Estoquistas não acessam a aba Chips.

## Estoque recebido

Fonte: `ESTOQUE07,08(1).xlsx`.

- 1.184 linhas de estoque na planilha;
- 295 códigos materiais e 1.074 unidades disponíveis após excluir RPAR;
- 110 unidades de RPAR desconsideradas;
- depósitos disponíveis: `148`, `EXPO`, `LOJA` e `LVUT`;
- nenhum item em `DEPS` ou `NREM` nesta atualização;
- quatro materiais novos:
  - `22022936` — Amazon Echo Spot 2024 Alexa Relógio Preto;
  - `22024837` — Ovvi i2GO Capa Galaxy S26+ Silicone Magnética Preto;
  - `22024888` — Samsung Galaxy Buds4 Pro Preto;
  - `TGMO586C2000` — Motorola Moto G67 128GB Cinza.

### Conferência no Simulador Produtos

Conferência realizada em 07/08/2026; o próprio simulador informou **Tabela de produtos: 06/08/2026**.

- **Motorola Moto G67 5G 128GB:** PRÉ e Controle BTL por R$ 1.299,00; Controle Entrada por R$ 1.269,00; Controle Alto Valor por R$ 1.239,00; Pós Individual por R$ 1.209,00; Família 2 por R$ 1.179,00; Família 3 por R$ 1.149,00; Família 4/5 por R$ 1.119,00; Vivo V por R$ 1.089,00.
- O simulador informou que o Moto G67 não possui preço para **B2B 10x** nem **B2B 24x**.
- Amazon Echo Spot 2024, capa Ovvi/i2GO para Galaxy S26+ e Galaxy Buds4 Pro não aparecem na busca por nome nem por código. Como essa tela do simulador pesquisa somente smartphones, os três acessórios permanecem sem preço e bloqueados para pedido até existir uma fonte autorizada de valor.

## Banco de dados

- `0021_news.sql`: cria Notícias e as cinco campanhas iniciais da versão 6.5;
- `0022_chips.sql`: cria carteiras, regras de situação, limite de 10 e índices;
- `0023_inventory_refresh_2026_08_07.sql`: aplica o estoque de 07/08 e preserva dados operacionais.
- `0024_pricing_verification_2026_08_07.sql`: registra a conferência do Moto G67 e mantém os acessórios ausentes sem preço presumido.

A remoção de um chip é lógica: o registro e o histórico ficam preservados. A restrição de 10 chips disponíveis, a validação de vendedor ativo e a proteção da carteira antes de desativar ou excluir um vendedor também existem no D1, não apenas na tela.

## Ordem segura de publicação

Na pasta do projeto, execute:

```bash
npm install
npm run check
npm test
npx wrangler deploy --dry-run --keep-vars
npx wrangler d1 export controle-estoque-db --remote --output backup-controle-estoque-2026-08-07.sql
npx wrangler d1 migrations list controle-estoque-db --remote
npx wrangler d1 migrations apply controle-estoque-db --remote
npx wrangler deploy --keep-vars
```

O resultado esperado da suíte é:

```text
tests 18
pass 18
fail 0
```

## Conferência depois da publicação

1. Entre como Gerente e confirme que **Chips** aparece no menu.
2. Cadastre um chip de teste apontando o leitor para o código grande.
3. Confirme material, ICCID, vendedor e indicação **conciliado com o estoque**.
4. Entre como Vendedor e registre a venda com data e número cadastrado.
5. Volte como Gerente, use **Corrigir venda** e confirme que o chip retorna para Disponível.
6. Teste uma transferência entre vendedores e confira os contadores de 10 vagas.
7. Abra Estoque e confirme o indicador **Com vendedores**.
8. Confira no painel a fonte `ESTOQUE07,08(1).xlsx` e a data `07/08/2026`.
9. Pressione `Ctrl + F5` no navegador se a versão anterior ainda aparecer.
