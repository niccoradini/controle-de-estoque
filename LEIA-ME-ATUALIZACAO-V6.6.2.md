# Atualização 6.6.2 — cadastro de vários chips

Esta atualização amplia o cadastro assistido da versão 6.6.1 e permite distribuir vários chips para um vendedor em uma única confirmação.

## Como funciona

1. Entre como **Gerente**, abra **Chips** e clique em **Cadastrar chip**.
2. Escolha o vendedor responsável pelo lote.
3. Escolha qualquer material de SIM card disponível.
4. Informe os 6 últimos dígitos do ICCID e confira a correspondência completa.
5. Clique em **Adicionar à fila**.
6. Repita o processo para todos os chips desejados. É possível misturar materiais.
7. Revise a fila, remova algum item se necessário e clique em **Cadastrar chips**.

O vendedor fica fixo depois que o primeiro item entra na fila. Para escolher outro vendedor, limpe a fila e comece novamente.

## Proteção do lote

- cada ICCID só pode aparecer uma vez na fila;
- o lote respeita o limite de 10 chips disponíveis por vendedor;
- o servidor consulta novamente todos os ICCIDs antes da confirmação;
- as gravações são executadas em uma transação do D1;
- se uma unidade ficar indisponível ou faltar vaga, todo o lote é cancelado;
- nenhum chip é cadastrado parcialmente;
- vendedores e estoquistas não têm acesso ao cadastro em lote;
- cada chip mantém seu próprio registro no Histórico.

Não há nova migração nesta versão. A proteção `0025_chip_suffix_lookup.sql` continua sendo utilizada.

## Atualização automática

1. Extraia o ZIP completo em uma pasta nova.
2. Abra a pasta extraída.
3. Dê dois cliques em `ATUALIZAR-SISTEMA.bat`.
4. Leia a apresentação e pressione uma tecla para começar.
5. Se o Cloudflare pedir autorização, conclua o login no navegador.
6. Confirme com `y` caso o backup ou uma migração solicite confirmação.
7. Aguarde a mensagem **ATUALIZAÇÃO CONCLUÍDA COM SUCESSO**.

O atualizador prepara o projeto, executa os 18 testes, cria um backup do banco, aplica migrações pendentes, valida o pacote e publica o sistema. Se alguma etapa falhar, as seguintes não são executadas e a tela informa que deve ser fotografada para conferência.

## Conferência depois da publicação

1. Pressione `Ctrl + F5` no site.
2. Entre como Gerente e abra **Chips**.
3. Adicione pelo menos dois chips à fila.
4. Confira o contador de vagas restantes.
5. Remova e adicione novamente um dos chips.
6. Confirme o lote e verifique se todos aparecem na carteira correta.
7. Entre como Vendedor e confirme que os novos chips aparecem normalmente.
