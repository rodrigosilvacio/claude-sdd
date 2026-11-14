// Lógica pura do Comparador (R9.1 a R9.7, R9.15). Sem DOM e sem localStorage.
export const MIN = 2;
export const MAX = 4;
export const NAO_INFORMADO = 'verificar na fonte';

export function alternar(selecao, id) {
  if (selecao.includes(id)) return { selecao: selecao.filter((x) => x !== id), erro: null };
  if (selecao.length >= MAX) return { selecao: selecao.slice(), erro: 'limite' };
  return { selecao: [...selecao, id], erro: null };
}

export const tabelaVisivel = (selecao) => selecao.length >= MIN && selecao.length <= MAX;

export const CRITERIOS = [
  { id: 'fluxo', rotulo: 'Fluxo de trabalho' },
  { id: 'curva', rotulo: 'Curva de aprendizado' },
  { id: 'integracao', rotulo: 'Integração com agentes de IA' },
  { id: 'formato', rotulo: 'Formato dos artefatos' },
  { id: 'licenca', rotulo: 'Licença' },
  { id: 'custo', rotulo: 'Custo' },
];

const textoOuNaoInformado = (v) => {
  if (v === null || v === undefined) return NAO_INFORMADO;
  const t = String(v).trim();
  return t === '' ? NAO_INFORMADO : t;
};

/** Uma linha por critério; cada linha traz um valor por ferramenta selecionada, na ordem da seleção. */
export function linhasTabela(selecao, ferramentas) {
  const porId = new Map(ferramentas.map((f) => [f.id, f]));
  const escolhidas = selecao.map((id) => porId.get(id)).filter(Boolean);
  return CRITERIOS.map((c) => ({
    id: c.id,
    rotulo: c.rotulo,
    valores: escolhidas.map((f) => {
      const bruto = f.atributos && c.id in f.atributos ? f.atributos[c.id] : f[c.id];
      return { ferramenta: f.id, texto: textoOuNaoInformado(bruto) };
    }),
  }));
}

const ROTULOS = {
  fluxo: 'fluxo de trabalho',
  curva: 'curva de aprendizado',
  integracao: 'integração com agentes de IA',
  formato: 'formato dos artefatos',
  equipe: 'adoção em equipe',
};
const EIXOS = Object.keys(ROTULOS);

/** Pesos por eixo conforme o Perfil_Projeto {tipo, equipe, base}. */
export function pesos(perfil) {
  const w = { fluxo: 1, curva: 1, integracao: 1, formato: 1, equipe: 1 };
  if (perfil.equipe === 'grande') w.equipe += 2;
  else if (perfil.equipe === 'solo') w.curva += 2;
  else if (perfil.equipe === 'pequena') w.equipe += 1;
  if (perfil.base === 'novo') w.fluxo += 2;
  else if (perfil.base === 'existente') w.integracao += 1;
  if (perfil.tipo === 'web') w.integracao += 1;
  else if (perfil.tipo === 'api' || perfil.tipo === 'cli') w.formato += 1;
  return w;
}

const BONUS_EXISTENTE = 2;
const trataCodigoExistente = (f) =>
  [...(f.comandosPermitidos || []), ...Object.values(f.atributos || {}), f.proposito || '']
    .some((t) => typeof t === 'string' && /onboard|existente|brownfield|init.*existing/i.test(t));

/** Devolve as 3 melhores: ordem por pontuação desc e id asc. */
export function recomendar(perfil, ferramentas, notas) {
  const w = pesos(perfil);
  const lista = ferramentas
    .filter((f) => notas[f.id])
    .map((f) => {
      const n = notas[f.id];
      let pontuacao = EIXOS.reduce((s, e) => s + w[e] * (Number(n[e]) || 0), 0);
      const bonus = perfil.base === 'existente' && trataCodigoExistente(f);
      if (bonus) pontuacao += BONUS_EXISTENTE;
      return { id: f.id, nome: f.nome, pontuacao, n, bonus };
    });
  lista.sort((a, b) => b.pontuacao - a.pontuacao || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return lista.slice(0, 3).map((r) => ({
    id: r.id,
    pontuacao: r.pontuacao,
    justificativa: justificar(r, w),
  }));
}

function justificar(r, w) {
  const destaques = EIXOS.map((e, i) => ({ e, i, v: w[e] * (Number(r.n[e]) || 0) }))
    .sort((a, b) => b.v - a.v || a.i - b.i)
    .slice(0, 2)
    .map((d) => `${ROTULOS[d.e]} (nota ${r.n[d.e]} de 5)`);
  const extra = r.bonus ? ' A fonte oficial também trata de projetos com código existente.' : '';
  return `${r.nome} pontua ${r.pontuacao} para o seu perfil, sobretudo em ${destaques[0]} e ${destaques[1]}.${extra}`;
}
