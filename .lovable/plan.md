# Revisão final antes de publicar

## Situação atual
O app está funcionalmente completo: ritual matinal, transações com parcelas, cartões, orçamento 70/20/10, Resgate de Paz, multiplicador, jornada/conquistas, manual, tour em slides, PIN/biometria, backup na nuvem, PWA offline, Premium via Hotmart, Sala do Guardião com métricas e acesso total para o seu e-mail. A verificação de tipos passou sem erros.

## Passo 1 — Checagem de segurança (obrigatório antes de publicar)
- Rodar a varredura de segurança e ler os resultados.
- Se aparecer algo crítico, corrigir antes do deploy; se for aviso conhecido e intencional (ex.: `admin_metrics` valida o papel admin por dentro), registrar na memória de segurança em vez de mudar código.

## Passo 2 — Teste de fumaça no navegador
Percorrer, em telas de celular e desktop:
1. Primeiro acesso (app vazio) → Ritual de Entrada → dashboard.
2. Lançar entrada e despesa, conferir a regra dos 10% e a recompensa visual.
3. Abrir um recurso Premium com conta comum → modal aparece; conferir os dois links da Hotmart.
4. Entrar com o seu Google → selo "Modo Guardião", tudo liberado, `/admin` com números.
5. Backup na nuvem: salvar e restaurar.
6. Modo offline: recarregar sem rede.

## Passo 3 — Ajustes finais recomendados (pequenos, se algo aparecer)
- Metadados de cada rota (título, descrição, og) revisados e únicos.
- Nenhum texto de "modo demonstração" ou placeholder sobrando.
- Ícones e manifest do PWA coerentes com o nome AURIN.

## Passo 4 — O que ainda falta de verdade (fora do código, decisão sua)
- **E-mails automáticos**: dependem de um domínio próprio verificado. Já registro os eventos que eles vão usar; ativo quando você tiver o domínio.
- **Domínio próprio**: opcional, conectado depois da publicação nas configurações do projeto.
- **Política de privacidade / termos**: recomendável para vender assinatura (página simples `/privacidade` com o essencial: dados ficam no aparelho, backup opcional, e-mail usado para reconhecer a compra). Posso criar se quiser.
- **Teste real de compra**: fazer uma compra de teste na Hotmart e confirmar que o webhook libera o Premium automaticamente.

## Passo 5 — Publicação
Com a varredura limpa e o teste de fumaça ok, publico o app e te passo o link.

## Detalhes técnicos
- Verificação: `security--get_scan_results` + `run_security_scan`, Playwright para o fluxo, `preview_ui--publish` no fim.
- Nenhuma migração nova prevista; alterações de código só se a varredura ou o teste apontarem algo.
