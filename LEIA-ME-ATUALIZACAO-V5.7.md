# Atualização 5.7 — Central de Alinhamento

Esta versão adiciona ao painel do gerente uma nova aba chamada **Alinhamento**.

## O que foi incluído

- primeira edição da Central de Alinhamento;
- quatro cards expansíveis sobre resolução de problemas, responsabilidades do consultor, comportamento em loja e organização dos ambientes;
- ênfase no acompanhamento do cliente até a solução ou encaminhamento correto;
- troca de chip, faturas, recargas, ativação de Pré e portabilidade entre as rotinas apresentadas;
- compromisso com horários, postura profissional e comunicação respeitosa;
- hierarquia: gerente geral, gerente de operações e consultores;
- cozinha e sala de estoque como responsabilidade de toda a equipe;
- imagens do PowerPoint-base otimizadas para carregamento rápido;
- acesso à nova aba restrito aos gerentes.

## Como atualizar

Não apague a pasta atual e não substitua o arquivo `wrangler.jsonc`. Ele mantém a ligação com o banco correto da Cloudflare.

1. Extraia o ZIP da atualização.
2. Copie o conteúdo extraído para a pasta atual do sistema.
3. Escolha **Substituir os arquivos no destino**.
4. Abra o terminal nessa pasta e execute, um comando por vez:

```bash
npm install
npm run db:remote
npm run deploy
```

Se a migração perguntar se deseja continuar, digite `y` e pressione Enter.

Esta versão não precisa criar tabelas novas. O comando de banco apenas confirma que todas as migrações anteriores continuam aplicadas.

Depois da publicação, abra `https://controleestoque.app.br` e pressione `Ctrl + F5`.

## O que será preservado

- usuários e senhas;
- produtos, quantidades e números de série;
- pedidos e cancelamentos;
- preços e categorias de plano;
- histórico de acessos e movimentações;
- configuração do banco definida no `wrangler.jsonc` existente.

## Como conferir

Entre com um usuário gerente e procure **Alinhamento** no menu lateral. Vendedores e estoquistas não verão essa opção.

Abra cada card e confira as imagens, listas e orientações. Em celulares, os cards e os detalhes ficam em uma única coluna.
