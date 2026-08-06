# Atualização 6.1 — Vivo Renova protegido

Esta versão mantém a V6.0, remove a edição manual do voucher e corrige a validação dos descontos no servidor.

## Correções e novidades

- voucher ASSURANT automático e não editável pelo vendedor;
- 62 modelos validados diretamente na tabela ASSURANT com vigência 06/2026;
- seleção obrigatória do aparelho usado e do estado Bom/Defeituoso;
- bônus do fabricante recalculado no servidor conforme o aparelho novo comprado;
- valores de voucher ou bônus alterados pelo navegador são ignorados;
- Renova limitado a exatamente um aparelho novo por pedido;
- descontos continuam limitados ao preço do aparelho;
- capas, películas e demais acessórios permanecem no valor normal;
- pedidos, usuários, estoque e histórico existentes são preservados.

## Instalação

Execute as migrações antes da publicação:

```bash
npm install
npm run db:remote
npm run deploy
```

A migração `0017_renova_authoritative_values.sql` cria a tabela protegida de avaliações ASSURANT sem alterar os pedidos anteriores.
