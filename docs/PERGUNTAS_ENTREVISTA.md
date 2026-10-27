# Perguntas e respostas para apresentar o Sneakers Store

Guia de preparação para entrevista, baseado no código e no README atuais.

As respostas são modelos de fala. Use suas palavras e adapte os relatos à sua participação real. Não precisa decorar nomes de classes: primeiro explique o comportamento, depois aprofunde se perguntarem.

## Apresentação do projeto

### 1. Pode me apresentar o projeto em cerca de 30 segundos?

É uma loja online de estudo com React no frontend e Laravel no backend. O usuário pode consultar produtos, criar uma conta, verificar o e-mail, salvar favoritos, montar um carrinho e concluir uma compra simulada. Também há endereços, histórico de pedidos e notificações. O foco foi praticar um fluxo completo, incluindo segurança, consistência dos dados e testes.

### 2. Qual foi o objetivo do projeto?

O objetivo foi evoluir um projeto original em MERN, de 2022, para uma aplicação com API Laravel e interface React. A ideia foi trabalhar a comunicação entre as duas partes e os cuidados que aparecem em uma aplicação com usuários, pedidos e informações persistidas.

### 3. O que veio da versão original e o que mudou?

A versão MERN serviu como referência para a proposta da loja, os fluxos e os dados de catálogo. Nesta versão, o backend foi reimplementado com Laravel e MySQL, enquanto a interface usa React com TypeScript e React Router. Não foi feita importação de dados pessoais do MongoDB original.

### 4. Quais funcionalidades posso demonstrar?

Posso mostrar o catálogo com filtros e ordenação, o detalhe de um produto, favoritos, carrinho e troca entre inglês/USD e português/BRL. Depois, cadastro, verificação de e-mail, checkout, endereços, pedidos e notificações. Eu explicaria desde o início que o pagamento é simulado.

### 5. Por que uma loja online é um bom projeto de portfólio?

Porque ela exige mais do que exibir uma lista de produtos. É preciso relacionar dados, proteger informações de usuários diferentes, validar entradas e manter um pedido consistente mesmo quando uma requisição falha ou é repetida.

## Organização e funcionamento

### 6. Quais tecnologias foram utilizadas?

O backend utiliza PHP 8.4, Laravel 13 e MySQL. O frontend utiliza React 19, TypeScript, React Router e Tailwind CSS, com Vite Plus para desenvolvimento e build. Os testes do backend usam Pest, e também há testes do frontend e verificações em navegador real.

### 7. Como frontend e backend conversam?

O React envia requisições HTTP para a API do Laravel, que responde com dados em JSON. Por exemplo, ao abrir o catálogo, o frontend pede os produtos à API; o Laravel consulta o banco e devolve a lista. O React apresenta os resultados ou mostra um estado de carregamento, vazio ou erro.

### 8. Por que separar React e Laravel?

A separação deixa mais clara a responsabilidade de cada parte. O React cuida da experiência e da navegação; o Laravel concentra autenticação, autorização, validação e regras de negócio. Isso permite evoluir a interface sem colocar regras importantes apenas no navegador.

### 9. Como o backend está organizado?

As rotas direcionam a requisição para um controller. Há classes para validar a entrada, políticas para verificar permissões e recursos que organizam o JSON de resposta. A regra mais complexa do checkout fica em um serviço, em vez de deixar toda a lógica no controller.

Se pedirem os nomes: essas peças são Form Requests, Policies, API Resources e CheckoutService.

### 10. Por que utilizar MySQL?

Os dados têm relações bem definidas: um usuário possui endereços e pedidos, e cada pedido possui itens. O banco relacional permite representar essas relações e usar transações para manter as alterações consistentes. Isso se encaixa bem no fluxo de checkout.

### 11. Onde ficam os dados do carrinho e dos favoritos?

Eles ficam no banco, associados ao usuário autenticado. O React mantém uma representação desses dados para atualizar a tela, mas o navegador não é a única fonte das informações. Assim, recarregar a página não deve apagar o carrinho salvo.

### 12. Como são controlados os estados no frontend?

O projeto usa Context e hooks do React para compartilhar autenticação, idioma, carrinho e notificações. Também existem estados específicos de cada página, como a etapa atual do checkout. A proposta foi atender ao tamanho atual da aplicação sem adicionar outra biblioteca de estado.

### 13. Como funcionam os filtros do catálogo?

Busca, categoria, marca, preço e ordenação são enviados à API. Os filtros também ficam na URL, permitindo atualizar ou compartilhar a página com a mesma seleção. O backend valida os parâmetros e filtra a consulta ao banco; não depende apenas de esconder produtos na interface.

## Autenticação e segurança

### 14. Como funciona o login?

O Laravel autentica o usuário e mantém uma sessão identificada por cookie, usando Sanctum para a aplicação React. O frontend consulta a API para saber quem está autenticado. Salvar um nome ou e-mail no localStorage não concede acesso à conta.

### 15. Por que usar sessão com cookie em vez de guardar um token no localStorage?

Para esta aplicação web, a autenticação por sessão atende ao fluxo sem precisar guardar um token de acesso no localStorage. O projeto utiliza a integração do Sanctum com cookies e proteção CSRF. Essa escolha ainda exige configurar corretamente origem, cookies e HTTPS no ambiente de produção.

### 16. O que é CSRF, em uma explicação simples?

É uma tentativa de fazer o navegador de uma pessoa executar uma ação em um site onde ela já está autenticada, a partir de outra página. A proteção CSRF exige um token nas operações que alteram dados, além do cookie de sessão. Isso ajuda a impedir esse tipo de requisição indevida.

### 17. Qual é a diferença entre estar autenticado e ter permissão?

Estar autenticado significa que o sistema sabe quem é o usuário. Ter permissão significa que ele pode executar aquela ação sobre aquele registro. Mesmo autenticado, um usuário não pode consultar o pedido ou alterar a notificação de outra pessoa.

### 18. Como o projeto protege os dados de cada usuário?

As consultas são limitadas ao usuário autenticado e as políticas verificam quem é o dono do registro. Esconder um botão no React não seria suficiente: a API também precisa recusar o acesso. Há testes para tentativas de acessar informações de outra conta.

### 19. Como funciona a verificação de e-mail?

Após o cadastro, o sistema envia um link temporário que abre uma rota do React. Essa página confirma o link com a API. Ele funciona mesmo com o usuário deslogado, mas verificar o e-mail não cria automaticamente uma sessão de login.

O catálogo é público; operações como carrinho, favoritos e pedidos exigem uma conta verificada.

### 20. Como funciona a recuperação de senha?

O usuário solicita um link de redefinição e informa a nova senha em uma tela do frontend. O link tem validade curta e uso único. A resposta da solicitação é a mesma para um e-mail cadastrado ou inexistente, para não revelar quais pessoas possuem conta.

### 21. As senhas são enviadas por e-mail ou salvas em texto puro?

Não. As senhas são armazenadas como hash, e os e-mails nunca incluem a senha do usuário. O acesso e a recuperação usam links de verificação ou redefinição. Também existem limites de requisições para reduzir abuso de cadastro e envio de mensagens.

### 22. O que acontece se eu trocar de conta enquanto uma requisição ainda está carregando?

Uma resposta atrasada da conta anterior não deve aparecer na conta nova. Os providers usam controles para descartar respostas que já ficaram desatualizadas. Isso é especialmente importante para impedir que notificações ou outros dados de uma pessoa apareçam para outra.

## Checkout e consistência dos pedidos

### 23. O que acontece quando o usuário confirma um pedido?

A API valida a solicitação, verifica o endereço do usuário e lê o carrinho. Depois calcula os valores, registra o pedido e seus itens e limpa o carrinho. Essas alterações acontecem juntas, dentro de uma transação, e a notificação é enfileirada para processamento após a confirmação dessa transação.

### 24. O que é uma transação e por que ela importa aqui?

É uma forma de tratar várias alterações como uma única operação. Se ocorrer uma falha durante a criação do pedido, as alterações daquela operação são desfeitas. Isso evita, por exemplo, limpar o carrinho e deixar um pedido incompleto.

### 25. Como o sistema evita pedidos duplicados?

Cada tentativa de checkout possui uma chave de idempotência, que identifica aquela operação. Se a mesma tentativa chegar novamente com os mesmos dados, a API devolve o pedido já criado. Se a chave for reutilizada com dados diferentes, a solicitação é rejeitada.

Em termos simples: repetir a mesma confirmação não deve criar outro pedido.

### 26. E se duas confirmações chegarem ao mesmo tempo?

Além da chave de idempotência, o checkout usa um bloqueio no registro do usuário durante a transação. Assim, as confirmações daquele usuário são processadas em sequência. Esse comportamento também foi verificado com requisições simultâneas em um MySQL temporário.

### 27. E se o pedido for criado, mas a resposta não chegar ao navegador?

O frontend conserva os dados e a chave da tentativa pendente no sessionStorage. Ele pode repetir a confirmação com a mesma chave, em vez de tratar o problema como uma compra nova. A API consegue reconhecer a repetição e retornar o pedido existente.

### 28. O que é o snapshot do pedido?

É o registro dos dados utilizados naquela compra, como nome e preço dos itens, endereço, moeda e total. Se o produto ou o endereço forem alterados depois, o histórico do pedido continua mostrando os dados registrados na compra. Ele não depende apenas das informações atuais do catálogo.

### 29. Como o sistema trabalha com preços e moedas?

Os valores são armazenados em centavos inteiros, para evitar problemas de precisão comuns ao usar números decimais em dinheiro. Existem preços cadastrados em USD e BRL, e não uma conversão de câmbio em tempo real. O pedido guarda a moeda e os valores utilizados na confirmação.

### 30. O usuário poderia alterar o total pelo navegador?

O frontend não é a autoridade sobre o total. O backend calcula os valores a partir do carrinho persistido e das opções de entrega aceitas. Na mesma moeda, o carrinho conserva o preço registrado na adição; ao trocar a moeda, utiliza os preços cadastrados para ela.

Eu não diria que o checkout sempre usa o preço mais recente do catálogo: essa não é a regra atual.

### 31. Existe pagamento real?

Não. A Wallet permite concluir o fluxo de demonstração, mas não movimenta dinheiro nem realiza cobranças. A confirmação da tela significa que o pedido foi registrado; não é uma confirmação de pagamento por um banco. O pedido é criado com status pendente.

### 32. O frete é calculado por uma transportadora?

Não. As opções de frete usam preços e prazos de demonstração definidos no backend. Não há integração para cotação ou rastreamento. Isso mantém o foco do projeto no fluxo da compra, sem apresentar uma simulação como se fosse um serviço real.

## E-mails, notificações e interface

### 33. Como funcionam os e-mails?

Eventos como cadastro, verificação, recuperação de senha e confirmação de pedido geram notificações. O envio passa por uma fila processada por um worker, separado da requisição do usuário. Em desenvolvimento, o Mailpit permite visualizar os e-mails localmente sem enviá-los para destinatários reais.

### 34. Por que utilizar uma fila?

Porque a resposta ao usuário não precisa esperar a conexão com o serviço de e-mail e o envio da mensagem. O trabalho fica registrado para processamento separado, com tentativas em caso de falha. Se o worker estiver parado, as mensagens ficam pendentes; por isso, ele faz parte da configuração de execução do projeto.

As notificações internas também passam pela fila.

### 35. Como o sino recebe novas notificações?

O frontend consulta a API periodicamente, a cada 30 segundos enquanto a aba está visível, e atualiza ao reabrir a aba. Essa estratégia é chamada de polling. Não há WebSocket nesta versão: a solução atual atende à demonstração com menos infraestrutura, mas pode ter um pequeno atraso.

### 36. Como funcionam os dois idiomas?

O usuário pode selecionar português brasileiro ou inglês, e essa preferência é persistida para a conta. A seleção também define a moeda exibida e a formatação dos valores. Os e-mails utilizam a preferência salva do usuário, e não apenas o idioma que estava aberto no navegador.

### 37. Quais cuidados houve com a experiência de uso?

A interface possui estados de carregamento, vazio e erro, além de oportunidades para tentar novamente. Também houve verificações em telas menores e navegação por teclado no sino. No portfólio, os GIFs mostram os fluxos reais com dados fictícios.

Isso não significa afirmar que foi feita uma certificação completa de acessibilidade.

## Testes, decisões e evolução

### 38. Como você verificou se o projeto funciona?

Há testes automatizados para autenticação, catálogo, carrinho, endereços, pedidos e notificações. Eles cobrem tanto o caminho de sucesso quanto situações como acesso a dados de outra pessoa, links inválidos e repetição de checkout. Também foram percorridos fluxos em navegador real com Mailpit.

### 39. Por que existe Python em um projeto PHP e React?

Ele é usado somente em um teste manual de concorrência com MySQL. O script dispara requisições simultâneas para verificar endereço padrão e checkout idempotente. Python não participa do funcionamento do site e não é necessário para o usuário navegar na aplicação.

### 40. Por que o teste de concorrência usa MySQL, se outros testes usam SQLite?

SQLite em memória facilita executar a suíte de testes de forma isolada. Mas o teste de concorrência precisa observar os bloqueios e as transações no banco escolhido para a aplicação. Por isso existe uma verificação específica com MySQL local temporário, sem utilizar o banco habitual de desenvolvimento.

### 41. Para que servem TypeScript, lint, Pint e PHPStan?

TypeScript ajuda a encontrar incompatibilidades de tipos no frontend antes da execução. Lint e Pint ajudam a manter consistência, enquanto o PHPStan analisa o código PHP em busca de possíveis problemas. São verificações complementares: nenhuma delas substitui os testes do comportamento da aplicação.

### 42. Pode dar um exemplo de problema real encontrado?

Um caso foi o catálogo não carregar, mesmo com o frontend aberto. A API retornava erro porque o PHP 8.4 do Herd estava carregando configurações do PHP 8.5 do Scoop e não conseguia iniciar o driver MySQL. A correção foi separar essa configuração local e conferir novamente a resposta da API e as imagens no navegador.

O aprendizado foi investigar a requisição e a causa no backend antes de tratar o problema como um erro visual do React.

### 43. De onde vêm as imagens? Você utilizou IA?

O catálogo utiliza imagens locais com fontes e créditos documentados. As imagens dos dois gorros foram geradas por IA; as demais fotos do catálogo estão creditadas ao Pexels. O projeto também teve apoio de IA na evolução do código e na documentação.

Ao explicar minha participação, eu separo o que foi reaproveitado, o que foi adaptado com apoio e o que consigo explicar e validar.

### 44. O projeto está pronto para uma loja real?

Eu o apresento como um projeto de estudo com fluxos funcionais e testes, não como uma operação comercial completa. Não possui cobrança real, integração logística, controle quantitativo de estoque ou painel administrativo. As avaliações exibidas são dados estáticos do catálogo, não uma votação dos usuários.

### 45. O que você faria em uma próxima etapa?

A integração de pagamentos reais já está registrada como plano futuro. Ela exigiria escolher um provedor, validar o fluxo em sandbox e confirmar o pagamento por uma comunicação confiável do provedor, sem confiar apenas na tela de sucesso. Também seriam evoluções possíveis o estoque, a administração e a integração de entrega, conforme a prioridade do projeto.

### 46. O que seria necessário cuidar em produção?

Além de implementar as integrações necessárias, seria preciso configurar domínio, HTTPS, banco, cookies, segredos, SMTP e execução contínua do worker. Também seriam necessários monitoramento, backups e tratamento operacional de falhas. Eu não confundiria conseguir rodar localmente com ter uma operação pronta para produção.

### 47. Qual foi o principal aprendizado que este projeto permite demonstrar?

Que uma aplicação precisa manter suas regras mesmo quando o navegador falha, a requisição é repetida ou alguém tenta acessar um registro que não pertence a ele. A interface importa, mas segurança, consistência dos pedidos e tratamento de erros também fazem parte da experiência de uso.

## Roteiro rápido para apresentar na entrevista

1. **Contexto:** explique em uma frase que é uma evolução de um projeto de estudo MERN para Laravel e React.
2. **Demonstração:** mostre catálogo, favorito e carrinho; depois, um checkout simulado e o pedido na conta.
3. **Decisão importante:** explique como a transação e a chave de idempotência ajudam a evitar pedidos incompletos ou duplicados.
4. **Segurança e qualidade:** cite a proteção por proprietário dos dados e um teste relevante, em vez de apenas dizer que o sistema é seguro.
5. **Limite e evolução:** deixe claro que pagamento e frete são simulados e apresente a integração real como uma etapa futura.

Uma forma de responder quando não lembrar um detalhe:

> Não lembro o nome exato da classe, mas o comportamento é este: [...]. Eu conferiria a implementação e os testes desse fluxo antes de afirmar o detalhe.

## Onde conferir no projeto

- [Visão geral, execução e limites](../README.md).
- [Checkout, transação, idempotência e snapshot](../sneakers-store-backend/app/Services/CheckoutService.php).
- [Autenticação e preferência de idioma no frontend](../sneakers-store-frontend/src/context/AuthContext.tsx).
- [Permissão para consultar pedidos](../sneakers-store-backend/app/Policies/OrderPolicy.php).
- [Testes de checkout](../sneakers-store-backend/tests/Feature/CheckoutApiTest.php).
- [Testes de segurança de publicação](../sneakers-store-backend/tests/Feature/PublicationSecurityTest.php).
- [Créditos das imagens](../CREDITS.md).
