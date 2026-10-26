# Sneakers Store

Migração em fases do projeto MERN [GuilhermeZalla/sneakers](https://github.com/GuilhermeZalla/sneakers/tree/master) para Laravel + React. A API já oferece autenticação, catálogo, carrinho, favoritos, endereços, checkout e pedidos. As páginas da loja, dashboard e checkout serão implementadas nas fases seguintes; o frontend atual é apenas a entrada React Router.

## Estrutura e stack

- `backend/`: Laravel 13, PHP 8.4, MySQL, Fortify sem telas, Sanctum e Pest.
- `frontend/`: React 19, Vite Plus, React Router 7, TypeScript e Tailwind 4.
- `frontend/starter/`: componentes e páginas do starter preservados para adaptação; não fazem parte da compilação atual.
- `docs/STATUS.md`: controle interno de fases.

O repositório antigo é fonte de consulta. Nenhum novo commit ou push deve ser feito pelo agente sem nova instrução.

## Executar localmente

Requisitos: PHP com PDO MySQL, PDO SQLite para testes e Intl; Composer; Node.js 22 ou superior; MySQL disponível.

No PowerShell, para uma instalação nova:

```powershell
cd backend
composer install
Copy-Item .env.example .env
php artisan key:generate
```

Crie um banco vazio chamado `sneakers_store` no MySQL e ajuste `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME` e `DB_PASSWORD` no `backend/.env`. Depois:

```powershell
php artisan migrate --seed --no-interaction
php artisan serve --host=localhost --port=8000
```

O seeder importa os 63 produtos originais, sem criar conta com senha padrão. Uma nova execução preserva registros e preços já cadastrados.

Em outro terminal:

```powershell
cd frontend
npm.cmd ci
Copy-Item .env.example .env
npm.cmd run dev
```

Abra `http://localhost:5173`. Use `localhost` em ambos os serviços para compartilhar os cookies corretamente. `FRONTEND_URL` e `SANCTUM_STATEFUL_DOMAINS` no backend devem corresponder ao frontend; `VITE_API_URL` prepara o endereço da API para a integração das páginas.

## API e autenticação

A API usa JSON e autenticação SPA por sessão/cookies, conforme a [documentação do Sanctum](https://laravel.com/docs/13.x/sanctum). O cliente deve enviar credenciais e obter primeiro `GET /sanctum/csrf-cookie`; nos pedidos seguintes, enviar o cookie XSRF decodificado em `X-XSRF-TOKEN`.

- `POST /api/v1/auth/register`: name, email, password, password_confirmation, phone, birthday (YYYY-MM-DD), gender e second_contact opcional.
- `POST /api/v1/auth/login`: email e password.
- `POST /api/v1/auth/logout`: encerra sessão.
- `GET/PATCH/DELETE /api/v1/user`: conta autenticada; exclusão exige password.
- `PUT /api/v1/user/password`: current_password, password e password_confirmation.
- Rotas de recuperação de senha do starter foram preservadas na API; o link do e-mail aponta para o frontend, cuja tela será adaptada depois.

O catálogo é público. Carrinho, wishlist e endereços exigem sessão autenticada:

- `GET /api/v1/products` lista produtos com paginação. Aceita `brand`, `type` (`sneaker`, `shirt`, `cap`, `gift`), `search`, `min_price`, `max_price`, `per_page` e `sort` (`name`, `-name`, `price`, `-price`, `rating`, `-rating`). Filtros de preço usam centavos na moeda selecionada.
- `GET /api/v1/products/{slug}` retorna um produto. Cada preço é um inteiro em centavos com sua `currency`.
- `GET /api/v1/cart` retorna itens e `meta.subtotal`; `POST /api/v1/cart/items` recebe `product_id` e `quantity`. `PATCH /api/v1/cart/items/{id}` altera quantidade; `DELETE` nesse mesmo endereço remove o item; `DELETE /api/v1/cart` esvazia o carrinho. Quantidades aceitas: 1 a 999; adicionar novamente soma ao item existente.
- O preço unitário do carrinho é obtido no servidor e preservado enquanto a moeda permanece a mesma. Quando o idioma/moeda muda, o próximo acesso ao carrinho atualiza todos os itens em uma transação usando os preços cadastrados para a nova moeda. O preço do produto aninhado representa o catálogo atual; use `unit_price` do item para o subtotal.
- `GET/POST /api/v1/wishlist` lista ou adiciona por `product_id`. `DELETE /api/v1/wishlist/{id}` remove pelo ID do item da wishlist. Adicionar novamente é idempotente.
- `GET/POST /api/v1/addresses` lista ou cria. `GET/PATCH/PUT/DELETE /api/v1/addresses/{id}` consulta, altera ou remove. `PUT /api/v1/addresses/{id}/default` define o padrão. O usuário pode ter até quatro endereços e, no máximo, um padrão. CEP é string com oito dígitos e hífen opcional; `type` aceita `home`, `work` ou `other`, e `state` aceita uma UF brasileira.

- `GET /api/v1/shipping-methods` informa preços e prazos fixos na moeda selecionada.
- `POST /api/v1/checkout` recebe `address_id`, `shipping_method` (`blue`, `sedex`, `fedex`, `red`) e `payment_method` (`debit`, `credit`, `paypal`, `wallet`). Envie um cabeçalho `Idempotency-Key` único de 16 a 64 caracteres alfanuméricos, hífen ou sublinhado por tentativa de compra. Repetir a mesma chave e os mesmos dados retorna o mesmo pedido; dados ou idioma diferentes retornam 409. Para uma nova compra, use outra chave.
- `GET /api/v1/orders` lista os pedidos da conta; `GET /api/v1/orders/{id}` retorna seus detalhes. Pedidos mantêm snapshots dos itens, endereço, moeda, subtotal, frete e total. Valores recebidos do cliente são ignorados e o carrinho é limpo na mesma transação de criação do pedido.

Gênero aceita `male`, `female` ou `not_informed`. Telefones e CEP são strings. Não envie o e-mail do usuário como mecanismo de autorização. CORS permite somente a origem configurada; para HTTPS em produção, configure cookies seguros e o domínio de sessão adequadamente.

## Idiomas, moedas e valores

- Inglês (`en`, formatação `en-US`) usa USD.
- Português do Brasil (`pt_BR`, formatação `pt-BR`) usa BRL.
- Idioma e moeda são vinculados. A API seleciona o par pelo cabeçalho `Accept-Language` e informa `Content-Language` e `X-Store-Currency`.
- Preços são fixos por moeda e armazenados como inteiros em centavos. Não há cotação em tempo real.
- Os preços USD vêm do JSON original. Os valores BRL de demonstração são gerados inicialmente com **5× o valor USD**, por decisão do usuário; isso não representa cotação. Depois de cadastrados, podem ser alterados independentemente.
- Carrinho e pedidos têm moeda explícita. As próximas fases deverão atualizar o resumo ao trocar de idioma/moeda e nunca misturar moedas no mesmo pedido.
- O JSON original, incluindo nomes e descrições comerciais, foi preservado como dado de origem. A API ainda retorna as descrições em inglês; a tradução delas para pt-BR, junto às traduções das interfaces, está pendente para as fases de frontend.

## Pagamento simulado e desvios do original

O pagamento é simulado. A regra aprovada é **valor cobrado = total do pedido**, inclusive para Wallet. A Wallet continuará sendo um método de pagamento simulado, **sem o desconto fictício de US$ 10 do projeto MERN**, sem saldo financeiro e sem integração com gateway.

O limite de quatro endereços por usuário é um desvio do projeto original. Os fretes são simulados e fixos por moeda; os valores BRL iniciais de demonstração foram definidos como 5× os valores USD, sem cotação em tempo real. Não há estoque quantitativo, painel administrativo ou avaliações enviadas por usuários no original. `rank` é a nota estática exibida em estrelas. O catálogo inclui os 50 tênis e também 13 roupas, acessórios e presentes.

## Verificação

```powershell
cd backend
php artisan test --compact
composer types:check
```

Os testes usam SQLite em memória e não alteram o MySQL configurado. Para testar concorrência real no MySQL local com uma conta temporária e dois servidores locais: `python tests/Integration/mysql_concurrency.py` dentro de `backend/`. Use apenas um banco de desenvolvimento com migrations e catálogo já aplicados; a conta de teste e seus dados são removidos ao final. Executar os testes não substitui validar a instalação/migração no MySQL local.

```powershell
cd frontend
npm.cmd test
npm.cmd run types:check
npm.cmd run check
npm.cmd run build
```

Screenshots, fluxos completos e documentação final serão acrescentados na fase 8.
