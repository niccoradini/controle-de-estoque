# Atualização 6.2 — valores de agosto do Vivo Renova

Esta versão atualiza as duas referências do Vivo Renova sem alterar pedidos já registrados.

## Valores importados

- 1.042 aparelhos aceitos pela ASSURANT, extraídos exclusivamente da aba atual `SAP`;
- avaliações de aparelho em estado **Bom** e **Defeituoso** da tabela de 04/08/2026;
- smartphones e tablets das 14 fabricantes presentes na planilha;
- 72 boosts de Apple, Samsung, Motorola e JOVI;
- início e fim de cada boost respeitados automaticamente pelo servidor;
- iPhone 17 Pro Max 256 GB corrigido para R$ 500 de boost;
- iPhone 17 Pro Max 1 TB permanece com R$ 800 de boost;
- Galaxy S26 Ultra 256 GB recebe R$ 1.200 de boost.

## Funcionamento preservado

- o vendedor escolhe o aparelho usado e informa se está Bom ou Defeituoso;
- voucher e boost são automáticos e não editáveis;
- o servidor confere novamente todos os valores antes de liberar o pedido;
- voucher e boost descontam somente o aparelho novo;
- capas, películas, cabos e outros acessórios continuam no valor integral;
- o desconto nunca ultrapassa o preço do aparelho novo;
- modelos parecidos não herdam boost indevido, como Galaxy S25 FE no lugar de Galaxy S25.

## Busca do aparelho usado

A lista ASSURANT passou de 62 para 1.042 opções. Por isso, o campo agora é pesquisável por marca, modelo ou memória. O aparelho precisa ser selecionado entre os resultados válidos para que o voucher seja aplicado.

## Instalação

Faça um backup e execute as migrações antes da publicação:

```bash
npm install
npm run db:remote
npm run deploy
```

A migração `0018_renova_values_2026_08_04.sql` substitui somente a tabela de referência do Renova e cria a tabela de boosts. Usuários, estoque, pedidos e histórico permanecem preservados.
