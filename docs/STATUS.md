# Controle da migração Sneakers

Atualizado em 26/10/2026. Controle interno; instruções de uso ficam no README.

## Fase atual

**Fase 7 concluída.** Checkout e dashboard estão implementados e verificados. Próxima fase: revisão final do README e screenshots.

Fonte do MERN: branch `master`, commit `438224126ba5239b4f6c357feafcf4b16473b75c`, de GuilhermeZalla/sneakers. Análise original em `ANALISE_MIGRACAO.md`.

## Checklist

- [x] 1. Análise e plano (Etapa 0), com criação deste STATUS.
- [x] 2. Backend: migrations, models, factories, seeder do catálogo e autenticação.
- [x] 3. Backend: produtos, carrinho, wishlist, endereços e testes.
- [x] 4. Backend: checkout, pedidos e testes.
- [x] 5. Frontend: design tokens, componentes base e autenticação.
- [x] 6. Frontend: home, catálogo, produto, wishlist e carrinho.
- [x] 7. Frontend: checkout e dashboard.
- [ ] 8. README final, screenshots, instruções locais e exclusões de escopo; README inicial criado.

## Decisões tomadas

- O repositório antigo é somente fonte de consulta. O usuário autorizou o commit local da fase 4; não há autorização para push.
- **MySQL**, escolhido pelo usuário. Criado o banco local novo `sneakers_store`, antes inexistente; migrations e seeder executados. O arquivo SQLite anterior foi preservado.
- Monorepo aprovado com Laravel em `backend/` e React/Vite/React Router em `frontend/`, substituindo Inertia. AGENTS.md alterado apenas nos dois blocos ligados ao Inertia; regras gerais, estilo, testes e convenções foram preservados.
- Fortify do starter reaproveitado sem telas para login, cadastro, logout e recuperação de senha; Sanctum protege a API por sessão/cookies e CSRF. Perfil e troca de senha foram adaptados para JSON; testes existentes foram adaptados sem excluir arquivos de testes.
- Componentes e páginas do starter preservados em `frontend/starter/` para reaproveitar nas fases de frontend. Não são compilados nem usados pela entrada atual.
- TypeScript e Tailwind mantidos; tokens CSS neobrutalistas e React Context para sessão, idioma, carrinho e favoritos implementados.
- Idioma/moeda vinculados: `en`/USD com formatação en-US e `pt_BR`/BRL com formatação pt-BR. A API negocia pelo Accept-Language. Mensagens de auth/validação e utilitários de dinheiro/data têm suporte aos dois pares.
- Preços fixos e independentes por moeda, armazenados em centavos. O usuário aprovou **5× o USD original apenas para gerar os BRL iniciais de demonstração**, sem cotação em tempo real. Reexecutar o seeder não sobrescreve ajustes posteriores de preço.
- Preservados 63 produtos, marcas, categorias, imagens, cores e tamanhos. `rank` é rating estático do produto; não criar votação ou estoque quantitativo inexistentes.
- Carrinho e pedido possuem moeda explícita; itens de pedido preservam snapshots. O carrinho mantém o preço de adição enquanto a moeda não muda e, na troca de idioma/moeda, atualiza todos os itens em transação com os preços da moeda selecionada.
- Carrinho aceita quantidades de 1 a 999 e soma ao adicionar um produto já existente. Favoritar novamente é idempotente. A lista de endereços tem limite de quatro, e pode haver no máximo um endereço padrão por usuário.
- **Wallet simulada sem desconto fictício de US$ 10; valor cobrado = total do pedido.** Regra aprovada, implementada e registrada no README.
- A skill `testing-best-practices` exigida no AGENTS.md não está disponível. O usuário autorizou usar a documentação oficial do Pest/Laravel como substituta, mantendo as demais regras de testes.

## Desvios do original

- Starter Inertia substituído por React Router + API/Sanctum, com estrutura backend/frontend.
- Desconto fictício da Wallet removido; pagamento simulado cobra o total integral. **Desvio mencionado no README.**
- Limite de quatro endereços por usuário adicionado; o projeto original não impunha esse limite.
- Adicionados idioma português do Brasil e preços BRL independentes; original tinha interface em inglês e valores exibidos com $.
- Senhas agora usam hash Laravel; endpoints de conta têm sessão/autorização pelo usuário atual, sem confiar em e-mail de localStorage.
- Autenticação responde JSON; CORS limitado à origem configurada; metadados de idioma/moeda nas respostas.
- Preços e proprietário de itens são definidos no servidor; Policies impedem operações em itens e endereços de outra conta. Mudanças de moeda e endereço padrão usam transações com bloqueio do usuário.
- Dados de conta, CEP e números de endereço são strings apropriadas; valores monetários são centavos inteiros; pedidos têm snapshots estruturados.
- Nenhum usuário com senha padrão foi seedado. Recuperação de senha e exclusão de conta do starter foram preservadas na API; suas telas ainda não foram adaptadas.

## Verificação da fase 2

- **45 testes Feature passaram, 168 assertions**, em SQLite isolado em memória: auth, perfil, senha, reset, limites de login, CSRF, autorização de conta, cadastro, catálogo idempotente, unicidade de carrinho/wishlist e locale/moeda.
- **PHPStan nível 7: zero erros**, com limite de memória de 512 MB. Pint aplicado com `--dirty --format agent`; Composer validado.
- **2 testes do frontend passaram**: formatação monetária USD/BRL e preservação do dia em datas sem horário. TypeScript, lint/formatação e build passaram.
- MySQL local: banco criado, todas as cinco migrations aplicadas, ProductSeeder executado e estrutura de products inspecionada via Artisan.
- `db:show --counts` falhou porque este servidor não tem performance_schema.session_status; diagnóstico auxiliar, sem falha nas migrations/seeder. Nenhuma configuração global do servidor foi alterada.
- Versões: Laravel 13.38.0, Sanctum 4.3.3, Fortify 1.41.0, Pest 5.3.3, React 19.3.1 e React Router 7.18.4.
- PHP local emite avisos de extensões duplicadas e pdo_firebird indisponível; não impedem os checks e não foram corrigidos alterando configuração global.
- Git conferido: nenhum novo commit nem arquivo em stage; .env, vendor, node_modules e dist continuam ignorados.
- Sem validação visual das páginas finais; elas ainda não foram implementadas. Workflow ajustado aos caminhos do monorepo, sem execução remota de CI.

## Verificação da fase 3

- **31 testes Feature passaram, 172 assertions**, em SQLite isolado: filtros e preços do catálogo, moeda, snapshots e quantidades no carrinho, isolamento de contas, wishlist e CRUD de endereços, limite de quatro e endereço padrão.
- **PHPStan nível 7: zero erros**; Pint aplicado com `--dirty --format agent`.
- Listagem pública consultada no MySQL local por HTTP, em inglês/USD e pt-BR/BRL: 63 produtos em ambos os casos. Servidor temporário encerrado.
- A regra de endereço padrão usa bloqueio de linha do usuário no MySQL; concorrência verificada na fase 4.
- Nenhuma migration, dependência, commit ou stage foi criado nesta fase.

## Verificação da fase 4

- Checkout cobre carrinho vazio, endereço de outra conta, adulteração de valores, repetição, rollback e permissões de pedidos.
- Teste de integração no MySQL local: dez pares simultâneos de alteração de endereço padrão e checkout simultâneo com a mesma chave, com uma conta temporária removida ao final.
- Pint aplicado; PHPStan nível 7 sem erros; suíte completa: 83 testes e 380 assertions, em SQLite em memória. Migration de idempotência aplicada no MySQL local.

## Verificação da fase 5

- Teste de navegador real com proxy Vite, Laravel e MySQL: cadastro, rota protegida com retorno ao endereço, logout e login passaram; conta temporária removida.
- Testes de frontend cobrem formatação e cliente HTTP, incluindo credenciais, CSRF e erros 401/419/422. Lint, tipos e build verificados.
- Histórico Git: apenas modelos .env.example rastreados; busca por padrões comuns de chave privada, token GitHub, chave AWS e APP_KEY Laravel não encontrou ocorrências.

## Verificação da fase 6

- As 63 descrições de demonstração receberam versões pt-BR; API seleciona pelo idioma e o seeder preserva alterações existentes.
- Imagens remotas: Sole Collector e CDN Shopify; não foi identificada licença para uso. Confirmar autorização ou substituir antes da publicação.
- Frontend: 8 testes passaram, além de lint, tipos e build. Backend: 85 testes e 387 assertions; Pint aplicado e PHPStan sem erros.
- Navegador real com Laravel e MySQL: favorito após login retorna à URL do catálogo; quantidade, remoção e troca de moeda no carrinho verificadas. Home, catálogo, produto, favoritos e carrinho sem overflow horizontal em 360, 768 e 1280 px. Contas temporárias removidas.

## Verificação da fase 7

- Frontend: 11 testes passaram, incluindo idempotência, máscaras e moeda do pedido; lint, tipos e build passaram. Backend: 85 testes e 387 assertions em SQLite isolado.
- Navegador real com Laravel e MySQL: cadastro, carrinho, endereço, Wallet simulada, confirmação e histórico passaram. Resposta perdida após criação do pedido foi simulada e a tentativa repetida com a mesma chave confirmou o pedido.
- Checkout, histórico e seções do dashboard verificados em 360, 768 e 1280 px sem overflow horizontal. Fallback de imagem validado; contas temporárias removidas.
- URLs de imagens permanecem no JSON do seeder; fallback reutilizável no frontend. Não foram adicionadas cópias de imagens.

## IMPEDIMENTO PARA PUBLICAÇÃO

As imagens referenciadas em `images.solecollector.com` e `cdn.shopify.com` não têm licença confirmada. Devem ser substituídas por imagens com licença apropriada antes de tornar o repositório público ou fazer deploy. Não baixar nem commitar cópias dessas imagens. As URLs de demonstração estão centralizadas em `backend/database/seeders/data/products.json`; dados já cadastrados no banco podem exigir atualização separada.

## Pendências

- Fase 4: concluída com checkout transacional, idempotência por usuário e fretes fixos. Valores BRL de frete são provisórios para demonstração, inicialmente 5× os USD, sem cotação em tempo real.
- Fase 7 concluída: checkout e dashboard no frontend, com máscaras, erros de campos e moeda dos pedidos.
- Referência visual e screenshots na etapa apropriada. README final será complementado com o fluxo completo.
- Não há exportação MongoDB; nenhuma migração de dados pessoais reais foi feita.

## Próximo passo concreto

Após aprovação, iniciar a fase 8: documentação final e screenshots. O impedimento de publicação das imagens permanece. Não fazer push.
