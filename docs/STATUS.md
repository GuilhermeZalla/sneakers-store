# Status do projeto

Atualizado em 18/11/2026.

## Estado atual

Sneakers Store é uma loja de calçados, roupas e acessórios desenvolvida em 2026. A versão 1.0.0 está publicada como demonstração estática no [GitHub Pages](https://guilhermezalla.github.io/sneakers-store/). A demonstração usa dados fictícios no navegador; o sistema completo é composto por uma API Laravel e um frontend React.

O catálogo tem 30 produtos fictícios da marca Lume, com imagens locais creditadas em `CREDITS.md`. A interface oferece inglês/USD e português brasileiro/BRL, com preços independentes por moeda. O checkout e os pagamentos são simulados; nenhum valor é cobrado.

## Funcionalidades

- Cadastro, login, verificação de e-mail e recuperação de senha.
- Catálogo com busca, filtros, ordenação e paginação; galeria de imagens, ampliação e produtos relacionados.
- Avaliações, variantes de tamanho e cor, favoritos e carrinho.
- Microinterações e animações táteis nos botões, cards, galeria, opções de variantes e hero, com foco de teclado e tratamento de `prefers-reduced-motion`.
- Endereços, opções de frete, checkout, pedidos e notificações.
- Demonstração com os fluxos de compra executados localmente, sem conexão à API.

## Pendências

- Hospedar o sistema completo, incluindo frontend, API, banco de dados e filas.
- Escolher e integrar um provedor de pagamentos reais. Até lá, pedidos e pagamentos permanecem simulados.

## Notas de operação

- A API usa Laravel, Sanctum e sessões com cookies e proteção CSRF. O frontend usa React Router.
- Duas migrations de avaliações e variantes foram aplicadas ao banco local em 17/11/2026. Outros ambientes devem aplicar migrations pendentes com `php artisan migrate --no-interaction`.
- As avaliações na demonstração pública ficam na sessão do visitante; não são compartilhadas entre visitantes.
- Os testes, verificações de tipos, lint e build da demonstração com microanimações integradas passaram com sucesso em 17/11/2026.

## Revisão de continuidade — 18/11/2026

- Galeria/zoom, produtos relacionados e filtros mobile já foram incorporados em `7b637fb5`; não precisam ser refeitos.
- [x] Corrigida a permanência do último quadro da animação de entrada sobre o transform dos cards: após a entrada, o hover/foco volta a usar o movimento aprovado. A correção também libera o deslocamento da imagem de destaque após a entrada.
- [x] Movimento reduzido não apaga mais a transformação estrutural que posiciona a imagem da Home no desktop. Mantida a entrada desativada nessa preferência.
- [x] Lint, formatação, tipos, 22 testes unitários e oito cenários de navegador aprovados; builds normal/demo aprovados. Navegador confirmou o posicionamento da imagem no desktop e foco nos cards com deslocamento de 3 px em movimento reduzido. O navegador de revisão estava com essa preferência ativa; a entrada em movimento normal foi conferida no CSS, sem simular uma preferência global diferente.
- Propostas inicialmente apresentadas separadamente e aprovadas na continuação abaixo: abertura/fechamento discreto dos filtros e feedback breve no botão após adicionar ao carrinho. Exemplos separados da aplicação; nenhuma animação nova será aplicada sem aprovação.
- Hospedagem completa e pagamentos reais continuam pendentes. Mesmos componentes e estilos atendem demo e aplicação conectada à API.

Os exemplos de filtros (180 ms) e confirmação na sacola (160 ms) estão separados do repositório. São propostas para aprovação, não funcionalidades pendentes já autorizadas. Nenhuma migration, alteração de dados ou dependência nesta revisão.

## Movimentos aprovados — 18/11/2026 (concluído)

- Aprovados pelo titular: abertura/fechamento de filtros em 180 ms e confirmação no botão da sacola com transição de 160 ms.
- [x] Implementados nos componentes compartilhados da demo e aplicação completa. Filtros recolhidos ficam fora do foco/árvore acessível; desktop mantém acesso aos campos.
- [x] Confirmação exibida por um segundo somente após sucesso da inclusão. Falhas não confirmam a compra; trocar opções/produto limpa o feedback, e o timer é cancelado ao sair. O botão mantém o espaço do rótulo para não deslocar o layout.
- [x] Conferidos filtros em 390/768 px e desktop, retorno do foco para o próximo controle visível, atualização de filtros e ausência de overflow. Confirmado `ADDED` após sucesso, retorno após um segundo e dimensões idênticas do botão antes/durante o feedback. Movimento reduzido elimina as transições e mantém a informação de sucesso.
- [x] 22 testes unitários, oito cenários de navegador, tipos, lint/formatação e builds normal/demo aprovados. Publicação pelo workflow existente após push.

Sem novas dependências, alterações na API ou banco. Hospedagem completa e pagamentos reais continuam pendentes.
