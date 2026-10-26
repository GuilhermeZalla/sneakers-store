# Controle da migração Sneakers

Atualizado em 26/10/2026. Controle interno; instruções de uso ficarão no README.

## Fase atual

Fase 1 — análise técnica registrada; aguardando aprovação das decisões de escopo antes da implementação. Fonte: branch `master`, commit `438224126ba5239b4f6c357feafcf4b16473b75c`, do repositório GuilhermeZalla/sneakers. Inventário e plano em `ANALISE_MIGRACAO.md`.

## Checklist

- [x] 1. Análise e plano (Etapa 0), com criação deste STATUS.
- [ ] 2. Backend: migrations, models, seeders e autenticação.
- [ ] 3. Backend: produtos, carrinho, wishlist, endereços e testes.
- [ ] 4. Backend: checkout, pedidos e testes.
- [ ] 5. Frontend: setup, tokens, componentes base e autenticação.
- [ ] 6. Frontend: home, produto, wishlist e carrinho.
- [ ] 7. Frontend: checkout e dashboard.
- [ ] 8. README, screenshots, instruções locais e exclusões de escopo.

## Decisões tomadas

- Banco: **MySQL**, escolhido pelo usuário nesta sessão.
- Arquitetura solicitada: API Laravel + Sanctum em `backend`, React/Vite + React Router em `frontend`. O starter atual usa Inertia/Fortify; a divergência está registrada antes de qualquer alteração.
- Proposta de TypeScript: manter, pois já existe no destino e ajuda a tipar contratos da API.
- Proposta de estilos: Tailwind com variáveis CSS para tokens; o destino já contém Tailwind e componentes Radix reutilizáveis. Evita adicionar SASS ao destino.
- Proposta de estado: Context com reducers para auth/carrinho, sem acrescentar Zustand para dois domínios pequenos.
- Preservar os 63 produtos, categorias, marcas, cores, tamanhos e imagens. Não criar estoque quantitativo inexistente no original.
- `rank` será rating estático do produto, sem votação nem prioridade de favoritos.

## Pendências e dúvidas

- Aprovar tratamento da Wallet fictícia: proposta de manter a opção como pagamento simulado sem saldo ou desconto artificial de US$ 10. Isso altera o comportamento original e exige OK.
- Confirmar a reorganização do starter em `backend`/`frontend`, com substituição do fluxo Inertia por React Router/API, diante das instruções locais conflitantes.
- Moeda proposta: USD, preservando a apresentação `$` e os valores do catálogo; não converter preços silenciosamente.
- Preservar provisoriamente o limite de quatro endereços, hoje apenas no frontend; aplicar a mesma regra no servidor.
- A referência visual será inspecionada na fase de design; nenhuma validação visual foi feita nesta fase.
- Não há exportação MongoDB no repositório; migração de dados pessoais reais não foi executada nem planejada sem uma fonte fornecida.
- A pasta destino chegou sem `.git`; Git foi inicializado nesta fase, com somente os documentos de análise preparados para o primeiro commit. O starter existente permanece fora desse commit.

## Desvios do original

Nenhum comportamento de aplicação foi alterado. Correções planejadas: autenticação real, hash de senha, autorização por proprietário, respostas JSON, preços e fretes calculados no servidor, quantidades positivas, exclusão do item correto, endereço padrão único em transação, pedidos com snapshots e limpeza transacional do carrinho. CRUD de conta/endereços e etapas de confirmação completarão funcionalidades pedidas que o código original não implementa integralmente.

## Verificação desta fase

- Leitura estática de rotas Express, schemas Mongoose, catálogo, páginas/componentes React, roteamento e estilos do original.
- Versões locais conferidas com `composer show --direct` e `package.json`: Laravel 13.38.0, Inertia Laravel 3.5.2, Fortify 1.41.0 e Pest 5.3.3; React declarado ^19.2.0, Tailwind ^4 e TypeScript ^5.7.2.
- Rotas locais consultadas com `php artisan route:list --except-vendor --no-interaction`.
- Sem execução do MERN ou testes funcionais; nenhuma implementação foi iniciada. O PHP local emitiu aviso de extensão `pdo_firebird` indisponível.

## Próximo passo concreto

Após o OK sobre escopo/arquitetura, iniciar a fase 2: preservar os arquivos existentes ao reorganizar o monorepo, conferir a versão estável disponível do Laravel e compatibilidade dos pacotes, configurar MySQL e Sanctum e criar modelagem, catálogo seedado e testes de autenticação. Cada fase deverá atualizar este arquivo no próprio commit.
