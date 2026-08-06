# Atualização 5.8 — Alinhamento para TV e base legal

Esta versão amplia a Central de Alinhamento para apresentações em televisores e completa o card **Responsabilidades do consultor** com as principais orientações legais e regulatórias do material enviado.

## O que mudou

- letras maiores em toda a Central de Alinhamento;
- títulos, cards, listas, legendas e textos auxiliares legíveis a uma distância maior;
- ajustes próprios para celular, evitando que a ampliação prejudique telas pequenas;
- dez frentes da função do consultor, incluindo atendimento, serviços, informação, conferência, documentos, protocolo, consentimento e proteção de dados;
- explicação de que a função não se limita à venda;
- diferenciação entre obrigação da Vivo ou da empresa e atribuição operacional do funcionário;
- esclarecimento de que dar tratamento pode significar resolver, registrar, encaminhar e acompanhar;
- seção com referências oficiais da Anatel, CDC, LGPD e CLT;
- links clicáveis para consultar as normas completas.

## Referências apresentadas no sistema

- Resolução Anatel nº 765/2023: arts. 9º, 10, 20, 21, 36, 40 a 42 e 60 a 65;
- Código de Defesa do Consumidor: arts. 30, 31, 34, 37 e 39;
- Lei Geral de Proteção de Dados: arts. 6º, 39, 46 e 47;
- Consolidação das Leis do Trabalho: art. 462.

As normas impõem obrigações principalmente à prestadora ou à empresa responsável pela loja. O sistema as traduz em comportamentos esperados do consultor dentro de seus acessos, atribuições, treinamentos e procedimentos internos.

## Como atualizar

Não apague a pasta atual e não substitua o arquivo `wrangler.jsonc`. Ele mantém a ligação com o banco correto da Cloudflare.

1. Extraia o ZIP.
2. Copie o conteúdo para a pasta atual do sistema.
3. Escolha **Substituir os arquivos no destino**.
4. Abra o terminal nessa pasta e execute:

```bash
npm install
npm run db:remote
npm run deploy
```

Se a migração perguntar se deseja continuar, digite `y` e pressione Enter.

Esta versão não cria novas tabelas. Usuários, estoque, preços, pedidos, IMEIs e histórico serão preservados.

Depois da publicação, abra `https://controleestoque.app.br` e pressione `Ctrl + F5`.

## Como conferir na televisão

1. Entre com um usuário gerente.
2. Abra **Alinhamento**.
3. Expanda **Responsabilidades do consultor**.
4. Coloque o navegador em tela cheia pressionando `F11`.
5. Role o conteúdo durante a reunião conforme cada tema for discutido.
