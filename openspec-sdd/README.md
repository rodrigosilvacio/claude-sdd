# OpenSpec (SDD)

Avaliação do sabor **OpenSpec** de Spec-Driven Development.

- Site: https://openspec.dev
- CLI: `npm install -g @fission-ai/openspec@latest` (v2.0.0)
- Inicializado com: `openspec init --tools claude --language pt-BR`

## Estrutura

- `openspec/specs/`: specs vigentes (fonte da verdade do sistema)
- `openspec/changes/`: propostas de mudança em andamento
- `openspec/changes/archive/`: mudanças concluídas
- `.claude/skills/` → `.agents/skills/`: skills do fluxo OpenSpec para o Claude Code

## Fluxo

1. `/openspec-explore`: explorar ideia
2. `/openspec-propose "ideia"`: gerar proposta, design, tasks e delta de specs
3. `/openspec-apply-change`: implementar as tasks
4. `/openspec-archive-change`: arquivar e consolidar specs
