# Parte A + B: Admin com Premium total, métricas e eventos (e-mails ficam para depois)

## 1. Admin sempre com acesso Premium
- Em `src/lib/premium.functions.ts`, `getPremiumStatus` passa a checar `is_admin(userId)` **antes** de consultar `premium_status`. Se for admin, retorna `{ active: true, plan: "admin", expiresAt: null }`.
- Decisão feita no servidor, então nenhum cliente consegue burlar.
- Efeito: `usePremiumSync` grava `plan: "premium"` no store e todos os `PremiumGate` abrem para o seu e-mail.

## 2. Selo "Modo Guardião"
- `getPremiumStatus` devolve `plan: "admin"`; a página "Minha conta" mostra um selo discreto ("Modo Guardião — acesso completo para testes") quando o plano vier como admin.

## 3. Registro de eventos (base das métricas)
Migração criando `public.app_events`:
- Colunas: `id uuid`, `user_id uuid null`, `email text null`, `event text`, `meta jsonb`, `created_at timestamptz default now()`.
- GRANTs: `SELECT` para `authenticated` (usado via função admin), `ALL` para `service_role`.
- RLS ativa; política de leitura só com `is_admin(auth.uid())`; escrita apenas por função de servidor.
- Índices em `created_at` e `event`.

Eventos gravados (sem PII sensível): `app_open`, `signin`, `premium_view` (abriu o modal), `checkout_click`, `premium_activated`, `onboarding_done`.

## 4. Gravação dos eventos
- Nova função de servidor `logEvent` em `src/lib/analytics.functions.ts` (autenticada quando houver sessão; anônima grava só `event` + `meta`).
- Chamadas nos pontos: abertura do app (`app-shell`), login (`conta`), abrir `PremiumDialog`, clicar em "Assinar", ativação confirmada pelo webhook/sync.

## 5. Painel de métricas em `/admin`
Nova função `getAdminMetrics` (valida `is_admin` no servidor) retornando:
- Total de contas com backup na nuvem (`aurin_backups`).
- Premium ativos, premium inativos/expirados, mensal vs. anual.
- Estimativa de gratuitos = contas registradas − premium ativos.
- Acessos: hoje, 7 dias, 30 dias (a partir de `app_events`).
- Funil: quantos viram o modal → quantos clicaram no checkout → quantos ativaram (taxa de conversão).
- Novos cadastros nos últimos 7/30 dias.

UI: cartões de números no topo da Sala do Guardião, acima da lista de assinaturas, com botão "Atualizar".

## 6. Boas práticas incluídas por padrão
- Nenhum dado financeiro pessoal sai do aparelho; os eventos guardam só contadores e o e-mail da conta quando existir sessão.
- Consultas de métricas sempre server-side com verificação de papel admin.
- Zero dependência de serviço externo de analytics.

## 7. E-mails automáticos — adiados
Fica pronto o registro de eventos que os e-mails vão usar depois (`premium_activated`, `checkout_click` sem compra, cancelamento). Quando você tiver um domínio próprio verificado, ativo os templates e gatilhos sem refazer nada.

## 8. Verificação
- Entrar com `ozzymusabarto@gmail.com` e confirmar que todos os recursos Premium abrem e o selo aparece.
- Confirmar que uma conta comum continua bloqueada.
- Abrir `/admin`, conferir os números e comparar com consultas diretas ao banco.

## Detalhes técnicos
- Arquivos tocados: `src/lib/premium.functions.ts`, `src/lib/admin.functions.ts`, novo `src/lib/analytics.functions.ts`, `src/routes/admin.tsx`, `src/routes/conta.tsx`, `src/components/premium-dialog.tsx`, `src/components/app-shell.tsx`.
- Uma migração de banco (tabela `app_events` + GRANTs + RLS + índices).
