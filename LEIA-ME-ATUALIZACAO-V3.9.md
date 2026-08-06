# Atualização V3.9 — nova identidade visual Ônix

Esta versão mantém todas as funções e dados da V3.8 e redesenha o sistema inteiro com uma identidade escura em preto, grafite e vermelho.

## Nova aparência

A identidade visual **Ônix** foi aplicada em todas as áreas:

- login e primeiro acesso;
- painel do gerente;
- painel dos vendedores;
- cartões de métricas e grupos;
- catálogo e carrinho;
- estoque e tabelas;
- pedidos e escolha de números de série;
- usuários, histórico e janelas de confirmação;
- campos, filtros, alertas e mensagens.

O fundo utiliza preto suave, os cartões usam tons de grafite e o vermelho aparece nos botões e destaques principais. Cores funcionais foram mantidas quando ajudam na leitura, como verde para saldo disponível e amarelo para avisos.

## Desempenho e acessibilidade

- nenhuma imagem, fonte ou biblioteca externa foi adicionada;
- as ilustrações continuam sendo SVGs leves já incluídos no sistema;
- o contraste foi ajustado para textos, códigos materiais e campos;
- o navegador passa a identificar o sistema como interface escura;
- foco de campos e seleções permanece visível;
- o layout continua responsivo em computador, tablet e celular;
- a preferência do dispositivo por movimentos reduzidos continua respeitada.

## Nova visão no painel dos vendedores

Ao entrar no sistema, o vendedor agora encontra os produtos separados nos mesmos nove grupos usados pelo gerente:

- aparelhos;
- capas;
- películas;
- caixas de som;
- notebooks;
- TVs;
- carregadores;
- cabos;
- acessórios diversos.

Cada cartão do vendedor mostra:

- quantidade de unidades disponíveis;
- quantidade de códigos materiais com saldo;
- uma prévia dos três produtos com maior disponibilidade;
- nome simplificado e código material;
- botão **Ver produtos e adicionar**, que abre a loja já filtrada no grupo escolhido.

O botão **Ver todos os produtos** limpa o filtro e abre o catálogo completo. O carrinho atual é mantido quando o vendedor alterna entre os grupos.

### Privacidade mantida

Essa visão não envia nem mostra ao vendedor:

- números de série;
- saldo físico gerencial;
- quantidades reservadas;
- produtos sem disponibilidade.

Os números de série continuam liberados somente depois que o gerente aprova o pedido e escolhe as unidades.

## Visão de produtos no painel gerencial

O início do painel gerencial agora mostra o estoque separado nos nove grupos do catálogo:

- aparelhos;
- capas;
- películas;
- caixas de som;
- notebooks;
- TVs;
- carregadores;
- cabos;
- acessórios diversos.

Cada cartão apresenta:

- unidades disponíveis;
- quantidade de códigos materiais;
- unidades reservadas;
- saldo físico;
- quantidade de materiais com saldo;
- avisos de saldo baixo ou zerado;
- uma prévia dos três maiores saldos, com nome e código material;
- acesso direto à lista completa daquele grupo.

Na página **Estoque**, o gerente também pode combinar a busca por nome ou código com o filtro de grupo. A visualização se adapta a computador, tablet e celular.

## Alterações em relação ao estoque anterior

- 287 códigos materiais continuam ativos;
- o saldo válido permanece em **1.000 unidades**;
- os dados e números de série das atualizações anteriores são mantidos;
- os registros antigos não são apagados: séries ausentes continuam preservadas para rastreabilidade.

## Gestão de usuários mantida

O gerente continua podendo editar ou excluir cadastros diretamente na página **Usuários**:

- edição de nome, e-mail, perfil e status;
- definição de uma nova senha sem pedir a senha antiga;
- alteração da própria senha do gerente sem pedir a senha anterior;
- exclusão de qualquer outro cadastro;
- encerramento automático de todas as sessões do usuário quando sua senha é redefinida, seu acesso é desativado ou seu cadastro é excluído;
- proteção contra excluir o próprio cadastro ou deixar o sistema sem gerente ativo;
- pedidos e histórico de um usuário excluído continuam preservados, identificados como **Usuário excluído**, sem exibir seu e-mail pessoal.

Ao editar um usuário, deixe o campo **Nova senha** em branco para manter a senha atual. Se preencher uma nova senha, a pessoa deverá entrar novamente usando essa senha.

## Estoque incluído nesta versão

Esta atualização usa a planilha `Planilha em Basis (1)(2).xlsx` como o retrato completo do estoque atual e desconsidera todas as linhas do depósito **RPAR**.

## Resultado da importação

- 1.110 unidades encontradas na planilha original;
- 110 unidades de RPAR excluídas;
- 287 códigos materiais ativos;
- 1.000 unidades e 1.000 números de série disponíveis;
- depósitos LVUT, 153, LOJA e EXPO mantidos e somados por código material;
- nomes técnicos convertidos para nomes comuns e organizados nos nove grupos do catálogo;
- números de série ausentes são retirados da disponibilidade, sem apagar pedidos históricos.

## Como funciona a liberação

1. O vendedor escolhe o material e a quantidade, sem ver números de série.
2. O gerente abre o pedido pendente e clica em **Aprovar retirada**.
3. O gerente escolhe exatamente a quantidade solicitada entre os números de série disponíveis.
4. Depois da aprovação, o estoque é baixado e o vendedor passa a ver somente os números liberados naquele pedido.

## O que será preservado

- usuários, senhas e perfis;
- sessões de login que não forem encerradas por uma alteração de acesso ou senha;
- pedidos existentes;
- histórico existente;
- ligação do projeto com o banco Cloudflare pelo `wrangler.jsonc` do computador.

## Como atualizar com segurança

1. Não apague a pasta atual.
2. Abra o terminal em `C:\Users\nic\Documents\controle-estoque-cloudflare`.
3. Faça um backup antes de copiar a atualização:

```bash
npx wrangler d1 export DB --remote --output backup-antes-estoque-2026-07-29.sql
```

4. Confirme que o arquivo de backup apareceu na pasta.
5. Extraia o ZIP e copie seu conteúdo para a pasta atual.
6. Escolha **Substituir os arquivos no destino**.
7. Não substitua nem apague o `wrangler.jsonc` existente.
8. Execute um comando por vez:

```bash
npm install
npm run db:remote
npm run deploy
```

9. Se o banco perguntar se deseja continuar, digite `y` e pressione Enter.
10. Abra `https://controleestoque.app.br` e pressione `Ctrl + F5`.

Depois da atualização:

1. Abra a tela de login e confirme a nova identidade preta e vermelha.
2. Confira no painel do gerente se aparecem os nove cartões de grupos.
3. Confirme que os totais somam **287 materiais** e **1.000 unidades físicas**.
4. Entre com um vendedor e confira os cartões de produtos disponíveis.
5. Clique em **Ver produtos e adicionar** e confirme que a loja abre filtrada no grupo escolhido.
6. Abra **Usuários**, edite um cadastro de teste e confirme que aparecem os campos de e-mail e nova senha.
7. Faça um pedido de teste, selecione o número de série na aprovação e confirme que ele aparece para o vendedor somente depois de aprovado.
