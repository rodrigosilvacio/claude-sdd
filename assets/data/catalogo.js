// Catálogo do Curso_SDD: fonte do percentual, pendências, vizinhas e Conclusão_Total.
// Todo item listado aqui é obrigatório (sem itens opcionais e sem Tessl).
// URLs relativas à raiz do site (sem barra inicial), no padrão `modulos/<pasta>/<arquivo>.html`.
//
// Formato exportado (consumido por core/progresso.js):
//   catalogo = { cargaHorariaHoras, modulos, checklists }
//   Item   = { id, titulo, tipo: 'licao'|'tutorial'|'exercicio'|'quiz', url, minutos }
//   Modulo = { id, titulo, pasta, url, ferramenta?, itens: Item[] }
//   checklists = { [ferramentaId]: { id: '<ferramenta>/c<N>', texto }[] }
// Ids: licao:<modulo>/<slug>, exercicio:<ferramenta>, quiz:<modulo>.

export const cargaHorariaHoras = 24; // valor fixo e estimado (R14.10, R2.4)

/** Ferramentas, na ordem dos módulos. */
const FERRAMENTAS = [
  { id: 'openspec', nome: 'OpenSpec', pasta: '02-openspec' },
  { id: 'spec-kit', nome: 'GitHub Spec Kit', pasta: '03-spec-kit' },
  { id: 'bmad', nome: 'BMAD Method', pasta: '04-bmad' },
  { id: 'kiro', nome: 'AWS Kiro', pasta: '05-kiro' },
  { id: 'gsd', nome: 'GSD', pasta: '06-gsd' },
  { id: 'spec-kitty', nome: 'Spec Kitty', pasta: '07-spec-kitty' },
  { id: 'specweave', nome: 'SpecWeave', pasta: '08-specweave' },
];

function moduloFerramenta({ id, nome, pasta }) {
  const base = `modulos/${pasta}`;
  return {
    id,
    titulo: nome,
    pasta,
    url: `${base}/index.html`,
    ferramenta: id,
    itens: [
      { id: `licao:${id}/tutorial`, titulo: `Tutorial de ${nome}`, tipo: 'tutorial', url: `${base}/tutorial.html`, minutos: 80 },
      { id: `exercicio:${id}`, titulo: `Exercício de ${nome}`, tipo: 'exercicio', url: `${base}/exercicio.html`, minutos: 90 },
      { id: `quiz:${id}`, titulo: `Quiz de ${nome}`, tipo: 'quiz', url: `${base}/quiz.html`, minutos: 15 },
    ],
  };
}

export const modulos = [
  {
    id: 'fundamentos',
    titulo: 'Fundamentos de SDD',
    pasta: '01-fundamentos',
    url: 'modulos/01-fundamentos/index.html',
    itens: [
      { id: 'licao:fundamentos/o-que-e-sdd', titulo: 'O que é SDD', tipo: 'licao', url: 'modulos/01-fundamentos/01-o-que-e-sdd.html', minutos: 30 },
      { id: 'licao:fundamentos/projeto-exemplo', titulo: 'Projeto de exemplo', tipo: 'licao', url: 'modulos/01-fundamentos/02-projeto-exemplo.html', minutos: 30 },
      { id: 'quiz:fundamentos', titulo: 'Quiz de fundamentos', tipo: 'quiz', url: 'modulos/01-fundamentos/quiz.html', minutos: 15 },
    ],
  },
  ...FERRAMENTAS.map(moduloFerramenta),
  {
    id: 'complementares',
    titulo: 'Ferramentas complementares',
    pasta: '09-complementares',
    url: 'modulos/09-complementares/index.html',
    itens: [
      { id: 'licao:complementares/ferramentas-complementares', titulo: 'Ferramentas complementares de planejamento e orquestração', tipo: 'licao', url: 'modulos/09-complementares/ferramentas-complementares.html', minutos: 45 },
      { id: 'quiz:complementares', titulo: 'Quiz de ferramentas complementares', tipo: 'quiz', url: 'modulos/09-complementares/quiz.html', minutos: 15 },
    ],
  },
];

const lista = (ferramenta, textos) =>
  textos.map((texto, i) => ({ id: `${ferramenta}/c${i + 1}`, texto }));

/** Checklists redigidos com comandos e artefatos da Fonte_Oficial ("Fatos extraídos"). */
export const checklists = {
  openspec: lista('openspec', [
    'Confirmar Node.js 22.12.0 ou superior e instalar com `npm install -g @fission-ai/openspec@latest`.',
    'Executar `openspec init` na pasta do Projeto_Exemplo.',
    'Pedir ao agente `/openspec-propose` com a descrição do Projeto_Exemplo.',
    'Conferir em `openspec/changes/<nome>/` os arquivos `proposal.md`, `specs/`, `design.md` e `tasks.md`.',
    'Executar `/openspec-apply-change` para implementar as tarefas de `tasks.md`.',
    'Executar `/openspec-archive-change` e conferir a mudança em `openspec/changes/archive/`.',
  ]),
  'spec-kit': lista('spec-kit', [
    'Confirmar Python 3.11+ e `uv` e instalar com `uv tool install specify-cli`.',
    'Criar o projeto com `specify init my-project --integration copilot`.',
    'Conferir a pasta `.specify/` criada no projeto.',
    'No chat do agente, executar `/speckit-constitution` e `/speckit-specify` sobre o Projeto_Exemplo.',
    'Executar `/speckit-plan` e `/speckit-tasks` para gerar plano e tarefas.',
    'Executar `/speckit-implement` e `/speckit-converge`, repetindo até a convergência.',
  ]),
  bmad: lista('bmad', [
    'Confirmar Node.js 20.12+, Python 3.10+ e `uv`.',
    'Instalar a versão estável v6.12 com `npx bmad-method install`.',
    'Invocar `bmad-help` na ferramenta de IA para ver o próximo passo.',
    'Invocar `bmad-build` na ferramenta de IA para construir o Projeto_Exemplo.',
    'Conferir os módulos oficiais instalados (como BMad Builder e Test Architect).',
  ]),
  kiro: lista('kiro', [
    'Instalar o CLI com `curl -fsSL https://cli.kiro.dev/install | bash` ou abrir o Kiro na IDE.',
    'Criar uma spec para o Projeto_Exemplo pelo fluxo Requirements-First.',
    'Conferir o arquivo `requirements.md` gerado.',
    'Conferir o arquivo `design.md` gerado.',
    'Conferir o arquivo `tasks.md` gerado e executar uma tarefa.',
    'Comparar o fluxo Design-First e o Quick Spec com o fluxo Requirements-First.',
  ]),
  gsd: lista('gsd', [
    'Executar `npx @opengsd/gsd-core@latest` e escolher o runtime e a instalação global ou local.',
    'Iniciar o Projeto_Exemplo com `/gsd-new-project`.',
    'Percorrer a etapa Discuss e a etapa Plan de uma fase.',
    'Percorrer as etapas Execute e Verify da mesma fase.',
    'Concluir a etapa Ship e conferir `STATE.md` e `CONTEXT.md`.',
  ]),
  'spec-kitty': lista('spec-kitty', [
    'Instalar o CLI com `pipx install spec-kitty-cli` (Python 3.11+, `pipx` e `git`).',
    'Executar `spec-kitty init my-project --ai claude` com uma chave `--ai`.',
    'Conferir a pasta `.kittify/` e os arquivos de comandos do agente criados.',
    'Executar `/spec-kitty.specify` sobre o Projeto_Exemplo.',
    'Gerar o plano com `/spec-kitty.plan` e as tarefas com `/spec-kitty.tasks`.',
    'Executar `/spec-kitty.review` com um revisor diferente do autor antes de `/spec-kitty.merge`.',
  ]),
  specweave: lista('specweave', [
    'Instalar o CLI com `npm install -g specweave`.',
    'Executar `specweave init` na pasta do Projeto_Exemplo.',
    'Criar um incremento com `specweave create-increment "<título>"`.',
    'Marcar ao menos um critério `AC-01` em `spec.md`.',
    'Registrar uma tarefa com `specweave task claim T-01` e `specweave task done T-01 --run "npm test"`.',
    'Fechar o incremento com `specweave verify` e `specweave complete`.',
  ]),
};

/** Objeto único recebido pelo Gerenciador_Progresso. */
export const catalogo = { cargaHorariaHoras, modulos, checklists };

export default catalogo;
