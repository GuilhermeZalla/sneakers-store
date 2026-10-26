# Sneakers Store

Loja online em desenvolvimento com API Laravel e interface React. A API oferece autenticação, catálogo, carrinho, favoritos, endereços, checkout e histórico de pedidos. O frontend inclui cadastro, login, Home, catálogo, produto, favoritos e carrinho; checkout e painel serão desenvolvidos na próxima fase.

## Estrutura e stack

- `backend/`: PHP 8.4, Laravel 13, MySQL, Fortify, Sanctum e Pest.
- `frontend/`: React 19, Vite Plus, React Router 7, TypeScript e Tailwind CSS 4.
- `docs/STATUS.md`: controle de progresso.
- `frontend/starter/`: componentes de referência ainda não utilizados pela aplicação.

## Executar localmente

Requisitos: PHP com PDO MySQL, PDO SQLite e Intl; Composer; Node.js 22 ou superior; e MySQL.

No PowerShell, para uma instalação nova:

```powershell
cd backend
composer install
Copy-Item .env.example .env
php artisan key:generate
```

Crie um banco vazio chamado `sneakers_store` no MySQL e ajuste `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME` e `DB_PASSWORD` em `backend/.env`. Depois:

```powershell
php artisan migrate --seed --no-interaction
php artisan serve --host=localhost --port=8000
```

O seeder cadastra 63 produtos sem criar contas com senha padrão. Uma nova execução preserva produtos e preços já cadastrados.

Em outro terminal:

```powershell
cd frontend
npm.cmd ci
Copy-Item .env.example .env
npm.cmd run dev
```

Abra `http://localhost:5173`. O Vite encaminha `/api` e `/sanctum` ao backend configurado em `VITE_API_URL`, cujo valor padrão é `http://localhost:8000`. Reinicie o Vite após alterar essa variável. Use `localhost` em ambos os serviços e configure `FRONTEND_URL` e `SANCTUM_STATEFUL_DOMAINS` no backend para o endereço do frontend. Em produção, configure um proxy da mesma origem para esses caminhos, cookies seguros e o domínio de sessão apropriado.

## Autenticação e interface

A autenticação usa sessão por cookie com [Sanctum SPA](https://laravel.com/docs/13.x/sanctum). O cliente obtém `/sanctum/csrf-cookie`, envia credenciais e inclui o token XSRF nas alterações. As páginas `/login` e `/register` permitem entrar ou criar conta; `/account` exige autenticação. Ao entrar depois de acessar uma rota protegida, o usuário retorna ao endereço solicitado.

O catálogo mantém busca, marca, categoria, faixa de preço, ordenação e paginação na URL. Favoritos e carrinho exigem autenticação; ao favoritar sem sessão, o usuário entra e retorna à página com o produto adicionado. O seletor no cabeçalho vincula inglês a USD e português brasileiro a BRL. A interface salva a preferência de idioma e envia `Accept-Language` à API. A base visual usa tokens de cores, bordas, sombras e espaçamento, com componentes reutilizáveis e foco visível.

## API

Os endpoints abaixo usam o prefixo `/api/v1`:

- `POST /auth/register`: name, email, password, password_confirmation, phone, birthday (YYYY-MM-DD), gender e second_contact opcional.
- `POST /auth/login` e `POST /auth/logout`: entrada e saída.
- `GET/PATCH/DELETE /user`: conta autenticada; exclusão exige password. `PUT /user/password` altera a senha.
- `GET /products` e `GET /products/{slug}`: catálogo público. A listagem aceita `brand`, `type`, `search`, `min_price`, `max_price`, `per_page` e `sort`; valores de filtro usam centavos.
- `GET /cart`, `POST /cart/items`, `PATCH/DELETE /cart/items/{id}` e `DELETE /cart`: carrinho autenticado, com quantidades de 1 a 999.
- `GET/POST /wishlist` e `DELETE /wishlist/{id}`: favoritos.
- `GET/POST /addresses`, `GET/PATCH/PUT/DELETE /addresses/{id}` e `PUT /addresses/{id}/default`: endereços. Cada usuário pode cadastrar até quatro e definir no máximo um como padrão.
- `GET /shipping-methods`: preços e prazos de frete na moeda selecionada.
- `POST /checkout`: recebe `address_id`, `shipping_method` e `payment_method`; exige o cabeçalho `Idempotency-Key` único de 16 a 64 caracteres alfanuméricos, hífen ou sublinhado. Repetir os mesmos dados e chave retorna o mesmo pedido; dados ou idioma diferentes retornam 409.
- `GET /orders` e `GET /orders/{id}`: histórico e detalhes dos pedidos da conta autenticada.

O servidor calcula valores e armazena snapshots de itens, endereço, moeda, subtotal, frete e total. A criação do pedido e a limpeza do carrinho ocorrem na mesma transação. O carrinho conserva o preço de adição na mesma moeda; ao trocar idioma/moeda, seus itens passam a usar os preços cadastrados para a nova moeda.

## Idiomas, preços e pagamento

- Inglês usa USD e formatação `en-US`; português usa BRL e formatação `pt-BR`. Os valores são armazenados em centavos inteiros.
- Os preços de produtos em BRL foram inicialmente cadastrados para demonstração em 5× os valores USD; depois podem ser alterados independentemente. Não há cotação em tempo real.
- Os fretes BRL são **valores provisórios de demonstração** fixados inicialmente em 5× os valores USD, sem cotação em tempo real.
- Todos os métodos de pagamento são simulados. Na Wallet, o valor considerado é exatamente o total do pedido, sem desconto fictício de US$ 10, saldo financeiro ou integração com gateway.
- As descrições dos 63 produtos possuem versões em inglês e português. O seeder preenche traduções ausentes sem sobrescrever textos e preços editados.
- As imagens de demonstração são carregadas de servidores externos `images.solecollector.com` e `cdn.shopify.com`. A licença de uso dessas imagens não foi identificada; confirme as permissões com os titulares antes de publicar ou substitua-as por imagens licenciadas.

## Verificação

```powershell
cd backend
php artisan test --compact
composer types:check
```

Os testes PHP usam SQLite em memória e não alteram o MySQL configurado. Para testar concorrência no MySQL de desenvolvimento com uma conta temporária, execute `python tests/Integration/mysql_concurrency.py` dentro de `backend/`; o banco deve estar migrado e com o catálogo cadastrado.

```powershell
cd frontend
npm.cmd test
npm.cmd run types:check
npm.cmd run check
npm.cmd run build
```
