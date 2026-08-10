# Loja e Controle de Estoque

Sistema online para controlar produtos por código material e número de série, montar pedidos e acompanhar a operação da loja.

## Versão 6.6.7

Corrige a abertura da lateral do carrinho por meio do controle global de eventos e passa a usar exclusivamente a URL real da imagem fornecida pelo cadastro do produto, sem geração de placeholders.

## Versão 6.6.6

Mantém o botão do carrinho sempre visível na tela e exibe uma imagem para cada produto na lateral do pedido, com imagem cadastrada ou placeholder interno automático.

## Versão 6.6.5

Atualiza o estoque com a planilha de 10/08/2026: 291 códigos materiais e 1.061 unidades disponíveis após excluir 110 linhas do depósito RPAR. A migração preserva usuários, pedidos, baixas históricas e chips já distribuídos aos vendedores. Foram incluídos seis materiais novos, entre eles o Motorola Moto G56 256GB; produtos novos sem valor confirmado continuam bloqueados para pedidos até a inclusão do preço oficial. Consulte `LEIA-ME-ATUALIZACAO-V6.6.5.md`.

## Versão 6.6.2

Permite cadastrar vários chips de uma só vez. O Gerente identifica cada ICCID pelos 6 últimos dígitos, adiciona chips de qualquer material à fila, revisa o lote e confirma todos para o mesmo vendedor. O lote é protegido: se faltar vaga ou algum ICCID deixar de estar disponível, nenhum item é cadastrado parcialmente. O pacote inclui `ATUALIZAR-SISTEMA.bat` para atualizar o Cloudflare com dois cliques. Consulte `LEIA-ME-ATUALIZACAO-V6.6.2.md`.

## Versão 6.6.4

Substitui a barra fixa de finalização por um botão flutuante sempre disponível. O botão abre um carrinho lateral com visual de cada produto, código material, preço, subtotal ao vivo, ajuste de quantidade e remoção rápida. O painel preserva o cálculo do Vivo Renova e leva à revisão final já existente.

## Versão 6.6.3

Mantém o resumo do pedido sempre acessível enquanto o vendedor escolhe os produtos. A barra fixa mostra quantidade, subtotal atualizado ao vivo, valor após o Vivo Renova quando houver desconto e um botão destacado para finalizar. Na revisão, a confirmação permanece visível mesmo em pedidos longos.

## Versão 6.6.1

Substitui o leitor de código de barras pelo cadastro assistido de chips. O Gerente escolhe um dos materiais de SIM card realmente disponíveis, informa somente os 6 últimos dígitos do ICCID e o sistema identifica a série completa no estoque. Uma correspondência é selecionada automaticamente; quando há mais de uma, as opções são mostradas para conferência. Material e ICCID ficam protegidos depois do cadastro, e a transferência altera somente o vendedor responsável. Consulte `LEIA-ME-ATUALIZACAO-V6.6.1.md`.

## Versão 6.6

Atualiza o estoque com a planilha de 07/08/2026 e cria a aba **Chips** para Gerente e Vendedores. Cada vendedor pode manter até 10 chips disponíveis, registrar venda com data e número cadastrado e consultar material e ICCID. O Gerente cadastra pelo código de barras, transfere, retira, restaura e corrige vendas; chips vinculados à planilha ficam reservados e a baixa é conciliada automaticamente com o estoque. O Moto G67 5G 128GB foi reconferido no Simulador Produtos; os três acessórios novos ausentes na busca permanecem sem preço presumido. Consulte `LEIA-ME-ATUALIZACAO-V6.6.md`.

## Versão 6.5

Adiciona a aba **Notícias** para Gerente, Vendedor e Estoquista. O Gerente publica, edita, oculta e republica conteúdos sem apagar o histórico. A versão já leva cinco campanhas extraídas das artes comerciais de agosto: Bundle Apple, alças e capas, Semana Gamer, Bundle Samsung e Bundle Motorola, com preços, elegibilidade, vigência e arte ampliável. Consulte `LEIA-ME-ATUALIZACAO-V6.5.md`.

## Versão 6.4

Amplia a área operacional do Estoquista: painel por grupo, consulta completa de preços e disponibilidade e cancelamento de pedidos com devolução automática dos itens. Vendedores e estoquistas também passam a ter um Alinhamento rápido de 5 minutos, enquanto o gerente mantém a edição completa. Consulte `LEIA-ME-ATUALIZACAO-V6.4.md`.

## Versão 6.3

Atualiza o estoque com o relatório de 05/08/2026: 293 códigos materiais e 1.073 unidades disponíveis após excluir RPAR. Inclui seis novos materiais, confere os novos produtos no Simulador Produtos e bloqueia pedidos sem preço verificado. Consulte `LEIA-ME-ATUALIZACAO-V6.3.md`.

## Versão 6.2

Atualiza o Vivo Renova com 1.042 avaliações ASSURANT da planilha de 04/08/2026 e 72 boosts por modelo e vigência. A busca do aparelho usado agora aceita marca, modelo ou memória, sem liberar a edição manual dos valores. Consulte `LEIA-ME-ATUALIZACAO-V6.2.md`.

## Versão 6.1

Torna o Vivo Renova automático e protegido no servidor: o vendedor seleciona o aparelho usado e o estado, enquanto voucher ASSURANT e bônus do fabricante não aceitam edição. Consulte `LEIA-ME-ATUALIZACAO-V6.1.md`.

## Versão 6.0

Inclui o Vivo Renova no configurador, com bônus do fabricante e voucher ASSURANT separados, sem descontar capa ou película. Consulte `LEIA-ME-ATUALIZACAO-V6.0.md`.

## Versão 5.9

- navegação persistente na Central de Alinhamento, com índice lateral em telas grandes e abas horizontais no celular;
- primeiro tema aberto automaticamente, troca de conteúdo na mesma tela, indicador de progresso e botões anterior/próximo;
- comunicados de Renato Dal Negro e Maria Caldas recriados como uma conversa nativa do sistema, com remetentes em destaque;
- roteiro reorganizado para duração máxima de 20 minutos e base legal resumida sem retirar as referências oficiais;
- quadro de saídas da equipe recriado em HTML e CSS e exibido nas telas iniciais de gerente, vendedor e estoquista;
- o mesmo quadro foi integrado ao tema de horários da Matinal;
- identidade visual atualizada de vermelho para lavanda quase pastel, mantendo o Liquid Glass escuro, leve e responsivo;
- vermelho reservado a erros, cancelamentos e ações destrutivas, com verde para sucesso e âmbar para alertas;

### Base preservada da versão 5.8

- tipografia da Central de Alinhamento ampliada para leitura à distância em apresentações na TV;
- títulos, cards, listas, legendas, referências e textos auxiliares maiores;
- card **Responsabilidades do consultor** expandido de seis para dez frentes da função;
- atendimento, informação comercial, conferência da operação, documentos, protocolos, consentimento e proteção de dados incluídos;
- nova seção de base legal e regulatória com links para fontes oficiais;
- Resolução Anatel nº 765/2023: arts. 9º, 10, 20, 21, 36, 40–42 e 60–65;
- Código de Defesa do Consumidor: arts. 30, 31, 34, 37 e 39;
- Lei Geral de Proteção de Dados: arts. 6º, 39, 46 e 47;
- CLT: art. 462, diferenciando responsabilidade empresarial, erro operacional, dano e dolo;
- esclarecimento de que dar tratamento significa resolver quando possível ou registrar, encaminhar e acompanhar corretamente;
- tamanhos adaptados novamente em telas menores para preservar a experiência no celular;

### Base preservada da versão 5.7

- nova aba **Alinhamento**, visível somente para gerentes;
- primeira edição da Central de Alinhamento com quatro cards expansíveis;
- destaque para a obrigação operacional de acolher, orientar e buscar a resolução dos problemas dos clientes;
- responsabilidades do consultor organizadas por serviço: troca de chip, faturas, recargas, ativação de Pré, portabilidade e suporte;
- compromissos de pontualidade, intervalos, comunicação de atrasos e acompanhamento das demandas;
- orientações de postura na cadeira, atendimento ao cliente e convivência entre colegas;
- hierarquia da loja apresentada como gerente geral, gerente de operações e consultores;
- cozinha e sala de estoque definidas como responsabilidade compartilhada de toda a equipe;
- comunicados, quadro de atitudes e fotos do PowerPoint-base integrados aos cards;
- seis imagens convertidas para WebP, totalizando menos de 230 KB para preservar o carregamento leve;
- conteúdo responsivo, acessível por teclado e compatível com redução de movimento;

### Base preservada da versão 5.6

- nova interface inspirada no iOS com acabamento Liquid Glass em preto e lavanda pastel;
- barra lateral e cabeçalho flutuantes, compactos e translúcidos;
- tipografia fina usando as fontes nativas do computador ou celular, sem downloads externos;
- cartões, formulários, filtros, pedidos e janelas com hierarquia visual mais limpa;
- textos secundários menores e informações principais mais fáceis de localizar;
- animações curtas e fluidas, respeitando a preferência do usuário por movimento reduzido;
- renderização progressiva das seções longas do catálogo para manter a rolagem leve;
- desfoque limitado às superfícies flutuantes e visual alternativo para navegadores sem suporte;

- conferência integral dos 42 modelos de aparelhos no Simulador Produtos;
- 378 preços validados individualmente em nove categorias de plano;
- correção de quatro valores divergentes nos iPhones 13 e 15 de 256 GB;
- migração corretiva própria para atualizar bancos que já receberam a versão 5.4;
- arquivo de auditoria incluído para impedir que a tabela gerada divirja dos valores conferidos;
- opções B2B 10x e B2B 24x verificadas, mas mantidas fora do sistema porque o simulador não apresenta preço de aparelho nelas;

- preços vinculados aos 287 códigos materiais do estoque de 04/08/2026;
- 64 materiais de celulares continuam com preço variável em nove categorias de plano;
- 223 materiais receberam preço fixo, incluindo capas, películas, cabos, carregadores, áudio, TVs, notebooks e acessórios diversos;
- cards, seletores de capa/película, carrinho, revisão e painel gerencial agora exibem os valores;
- total do pedido inclui aparelhos, capas, películas e todos os demais produtos;
- valor unitário, tipo de preço, categoria e data da tabela ficam preservados no histórico;
- quatro códigos de SIM Card aparecem como **Sem cobrança**, sem criar um valor fictício;
- itens novos não listados literalmente no simulador usam uma referência equivalente identificada e rastreável;

- tabela do `Gramcell · Simulador Produtos` importada com data de 04/08/2026;
- 42 modelos do estoque com preços em nove categorias de plano;
- vendedor escolhe a categoria e vê o preço exato antes de adicionar o aparelho;
- revisão mostra o total completo do pedido e o parcelamento sem juros;
- preço, categoria e data da tabela ficam preservados no histórico do pedido;
- gerente vê o preço inicial dos aparelhos na consulta de estoque;
- aparelhos ausentes no simulador podem usar referência equivalente devidamente identificada;
- capas e películas entram no total do pedido;

- estoque atualizado pela planilha `ESTOQUE04.08.2026(1).xlsx`;
- 287 materiais e 977 unidades disponíveis após excluir RPAR;
- 9 números de série adicionados e 33 retirados em relação ao retrato anterior;
- novos materiais: Nintendo Switch OLED e Motorola Moto G35 128GB Grafite;
- gerente pode cancelar pedidos já liberados;
- o cancelamento devolve automaticamente as quantidades e os IMEIs ao estoque;
- o pedido cancelado e seus números de série continuam visíveis no histórico gerencial;
- retrato anterior da planilha `att.xlsx` substituído pelo estoque de 04/08/2026;
- 110 unidades do depósito RPAR desconsideradas;
- depósitos DEPS e NREM tratados separadamente como produtos em entrega;
- a planilha atual não possui linhas DEPS/NREM, portanto o indicador começa zerado;
- números de série vinculados a cada unidade disponível;
- nomes comuns e simplificados, mantendo o nome técnico para busca;
- nove grupos: aparelhos, capas, películas, caixas de som, notebooks, TVs, carregadores, cabos e acessórios diversos;
- aparelhos agrupados por modelo, com escolha de memória, cor, capa compatível e película;
- pedidos liberados automaticamente no momento do envio;
- escolha automática do IMEI ou número de série de todos os itens;
- IMEI exibido ao vendedor e ao estoquista logo após a liberação;
- números internos de capas e películas continuam ocultos na interface, embora a baixa seja registrada corretamente;
- novo perfil Estoquista, com acesso somente à tela simplificada de pedidos;
- gerente sem etapa de aprovação manual;
- painel gerencial com disponibilidade por grupo, fluxo de pedidos, itens em falta, saldo baixo e produtos em entrega;
- histórico detalhado de acessos, produtos escolhidos, liberações automáticas e alterações administrativas;
- criação, edição completa, redefinição de senha e exclusão segura de usuários;
- tema Ônix em preto, grafite e lavanda pastel, responsivo e sem bibliotecas visuais externas.

## Publicação automática pelo GitHub

O arquivo `.github/workflows/deploy-cloudflare.yml` transforma a branch `main` na fonte oficial da produção:

1. todo pull request executa a conferência do código e os testes;
2. todo commit publicado na `main` executa novamente essas validações;
3. somente depois da aprovação dos testes, o GitHub aplica as migrações pendentes do D1;
4. o Worker e os arquivos do site são publicados no Cloudflare;
5. o endereço `https://controleestoque.app.br` é conferido automaticamente.

Cadastre estes dois segredos no ambiente GitHub chamado `production`:

- `CLOUDFLARE_ACCOUNT_ID`: ID da conta Cloudflare;
- `CLOUDFLARE_API_TOKEN`: token restrito à conta e à zona do sistema, com permissão para editar Workers, rotas do Worker e D1.

O token nunca deve ser colocado em arquivos, commits ou mensagens. Depois que os segredos forem cadastrados, não é necessário executar PowerShell, enviar ZIP ou publicar manualmente pelo Wrangler.

## Atualização manual de emergência

Leia primeiro `LEIA-ME-ATUALIZACAO-V6.6.2.md`.

Se a automação do GitHub estiver temporariamente indisponível, extraia o ZIP em uma pasta nova e dê dois cliques em `ATUALIZAR-SISTEMA.bat`. O atualizador instala o necessário, testa o sistema, cria um backup do banco, aplica migrações pendentes e publica a nova versão.

Se preferir executar manualmente, use:

Dentro da pasta do projeto, execute:

```bash
npm install
npm run db:remote
npm run deploy
```

Quando a migração perguntar se deseja continuar, confirme com `y`.

A atualização preserva usuários, sessões, pedidos, números de série já retirados e histórico. A migração `0026` atualiza o retrato de 10/08 e preserva chips já distribuídos, enquanto a `0025` protege a busca pelos 6 últimos dígitos e impede que um pedido comum e uma carteira reservem o mesmo chip. Instalações que ainda não receberam as versões anteriores também aplicarão Notícias (`0021`) e Chips (`0022`).

Depois da publicação, abra `https://controleestoque.app.br` e pressione `Ctrl + F5`.

## Publicar pela primeira vez

```bash
npm install
npx wrangler login
npx wrangler d1 create controle-estoque-db --location enam --binding DB --update-config
npm run db:remote
npm run deploy
```

Depois, acesse `https://controleestoque.app.br` e cadastre o primeiro gerente. Não existe senha padrão.

## Perfis

- Gerente: painel administrativo, gestão completa de chips, notícias com gestão de publicação, estoque, todos os pedidos, cancelamento com devolução de itens, usuários e histórico.
- Vendedor: carteira de até 10 chips disponíveis, registro de venda, notícias, catálogo, montagem de pedido, consulta dos próprios pedidos e Alinhamento rápido.
- Estoquista: notícias, painel operacional, conferência de preços e disponibilidade, pedidos liberados, cancelamento com devolução de itens e Alinhamento rápido.

O gerente pode criar um Estoquista em `Usuários > Novo usuário`.

## Uso local

```bash
npm install
npm run db:local
npm run dev
```

## Backup manual

```bash
npx wrangler d1 export DB --remote --output backup-estoque.sql
```

Guarde o arquivo exportado em local seguro.

## Segurança

- senhas derivadas com PBKDF2-SHA256 e salt exclusivo;
- sessões aleatórias em cookie `HttpOnly`, `Secure` e `SameSite`;
- permissões verificadas no servidor;
- perfil Estoquista limitado no servidor às consultas operacionais, aos pedidos e ao cancelamento; criação de pedidos, ajustes manuais, usuários e auditoria permanecem bloqueados;
- criação, edição e visibilidade das notícias limitadas ao Gerente no servidor;
- cadastro, transferência, retirada, restauração e correção de chips limitados ao Gerente; o Vendedor só registra a venda de chips da própria carteira;
- ICCID único, limite de 10 chips disponíveis por vendedor, seleção obrigatória de uma série livre e conciliação com o estoque protegidos também no banco;
- vendedores com chips disponíveis não podem ser desativados, excluídos ou ter o perfil alterado antes da transferência ou retirada da carteira;
- proteção contra requisições externas e excesso de tentativas de login;
- reserva, escolha de série e baixa executadas numa única operação transacional;
- nenhuma credencial ou senha gravada no código.

## Verificação técnica

```bash
npm test
npm run check
npx wrangler deploy --dry-run
```

Os 18 testes cobrem a migração do relatório de 10/08, os 291 materiais da planilha, 1.061 unidades, exclusão de RPAR, estrutura DEPS/NREM, preservação de pedidos e chips distribuídos, preços, Estoquista, Vivo Renova, usuários, Notícias e todo o ciclo de Chips: materiais disponíveis, busca pelos 6 últimos dígitos, múltiplas correspondências, limite por vendedor, transferência, venda, correção, retirada, restauração e conciliação com o estoque.
