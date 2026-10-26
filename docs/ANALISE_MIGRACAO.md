# Etapa 0 — análise e plano

Análise estática de 26/10/2026. Fonte: https://github.com/GuilhermeZalla/sneakers/tree/master, commit `438224126ba5239b4f6c357feafcf4b16473b75c`. A branch padrão `main`, commit `642c8c5695be621c1d70502b23f6c27f9349be2b`, contém somente README e LICENSE; a implementação está em `master`.

## Inventário do original

Express concentra todos os handlers em `server/src/routes/account.js`, sem controllers separados. `server/index.js` monta esse mesmo router em **`/account` e `/product`**. Assim, os 21 handlers abaixo são expostos sob ambos os prefixos; `/product` não é uma API de catálogo.

| Método | Caminho relativo ao prefixo | Comportamento |
| --- | --- | --- |
| POST | `/` | Cadastro de usuário |
| POST | `/wishlist/:email/:name/:price/:rank/:id` | Adicionar favorito |
| POST | `/shopping-cart/:email/:name/:price/:quant` | Criar/alterar item do carrinho |
| POST | `/update-password` | Tentativa de troca de senha, com implementação defeituosa |
| POST | `/address` | Criar endereço |
| POST | `/payment` | Gravar compra e redirecionar |
| GET | `/:email` | Consultar existência do e-mail |
| GET | `/phone/:phone` | Consultar existência do telefone |
| GET | `/validation/:email/:password` | Comparar credenciais |
| GET | `/wishlist/:email` | Listar favoritos |
| GET | `/user/:email` | Retornar documento do usuário, incluindo senha |
| GET | `/user-cart/:email` | Listar carrinho e somar preço × quantidade |
| GET | `/verify-password/:email/:password` | Buscar usuário por credenciais |
| GET | `/address/:email` | Listar endereços |
| GET | `/purchase/:email` | Listar compras |
| PATCH | `/login/:email/:state` | Alterar booleano `logged` |
| PATCH | `/cart-item/update-quantity/:email/:name/:quant` | Alterar quantidade |
| PATCH | `/define-default/:id/:state` | Alterar flag padrão de um endereço |
| DELETE | `/wishlist/remove/:email/:name` | Tentativa de remover favorito |
| DELETE | `/cart-item/remove/:email/:name` | Tentativa de remover item do carrinho |
| DELETE | `/remove-address/:id` | Tentativa de remover endereço |

Schemas Mongoose: User, Wishlist, CartItem, Address e Purchase. Não há Product, estoque, gateway, sessão autenticada ou token. As referências declaradas no User não são mantidas pelos handlers; as consultas usam a referência `user` nos documentos filhos.

## Telas e componentes

React 18/CRA e React Router 6 no original, com cinco rotas:

| Rota | Tela e fluxos |
| --- | --- |
| `/` | Home; filtros por marca e categoria; cards com preço, estrelas, favorito e carrinho |
| `/product-overview/:name` | Detalhe do produto e quantidade para adicionar ao carrinho |
| `/login` | Login/cadastro; também existem modais de autenticação no Header |
| `/payment` | Itens/quantidades, endereços, frete e modal de pagamento na mesma página |
| `/dashboard/:destination` | `home`, `data`, `purchase`, `wishlist` |

Componentes principais: Header e Item do minicarrinho; Home e Products; ProductOverview; Login; Payment, Product e Country; Dashboard, Home, UserData, Wishlist/Product, Purchases/Purchase/Item; Address compartilhado. Os componentes Screen apenas envolvem os respectivos layouts.

Não existe rota separada de carrinho, wishlist pública, tela de confirmação nem checkout realmente dividido em etapas. O carrinho aparece no Header e em `/payment`; wishlist fica no dashboard; endereços ficam em `data`. Preservar essas entradas e URLs compatíveis e implementar as etapas/confirmacão pedidas sem remover os fluxos existentes. Links Collections/Men/Women/About/Contact são âncoras sem páginas implementadas.

Não há Context/Zustand/Redux: cada componente mantém `useState`, repete fetches e usa callbacks/contadores e recarregamentos de página. Estilos SASS por área geram `src/style/style.css`, com variáveis de cor/fonte, seletores aninhados, modais e media queries. Novo design deve conservar a composição funcional, substituindo os tokens e componentes visuais.

## Catálogo e rank

`src/assets/data/products.json` contém **63 produtos**: 50 tênis, 7 roupas, 4 bonés/gorros e 2 presentes. Produtos não vêm de API externa; imagens usam URLs externas Sole Collector/Shopify. O JSON traz id, marca, nome, descrição, preço em string, thumbnail, uma imagem ou array de imagens, rank, cores, tipo e tamanhos quando aplicável. Não há saldo de estoque ou seleção de tamanho no fluxo de compra.

`rank` é uma **nota estática do catálogo**, desenhada como estrelas preenchidas até completar cinco em `home/products/products.jsx`. Wishlist copia esse valor junto com nome/preço/id. Não representa ordenação do favorito, quantidade de curtidas ou avaliações de usuários. No destino, rating pertence ao produto e wishlist guarda somente a relação usuário/produto.

Plano: Seeder com os 63 registros, preços numéricos, marcas/categorias/cores/tamanhos preservados e imagens normalizadas para coleção. Não inventar disponibilidade por tamanho. Usar slug para identidade canônica mantendo compatibilidade com links antigos por nome, inclusive nomes com barras/apóstrofos. Não converter moeda silenciosamente; proposta USD, pois a UI usa `$` e não define moeda formalmente.

## Autenticação atual

Cadastro grava senha sem hash. Login envia e-mail e senha na URL de um GET e recebe booleano. O navegador guarda somente o e-mail em `localStorage.user`; Header considera isso suficiente para mostrar estado autenticado. O booleano `logged` é alterado por PATCH sem autenticação. A página `/login` chama esse PATCH sem o segmento `:state`, diferentemente do modal do Header.

Não há proteção efetiva de checkout/dashboard nem autorização no servidor: clientes podem escolher outro e-mail ou ID nas requisições. Usuário completo, inclusive senha, é retornado pela API.

Plano: Sanctum para SPA com sessão/cookies e CSRF, login/logout/cadastro/me, hash Laravel, requests validados, rate limit e policies por proprietário. Não usar e-mail de localStorage como identidade autorizada nem enviar senhas em URL. CORS restrito ao frontend configurado.

## Frete, pagamento e pedido atuais

Frete **simulado e fixo**, sem CEP, peso ou transportadora integrada:

| Opção | Preço exibido | Prazo exibido |
| --- | --- | --- |
| Blue | $15.07 | Até 4 dias úteis |
| Sedex | $8.90 | Até 8 dias úteis |
| Fedex | $22.02 | Até 5 dias úteis |
| Red | $4.70 | Até 3 dias úteis |

Servidor soma preço × quantidade do carrinho, porém aceita esses preços originalmente do cliente. O componente Payment soma frete no navegador com estado assíncrono inconsistente. O POST de pagamento aceita total, frete, itens e endereço enviados em campos ocultos. Não há validação financeira, processamento real de cartão/PayPal ou transação de banco.

Métodos exibidos: débito, crédito, PayPal e Wallet. Wallet tem saldo fixo de $10 apenas no estado React; dashboard mostra $0. A subtração pode gerar valor negativo e não registra débito em carteira. Campos de cartão não são processados por gateway; REST Countries só fornece opções de país.

O POST cria Purchase com número aleatório de sete dígitos, data em string, status `Waiting confirmation`, itens serializados e endereço copiado, depois redireciona ao histórico. Não limpa carrinho. No fluxo de cartão, o frontend envia array de endereços, enquanto o servidor espera um único objeto, causando inconsistência de campos obrigatórios. O README descreve uma confirmação mais ampla do que o código implementa.

Plano: manter tabela de fretes simulados no servidor; total = subtotal + frete; validar endereço do usuário; criar order e order_items com snapshots e número único e limpar carrinho em transação. Pagamento atrás de interface/serviço simulado para futura integração. Não coletar cartão real numa simulação. **Depende de OK:** manter Wallet como método simulado sem desconto fictício, em vez de criar um sistema financeiro de carteira fora do escopo.

## Bugs e correções propostas

| Problema observado | Correção planejada |
| --- | --- |
| Senhas sem hash, em URL e expostas nas respostas | Hash Laravel; POST seguro; Resources sem campos sensíveis |
| Acesso arbitrário por e-mail/ID; CORS aberto | Sanctum, middleware e policies; CORS configurado |
| Preço, quantidade, frete e total controlados pelo cliente | Valores do catálogo/frete no servidor; quantidade inteira positiva |
| Busca inicial de carrinho por nome ignora usuário | Relação pelo usuário autenticado e chave única usuário/produto |
| `findOneAndDelete` recebe nome como opções em vez de filtro | Filtrar item por proprietário e product_id em uma única consulta |
| Exclusão de endereço usa `addressId`, campo inexistente | Binding por ID e policy de propriedade |
| Laço `for (let i = 0; addresses.length; ++i)` não limita índice | Regra de endereço padrão no servidor em transação, com bloqueio por usuário |
| Possíveis vários endereços padrão e chamadas concorrentes do cliente | Desmarcar demais e marcar escolhido atomicamente |
| Troca de senha usa e-mail inexistente em params e chamada incorreta de update | Request de senha atual, confirmação e atualização do usuário autenticado |
| Formulário de dados sem endpoint de atualização | Implementar atualização da conta já exigida no pedido |
| Cadastro da página omite birthday exigido pelo schema | Unificar formulário e contrato de cadastro; erros por campo |
| Não existe edição de endereço, embora README prometa | CRUD completo solicitado, com formulário reutilizado |
| Quantidade zero/negativa e setter durante render | Iniciar em 1 e validar limites em ambos os lados |
| Pedido sem limpeza do carrinho e número sujeito a colisão | Transação, itens estruturados e unicidade no banco |
| `parseInt(price)` descarta centavos no histórico | Dinheiro em centavos no domínio e formatação decimal na UI |
| Imagem pode ser array, mas detalhe trata como URL única | Galeria normalizada; tratamento de imagem indisponível |
| Fetches repetidos por card, manipulação direta do DOM e reloads antes de concluir mutações | Client central, Context/reducer, estado declarativo e aguardar respostas |
| Placeholders usados como labels e modais sem gestão de foco | Labels, foco visível, teclado e primitivas acessíveis existentes |
| URLs localhost fixas, erros com status incorreto/respostas que podem ficar pendentes | Variáveis de ambiente, JSON consistente e tratamento de loading/erro |
| Teste CRA procura link inexistente; backend não tem testes úteis | Pest para auth, isolamento, carrinho, wishlist, endereços e checkout |
| Manifests Express dividem dependências entre raiz e server; sem build SASS declarado | Instalação Laravel/React explícita e documentada, sem transportar configuração defeituosa |

Limite de quatro endereços existe somente na UI. Proposta: preservá-lo e aplicar no servidor. Não adicionar estoque, painel administrativo, avaliações por usuários, gateway, saldo financeiro real, recuperação de senha ou páginas institucionais ausentes sem novo acordo.

## Destino e plano por fase

O destino atual é Laravel **13.38.0**, Inertia Laravel **3.5.2**, Fortify **1.41.0**, Pest **5.3.3**, com React/TypeScript/Tailwind declarados no package.json. Sanctum e React Router não constam nas dependências diretas atuais. `.ai/rules` e STATUS anterior não foram encontrados. A pasta chegou sem Git. Não houve alteração de dependências, banco, rotas ou código nesta fase.

A arquitetura solicitada exige substituir o fluxo Inertia e reorganizar o starter. Registrar essa divergência com AGENTS.md antes da fase 2; preservar arquivos existentes durante a reorganização. Revalidar versão estável e compatibilidade no momento da implementação, sem atualizar dependências apenas por suposição.

1. Análise e plano: este inventário, STATUS e decisões pendentes.
2. Base backend: reorganização autorizada, MySQL, Sanctum, migrations/models/factories, Seeder do catálogo e auth. Tabelas users, products, cart_items, wishlist_items, addresses, orders e order_items; dinheiro em centavos e CEP/telefones/números de endereço como strings.
3. Catálogo com filtros de marca/tipo e ordenação básica, detalhe, carrinho, wishlist e endereços; API Resources, Form Requests, policies e testes dos fluxos/isolamento.
4. Serviço transacional de checkout, frete/pagamento simulados, snapshots e histórico/detalhe de pedidos; testes de falhas, autorização e totais.
5. React/Vite/React Router com TypeScript; Tailwind e tokens CSS neobrutalistas; Button/Card/Input/Select/Badge/Modal/Stepper; auth e client central. Context/reducer evita nova dependência de estado.
6. Loja com os 63 produtos, filtros, galeria, wishlist e carrinho; compatibilidade das entradas antigas.
7. Etapas do checkout e confirmação; dashboard com dados, pedidos, favoritos e CRUD de endereços. Rotas protegidas e estados vazios/loading/erro, máscaras e validação.
8. README de instalação/configuração, screenshots e exclusões explícitas; validação final de testes e build, revisão de segredos antes de cada commit.

Atualizar STATUS e realizar commit específico ao fim de cada fase. Validar mobile/teclado/contraste durante as fases de frontend. Nesta etapa houve leitura estática e consulta de versões/rotas locais; não se afirma que o MERN funciona, nem que testes ou aparência foram validados.
