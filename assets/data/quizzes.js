// Quizzes por módulo (R8.1). Conteúdo baseado nas fontes oficiais consultadas em 14/11/2026.
// `correta` é o índice (base 0) da opção correta.

export const NOTA_APROVACAO = 70;

export const quizzes = {
  'fundamentos': {
    moduloId: 'fundamentos',
    questoes: [
      {
        id: 'fundamentos-q1',
        enunciado: 'Qual é a ideia central do Spec-Driven Development (SDD)?',
        opcoes: [
          'O código é escrito primeiro e a documentação é feita depois.',
          'A especificação orienta a implementação.',
          'Os testes substituem qualquer tipo de especificação.',
          'A IA decide o escopo sem registro escrito.',
        ],
        correta: 1,
        explicacao: 'No SDD, a especificação orienta a implementação, em vez de o código ser escrito sem um registro prévio do que deve ser feito.',
      },
      {
        id: 'fundamentos-q2',
        enunciado: 'Qual sequência representa o fluxo de SDD apresentado no curso?',
        opcoes: [
          'Implementação, tarefas, design e requisitos.',
          'Design, implementação, requisitos e tarefas.',
          'Requisitos, design, tarefas e implementação.',
          'Tarefas, requisitos, implementação e design.',
        ],
        correta: 2,
        explicacao: 'O fluxo do curso é requisitos, design, tarefas e implementação.',
      },
      {
        id: 'fundamentos-q3',
        enunciado: 'Qual é a diferença entre SDD e desenvolvimento guiado apenas por prompts?',
        opcoes: [
          'No SDD, as decisões ficam registradas em artefatos de especificação que guiam o trabalho.',
          'No SDD, não se usa agente de IA.',
          'No desenvolvimento por prompts, sempre há requisitos escritos.',
          'Não há diferença entre as duas abordagens.',
        ],
        correta: 0,
        explicacao: 'O SDD mantém a especificação como artefato que orienta a implementação. No trabalho apenas por prompts, as decisões ficam dispersas nas conversas.',
      },
      {
        id: 'fundamentos-q4',
        enunciado: 'Para que serve o Projeto_Exemplo no curso?',
        opcoes: [
          'Para ser publicado como produto final do curso.',
          'Para substituir os quizzes de cada módulo.',
          'Para cada tutorial usar um projeto diferente.',
          'Para que todos os tutoriais e exercícios usem o mesmo projeto e as ferramentas possam ser comparadas.',
        ],
        correta: 3,
        explicacao: 'O Projeto_Exemplo é único e serve de base para todos os tutoriais e exercícios, o que permite comparar as ferramentas em condições equivalentes.',
      },
      {
        id: 'fundamentos-q5',
        enunciado: 'Quantas ferramentas de SDD o curso compara com tutorial e exercício?',
        opcoes: [
          'Três.',
          'Cinco.',
          'Sete.',
          'Nove.',
        ],
        correta: 2,
        explicacao: 'São sete: OpenSpec, GitHub Spec Kit, BMAD Method, AWS Kiro, GSD, Spec Kitty e SpecWeave.',
      },
    ],
  },

  'openspec': {
    moduloId: 'openspec',
    questoes: [
      {
        id: 'openspec-q1',
        enunciado: 'Qual comando inicializa o OpenSpec em um projeto?',
        opcoes: [
          'openspec init',
          'openspec start',
          'specify init',
          'openspec create',
        ],
        correta: 0,
        explicacao: 'A inicialização do OpenSpec é feita com `openspec init`.',
      },
      {
        id: 'openspec-q2',
        enunciado: 'Qual versão mínima de Node.js a fonte oficial exige para instalar o OpenSpec com npm?',
        opcoes: [
          'Node.js 16.0.0.',
          'Node.js 22.12.0 ou superior.',
          'Node.js 18.0.0.',
          'Node.js 20.12 ou superior.',
        ],
        correta: 1,
        explicacao: 'A instalação com `npm install -g @fission-ai/openspec@latest` exige Node.js 22.12.0 ou superior.',
      },
      {
        id: 'openspec-q3',
        enunciado: 'Quais arquivos e pastas cada mudança gera em `openspec/changes/<nome>/`?',
        opcoes: [
          '`requirements.md`, `design.md` e `tasks.md`.',
          '`spec.md`, `ledger.jsonl` e `handoff.md`.',
          '`proposal.md`, `specs/`, `design.md` e `tasks.md`.',
          '`STATE.md` e `CONTEXT.md`.',
        ],
        correta: 2,
        explicacao: 'Cada mudança do OpenSpec gera `proposal.md`, `specs/`, `design.md` e `tasks.md`.',
      },
      {
        id: 'openspec-q4',
        enunciado: 'Qual comando de agente cria a proposta de uma mudança no OpenSpec?',
        opcoes: [
          '/openspec-archive-change',
          '/openspec-apply-change',
          '/openspec-explore',
          '/openspec-propose <descrição>',
        ],
        correta: 3,
        explicacao: 'O comando `/openspec-propose <descrição>` cria a proposta. No Codex, o equivalente é `$openspec-propose`.',
      },
      {
        id: 'openspec-q5',
        enunciado: 'O que acontece com uma mudança ao ser arquivada no OpenSpec?',
        opcoes: [
          'Ela é movida para `openspec/changes/archive/`.',
          'Ela é apagada do repositório.',
          'Ela é enviada a um servidor remoto.',
          'Ela volta para a etapa de proposta.',
        ],
        correta: 0,
        explicacao: 'O arquivamento move a mudança para `openspec/changes/archive/`.',
      },
    ],
  },

  'spec-kit': {
    moduloId: 'spec-kit',
    questoes: [
      {
        id: 'spec-kit-q1',
        enunciado: 'Quais pré-requisitos o GitHub Spec Kit exige?',
        opcoes: [
          'Node.js 22 e npm.',
          'Python 3.11+ e `uv`.',
          'Python 3.10+ e `pipx`.',
          'Apenas um navegador.',
        ],
        correta: 1,
        explicacao: 'O Spec Kit exige Python 3.11+ e `uv`.',
      },
      {
        id: 'spec-kit-q2',
        enunciado: 'Qual comando instala a CLI do Spec Kit?',
        opcoes: [
          'npm install -g specify-cli',
          'pipx install spec-kit',
          'uv tool install specify-cli',
          'brew install specify',
        ],
        correta: 2,
        explicacao: 'A instalação é feita com `uv tool install specify-cli`.',
      },
      {
        id: 'spec-kit-q3',
        enunciado: 'Qual comando cria um projeto com o Spec Kit usando o Copilot?',
        opcoes: [
          'speckit new my-project',
          'specify start --copilot',
          'spec-kitty init my-project --ai copilot',
          'specify init my-project --integration copilot',
        ],
        correta: 3,
        explicacao: 'O projeto é criado com `specify init my-project --integration copilot`.',
      },
      {
        id: 'spec-kit-q4',
        enunciado: 'Qual é a sequência de comandos do Spec Kit no chat do agente?',
        opcoes: [
          '/speckit-constitution, /speckit-specify, /speckit-plan, /speckit-tasks, /speckit-implement e /speckit-converge.',
          '/speckit-plan, /speckit-specify, /speckit-implement e /speckit-tasks.',
          '/speckit-specify, /speckit-review e /speckit-merge.',
          '/speckit-explore, /speckit-propose e /speckit-archive.',
        ],
        correta: 0,
        explicacao: 'O fluxo é constitution, specify, plan, tasks, implement e converge.',
      },
      {
        id: 'spec-kit-q5',
        enunciado: 'Em qual pasta ficam os artefatos do projeto criado pelo Spec Kit?',
        opcoes: [
          '`.kittify/`',
          '`.specify/`',
          '`.specweave/`',
          '`openspec/`',
        ],
        correta: 1,
        explicacao: 'Os artefatos do projeto ficam em `.specify/`.',
      },
    ],
  },

  'bmad': {
    moduloId: 'bmad',
    questoes: [
      {
        id: 'bmad-q1',
        enunciado: 'Qual comando instala a versão estável (v6.12) do BMAD Method?',
        opcoes: [
          'npx bmad-method install',
          'uv tool install bmad-method',
          'pipx install bmad',
          'npm install -g bmad-build',
        ],
        correta: 0,
        explicacao: 'A versão estável é instalada com `npx bmad-method install`.',
      },
      {
        id: 'bmad-q2',
        enunciado: 'Quais pré-requisitos a fonte oficial lista para a versão estável do BMAD Method?',
        opcoes: [
          'Somente Python 3.11+.',
          'Somente Docker.',
          'Node.js 20.12+ e Python 3.10+, com `uv` necessário.',
          'Somente Node.js 22.12.0.',
        ],
        correta: 2,
        explicacao: 'A versão v6.12 pede Node.js 20.12+ e Python 3.10+, e o `uv` é necessário.',
      },
      {
        id: 'bmad-q3',
        enunciado: 'O que se invoca na ferramenta de IA depois da instalação do BMAD Method?',
        opcoes: [
          '`bmad-start` e `bmad-stop`.',
          '`bmad-init` e `bmad-run`.',
          '`bmad-plan` e `bmad-ship`.',
          '`bmad-build` e `bmad-help`.',
        ],
        correta: 3,
        explicacao: 'A fonte oficial indica a invocação de `bmad-build` e `bmad-help` na ferramenta de IA.',
      },
      {
        id: 'bmad-q4',
        enunciado: 'Como a fonte oficial descreve a linha v7 do BMAD Method na Data_Consulta?',
        opcoes: [
          'Versão estável, recomendada para produção.',
          'Preview alpha.',
          'Descontinuada.',
          'Disponível só como aplicativo móvel.',
        ],
        correta: 1,
        explicacao: 'A linha v7 está em preview alpha. A versão estável é a v6.12.',
      },
      {
        id: 'bmad-q5',
        enunciado: 'Qual é a licença do BMAD Method segundo a fonte oficial?',
        opcoes: [
          'Proprietária.',
          'GPL.',
          'MIT.',
          'A fonte não informa.',
        ],
        correta: 2,
        explicacao: 'A fonte oficial informa licença MIT.',
      },
    ],
  },

  'kiro': {
    moduloId: 'kiro',
    questoes: [
      {
        id: 'kiro-q1',
        enunciado: 'Quais arquivos uma spec de feature do Kiro gera?',
        opcoes: [
          '`requirements.md`, `design.md` e `tasks.md`.',
          '`proposal.md`, `specs/` e `tasks.md`.',
          '`spec.md`, `ledger.jsonl` e `handoff.md`.',
          '`STATE.md` e `CONTEXT.md`.',
        ],
        correta: 0,
        explicacao: 'As specs do Kiro geram `requirements.md`, `design.md` e `tasks.md`.',
      },
      {
        id: 'kiro-q2',
        enunciado: 'Qual arquivo substitui `requirements.md` em uma spec de bugfix do Kiro?',
        opcoes: [
          '`bug.md`',
          '`bugfix.md`',
          '`fix.md`',
          '`issue.md`',
        ],
        correta: 1,
        explicacao: 'Em specs de bugfix, o primeiro arquivo é `bugfix.md`.',
      },
      {
        id: 'kiro-q3',
        enunciado: 'Quais são os dois fluxos de feature do Kiro?',
        opcoes: [
          'Discuss e Ship.',
          'Propose e Archive.',
          'Requirements-First e Design-First.',
          'Claim e Handoff.',
        ],
        correta: 2,
        explicacao: 'O Kiro oferece os fluxos Requirements-First e Design-First, além do Quick Spec.',
      },
      {
        id: 'kiro-q4',
        enunciado: 'Como o Kiro executa as tarefas de uma spec?',
        opcoes: [
          'Uma por vez, sempre em ordem alfabética.',
          'Somente manualmente, sem agente.',
          'Apenas em um servidor remoto próprio do curso.',
          'Em ondas paralelas, conforme as dependências.',
        ],
        correta: 3,
        explicacao: 'A execução de tarefas ocorre em ondas paralelas conforme as dependências.',
      },
      {
        id: 'kiro-q5',
        enunciado: 'Qual comando instala o CLI do Kiro?',
        opcoes: [
          'npm install -g kiro',
          'curl -fsSL https://cli.kiro.dev/install | bash',
          'pipx install kiro-cli',
          'uv tool install kiro',
        ],
        correta: 1,
        explicacao: 'O CLI é instalado com `curl -fsSL https://cli.kiro.dev/install | bash`.',
      },
    ],
  },

  'gsd': {
    moduloId: 'gsd',
    questoes: [
      {
        id: 'gsd-q1',
        enunciado: 'Qual comando instala o GSD Core?',
        opcoes: [
          'pipx install gsd-core',
          'npx @opengsd/gsd-core@latest',
          'uv tool install gsd',
          'brew install gsd',
        ],
        correta: 1,
        explicacao: 'A instalação usa `npx @opengsd/gsd-core@latest`. O instalador pergunta o runtime e se a instalação é global ou local.',
      },
      {
        id: 'gsd-q2',
        enunciado: 'Qual comando inicia o GSD em um projeto novo?',
        opcoes: [
          '/gsd-onboard',
          '/gsd-ship',
          '/gsd-new-project',
          '/gsd-discuss',
        ],
        correta: 2,
        explicacao: 'Projeto novo começa com `/gsd-new-project`. Código existente começa com `/gsd-onboard`.',
      },
      {
        id: 'gsd-q3',
        enunciado: 'Qual comando inicia o GSD em um código já existente?',
        opcoes: [
          '/gsd-onboard',
          '/gsd-new-project',
          '/gsd-verify',
          '/gsd-plan',
        ],
        correta: 0,
        explicacao: 'Para código existente, a fonte oficial indica `/gsd-onboard`.',
      },
      {
        id: 'gsd-q4',
        enunciado: 'Quais são as cinco etapas do laço de cada fase no GSD?',
        opcoes: [
          'Propose, Apply, Review, Accept e Merge.',
          'Specify, Plan, Tasks, Implement e Converge.',
          'Explore, Propose, Apply, Archive e Update.',
          'Discuss, Plan, Execute, Verify e Ship.',
        ],
        correta: 3,
        explicacao: 'O laço é Discuss, Plan, Execute, Verify e Ship.',
      },
      {
        id: 'gsd-q5',
        enunciado: 'Quais artefatos o GSD cita na fonte oficial?',
        opcoes: [
          '`spec.md` e `ledger.jsonl`.',
          '`STATE.md` e `CONTEXT.md`.',
          '`proposal.md` e `tasks.md`.',
          '`.kittify/` e `.specify/`.',
        ],
        correta: 1,
        explicacao: 'Os artefatos citados são `STATE.md` e `CONTEXT.md`.',
      },
    ],
  },

  'spec-kitty': {
    moduloId: 'spec-kitty',
    questoes: [
      {
        id: 'spec-kitty-q1',
        enunciado: 'Quais pré-requisitos o Spec Kitty exige?',
        opcoes: [
          'Node.js 22 e npm.',
          'Python 3.10+ e `uv`.',
          'Python 3.11+, `pipx` e `git`.',
          'Apenas `git`.',
        ],
        correta: 2,
        explicacao: 'O Spec Kitty exige Python 3.11+, `pipx` e `git`.',
      },
      {
        id: 'spec-kitty-q2',
        enunciado: 'Qual comando instala a CLI do Spec Kitty?',
        opcoes: [
          'npm install -g spec-kitty',
          'uv tool install spec-kitty',
          'npx spec-kitty install',
          'pipx install spec-kitty-cli',
        ],
        correta: 3,
        explicacao: 'A instalação é feita com `pipx install spec-kitty-cli`.',
      },
      {
        id: 'spec-kitty-q3',
        enunciado: 'O que o `spec-kitty init` cria no projeto?',
        opcoes: [
          'A pasta `.specify/` apenas.',
          'A pasta `.kittify/` e os arquivos de comandos do agente, como `.claude/`.',
          'A pasta `openspec/changes/`.',
          'A pasta `.specweave/increments/`.',
        ],
        correta: 1,
        explicacao: 'O init cria `.kittify/` e os arquivos de comandos do agente escolhido, por exemplo `.claude/`.',
      },
      {
        id: 'spec-kitty-q4',
        enunciado: 'Onde cada work package roda no Spec Kitty?',
        opcoes: [
          'No mesmo diretório de trabalho, sem isolamento.',
          'Em um contêiner remoto obrigatório.',
          'Em seu próprio git worktree.',
          'Em um branch compartilhado por todos os work packages.',
        ],
        correta: 2,
        explicacao: 'Cada work package roda em seu próprio git worktree.',
      },
      {
        id: 'spec-kitty-q5',
        enunciado: 'Quem faz a revisão do trabalho no Spec Kitty e como se adiciona outro agente depois do init?',
        opcoes: [
          'Um revisor diferente do autor confere o trabalho. Outro agente entra com `spec-kitty agent config add <chave>`.',
          'O próprio autor revisa. Outro agente entra com `spec-kitty init --force`.',
          'Ninguém revisa. Outro agente entra com `pipx install`.',
          'Um servidor externo revisa. Outro agente entra com `spec-kitty agent remove`.',
        ],
        correta: 0,
        explicacao: 'A revisão é feita por um revisor diferente do autor, e `spec-kitty agent config add <chave>` adiciona um agente depois.',
      },
    ],
  },

  'specweave': {
    moduloId: 'specweave',
    questoes: [
      {
        id: 'specweave-q1',
        enunciado: 'Qual comando instala o SpecWeave?',
        opcoes: [
          'pipx install specweave',
          'npm install -g specweave',
          'uv tool install specweave',
          'curl -fsSL https://specweave.com/install | bash',
        ],
        correta: 1,
        explicacao: 'A instalação é feita com `npm install -g specweave`, seguida de `specweave init`.',
      },
      {
        id: 'specweave-q2',
        enunciado: 'Qual comando cria um incremento no SpecWeave?',
        opcoes: [
          'specweave init "<título>"',
          'specweave new "<título>"',
          'specweave create-increment "<título>"',
          'specweave task claim "<título>"',
        ],
        correta: 2,
        explicacao: 'O incremento é criado com `specweave create-increment "<título>"`, em `.specweave/increments/0001-<nome>/`.',
      },
      {
        id: 'specweave-q3',
        enunciado: 'Quais itens existem dentro de um incremento do SpecWeave?',
        opcoes: [
          '`requirements.md`, `design.md` e `tasks.md`.',
          '`proposal.md` e `specs/`.',
          '`STATE.md` e `CONTEXT.md`.',
          '`spec.md`, `ledger.jsonl`, `handoff.md` e a pasta `reports/`.',
        ],
        correta: 3,
        explicacao: 'O incremento contém `spec.md`, `ledger.jsonl`, `handoff.md` e `reports/`.',
      },
      {
        id: 'specweave-q4',
        enunciado: 'Qual é o ciclo de comandos do SpecWeave para executar tarefas e fechar o incremento?',
        opcoes: [
          'specweave task claim, specweave task done, specweave handoff, specweave pickup, specweave verify, specweave review e specweave complete.',
          'specweave plan, specweave build e specweave ship.',
          'specweave propose, specweave apply e specweave archive.',
          'specweave specify, specweave tasks e specweave merge.',
        ],
        correta: 0,
        explicacao: 'O ciclo documentado vai de `task claim` e `task done` até `handoff`, `pickup`, `verify`, `review` e `complete`.',
      },
      {
        id: 'specweave-q5',
        enunciado: 'Quando usar `specweave small-fix "<motivo>"`?',
        opcoes: [
          'Para criar um incremento completo de uma nova funcionalidade.',
          'Para uma correção pequena, em vez de abrir um incremento.',
          'Para instalar o CLI.',
          'Para gerar o certificado do curso.',
        ],
        correta: 1,
        explicacao: '`specweave small-fix` serve para correções pequenas, sem a criação de um incremento.',
      },
    ],
  },

  'complementares': {
    moduloId: 'complementares',
    questoes: [
      {
        id: 'complementares-q1',
        enunciado: 'Qual é o papel das ferramentas complementares no curso?',
        opcoes: [
          'Substituir as sete ferramentas de SDD.',
          'Ampliar o fluxo de trabalho com planejamento e orquestração de agentes.',
          'Servir como login do curso.',
          'Substituir o quiz de cada módulo.',
        ],
        correta: 1,
        explicacao: 'A lição trata de ferramentas complementares de planejamento e orquestração de agentes, que ampliam o fluxo com SDD.',
      },
      {
        id: 'complementares-q2',
        enunciado: 'O que a lição de complementares descreve para cada ferramenta citada?',
        opcoes: [
          'Somente o preço.',
          'Somente a data de criação.',
          'A finalidade, um caso de uso e a relação com as ferramentas de SDD.',
          'Somente o nome do autor.',
        ],
        correta: 2,
        explicacao: 'Para cada ferramenta complementar, a lição apresenta finalidade, caso de uso e relação com as ferramentas de SDD, com link oficial.',
      },
      {
        id: 'complementares-q3',
        enunciado: 'Por que cada ferramenta complementar traz um link oficial na lição?',
        opcoes: [
          'Para que o aluno confira as informações na fonte oficial.',
          'Para evitar que o aluno leia a lição.',
          'Para substituir o tutorial das sete ferramentas.',
          'Para registrar o progresso no servidor.',
        ],
        correta: 0,
        explicacao: 'O link oficial permite conferir os dados na fonte, como o curso faz com as ferramentas de SDD.',
      },
      {
        id: 'complementares-q4',
        enunciado: 'O módulo de complementares participa da Conclusão_Total do curso?',
        opcoes: [
          'Não, é opcional.',
          'Só o quiz participa.',
          'Só a lição participa.',
          'Sim, todos os módulos do catálogo participam.',
        ],
        correta: 3,
        explicacao: 'Nenhum módulo é opcional: tudo o que está no catálogo entra no cálculo da Conclusão_Total.',
      },
      {
        id: 'complementares-q5',
        enunciado: 'Qual é a Nota_Aprovação mínima para ser aprovado em um quiz?',
        opcoes: [
          '50%.',
          '60%.',
          '70%.',
          '100%.',
        ],
        correta: 2,
        explicacao: 'A Nota_Aprovação é de 70% de acertos. O quiz pode ser refeito sem limite de tentativas.',
      },
    ],
  },
};
