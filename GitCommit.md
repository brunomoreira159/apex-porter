# APEX Porter - Release Notes & Changelog

## Versão: 1.2.0 - Auditoria, Imutabilidade e Padronização do Sistema
**Data:** 18 de Maio de 2026
**Repositório:** https://github.com/fricosystem/apex-porter.git

---

### 🛡️ 1. Auditoria e Imutabilidade no Fluxo da Portaria
- **Registros Imutáveis:** Os registros na lista de Fluxo não podem mais ser modificados diretamente ou excluídos.
- **Fluxo de Correção (Refazer):** Inclusão do botão **Refazer Registro (Corrigir Versão)** no modal de Detalhes. Ao ser acionado, o registro atual é inativado com gravação de data e motivo (`Substituído por nova versão corrigida`).
- O sistema abre imediatamente o formulário de novo registro preenchido com as informações anteriores para que o usuário possa realizar a alteração e gerar uma nova versão auditável.
- **Rastreabilidade Bidirecional:** A nova versão referencia o ID do registro original e o registro inativado armazena a chave da nova versão gerada (`versaoAnteriorId`).

### 📝 2. Campo de Observação nos Registros
- Adição do campo `Observação (Opcional)` no modal de criação de registros.
- As observações cadastradas são salvas no banco de dados e exibidas em destaque na seção **Informações de Entrada** do modal de Detalhes do Registro.

### 🔠 3. Middleware Global de Caixa Alta (Uppercase no Firestore)
- Implementação da função `transformToUpperCase` no módulo do Firestore (`src/lib/firestore.ts`).
- Todas as strings enviadas ao banco de dados são automaticamente convertidas para `UPPERCASE`.
- Identificadores de sistema (`id`, `versaoAnteriorId`), chaves estrangeiras, senhas, e-mails e URLs de fotos foram protegidos pela lista `DONT_UPPERCASE_KEYS` para garantir a total integridade dos dados e relacionamentos.

### 🏢 4. Padronização de Dados (Turnos e Ramais)
- **Turnos:** Padronização absoluta das opções de turno em todo o sistema (Inspeção Diária, Quadro de Avisos) para exclusivamente `Diurno` e `Noturno`.
- **Ramais Dinâmicos:** Refatoração do dropdown de Departamentos no cadastro de Ramais para extrair e apresentar apenas dados reais cadastrados no banco (Firestore), eliminando opções estáticas de mock.

### 📊 5. Melhorias de Interface e Dashboard
- **Gráficos Recharts:** Configuração da propriedade `allowDecimals={false}` no eixo Y do gráfico de movimentação por hora, garantindo a exibição de números inteiros apenas.
- **Formulário de Categoria:** O campo de Categoria no modal de Novo Registro inicia limpo e com validação de obrigatoriedade sem ocultar os demais campos do formulário.