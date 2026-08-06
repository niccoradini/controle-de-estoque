# Atualização 6.0 — Vivo Renova

Esta versão mantém integralmente a V5.9 e adiciona o Vivo Renova ao configurador de aparelhos.

## Novidades

- opção Renova dentro da escolha do aparelho;
- identificação do aparelho usado e estado Bom/Defeituoso;
- voucher ASSURANT editável pelo vendedor;
- bônus automático do fabricante para campanhas cadastradas;
- descontos limitados ao preço dos aparelhos;
- capa, película e demais produtos permanecem no preço normal;
- valores do Renova registrados no pedido para consulta posterior;
- preço normal, descontos e total final exibidos separadamente.

## Instalação

Execute as migrações antes da publicação:

```bash
npm install
npm run db:remote
npm run deploy
```

A migração `0016_vivo_renova.sql` acrescenta os dados do Renova aos pedidos existentes sem apagar histórico ou estoque.

