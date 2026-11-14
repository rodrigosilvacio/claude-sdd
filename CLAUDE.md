# claude-sdd

Repositório de avaliação de sabores de Spec-Driven Development (SDD).
Cada sabor vive na sua própria pasta.

## OpenSpec (`openspec-sdd/`)

- O projeto OpenSpec fica em `openspec-sdd/` (lá está a pasta `openspec/`).
- **Rode todo comando `openspec` a partir de `openspec-sdd/`**, por exemplo `cd openspec-sdd && openspec list --json`. Da raiz do repo o CLI retorna `root: null`.
- Se o CLI não estiver instalado na sessão: `npm install -g @fission-ai/openspec@latest`.
- Skills disponíveis como comandos (links em `.claude/skills/`): `/openspec-explore`, `/openspec-propose`, `/openspec-apply-change`, `/openspec-update-change`, `/openspec-sync-specs`, `/openspec-archive-change`.
- Artefatos em pt-BR (ver `openspec-sdd/openspec/config.yaml`).
- O código da aplicação gerada também fica dentro de `openspec-sdd/`.
