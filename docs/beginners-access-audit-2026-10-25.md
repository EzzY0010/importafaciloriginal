# Auditoria de acesso do ImportaFácil — 25/10/2026

## Escopo e segurança

Esta auditoria foi feita somente por leitura do código e por build local. Não houve acesso, escrita ou deploy no banco de produção, no CN Pay ou em usuários reais. O backend novo não foi usado como evidência de produção.

## Resultado por cenário

| Cenário | Resultado esperado | Verificação no código | Situação |
|---|---|---|---|
| Usuário legado | Acesso total sem expiração | `useAuth` considera `legacy_access` sem prazo como acesso ativo; Dashboard não aplica `BeginnersGate`; Edge Functions `wolf-chat` e `vinted-scraper` consultam `has_full_access` | Simulado por leitura; não testado com conta real |
| Beginners novo ativo | Somente Calculadora Pro, login e perfil | Dashboard exibe Calculadora apenas quando `plan_type === "beginners"`; chat e Início ficam atrás de `BeginnersGate`; Fontes bloqueia Beginners ativo | Simulado por leitura; não testado com conta real |
| Beginners vencido | Login continua; Calculadora bloqueada; mensagem de vencimento e renovação | O estado de expiração é calculado em `useAuth`; foi preparada uma tela específica `Seu acesso Beginners venceu` no patch local; a versão anterior mostrava a tela genérica de compra | Simulado por leitura; patch ainda não publicado |
| Beginners renovado | Calculadora volta a abrir; demais áreas continuam bloqueadas | Expiração futura reativa `hasAccess`; `plan_type` continua limitando o Dashboard à Calculadora | Simulado por leitura; não testado com renovação real |
| Conexão USA / `grupo` | Sem acesso ao site | Webhook mapeia `038EXW7` para `grupo`; regra de perfil usa `has_paid = false`; Edge Functions de IA/busca exigem `has_full_access` | Simulado por leitura; não testado em produção |
| Elite | Acesso total enquanto ativo | Não entra na condição Beginners; `has_full_access` permite planos pagos não-Beginners e não-grupo | Simulado por leitura; não testado com conta real |

## Bloqueio de backend/API

- `wolf-chat` exige sessão autenticada e chama `has_full_access` antes de processar a IA.
- `vinted-scraper` também consulta `has_full_access` antes da busca.
- A regra SQL `has_full_access` exclui Beginners, grupo e assinaturas vencidas; preserva legado sem prazo.
- Isso depende da função SQL e das Edge Functions estarem implantadas no projeto Supabase realmente usado pela produção. Não foi afirmado como ativo em produção.

## Brecha encontrada e correção preparada

A rota `/fontes` tinha um bloqueio apenas para Beginners ativo. Beginners vencido e Conexão USA podiam abrir a rota diretamente porque `hasAccess` ficava falso e a página continuava renderizando a lista. Foi preparado um patch local para bloquear Beginners ativo/vencido e `grupo`, além de exibir a mensagem de vencimento. Esse patch **não foi publicado** nesta etapa, conforme solicitado.

Também não existe um middleware global de autorização de rotas no React Router. Portanto, as rotas internas devem continuar protegidas individualmente e as APIs críticas devem validar o plano no backend.

## Correção visual do chat

Aplicada somente na bolha de resposta do Lobo:

- `strong`, `b`, `em`, `i`, títulos e itens de lista herdam `#111827`.
- Links usam `#1D4ED8`, sublinhado e hover `#1E40AF`.
- A regra é escopada a `.wolf-assistant-message`; não altera a bolha azul do usuário nem textos globais do modo claro.

## Validação real realizada

- Build local do projeto executado com sucesso antes da separação do patch de acesso.
- Inspeção estática dos componentes, rotas e Edge Functions concluída.
- Não foi feito teste com conta real, pagamento real, webhook real ou banco de produção.
- Não foi feito deploy desta auditoria de acesso.
