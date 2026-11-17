# Status do projeto

Atualizado em 17/11/2026.

## Estado atual

Sneakers Store é uma loja de calçados, roupas e acessórios desenvolvida em 2026. A versão 1.0.0 está publicada como demonstração estática no [GitHub Pages](https://guilhermezalla.github.io/sneakers-store/). A demonstração usa dados fictícios no navegador; o sistema completo é composto por uma API Laravel e um frontend React.

O catálogo tem 30 produtos fictícios da marca Lume, com imagens locais creditadas em `CREDITS.md`. A interface oferece inglês/USD e português brasileiro/BRL, com preços independentes por moeda. O checkout e os pagamentos são simulados; nenhum valor é cobrado.

## Funcionalidades

- Cadastro, login, verificação de e-mail e recuperação de senha.
- Catálogo com busca, filtros, ordenação e paginação; galeria de imagens, ampliação e produtos relacionados.
- Avaliações, variantes de tamanho e cor, favoritos e carrinho.
- Endereços, opções de frete, checkout, pedidos e notificações.
- Demonstração com os fluxos de compra executados localmente, sem conexão à API.

## Pendências

- Hospedar o sistema completo, incluindo frontend, API, banco de dados e filas.
- Escolher e integrar um provedor de pagamentos reais. Até lá, pedidos e pagamentos permanecem simulados.

## Notas de operação

- A API usa Laravel, Sanctum e sessões com cookies e proteção CSRF. O frontend usa React Router.
- Duas migrations de avaliações e variantes foram aplicadas ao banco local em 17/11/2026. Outros ambientes devem aplicar migrations pendentes com `php artisan migrate --no-interaction`.
- As avaliações na demonstração pública ficam na sessão do visitante; não são compartilhadas entre visitantes.
- Os testes, verificações de tipos e lint, builds da aplicação e da demonstração passaram na CI do commit `7b637fb5`.
