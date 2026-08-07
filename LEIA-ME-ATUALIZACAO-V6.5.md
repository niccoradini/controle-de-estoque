# Atualização 6.5 — Notícias e campanhas

Esta versão cria uma central de notícias compartilhada pela equipe e preserva o controle editorial com o Gerente.

## O que mudou

- nova aba **Notícias** para Gerente, Vendedor e Estoquista;
- publicações em três tipos: Promoção, Comunicado e Novidade;
- Gerente pode publicar, editar, ocultar e republicar;
- ocultar é reversível e não apaga o conteúdo;
- cada alteração de publicação fica registrada no Histórico;
- campo opcional de vigência;
- conteúdo estruturado em seções, linhas de preço e avisos para leitura no celular;
- arte original da campanha em miniatura responsiva e com ampliação;
- cinco campanhas iniciais: Apple, alças e capas, Semana Gamer, Samsung e Motorola.

## Banco de dados

A migração `0021_news.sql` cria a tabela de notícias e insere as cinco campanhas iniciais. Ela não altera usuários, pedidos, estoque, preços nem números de série existentes.

## Como validar e publicar

Na pasta do projeto, execute:

```bash
npm install
npm run check
npm test
npx wrangler deploy --dry-run
npm run db:remote
npx wrangler deploy --keep-vars
```

O resultado esperado dos testes é:

```text
tests 17
pass 17
fail 0
```

Depois da publicação, abra `https://controleestoque.app.br` e pressione `Ctrl + F5`.

## Conferência recomendada

1. Entre como Gerente e abra **Notícias**.
2. Confira as cinco campanhas e amplie uma arte.
3. Edite uma publicação de teste e confira a vigência e a formatação.
4. Use **Ocultar da aba** e confirme que ela continua visível para o Gerente como **Oculta**.
5. Entre como Vendedor ou Estoquista e confirme que a publicação ocultada não aparece.
6. Volte como Gerente, use **Publicar novamente** e confira o registro no Histórico.
