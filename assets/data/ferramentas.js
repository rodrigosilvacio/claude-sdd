/* Único arquivo com as URLs oficiais das Ferramentas_SDD (R12.4).
   Todos os valores vêm da seção "Fatos extraídos das fontes oficiais" do requirements.md,
   consultada em 14/11/2026. Campos não informados pela Fonte_Oficial ficam null
   ("verificar na fonte" / "versão não informada na fonte"). URLs sem parâmetros utm_* (R12.6). */

/** @typedef {Object} Ferramenta
 *  @property {string} id
 *  @property {string} nome
 *  @property {{icone:string, cor:string}} identidade
 *  @property {string} urlOficial
 *  @property {string[]} fontesAdicionais
 *  @property {string} dataConsulta
 *  @property {string|null} versao
 *  @property {string|null} licenca
 *  @property {string|null} custo
 *  @property {string[]|null} agentes
 *  @property {string} proposito
 *  @property {string[]} artefatos
 *  @property {{id:string,rotulo:string,comando?:string}[]} ciclo
 *  @property {{titulo:string,comando?:string,descricao?:string}[]} passos
 *  @property {Object} arvore
 *  @property {Object<string,string|null>} atributos
 *  @property {string[]} comandosPermitidos
 */

const DATA_CONSULTA = '14/11/2026';

/** @type {Ferramenta[]} */
export const ferramentas = [
  {
    id: 'openspec',
    nome: 'OpenSpec',
    identidade: { icone: 'assets/svg/openspec.svg', cor: '#0b4f9c' },
    urlOficial: 'https://github.com/Fission-AI/OpenSpec',
    // A documentação é citada no README, mas não foi acessada.
    fontesAdicionais: ['https://openspec.dev/docs'],
    dataConsulta: DATA_CONSULTA,
    versao: null,
    licenca: 'MIT',
    custo: null,
    agentes: null, // a fonte informa "mais de 30 assistentes de IA", sem lista completa
    proposito: 'Propor, aplicar e arquivar mudanças com requisitos em Markdown, orientadas por comandos no agente de IA.',
    artefatos: [
      'openspec/changes/<nome>/proposal.md',
      'openspec/changes/<nome>/specs/',
      'openspec/changes/<nome>/design.md',
      'openspec/changes/<nome>/tasks.md',
      'openspec/changes/archive/',
    ],
    ciclo: [
      { id: 'explore', rotulo: 'Explorar', comando: '/openspec-explore' },
      { id: 'propose', rotulo: 'Propor', comando: '/openspec-propose <descrição>' },
      { id: 'apply', rotulo: 'Aplicar', comando: '/openspec-apply-change' },
      { id: 'archive', rotulo: 'Arquivar', comando: '/openspec-archive-change' },
    ],
    passos: [
      { titulo: 'Instalar o OpenSpec', comando: 'npm install -g @fission-ai/openspec@latest', descricao: 'Exige Node.js 22.12.0 ou superior. Alternativas: brew install openspec ou script curl/PowerShell.' },
      { titulo: 'Inicializar o projeto', comando: 'openspec init' },
      { titulo: 'Explorar a ideia', comando: '/openspec-explore' },
      { titulo: 'Propor a mudança', comando: '/openspec-propose <descrição>', descricao: 'Gera openspec/changes/<nome>/ com proposal.md, specs/, design.md e tasks.md. No Codex, use $openspec-propose.' },
      { titulo: 'Aplicar a mudança', comando: '/openspec-apply-change' },
      { titulo: 'Arquivar a mudança', comando: '/openspec-archive-change', descricao: 'Move a mudança para openspec/changes/archive/.' },
    ],
    arvore: {
      nome: 'openspec/',
      filhos: [
        {
          nome: 'changes/',
          filhos: [
            {
              nome: '<nome>/',
              filhos: [
                { nome: 'proposal.md' },
                { nome: 'specs/' },
                { nome: 'design.md' },
                { nome: 'tasks.md' },
              ],
            },
            { nome: 'archive/' },
          ],
        },
      ],
    },
    atributos: {
      fluxo: 'Explorar, propor, aplicar e arquivar mudanças.',
      curva: null,
      integracao: 'Mais de 30 assistentes de IA; comandos de agente como /openspec-propose.',
      formato: 'Markdown com "## ADDED Requirements" e "#### Scenario:" com WHEN/THEN.',
      licenca: 'MIT',
      custo: null,
    },
    comandosPermitidos: [
      'npm install -g @fission-ai/openspec@latest',
      'brew install openspec',
      'openspec init',
      'openspec update',
      '/openspec-explore',
      '/openspec-propose <descrição>',
      '/openspec-apply-change',
      '/openspec-archive-change',
      '$openspec-propose',
    ],
  },

  {
    id: 'spec-kit',
    nome: 'GitHub Spec Kit',
    identidade: { icone: 'assets/svg/spec-kit.svg', cor: '#1f5f3a' },
    urlOficial: 'https://github.com/github/spec-kit',
    fontesAdicionais: [],
    dataConsulta: DATA_CONSULTA,
    versao: null,
    licenca: 'MIT',
    custo: null,
    agentes: null, // a fonte cita apenas o exemplo --integration copilot
    proposito: 'Conduzir o SDD no chat do agente com constituição, especificação, plano, tarefas, implementação e convergência.',
    artefatos: ['.specify/'],
    ciclo: [
      { id: 'constitution', rotulo: 'Constituição', comando: '/speckit-constitution' },
      { id: 'specify', rotulo: 'Especificar', comando: '/speckit-specify' },
      { id: 'plan', rotulo: 'Planejar', comando: '/speckit-plan' },
      { id: 'tasks', rotulo: 'Tarefas', comando: '/speckit-tasks' },
      { id: 'implement', rotulo: 'Implementar', comando: '/speckit-implement' },
      { id: 'converge', rotulo: 'Convergir', comando: '/speckit-converge' },
    ],
    passos: [
      { titulo: 'Instalar o Specify CLI', comando: 'uv tool install specify-cli', descricao: 'Exige Python 3.11+ e uv.' },
      { titulo: 'Criar o projeto', comando: 'specify init my-project --integration copilot' },
      { titulo: 'Definir a constituição', comando: '/speckit-constitution' },
      { titulo: 'Especificar', comando: '/speckit-specify' },
      { titulo: 'Planejar', comando: '/speckit-plan' },
      { titulo: 'Gerar as tarefas', comando: '/speckit-tasks' },
      { titulo: 'Implementar', comando: '/speckit-implement' },
      { titulo: 'Convergir', comando: '/speckit-converge', descricao: 'Repita implement e converge até a convergência.' },
    ],
    arvore: {
      nome: 'my-project/',
      filhos: [{ nome: '.specify/' }],
    },
    atributos: {
      fluxo: 'Constituição, especificação, plano, tarefas, implementação e convergência.',
      curva: null,
      integracao: 'Integração escolhida na inicialização (exemplo da fonte: copilot).',
      formato: 'Artefatos do projeto em .specify/.',
      licenca: 'MIT',
      custo: null,
    },
    comandosPermitidos: [
      'uv tool install specify-cli',
      'specify init my-project --integration copilot',
      '/speckit-constitution',
      '/speckit-specify',
      '/speckit-plan',
      '/speckit-tasks',
      '/speckit-implement',
      '/speckit-converge',
      'specify extension add bug',
      'specify extension add assess',
    ],
  },

  {
    id: 'bmad',
    nome: 'BMAD Method',
    identidade: { icone: 'assets/svg/bmad.svg', cor: '#7a3e00' },
    urlOficial: 'https://github.com/bmad-code-org/BMAD-METHOD',
    fontesAdicionais: [],
    dataConsulta: DATA_CONSULTA,
    versao: 'v6.12 (estável); v7 em preview alpha',
    licenca: 'MIT',
    custo: null,
    agentes: null, // a fonte fala em "ferramenta de IA", sem lista de agentes
    proposito: 'Método com módulos oficiais (BMad Builder, Test Architect, entre outros) invocados na ferramenta de IA.',
    artefatos: [],
    ciclo: [
      { id: 'instalar', rotulo: 'Instalar', comando: 'npx bmad-method install' },
      { id: 'help', rotulo: 'Pedir ajuda', comando: 'bmad-help' },
      { id: 'build', rotulo: 'Construir', comando: 'bmad-build' },
    ],
    passos: [
      { titulo: 'Conferir os pré-requisitos', descricao: 'Node.js 20.12+ e Python 3.10+; uv necessário.' },
      { titulo: 'Instalar a versão estável v6.12', comando: 'npx bmad-method install' },
      { titulo: 'Invocar bmad-help na ferramenta de IA', comando: 'bmad-help' },
      { titulo: 'Invocar bmad-build na ferramenta de IA', comando: 'bmad-build' },
    ],
    arvore: {
      nome: 'projeto/',
      filhos: [],
    },
    atributos: {
      fluxo: 'Instalação e invocação de bmad-build e bmad-help na ferramenta de IA.',
      curva: null,
      integracao: 'Ferramenta de IA do aluno; lista de agentes não informada na fonte consultada.',
      formato: null,
      licenca: 'MIT',
      custo: null,
    },
    comandosPermitidos: [
      'npx bmad-method install',
      "npx skills add bmad-code-org/BMAD-METHOD/skills/core-tools --skill '*'",
      'bmad-build',
      'bmad-help',
    ],
  },

  {
    id: 'kiro',
    nome: 'AWS Kiro',
    identidade: { icone: 'assets/svg/kiro.svg', cor: '#5b3b9a' },
    urlOficial: 'https://kiro.dev',
    fontesAdicionais: ['https://kiro.dev/docs/specs/'],
    dataConsulta: DATA_CONSULTA,
    versao: null,
    licenca: null, // a página consultada não informa licença
    custo: null, // a página consultada não informa preço do plano
    agentes: null,
    proposito: 'Specs com requirements.md (ou bugfix.md), design.md e tasks.md, em IDE, CLI, Web e Mobile.',
    artefatos: ['requirements.md', 'bugfix.md', 'design.md', 'tasks.md'],
    ciclo: [
      { id: 'requirements', rotulo: 'Requisitos' },
      { id: 'design', rotulo: 'Design' },
      { id: 'tasks', rotulo: 'Tarefas' },
      { id: 'execucao', rotulo: 'Execução em ondas paralelas' },
    ],
    passos: [
      { titulo: 'Instalar o CLI', comando: 'curl -fsSL https://cli.kiro.dev/install | bash', descricao: 'Kiro também está disponível em IDE, Web e Mobile.' },
      { titulo: 'Escolher o fluxo da spec', descricao: 'Requirements-First, Design-First ou Quick Spec; specs de bugfix usam bugfix.md.' },
      { titulo: 'Gerar requirements.md' },
      { titulo: 'Gerar design.md' },
      { titulo: 'Gerar tasks.md' },
      { titulo: 'Executar as tarefas', descricao: 'As tarefas rodam em ondas paralelas conforme as dependências.' },
    ],
    arvore: {
      nome: 'spec/',
      filhos: [
        { nome: 'requirements.md' },
        { nome: 'design.md' },
        { nome: 'tasks.md' },
      ],
    },
    atributos: {
      fluxo: 'Requirements-First, Design-First e Quick Spec; specs de bugfix.',
      curva: null,
      integracao: 'IDE, CLI, Web e Mobile.',
      formato: 'requirements.md (ou bugfix.md), design.md e tasks.md.',
      licenca: null,
      custo: null,
    },
    comandosPermitidos: [
      'curl -fsSL https://cli.kiro.dev/install | bash',
    ],
  },

  {
    id: 'gsd',
    nome: 'GSD',
    identidade: { icone: 'assets/svg/gsd.svg', cor: '#9b1c31' },
    // ATENÇÃO: a confirmação da URL oficial pelo usuário é recomendada antes da publicação
    // (PEND-1; não bloqueia o certificado). A URL foi localizada na página do repositório antigo,
    // que informa a mudança para open-gsd/gsd-core.
    urlOficial: 'https://github.com/open-gsd/gsd-core',
    fontesAdicionais: ['https://github.com/gsd-build/get-shit-done'], // repositório antigo
    dataConsulta: DATA_CONSULTA,
    versao: null,
    licenca: 'MIT',
    custo: null,
    agentes: [
      'Claude Code',
      'OpenCode',
      'Antigravity CLI',
      'Kimi CLI',
      'Kilo',
      'Codex',
      'Copilot',
      'Cursor',
      'Windsurf',
    ], // a fonte diz "e outros"
    proposito: 'Sistema de meta-prompting, engenharia de contexto e SDD, em laço de cinco etapas por fase.',
    artefatos: ['STATE.md', 'CONTEXT.md'],
    ciclo: [
      { id: 'discuss', rotulo: 'Discuss' },
      { id: 'plan', rotulo: 'Plan' },
      { id: 'execute', rotulo: 'Execute' },
      { id: 'verify', rotulo: 'Verify' },
      { id: 'ship', rotulo: 'Ship' },
    ],
    passos: [
      { titulo: 'Instalar o GSD Core', comando: 'npx @opengsd/gsd-core@latest', descricao: 'O instalador pergunta o runtime e se a instalação é global ou local.' },
      { titulo: 'Iniciar um projeto novo', comando: '/gsd-new-project', descricao: 'Para código existente, use /gsd-onboard.' },
      { titulo: 'Discuss' },
      { titulo: 'Plan' },
      { titulo: 'Execute' },
      { titulo: 'Verify' },
      { titulo: 'Ship' },
    ],
    arvore: {
      nome: 'projeto/',
      filhos: [{ nome: 'STATE.md' }, { nome: 'CONTEXT.md' }],
    },
    atributos: {
      fluxo: 'Laço Discuss, Plan, Execute, Verify e Ship por fase.',
      curva: null,
      integracao: 'Claude Code, OpenCode, Antigravity CLI, Kimi CLI, Kilo, Codex, Copilot, Cursor, Windsurf e outros.',
      formato: 'STATE.md e CONTEXT.md.',
      licenca: 'MIT',
      custo: null,
    },
    comandosPermitidos: [
      'npx @opengsd/gsd-core@latest',
      '/gsd-new-project',
      '/gsd-onboard',
    ],
  },

  {
    id: 'spec-kitty',
    nome: 'Spec Kitty',
    identidade: { icone: 'assets/svg/spec-kitty.svg', cor: '#0b6e4f' },
    urlOficial: 'https://spec-kitty.ai',
    fontesAdicionais: [
      'https://spec-kitty.ai/getting-started.md',
      'https://github.com/spec-kitty/spec-kitty', // link do site, não acessado
    ],
    dataConsulta: DATA_CONSULTA,
    versao: 'spec-kitty-cli 3.2.7',
    licenca: 'MIT',
    custo: 'CLI gratuito',
    agentes: null, // a fonte informa "mais de 20 agentes", sem lista completa
    proposito: 'Fluxo SDD com um git worktree por work package e revisão por pessoa ou agente diferente do autor.',
    artefatos: ['.kittify/', '.claude/ (arquivos de comandos do agente escolhido)'],
    ciclo: [
      { id: 'specify', rotulo: 'Especificar', comando: '/spec-kitty.specify' },
      { id: 'plan', rotulo: 'Planejar', comando: '/spec-kitty.plan' },
      { id: 'tasks', rotulo: 'Tarefas', comando: '/spec-kitty.tasks' },
      { id: 'implement', rotulo: 'Implementar', comando: '/spec-kitty.implement' },
      { id: 'review', rotulo: 'Revisar', comando: '/spec-kitty.review' },
      { id: 'accept', rotulo: 'Aceitar', comando: '/spec-kitty.accept' },
      { id: 'merge', rotulo: 'Mesclar', comando: '/spec-kitty.merge' },
    ],
    passos: [
      { titulo: 'Instalar o CLI', comando: 'pipx install spec-kitty-cli', descricao: 'Exige Python 3.11+, pipx e git.' },
      { titulo: 'Inicializar o projeto', comando: 'spec-kitty init my-project --ai claude', descricao: 'Em repositório existente: spec-kitty init --ai claude. Vários agentes: --ai claude,codex.' },
      { titulo: 'Conferir .kittify/ e os arquivos de comandos do agente', descricao: 'O init cria .kittify/ e arquivos de comandos do agente (por exemplo .claude/).' },
      { titulo: 'Especificar', comando: '/spec-kitty.specify' },
      { titulo: 'Planejar', comando: '/spec-kitty.plan' },
      { titulo: 'Gerar as tarefas', comando: '/spec-kitty.tasks' },
      { titulo: 'Implementar', comando: '/spec-kitty.implement', descricao: 'Cada work package roda em seu próprio git worktree.' },
      { titulo: 'Revisar', comando: '/spec-kitty.review', descricao: 'Um revisor diferente do autor confere o trabalho.' },
      { titulo: 'Aceitar', comando: '/spec-kitty.accept' },
      { titulo: 'Mesclar', comando: '/spec-kitty.merge' },
    ],
    arvore: {
      nome: 'my-project/',
      filhos: [{ nome: '.kittify/' }, { nome: '.claude/' }],
    },
    atributos: {
      fluxo: 'Especificar, planejar, tarefas, implementar, revisar, aceitar e mesclar.',
      curva: null,
      integracao: 'Mais de 20 agentes; agente adicional com spec-kitty agent config add <chave>.',
      formato: '.kittify/ e arquivos de comandos do agente.',
      licenca: 'MIT',
      custo: 'CLI gratuito',
    },
    comandosPermitidos: [
      'pipx install spec-kitty-cli',
      'spec-kitty init my-project --ai claude',
      'spec-kitty init --ai claude',
      'spec-kitty init my-project --ai claude,codex',
      'spec-kitty agent config add <chave>',
      '/spec-kitty.specify',
      '/spec-kitty.plan',
      '/spec-kitty.tasks',
      '/spec-kitty.implement',
      '/spec-kitty.review',
      '/spec-kitty.accept',
      '/spec-kitty.merge',
      '/spec-kitty.charter',
    ],
  },

  {
    id: 'specweave',
    nome: 'SpecWeave',
    identidade: { icone: 'assets/svg/specweave.svg', cor: '#8a4b00' },
    urlOficial: 'https://spec-weave.com',
    fontesAdicionais: [],
    dataConsulta: DATA_CONSULTA,
    versao: '3.1.0 (17/10/2026)',
    licenca: 'MIT',
    custo: 'CLI gratuito',
    agentes: [
      'Claude Code',
      'Codex',
      'Cursor',
      'Gemini CLI',
      'GitHub Copilot CLI',
      'Grok',
      'OpenCode',
      'Muse Code',
      'Antigravity',
      'Pi',
    ],
    proposito: 'Incrementos com critérios de aceite e tarefas rastreados, com passagem de bastão, verificação e revisão.',
    artefatos: [
      '.specweave/increments/0001-<nome>/spec.md',
      '.specweave/increments/0001-<nome>/ledger.jsonl',
      '.specweave/increments/0001-<nome>/handoff.md',
      '.specweave/increments/0001-<nome>/reports/',
      '.specweave/memory/MEMORY.md',
    ],
    ciclo: [
      { id: 'claim', rotulo: 'Assumir tarefa', comando: 'specweave task claim T-01' },
      { id: 'done', rotulo: 'Concluir tarefa', comando: 'specweave task done T-01 --run "npm test"' },
      { id: 'handoff', rotulo: 'Passar o bastão', comando: 'specweave handoff' },
      { id: 'pickup', rotulo: 'Retomar', comando: 'specweave pickup' },
      { id: 'verify', rotulo: 'Verificar', comando: 'specweave verify' },
      { id: 'review', rotulo: 'Revisar', comando: 'specweave review' },
      { id: 'complete', rotulo: 'Completar', comando: 'specweave complete' },
    ],
    passos: [
      { titulo: 'Instalar o CLI', comando: 'npm install -g specweave' },
      { titulo: 'Inicializar o projeto', comando: 'specweave init' },
      { titulo: 'Criar o incremento', comando: 'specweave create-increment "<título>"', descricao: 'Cria .specweave/increments/0001-<nome>/.' },
      { titulo: 'Assumir uma tarefa', comando: 'specweave task claim T-01' },
      { titulo: 'Concluir a tarefa com teste', comando: 'specweave task done T-01 --run "npm test"' },
      { titulo: 'Passar o bastão', comando: 'specweave handoff' },
      { titulo: 'Retomar o trabalho', comando: 'specweave pickup' },
      { titulo: 'Verificar', comando: 'specweave verify' },
      { titulo: 'Revisar', comando: 'specweave review' },
      { titulo: 'Completar o incremento', comando: 'specweave complete', descricao: 'Para ajustes pequenos, use specweave small-fix "<motivo>" em vez de um incremento.' },
    ],
    arvore: {
      nome: '.specweave/',
      filhos: [
        {
          nome: 'increments/',
          filhos: [
            {
              nome: '0001-<nome>/',
              filhos: [
                { nome: 'spec.md' },
                { nome: 'ledger.jsonl' },
                { nome: 'handoff.md' },
                {
                  nome: 'reports/',
                  filhos: [
                    { nome: 'task-T-02.txt' },
                    { nome: 'verify.md' },
                    { nome: 'verify.json' },
                    { nome: 'review-codex.md' },
                  ],
                },
              ],
            },
          ],
        },
        { nome: 'memory/', filhos: [{ nome: 'MEMORY.md' }] },
      ],
    },
    atributos: {
      fluxo: 'Criar incremento, assumir e concluir tarefas, passar o bastão, verificar, revisar e completar.',
      curva: null,
      integracao: 'Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot CLI, Grok, OpenCode, Muse Code, Antigravity e Pi.',
      formato: 'spec.md com critérios "- [ ] AC-01:" e tarefas "### T-01"; ledger.jsonl.',
      licenca: 'MIT',
      custo: 'CLI gratuito',
    },
    comandosPermitidos: [
      'npm install -g specweave',
      'specweave init',
      'specweave create-increment "<título>"',
      'specweave task claim T-01',
      'specweave task done T-01 --run "npm test"',
      'specweave handoff',
      'specweave pickup',
      'specweave verify',
      'specweave review',
      'specweave complete',
      'specweave small-fix "<motivo>"',
    ],
  },
];

/** Validação de fonte registrada (R5.8): devolve a lista de erros de dados de uma ferramenta.
 *  Lista vazia => o Tutorial pode ser publicado. */
export function validarFerramenta(f) {
  const erros = [];
  if (!f || !f.urlOficial) erros.push('sem Fonte_Oficial');
  if (!f || !f.dataConsulta) erros.push('sem Data_Consulta');
  return erros;
}
