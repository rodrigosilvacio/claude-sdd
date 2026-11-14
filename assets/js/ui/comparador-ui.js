// Comparador interativo (Requisitos 9.1 a 9.4, 9.6 a 9.9, 9.13, 9.14, 9.16, 16.6, 18.7).
// Markup base: <div data-componente="comparador"></div>. Toda a interface é gerada aqui; sem JS a
// página mostra apenas o texto estático. Dados locais (módulos ES), sem rede e sem recursos externos.
// gráfico e cartões são importados dinamicamente: se falharem, a tabela continua (R9.16).
import { ferramentas } from '../../data/ferramentas.js';
import { eixos, notas } from '../../data/criterios.js';
import { MIN, MAX, alternar, tabelaVisivel, linhasTabela, recomendar } from '../core/comparador.js';
import { anunciar as anunciarPadrao } from './anuncio.js';

export const MSG_LIMITE = `Você já selecionou ${MAX} ferramentas, que é o limite. Desmarque uma para escolher outra.`;
export const MSG_MINIMO = `Selecione ao menos ${MIN} ferramentas para ver a comparação.`;

export const OPCOES_PERFIL = {
  tipo: {
    rotulo: 'Tipo de projeto',
    opcoes: [['web', 'Aplicação web'], ['api', 'API ou serviço'], ['cli', 'Ferramenta de linha de comando'], ['outro', 'Outro']],
  },
  equipe: {
    rotulo: 'Tamanho da equipe',
    opcoes: [['solo', 'Individual'], ['pequena', 'Pequena (2 a 5 pessoas)'], ['grande', 'Grande (6 ou mais pessoas)']],
  },
  base: {
    rotulo: 'Base de código',
    opcoes: [['novo', 'Projeto novo'], ['existente', 'Código existente']],
  },
};

export const anuncioGrafico = (n) => `Gráfico atualizado: ${n} ferramentas`;

function el(doc, tag, props = {}, filhos = []) {
  const e = doc.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'texto') e.textContent = v;
    else if (k === 'classe') e.className = v;
    else e.setAttribute(k, v);
  }
  for (const f of [].concat(filhos)) if (f != null) e.append(f);
  return e;
}

export function montarComparador(raiz, { anunciar, doc }) {
  if (raiz.getAttribute('data-comparador-ativo') === 'true') return null;
  raiz.setAttribute('data-comparador-ativo', 'true');
  raiz.textContent = '';

  let selecao = [];
  let modGrafico = null; // null: carregando; false: falhou
  let modCartao = null;

  // Seleção (checkboxes nativos, operáveis por teclado).
  const fs = el(doc, 'fieldset', { classe: 'comparador-selecao' }, [
    el(doc, 'legend', { texto: `Escolha de ${MIN} a ${MAX} ferramentas para comparar` }),
  ]);
  const caixas = ferramentas.map((f) => {
    const id = `cmp-${f.id}`;
    const input = el(doc, 'input', { type: 'checkbox', id, value: f.id });
    fs.append(el(doc, 'div', { classe: 'comparador-opcao' }, [input, ' ', el(doc, 'label', { for: id, texto: f.nome })]));
    return input;
  });
  const msg = el(doc, 'p', { classe: 'comparador-mensagem', id: 'cmp-mensagem', role: 'status' });
  const tabelaBox = el(doc, 'div', {
    classe: 'comparador-tabela', tabindex: '0', role: 'region', 'aria-label': 'Tabela de comparação das ferramentas',
  });
  const graficoBox = el(doc, 'div', { classe: 'comparador-grafico' });
  const cartoesBox = el(doc, 'div', { classe: 'comparador-cartoes' });

  // Perfil do projeto e recomendação.
  const perfilFs = el(doc, 'fieldset', { classe: 'comparador-perfil' }, [el(doc, 'legend', { texto: 'Perfil do seu projeto' })]);
  const selects = {};
  for (const [campo, def] of Object.entries(OPCOES_PERFIL)) {
    const id = `cmp-perfil-${campo}`;
    const sel = el(doc, 'select', { id, name: campo });
    sel.append(el(doc, 'option', { value: '', texto: 'Selecione' }));
    for (const [v, t] of def.opcoes) sel.append(el(doc, 'option', { value: v, texto: t }));
    selects[campo] = sel;
    perfilFs.append(el(doc, 'div', { classe: 'comparador-campo' }, [el(doc, 'label', { for: id, texto: def.rotulo }), ' ', sel]));
  }
  const recBox = el(doc, 'div', { classe: 'comparador-recomendacao', 'aria-live': 'polite' });

  raiz.append(fs, msg, tabelaBox, graficoBox, cartoesBox, perfilFs, recBox);

  const selecionadas = () => selecao.map((id) => ferramentas.find((f) => f.id === id)).filter(Boolean);

  function renderTabela() {
    tabelaBox.textContent = '';
    const lista = selecionadas();
    const t = el(doc, 'table', { classe: 'tabela-comparacao' });
    t.append(el(doc, 'caption', { texto: 'Comparação das ferramentas selecionadas' }));
    const tr = el(doc, 'tr', {}, [el(doc, 'th', { scope: 'col', texto: 'Critério' })]);
    for (const f of lista) tr.append(el(doc, 'th', { scope: 'col', texto: f.nome }));
    t.append(el(doc, 'thead', {}, [tr]));
    const corpo = el(doc, 'tbody');
    for (const l of linhasTabela(selecao, ferramentas)) {
      const linha = el(doc, 'tr', {}, [el(doc, 'th', { scope: 'row', texto: l.rotulo })]);
      for (const v of l.valores) linha.append(el(doc, 'td', { texto: v.texto }));
      corpo.append(linha);
    }
    // Data_Consulta por ferramenta (R9.15, R16.6).
    const dc = el(doc, 'tr', {}, [el(doc, 'th', { scope: 'row', texto: 'Data da consulta à fonte oficial' })]);
    for (const f of lista) dc.append(el(doc, 'td', { texto: f.dataConsulta || 'verificar na fonte' }));
    corpo.append(dc);
    t.append(corpo);
    tabelaBox.append(t);
  }

  function renderGrafico() {
    graficoBox.textContent = '';
    if (!modGrafico) { graficoBox.hidden = true; return; }
    try {
      const svg = modGrafico.radarSVG(selecao, notas, eixos, ferramentas, { tamanho: 360 });
      const alt = modGrafico.tabelaNotas(selecao, notas, eixos, ferramentas);
      graficoBox.innerHTML = `<div class="grafico-svg">${svg}</div>${alt}`; // markup gerado por funções puras com escape
      graficoBox.hidden = false;
      anunciar(anuncioGrafico(selecao.length));
    } catch (erro) {
      console.warn('Falha ao desenhar o gráfico:', erro);
      graficoBox.textContent = '';
      graficoBox.hidden = true;
    }
  }

  function renderCartoes() {
    cartoesBox.textContent = '';
    if (!modCartao || typeof modCartao.criarCartao !== 'function') return;
    for (const f of selecionadas()) {
      try {
        const c = modCartao.criarCartao(f, doc);
        if (typeof c === 'string') cartoesBox.insertAdjacentHTML('beforeend', c);
        else if (c) cartoesBox.append(c);
      } catch (erro) { console.warn('Falha ao criar cartão:', erro); }
    }
  }

  function renderRecomendacao() {
    recBox.textContent = '';
    const perfil = {};
    for (const [k, s] of Object.entries(selects)) perfil[k] = s.value;
    if (Object.values(perfil).some((v) => !v)) {
      recBox.append(el(doc, 'p', { texto: 'Informe o tipo de projeto, a equipe e a base de código para ver a recomendação.' }));
      return;
    }
    const lista = recomendar(perfil, ferramentas, notas);
    const ol = el(doc, 'ol', { classe: 'recomendacao-lista' });
    for (const r of lista) {
      const f = ferramentas.find((x) => x.id === r.id);
      ol.append(el(doc, 'li', {}, [el(doc, 'strong', { texto: f ? f.nome : r.id }), ': ', r.justificativa]));
    }
    recBox.append(el(doc, 'h3', { texto: 'Ferramentas mais adequadas ao seu perfil' }), ol);
  }

  function renderSelecao(erro) {
    for (const c of caixas) c.checked = selecao.includes(c.value);
    const visivel = tabelaVisivel(selecao);
    tabelaBox.hidden = !visivel;
    cartoesBox.hidden = !visivel;
    if (visivel) { renderTabela(); renderCartoes(); renderGrafico(); } else { graficoBox.hidden = true; graficoBox.textContent = ''; cartoesBox.textContent = ''; }
    const texto = erro === 'limite' ? MSG_LIMITE : (visivel ? '' : MSG_MINIMO);
    msg.textContent = texto;
    msg.setAttribute('data-tipo', erro === 'limite' ? 'limite' : (visivel ? 'ok' : 'minimo'));
    if (texto) anunciar(texto);
  }

  for (const c of caixas) {
    c.addEventListener('change', () => {
      const r = alternar(selecao, c.value);
      selecao = r.selecao;
      renderSelecao(r.erro);
    });
  }
  for (const s of Object.values(selects)) {
    s.addEventListener('change', () => {
      renderRecomendacao();
      if (recBox.querySelector('li')) anunciar('Recomendação atualizada');
    });
  }

  renderSelecao(null);
  renderRecomendacao();

  // Importações dinâmicas: falha oculta o gráfico (ou omite os cartões) e mantém a tabela.
  import('../core/grafico.js').then((m) => { modGrafico = m; }, (e) => { console.warn('Gráfico indisponível:', e); modGrafico = false; })
    .then(() => { if (tabelaVisivel(selecao)) renderGrafico(); });
  import('./cartao.js').then((m) => { modCartao = m; }, (e) => { console.warn('Cartões indisponíveis:', e); modCartao = false; })
    .then(() => { if (tabelaVisivel(selecao)) renderCartoes(); });

  return { selecao: () => selecao.slice() };
}

/**
 * @param {Element[]} elementos
 * @param {{anunciar?:(t:string)=>void, doc?:Document}} ctx
 */
export function ativar(elementos, ctx = {}) {
  const doc = ctx.doc ?? globalThis.document;
  const anunciar = ctx.anunciar ?? ((t) => anunciarPadrao(t, doc));
  for (const raiz of elementos) {
    try { montarComparador(raiz, { anunciar, doc }); } catch (erro) { console.warn('Falha ao ativar o Comparador:', erro); }
  }
}
