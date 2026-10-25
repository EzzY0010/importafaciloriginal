# Relatório simulado — regras de acesso

Data da simulação: 25/10/2026.

Este relatório valida por inspeção de código e simulação lógica. Não representa execução contra o Supabase de produção.

## Cenários

| Cenário | Resultado esperado | Resultado da implementação |
|---|---|---|
| Usuário legado ativo | Mantém `legacy_access`, `plan_type` e validade atuais; nenhuma nova regra sobrescreve seu acesso | **Preservado por código** quando `legacy_access` ou histórico de pagamento aprovado é detectado |
| Novo comprador Beginners | Recebe `plan_type = beginners`, validade de 30 dias e acesso somente à Calculadora | **Implementado** no webhook para a oferta atual `QN950TS`; o dashboard mostra a Calculadora e o `BeginnersGate` para as demais abas |
| Beginners vencido | Login continua; acesso à Calculadora é bloqueado depois da validade | **Parcial**: a validade é gravada, mas a verificação definitiva de expiração deve ser confirmada no fluxo de autenticação/backend de produção |
| Beginners renovado | Soma 30 dias ao vencimento vigente quando ainda ativo; usa a data do pagamento quando já vencido; duplicata não libera novamente | **Implementado no helper** de renovação; a deduplicação depende do webhook identificar o mesmo pagamento pelo `external_reference`/transação |
| Novo Conexão USA | Recebe `plan_type = grupo`, validade de 30 dias e não recebe acesso ao site | **Implementado** para a oferta `038EXW7`; `has_paid` permanece falso |
| Elite | Mantém o fluxo de acesso existente, sem sofrer a regra de Beginners | **Preservado** pelo mapeamento e pela proteção de usuários com histórico/acesso existente |
| Reembolso/cancelamento | Remove acesso somente de compradores novos Beginners/Grupo; nunca remove acesso legado | **Implementado no webhook** para status de reembolso/cancelamento identificáveis |

## Validações realizadas

- `git diff --check`: aprovado.
- `npm run build`: aprovado.
- O botão do card Beginners reutiliza o checkout atual `CN_PAY_CHECKOUTS.autonomo`.
- O botão Conexão USA reutiliza `CN_PAY_CHECKOUTS.mensal`, correspondente à oferta `038EXW7`.
- A proteção visual do dashboard limita Beginners à Calculadora e ao perfil, preservando login e recuperação de senha.

## Pendências de produção

O Supabase de produção não foi acessado nem alterado nesta sessão. Portanto, a Edge Function ainda precisa ser implantada no projeto correto e a regra de expiração/backend precisa ser validada com contas reais. Também não foi possível informar a contagem real de usuários legados, fazer backup ou executar testes de dados sem acesso autorizado ao banco.
