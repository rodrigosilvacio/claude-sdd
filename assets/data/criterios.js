// Avaliação editorial do curso (R9.10, R9.12, R15.9).
// Cada nota é um inteiro de 0 a 5, atribuída com base apenas nos fatos das Fontes_Oficiais
// consultadas em 14/11/2026. Não usa argumentos comparativos de terceiros.
// `niveis[n]` descreve o critério da nota n.

export const eixos = [
  {
    id: 'fluxo',
    rotulo: 'Fluxo de trabalho',
    criterio: 'Quantidade de etapas documentadas na fonte oficial e presença de etapa explícita de revisão, verificação ou aceite.',
    niveis: [
      'Nenhum ciclo de etapas documentado.',
      'Uma etapa ou comando documentado.',
      'Duas etapas documentadas.',
      'Três ou quatro etapas documentadas.',
      'Cinco etapas documentadas, ou seis ou mais sem etapa explícita de revisão, verificação ou aceite.',
      'Seis ou mais etapas documentadas, incluindo etapa explícita de revisão, verificação ou aceite.',
    ],
  },
  {
    id: 'curva',
    rotulo: 'Curva de aprendizado',
    criterio: 'Quantidade de pré-requisitos e passos de instalação listados na fonte oficial antes do primeiro uso.',
    niveis: [
      'Pré-requisitos não documentados.',
      'Quatro ou mais pré-requisitos listados.',
      'Três pré-requisitos listados.',
      'Dois pré-requisitos listados.',
      'Um pré-requisito (um runtime) e instalação por um comando.',
      'Instalação por um comando, sem runtime de linguagem a instalar antes.',
    ],
  },
  {
    id: 'integracao',
    rotulo: 'Integração com agentes de IA',
    criterio: 'Quantidade de agentes de IA que a fonte oficial informa como suportados.',
    niveis: [
      'Nenhum agente informado.',
      'Um agente informado.',
      'De dois a quatro agentes informados.',
      'Menos de nove agentes listados ou quantidade não informada na fonte consultada.',
      'De nove a vinte agentes listados.',
      'Mais de vinte agentes informados.',
    ],
  },
  {
    id: 'formato',
    rotulo: 'Formato dos artefatos',
    criterio: 'Estrutura dos artefatos descrita na fonte oficial: Markdown simples, estrutura padronizada de requisitos e registros verificáveis.',
    niveis: [
      'Formato dos artefatos não documentado.',
      'Artefatos sem formato definido.',
      'Artefato único em Markdown.',
      'Markdown com um arquivo por fase.',
      'Markdown com estrutura padronizada de requisitos e cenários (por exemplo, WHEN/THEN).',
      'Markdown com critérios marcáveis e registros adicionais de execução e verificação (por exemplo, JSON ou relatórios).',
    ],
  },
  {
    id: 'equipe',
    rotulo: 'Adoção em equipe',
    criterio: 'Mecanismos de coordenação documentados na fonte oficial: execução paralela ou isolada, handoff entre agentes ou pessoas, reivindicação de tarefa e revisão por revisor diferente do autor.',
    niveis: [
      'Nenhum uso em equipe documentado.',
      'Artefatos apenas locais.',
      'Artefatos versionáveis no repositório, sem mecanismo de coordenação documentado.',
      'Artefatos no repositório e um mecanismo de coordenação documentado.',
      'Artefatos no repositório e dois mecanismos de coordenação documentados.',
      'Artefatos no repositório e três ou mais mecanismos de coordenação documentados.',
    ],
  },
];

export const notas = {
  'openspec':   { fluxo: 3, curva: 4, integracao: 5, formato: 4, equipe: 2 },
  'spec-kit':   { fluxo: 4, curva: 3, integracao: 3, formato: 3, equipe: 2 },
  'bmad':       { fluxo: 3, curva: 2, integracao: 3, formato: 3, equipe: 2 },
  'kiro':       { fluxo: 3, curva: 5, integracao: 3, formato: 3, equipe: 3 },
  'gsd':        { fluxo: 4, curva: 4, integracao: 4, formato: 3, equipe: 2 },
  'spec-kitty': { fluxo: 5, curva: 2, integracao: 5, formato: 3, equipe: 4 },
  'specweave':  { fluxo: 5, curva: 4, integracao: 4, formato: 5, equipe: 5 },
};

export const avisoEditorial =
  'As notas de 0 a 5 são uma avaliação editorial do curso, baseada nos fatos das fontes oficiais consultadas em 14/11/2026 e nos critérios listados para cada eixo. Não são avaliação de terceiros.';
