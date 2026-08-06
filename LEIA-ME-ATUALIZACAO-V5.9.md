# Atualização 5.9 — Matinal fluida e tema lavanda

Esta versão torna a Central de Alinhamento mais fácil de apresentar, integra o relógio de saídas às telas iniciais e troca a identidade vermelha por um lavanda quase pastel.

## O que mudou

- índice persistente dos quatro temas da Matinal;
- primeiro tema aberto automaticamente;
- troca de assunto sem fechar cards ou voltar para outra tela;
- indicador **Tema X de 4** e botões **Anterior** e **Próximo**;
- navegação lateral para computador e TV, com abas horizontais no celular;
- mensagens de Renato Dal Negro e Maria Caldas apresentadas como conversa nativa, com o remetente em destaque e o texto preservado;
- roteiro ajustado para no máximo 20 minutos: 6, 6, 4 e 4 minutos;
- base legal resumida para apresentação, mantendo artigos e links oficiais;
- quadro de saídas da equipe reconstruído no tema Liquid Glass e exibido para gerente, vendedor e estoquista;
- quadro de saídas também incluído no tema de horários da Matinal;
- cor principal alterada para lavanda quase pastel, mantendo o fundo escuro e a interface leve;
- vermelho reservado a erros, rejeições, cancelamentos e exclusões.

## Relógio de saídas

- Ana: 11:00–12:36;
- Thalia: 11:30–13:06;
- Luiz: 12:36–14:12;
- Joice: 13:06–14:42;
- Pedro: 14:12–15:48.

Cada saída dura 1h36. No máximo duas pessoas ficam fora ao mesmo tempo, e a próxima saída ocorre somente depois do retorno confirmado da pessoa anterior.

## Como atualizar

Não apague a pasta atual e não substitua o arquivo `wrangler.jsonc`. Ele mantém a ligação com o banco correto da Cloudflare.

1. Extraia o ZIP.
2. Copie o conteúdo extraído para a pasta atual do sistema.
3. Escolha **Substituir os arquivos no destino**.
4. Abra o terminal nessa pasta e execute, um comando por vez:

```bash
npm install
npm run db:remote
npm run deploy
```

Se a migração perguntar se deseja continuar, digite `y` e pressione Enter.

Esta versão não cria uma nova migração. Usuários, estoque, preços, pedidos, números de série e histórico serão preservados.

Depois da publicação, abra `https://controleestoque.app.br` e pressione `Ctrl + F5`.

## Como apresentar a Matinal

1. Entre com um usuário gerente.
2. Abra **Alinhamento**.
3. Pressione `F11` para colocar o navegador em tela cheia na TV.
4. Use o índice lateral ou os botões **Anterior** e **Próximo** para seguir o roteiro.
