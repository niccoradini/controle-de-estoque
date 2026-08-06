# Atualização V5.6 — Interface Liquid Glass

Esta atualização reformula a aparência do sistema com uma interface inspirada no iOS, mantendo o tema preto e vermelho da loja.

## O que mudou

- superfícies translúcidas com efeito Liquid Glass;
- barra lateral flutuante e mais estreita;
- cabeçalho compacto, com menos elementos ocupando a tela;
- tipografia fina baseada nas fontes nativas do Windows, iPhone, Android e macOS;
- cartões com informações principais em destaque e textos auxiliares mais discretos;
- filtros, campos e botões arredondados e menos pesados;
- painel gerencial, catálogo, pedidos, usuários, histórico e janelas redesenhados;
- melhor adaptação para celular e tablet;
- animações curtas e suaves;
- modo de movimento reduzido para acessibilidade;
- carregamento visual progressivo das seções longas do catálogo;
- nenhuma biblioteca visual ou fonte externa adicionada.

O desfoque é usado somente na navegação, cabeçalho, seletor de plano, carrinho e janelas. Os cartões internos utilizam transparência sem desfoque contínuo, evitando peso desnecessário durante a rolagem. Navegadores sem suporte a Liquid Glass recebem automaticamente uma superfície escura sólida e legível.

Esta versão também contém a conferência completa dos 378 preços de aparelhos feita na V5.5.

## Como atualizar

1. Não apague a pasta atual.
2. Extraia o ZIP.
3. Copie o conteúdo extraído para a pasta atual do projeto.
4. Escolha **Substituir os arquivos no destino**.
5. Confirme que o seu `wrangler.jsonc` continua dentro da pasta.
6. Abra o PowerShell nessa pasta e execute, um por vez:

   `npm install`

   `npx wrangler whoami`

   `npm run db:remote`

   `npm run deploy`

7. Quando a migração perguntar se deseja continuar, digite `y` e pressione Enter.
8. Abra `https://controleestoque.app.br` e pressione `Ctrl + F5`.

O pacote não contém nem substitui o `wrangler.jsonc`. Usuários, senhas, estoque, IMEIs, pedidos, cancelamentos, preços e histórico são preservados.
