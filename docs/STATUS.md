# Controle da migração Sneakers

Atualizado em 27/10/2026. Controle interno; instruções de uso ficam no README.

## Fase atual

**Fase 10 concluída e validada localmente.** Segurança, testes, limpeza e instalação isolada conferidos. Aguardam execução manual os commits, a unificação em main e a remoção das duas screenshots antigas do histórico; sem deploy ou push.

Fonte do MERN: branch `master`, commit `438224126ba5239b4f6c357feafcf4b16473b75c`, de GuilhermeZalla/sneakers. Análise original em `ANALISE_MIGRACAO.md`.

## Checklist

- [x] 1. Análise e plano (Etapa 0), com criação deste STATUS.
- [x] 2. Backend: migrations, models, factories, seeder do catálogo e autenticação.
- [x] 3. Backend: produtos, carrinho, wishlist, endereços e testes.
- [x] 4. Backend: checkout, pedidos e testes.
- [x] 5. Frontend: design tokens, componentes base e autenticação.
- [x] 6. Frontend: home, catálogo, produto, wishlist e carrinho.
- [x] 7. Frontend: checkout e dashboard.
- [x] 8. README final, screenshots, instruções locais e exclusões de escopo.
- [x] 9. Notificações por e-mail e internas, verificação/reset SPA, testes e commit local autorizado.
- [x] 10. Pré-publicação: segurança, testes e documentação validados; procedimentos de branch/histórico preparados para execução manual.

## Decisões tomadas

- O repositório antigo é somente fonte de consulta. O usuário autorizou os commits locais das fases 4 e 9; não há autorização para push.
- **MySQL**, escolhido pelo usuário. Criado o banco local novo `sneakers_store`, antes inexistente; migrations e seeder executados. O arquivo SQLite anterior foi preservado.
- Monorepo aprovado com Laravel em `sneakers-store-backend/` e React/Vite/React Router em `sneakers-store-frontend/`, substituindo Inertia. AGENTS.md alterado apenas nos dois blocos ligados ao Inertia; regras gerais, estilo, testes e convenções foram preservados.
- Fortify do starter reaproveitado sem telas para login, cadastro, logout e recuperação de senha; Sanctum protege a API por sessão/cookies e CSRF. Perfil e troca de senha foram adaptados para JSON; testes existentes foram adaptados sem excluir arquivos de testes.
- Componentes e páginas do starter preservados em `sneakers-store-frontend/starter/` para reaproveitar nas fases de frontend. Não são compilados nem usados pela entrada atual.
- TypeScript e Tailwind mantidos; tokens CSS neobrutalistas e React Context para sessão, idioma, carrinho e favoritos implementados.
- Idioma/moeda vinculados: `en`/USD com formatação en-US e `pt_BR`/BRL com formatação pt-BR. A API negocia pelo Accept-Language. Mensagens de auth/validação e utilitários de dinheiro/data têm suporte aos dois pares.
- Preços fixos e independentes por moeda, armazenados em centavos. O usuário aprovou **5× o USD original apenas para gerar os BRL iniciais de demonstração**, sem cotação em tempo real. Reexecutar o seeder não sobrescreve ajustes posteriores de preço.
- Catálogo com 30 produtos fictícios Lume: 17 calçados, 7 peças de vestuário, 4 chapéus/gorros/bonés e 2 acessórios. Todas as fotos são locais e creditadas. `rank` é rating estático; não criar votação ou estoque quantitativo inexistentes.
- Carrinho e pedido possuem moeda explícita; itens de pedido preservam snapshots. O carrinho mantém o preço de adição enquanto a moeda não muda e, na troca de idioma/moeda, atualiza todos os itens em transação com os preços da moeda selecionada.
- Carrinho aceita quantidades de 1 a 999 e soma ao adicionar um produto já existente. Favoritar novamente é idempotente. A lista de endereços tem limite de quatro, e pode haver no máximo um endereço padrão por usuário.
- **Wallet simulada sem desconto fictício de US$ 10; valor cobrado = total do pedido.** Regra aprovada, implementada e registrada no README.
- A skill `testing-best-practices` exigida no AGENTS.md não está disponível. O usuário autorizou usar a documentação oficial do Pest/Laravel como substituta, mantendo as demais regras de testes.

## Desvios do original

- Catálogo substituído por produtos fictícios Lume com fotos locais creditadas e descrições bilíngues. As identidades dos 13 produtos de roupas e acessórios foram adaptadas às novas fotos por autorização do usuário; seus preços e vínculos foram preservados.
- Starter Inertia substituído por React Router + API/Sanctum, com estrutura `sneakers-store-backend/` e `sneakers-store-frontend/`.
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

## Situação das imagens para publicação

Pendência resolvida nesta tarefa: as referências Shopify foram removidas do catálogo atual e substituídas por WebP locais com fonte e licença registradas em `CREDITS.md`. A auditoria do MySQL local encontrou 30 produtos, sendo 17 calçados locais e 13 itens Shopify; não havia calçados antigos com legacy_id entre 1 e 50. O comando `catalog:refresh-apparel` atualizou os 13 itens restantes sem excluir registros.

## Verificação da troca de calçados

- As sete fotos foram verificadas individualmente no Pexels e convertidas para WebP local em larguras de 1100 e 400 px; a atribuição e os links estão em `CREDITS.md`. As imagens de vestuário e acessórios permanecem inalteradas.
- O comando `catalog:replace-footwear` é restrito ao ambiente local/de teste e a conexões locais; usa transação, preserva snapshots de pedidos e remove entradas de carrinho e favoritos dos calçados substituídos. Não foi executado no MySQL local.
- Pint e PHPStan passaram; 88 testes do backend passaram, com 399 assertions. Frontend: lint, tipos, 11 testes e build passaram.
- Navegador Edge com banco SQLite temporário: catálogo, produto, favoritos e carrinho exibiram as imagens locais sem overflow horizontal em 360, 768 e 1280 px.

## Ampliação do catálogo

- Foram adicionados dez calçados com fotos locais creditadas, descrições em inglês e pt-BR e preços fixos independentes. O catálogo passa a 30 itens, sendo 17 calçados e 13 produtos preservados de vestuário e acessórios.
- A listagem passa a exibir até 30 itens por página por padrão. A reexecução do seeder adiciona os itens novos sem sobrescrever edições; o banco MySQL local não foi alterado.
- Pint e PHPStan passaram; a suíte do backend passou com 88 testes e 401 assertions. Frontend: lint, tipos, 11 testes e build passaram.
- Edge com banco SQLite temporário: os 30 cards e as 17 fotos locais foram carregados sem overflow em 360, 768 e 1280 px.

## Pendências

- Fase 4: concluída com checkout transacional, idempotência por usuário e fretes fixos. Valores BRL de frete são provisórios para demonstração, inicialmente 5× os USD, sem cotação em tempo real.
- Fase 7 concluída: checkout e dashboard no frontend, com máscaras, erros de campos e moeda dos pedidos.
- Fase 8 concluída: screenshots e fluxo completo de demonstração documentados no README.
- Não há exportação MongoDB; nenhuma migração de dados pessoais reais foi feita.

## Ajuste dos nomes das pastas

- Pastas renomeadas manualmente pelo usuário para `sneakers-store-backend/` e `sneakers-store-frontend/`. Referências nos scripts da raiz, CI, regras de ignore, instruções e documentação atualizadas para os novos caminhos.
- Verificação: `npm.cmd run build` pela raiz passou; Artisan iniciou pelo novo caminho (Laravel 13.38.0); `.env`, `vendor`, `node_modules` e `dist` permanecem ignorados; `git diff --check` passou. Workflow atualizado, sem execução remota de CI.

## Próximo passo concreto

Revisar visualmente as novas imagens e screenshots. A substituição já foi aplicada e validada. Não fazer commit ou push sem autorização para esta tarefa.

## Verificação da fase 8

- README revisado com galeria, comandos na raiz, fluxo de demonstração e exclusões de escopo. Capturas em `docs/screenshots/`: 14 PNGs de home, catálogo Lume, produto, login, favoritos, carrinho, checkout (entrega e pagamento), confirmação, histórico e conta. Home, produto e histórico também têm versões para celular.
- Capturas reais no Edge 156 em português/BRL: desktop em 1440 × 1000 e celular em 390 × 844. Conta, endereço, carrinho, favoritos e pedido fictícios criados apenas em SQLite temporário; MySQL e arquivos `.env` preservados. Servidores temporários e navegador encerrados ao terminar.
- Screenshots da home refeitas a pedido do usuário com as imagens externas carregadas, como na execução local: os oito produtos carregaram suas imagens nas duas larguras, sem placeholders. A revisão da licença permanece pendente antes da publicação. Fotos locais dos calçados carregadas no catálogo e produto. O checkout foi percorrido até a confirmação e o pedido apareceu no histórico.
- As capturas não apresentaram overflow horizontal nas larguras utilizadas. Links locais do README e dimensões dos PNGs conferidos; esta etapa não alterou código de aplicação nem reexecutou as suítes de testes.

## Fase 9 — notificações

### Auditoria inicial

- O backend já tinha Fortify, broker de reset, tabela de tokens de senha e testes de recuperação. Os links já apontavam para o frontend, mas não havia telas React de recuperação/reset. O token durava 60 minutos e o envio de reset não era enfileirado.
- O modelo User usava Notifiable, mas não implementava MustVerifyEmail. O campo email_verified_at existia; a verificação não estava ativa.
- O mailer local estava em log. SMTP já tinha suporte por variáveis de ambiente, e as tabelas de jobs/failed_jobs já existiam.
- Não havia tabela notifications, notificações de negócio, endpoints, policy, sino ou histórico no dashboard. O locale não era persistido no usuário.

### Implementação

- Reaproveitados Fortify, o broker de senhas, Sanctum, os componentes do frontend e a fila database existente. Acrescentadas apenas as migrations de users.locale e notifications, aplicadas no MySQL local sem seed ou alteração de produtos.
- Boas-vindas, verificação, solicitação de reset, senha alterada, confirmação de pedido e mudança de status usam Laravel Notifications nos canais mail e database. Todos os canais passam pela conexão database com afterCommit; jobs são criptografados, com até três tentativas. Nenhuma senha é incluída nos payloads de e-mail.
- Verificação com MustVerifyEmail e link assinado relativo de 30 minutos: abre /verify-email/:id/:hash no React, que confirma com a API mesmo deslogado, sem criar sessão. Link consumido retorna 410; assinatura inválida, expirada ou e-mail alterado são rejeitados. Reenvio: uma solicitação por minuto.
- Reset preserva os tokens hash do broker, reduz a validade para 15 minutos e tem uso único. Solicitação/reset possuem rate limit por e-mail e IP. O worker descarta mensagens de reset cujo token já venceu ou foi consumido.
- Templates HTML com cores/bordas do projeto e alternativa em texto. Idioma en/pt_BR persistido no cadastro, restaurado ao entrar e atualizado pelo seletor. E-mails usam a preferência salva; valores de pedidos usam sua moeda registrada.
- API versionada: listar 15 por página, contar não lidas, consultar uma notificação, marcar uma e marcar todas. Policy impede leitura e alteração de registros de outra conta; listagem, contagem e operações em lote são sempre limitadas ao usuário autenticado. Links assinados e tokens de reset nunca são armazenados nos dados das notificações internas.
- Sino com contador, dropdown acessível, histórico no dashboard, carregamento animado, vazio/erro, paginação e polling a cada 30 segundos somente com a aba visível. Sem WebSocket. Operações de loja exigem e-mail verificado; conta e notificações permanecem acessíveis para concluir a verificação.
- Confirmação respeita a idempotência do checkout. Mudança de status é observada em atualizações de instâncias Eloquent de Order; não foi criado painel administrativo ou endpoint público para mudar status.
- README e .env.example documentam log/Mailpit, SMTP de produção e worker. O .env local foi preservado e continua em log.

### Validação e entrega

- PHP 8.4.27 / Laravel 13.38.0: suíte completa com **108 testes e 518 assertions**, em SQLite isolado. Cobertura inclui permissões de leitura/alteração, paginação e contagem, rate limit, verificação deslogada, expiração/uso único de links, templates bilíngues, fila durável, rollback e idempotência de pedidos.
- Frontend: **14 testes passaram**, incluindo sino/contador acessível, chamadas paginadas e erros da API; lint/formatação, TypeScript e build passaram. Pint aplicado com `--dirty --format agent`; PHPStan nível 7 sem erros.
- Edge 156 + Mailpit 1.32.0 + `queue:work database`, com banco temporário: cadastro em en e pt_BR; caixa vazia antes de iniciar o worker; sete e-mails entregues em HTML/texto; clique no link do Mailpit com sessão encerrada confirmou o e-mail sem autenticar o visitante.
- Navegador: login após verificação, checkout completo, confirmação de pedido por e-mail, aviso e contador no sino, lista vazia, histórico, marcação em lote e atualização do contador. Enter abre o dropdown; Escape fecha e devolve foco. Sem overflow em 360/768/1280 px. Recuperação de senha pelas telas React e aviso de senha alterada passaram.
- Conferidos os sete e-mails no Mailpit: nenhuma senha inicial, senha nova ou credencial de acesso em seus conteúdos. Links e tokens de verificação/reset são os únicos mecanismos de acesso enviados. Preferência pt_BR foi restaurada ao entrar em uma conta portuguesa a partir de um navegador em inglês.
- As duas migrations novas foram aplicadas no MySQL local; nenhum seed de catálogo foi executado e o .env foi preservado em log. Mailpit, navegador e servidores temporários encerrados. CI remoto não executado; commit local autorizado, sem push.
- A entrega inclui a renomeação manual das pastas e as screenshots/créditos aprovados nas tarefas anteriores, que ainda estavam sem commit. Nenhuma dependência de aplicação foi adicionada ou atualizada.
- Os avisos já existentes do PHP local (extensões duplicadas/pdo_firebird) permanecem; não impediram os checks com o PHP 8.4 correto. Configuração global do PHP não foi alterada.

## Substituição das imagens pendentes — 27/10/2026

- Autorizada pelo usuário a substituição, desde que as fotos continuem aparecendo no site. Mantido o tema único e a interface existente.
- Auditoria inicial do MySQL local: 30 produtos, 17 com fotos locais e 13 com fotos remotas Shopify. Nenhum calçado antigo com legacy_id de 1 a 50.
- Substituídas as imagens dos 13 itens restantes por fotos Pexels, com arquivos WebP locais em versões de lado máximo de 1100/400 px. Nomes, marca, descrições en/pt-BR e cores adaptados aos produtos fictícios Lume. Fontes, autores e licença em CREDITS.md; nenhum arquivo Shopify foi baixado.
- Acrescentado e executado no MySQL local o comando transacional `catalog:refresh-apparel`: 13 itens atualizados. IDs, slugs/URLs, preços, tamanhos, avaliações e relações preservados; sem alterações em migrations, dependências ou layout. O ProductSeeder mantém sua regra de não sobrescrever edições existentes.
- Testes afetados: **18 passaram, com 322 assertions**. Cobertura das 60 imagens locais, preservação dos dados/vínculos e snapshots, repetição do comando, bloqueio em produção e rollback se faltar um arquivo. Pint e PHPStan passaram.
- Frontend: lint/formatação, TypeScript, **14 testes** e build passaram.
- Edge com SQLite temporário: as 60 versões WebP foram decodificadas; CDNs externas bloqueadas durante o teste. Home e catálogo com imagens; catálogo de 30 cards sem placeholders/overflow em 360/768/1280 px. Detalhes dos 13 itens alterados, 13 imagens no carrinho e 13 nos favoritos conferidos.
- Cadastro, verificação pelo Mailpit deslogado, login, checkout e histórico percorridos; 14 screenshots refeitas em 1440 × 1000 e 390 × 844. Servidores, navegador e Mailpit temporários encerrados; .env preservado.
- README e créditos atualizados. Nenhum commit, stage ou push nesta tarefa; aguarda revisão visual do usuário. Suíte completa de backend não repetida nesta etapa; executados os testes afetados.

## Ajuste visual dos gorros — 27/10/2026

- O usuário preferiu os gorros isolados às fotos com pessoas. Substituídas somente as versões WebP de Lume Beanie Orange e Lume Beanie Red por imagens geradas com a ferramenta integrada OpenAI image_gen: fundo neutro, produto inteiro, sem pessoas, textos ou logotipos.
- Mantidos os quatro caminhos de imagem e os dados existentes; nenhuma alteração de banco, código, preço ou layout nesta revisão. CREDITS.md registra a origem gerada por IA e os prompts, substituindo as duas atribuições Pexels anteriores.
- Validação desta revisão: teste existente de integridade das imagens passou (1 teste, 241 assertions); build passou. Edge carregou as 60 versões locais, os dois detalhes e as imagens no carrinho/favoritos sem placeholders; catálogo sem overflow em 360/768/1280 px. Atualizadas as quatro capturas afetadas: home desktop/celular, catálogo e favoritos. Automação temporária encerrada; nenhum commit ou push.

## Fase 10 — segurança, testes e preparação para publicação

### Entrega concluída — 27/10/2026

- Revisão retomada sobre a árvore atual, preservando as imagens aprovadas e as 117 exclusões de starter/ já preparadas no índice durante a pausa. A aplicação não dependia desse diretório; Vite/TypeScript e documentação foram conferidos. Nenhum stage, commit, merge, rename de branch, push, deploy ou reescrita de histórico foi executado nesta entrega.
- Segurança: .env e .env.* ignorados em qualquer subpasta, com exceção dos .env.example; auth.json também ignorado em qualquer nível. Exemplos sem credenciais reais. Recuperação de senha retorna o mesmo status e JSON para conta existente/inexistente, em en e pt-BR; front mostra a mesma confirmação. Cadastro, troca de e-mail e reenvio compartilham cotas por IP/usuário, sem reiniciar o limite ao trocar o e-mail. CORS aceita Idempotency-Key, com preflight coberto.
- MySQL: fixture cria usuário verificado com senha aleatória recebida por stdin; exige APP_ENV=testing, driver mysql, host local e nome sneakers_test_<12-32 hex>. Seis cenários de recusa são testados antes de acessar dados. Seeder padrão cria somente produtos; senha padrão da UserFactory é documentada como exclusiva de testes.
- Front: teste monta AuthProvider, LocaleProvider, NotificationProvider, NotificationBell e histórico reais no navegador. Cobre teclado, foco, polling/aba oculta, carregamento/vazio/erro/retry, troca de conta, logout, resposta atrasada e recuperação uniforme. Sem dependências novas.
- Limpeza: removidos HandleAppearance, TwoFactorAuthenticationRequest, config/inertia.php, teste trivial e helpers/comentários genéricos sem uso após busca e testes. A remoção adicional de starter/ já existente ao retomar foi preservada.
- README: vínculo com MERN original (2022), aviso de estudo sem associação às marcas, LICENSE/CREDITS, decisões técnicas, Node 24.15.0/.nvmrc, Intl, instalação, Mailpit/SMTP/worker e teste MySQL isolado. LICENSE reproduz exatamente origin/main. ext-intl declarado e lockfile sincronizado sem atualizar versões de pacotes. Workflow preparado para main e pull_request.
- PHPUnit força ambiente, banco SQLite em memória, mailer/fila e origem de teste, independentemente do .env ou de variáveis herdadas do terminal. Nenhum banco habitual ou .env da árvore principal foi alterado.

### Instalação do zero e falhas corrigidas

- Clone temporário de master, com o diff atual aplicado e novos arquivos copiados, pois as mudanças ainda aguardam seus commits. Dependências instaladas do zero com composer install e npm ci, sem reutilizar vendor/node_modules. Cópia de .env.example, key:generate e migrate/seed executados exclusivamente em banco MySQL temporário identificado por UUID.
- Falha local do servidor embutido com OPcache no PHP 8.4.27/Herd: erro SplFileInfo e falha secundária de view. Alternativa com php -d opcache.enable=0 -S documentada e usada somente no processo de teste; configuração global preservada.
- Script de concorrência dependia da origem localhost:5173. Agora usa origens Sanctum próprias dos dois servidores temporários e desativa OPcache nesses processos. Passou com front configurado em outra porta.
- Quatro testes assumiam a origem padrão sem isolá-la do .env. Corrigido no PHPUnit; suíte completa também passou com variáveis MySQL herdadas, mantendo SQLite em memória.
- Testes de navegador exigem Chrome/Edge; pré-requisito e BROWSER_PATH documentados. Nenhuma falha restante de instalação identificada no procedimento validado.

### Verificações finais

- PHP 8.4.27 com Intl / Laravel 13.38.0: Pint aplicado, PHPStan nível 7 sem erros e suíte completa com **124 testes, 835 assertions**, tanto na árvore principal quanto na cópia instalada do zero.
- Front instalado do zero: lint/formatação, TypeScript, **14 testes unitários + 5 cenários montados no navegador** (6 resultados no node:test, contando o teste pai) e build passaram.
- MySQL temporário: **10 pares concorrentes de troca de endereço padrão e checkout idempotente simultâneo** passaram, sem duplicar pedido.
- Edge + Mailpit + worker database no clone: cadastro en/pt_BR, caixa vazia antes do worker, verificação via rota do front deslogado sem criar sessão, login, checkout, e-mail do pedido com resumo/moeda/endereço, sino/contador, teclado e histórico. Dropdown conferido em 360/768/1280 px.
- Recuperação/reset e aviso de senha alterada passaram. Sete e-mails bilíngues, com HTML/texto e sem senha inicial, senha nova ou credencial. Preferência portuguesa restaurada ao entrar a partir do navegador em inglês.
- Integridade dos 60 WebPs coberta pelo ProductMediaTest; créditos conferidos separadamente contra os arquivos reais. Gorros gerados por IA mantidos conforme aprovação. Nenhum dump/log novo foi incluído no repositório.
- Varredura de todas as referências: 16 commits e 513 blobs; nenhum .env real ou padrão de chave/token privado examinado. Valores SMTP não vazios no histórico são placeholders do README. Nenhum blob acima de 2 MB; as duas screenshots antigas continuam pendentes de filtragem manual.
- Dois bancos temporários criados nesta fase removidos após os testes. Servidores, Mailpit, worker e navegador temporários encerrados. CI remoto não executado.

### Ações manuais restantes antes da publicação

- Fazer os commits por tema. Mensagens e grupos estão no roteiro local docs/PRE_PUBLICACAO.md, que permanece fora de versionamento conforme a exclusão já existente.
- Incorporar origin/main com --allow-unrelated-histories e renomear master para main usando o passo 8 desse roteiro. Não houve push.
- Histórico antigo ainda contém duas screenshots com fotos sem licença confirmada. Caminhos, blobs e commits estão no passo 9 do roteiro. docs/remove-unlicensed-screenshots.ps1 prepara backup mirror e cópia filtrada, preserva as capturas novas e verifica todos os refs. Script apenas revisado sintaticamente; não executado por instrução do usuário.
- Não há pendência funcional desta fase. Publicação pública depende dos procedimentos manuais acima; o histórico original foi preservado.

### Conferência do plano de commits

- Base atual conferida: 8c1c25c31ec4e0abefbad09009a502f91aada474, commit feito após a entrega anterior, que já reúne 148 arquivos do frontend (imagens, testes e remoção de starter/). Sem reset/amend ou alteração desse commit.
- Plano dos arquivos ainda pendentes: cinco grupos de 19, 9, 4, 6 e 7 arquivos, sem omissões ou repetições. README/STATUS, composer.json/lock, workflow, .nvmrc e LICENSE entram inteiros no grupo 5; phpunit.xml entra inteiro no 3.
- Validada uma cópia isolada sobre esse HEAD, aplicando apenas cada grupo na ordem 1 a 5. Cada estado passou por Pint, PHPStan, testes PHP, lint, tipos, testes frontend e build. Resultados PHP por grupo: 112/780, 119/830, 124/835, 124/835 e 124/835 (testes/assertions). Em cada grupo passaram os 14 testes unitários e os cinco cenários montados do frontend.
- A garantia é dos estados sequenciais 1 → 5, cada um sobre os anteriores; não foi testado cherry-pick em ordem arbitrária. Nenhum commit foi criado na cópia ou na árvore principal; o índice principal permaneceu vazio.
- Os dois procedimentos locais, PRE_PUBLICACAO.md e remove-unlicensed-screenshots.ps1, estão ignorados em .git/info/exclude e não são rastreados na branch atual. O script tem cópias históricas em snapshots de arquivos não rastreados do Cline; essas referências foram preservadas.
- Nenhum caminho pessoal de usuário do Windows foi encontrado nos arquivos rastreados, nos arquivos novos planejados ou nos blobs históricos examinados.
- Revisadas visualmente 28 versões distintas dos 14 caminhos de screenshots em todas as referências locais. Só as duas capturas antigas da home mostram fotos comerciais sem licença confirmada; as outras doze mostram fotos Pexels creditadas ou telas sem fotos. As versões novas usam fotos/IA creditadas ou não exibem fotos de produtos. O inventário dos dois blobs antigos agora inclui também o commit 8c1c25c3.
- Conferidos separadamente 60 WebPs contra 60 nomes de arquivo em CREDITS: nenhuma imagem sem crédito e nenhum crédito sem arquivo. O ProductMediaTest verifica existência/formato e integridade do catálogo, não a documentação de créditos.
