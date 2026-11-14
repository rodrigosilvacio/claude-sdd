// Gráfico_Comparador: funções puras que devolvem markup (strings). Sem DOM, rede ou armazenamento.
// Escala fixa de 0 a 5 (R9.10). Séries distinguidas por cor, traço e forma do marcador (R18.5).
import { avisoEditorial } from '../../data/criterios.js';

export const ESCALA_MAX = 5;
export const ANEIS = 5;
const TRACOS = ['none', '8 4', '2 4', '10 3 2 3'];
const FORMAS = ['circulo', 'quadrado', 'triangulo', 'losango'];
const NOME_FORMA = { circulo: 'círculo', quadrado: 'quadrado', triangulo: 'triângulo', losango: 'losango' };

const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const num = (n) => String(Math.round(n * 100) / 100);

/** Nota válida (0 a 5) ou null quando ausente. */
function nota(notas, id, eixo) {
  const v = notas && notas[id] ? notas[id][eixo] : undefined;
  return typeof v === 'number' && Number.isFinite(v) ? Math.min(ESCALA_MAX, Math.max(0, v)) : null;
}

function series(selecao, ferramentas) {
  return selecao
    .map((id) => ferramentas.find((f) => f.id === id))
    .filter(Boolean)
    .slice(0, 4);
}

function marcador(forma, x, y, r, cor, extra = '') {
  const a = `fill="${esc(cor)}" stroke="#ffffff" stroke-width="1" ${extra}`;
  switch (forma) {
    case 'quadrado':
      return `<rect x="${num(x - r)}" y="${num(y - r)}" width="${num(2 * r)}" height="${num(2 * r)}" ${a}/>`;
    case 'triangulo':
      return `<polygon points="${num(x)},${num(y - r - 1)} ${num(x + r + 1)},${num(y + r)} ${num(x - r - 1)},${num(y + r)}" ${a}/>`;
    case 'losango':
      return `<polygon points="${num(x)},${num(y - r - 1)} ${num(x + r + 1)},${num(y)} ${num(x)},${num(y + r + 1)} ${num(x - r - 1)},${num(y)}" ${a}/>`;
    default:
      return `<circle cx="${num(x)}" cy="${num(y)}" r="${num(r)}" ${a}/>`;
  }
}

function resumo(lista, notas, eixos) {
  return lista
    .map((f) => {
      const partes = eixos.map((e) => {
        const v = nota(notas, f.id, e.id);
        return `${e.rotulo} ${v === null ? 'não informada' : v}`;
      });
      return `${f.nome}: ${partes.join(', ')}`;
    })
    .join('. ');
}

function legenda(lista, x0, y0, largura) {
  const linhaH = 24;
  return lista
    .map((f, i) => {
      const y = y0 + i * linhaH;
      const cor = f.identidade.cor;
      const tr = TRACOS[i];
      return (
        `<g data-legenda="${esc(f.id)}">` +
        `<image href="${esc(f.identidade.icone)}" x="${x0}" y="${y - 10}" width="20" height="20"/>` +
        `<line x1="${x0 + 26}" y1="${y}" x2="${x0 + 56}" y2="${y}" stroke="${esc(cor)}" stroke-width="2"` +
        `${tr === 'none' ? '' : ` stroke-dasharray="${tr}"`}/>` +
        marcador(FORMAS[i], x0 + 41, y, 4, cor) +
        `<text x="${x0 + 64}" y="${y + 4}" font-size="13" fill="#1a1a1a">${esc(f.nome)} (${NOME_FORMA[FORMAS[i]]})</text>` +
        `</g>`
      );
    })
    .join('');
}

/**
 * Radar com uma série por ferramenta.
 * @returns {string} markup SVG
 */
export function radarSVG(selecao, notas, eixos, ferramentas, opts = { tamanho: 360 }) {
  const tam = (opts && opts.tamanho) || 360;
  const lista = series(selecao, ferramentas);
  const n = eixos.length;
  const c = tam / 2;
  const R = tam * 0.34;
  const ang = (i) => (-90 + (360 / n) * i) * (Math.PI / 180);
  const ponto = (i, v) => [c + R * (v / ESCALA_MAX) * Math.cos(ang(i)), c + R * (v / ESCALA_MAX) * Math.sin(ang(i))];

  let g = '';
  // Anéis (1 a 5), com rótulo numérico.
  for (let k = 1; k <= ANEIS; k++) {
    const pts = eixos.map((_, i) => ponto(i, (ESCALA_MAX / ANEIS) * k).map(num).join(',')).join(' ');
    g += `<polygon class="anel" data-anel="${k}" points="${pts}" fill="none" stroke="#767676" stroke-width="1"/>`;
    const [lx, ly] = ponto(0, (ESCALA_MAX / ANEIS) * k);
    g += `<text x="${num(lx + 4)}" y="${num(ly + 3)}" font-size="10" fill="#444444">${k}</text>`;
  }
  // Eixos e rótulos.
  eixos.forEach((e, i) => {
    const [x, y] = ponto(i, ESCALA_MAX);
    const [lx, ly] = [c + (R + 14) * Math.cos(ang(i)), c + (R + 14) * Math.sin(ang(i))];
    const cos = Math.cos(ang(i));
    const anchor = Math.abs(cos) < 0.2 ? 'middle' : cos > 0 ? 'start' : 'end';
    g += `<line x1="${c}" y1="${c}" x2="${num(x)}" y2="${num(y)}" stroke="#767676" stroke-width="1"/>`;
    g += `<text x="${num(lx)}" y="${num(ly + 4)}" font-size="12" text-anchor="${anchor}" fill="#1a1a1a">${esc(e.rotulo)}</text>`;
  });
  // Séries.
  lista.forEach((f, i) => {
    const cor = f.identidade.cor;
    const pts = eixos.map((e, k) => ponto(k, nota(notas, f.id, e.id) ?? 0).map(num).join(',')).join(' ');
    const tr = TRACOS[i];
    g +=
      `<polygon data-ferramenta="${esc(f.id)}" points="${pts}" fill="${esc(cor)}" fill-opacity="0.12"` +
      ` stroke="${esc(cor)}" stroke-width="2"${tr === 'none' ? '' : ` stroke-dasharray="${tr}"`}/>`;
    eixos.forEach((e, k) => {
      const [x, y] = ponto(k, nota(notas, f.id, e.id) ?? 0);
      g += marcador(FORMAS[i], x, y, 4, cor, `data-marcador="${esc(f.id)}"`);
    });
  });

  const legY = tam + 8;
  const alt = tam + 16 + lista.length * 24;
  const titulo = 'Gráfico radar de comparação das ferramentas (escala de 0 a 5)';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${tam} ${alt}" width="${tam}" height="${alt}" role="img" aria-labelledby="grafico-titulo grafico-desc">` +
    `<title id="grafico-titulo">${esc(titulo)}</title>` +
    `<desc id="grafico-desc">${esc(resumo(lista, notas, eixos))}. Avaliação editorial do curso.</desc>` +
    g +
    legenda(lista, 8, legY + 10, tam) +
    `</svg>`
  );
}

/**
 * Barras agrupadas (opcional): um grupo por eixo, uma barra por ferramenta.
 * @returns {string} markup SVG
 */
export function barrasSVG(selecao, notas, eixos, ferramentas, opts = { tamanho: 360 }) {
  const larg = (opts && opts.tamanho) || 360;
  const lista = series(selecao, ferramentas);
  const m = { e: 40, d: 10, t: 14, b: 56 };
  const altPlot = 200;
  const plotL = larg - m.e - m.d;
  const grupoL = plotL / eixos.length;
  const barraL = Math.max(4, Math.min(24, (grupoL - 8) / Math.max(1, lista.length)));
  const y0 = m.t + altPlot;
  let g = '';
  for (let k = 0; k <= ESCALA_MAX; k++) {
    const y = y0 - (altPlot * k) / ESCALA_MAX;
    g += `<line x1="${m.e}" y1="${num(y)}" x2="${larg - m.d}" y2="${num(y)}" stroke="#767676" stroke-width="1"/>`;
    g += `<text x="${m.e - 6}" y="${num(y + 4)}" font-size="10" text-anchor="end" fill="#444444">${k}</text>`;
  }
  eixos.forEach((e, k) => {
    const gx = m.e + k * grupoL + (grupoL - barraL * lista.length) / 2;
    lista.forEach((f, i) => {
      const v = nota(notas, f.id, e.id) ?? 0;
      const h = (altPlot * v) / ESCALA_MAX;
      const cor = f.identidade.cor;
      const tr = TRACOS[i];
      g +=
        `<rect data-ferramenta="${esc(f.id)}" x="${num(gx + i * barraL)}" y="${num(y0 - h)}" width="${num(barraL)}" height="${num(h)}"` +
        ` fill="${esc(cor)}" fill-opacity="0.35" stroke="${esc(cor)}" stroke-width="2"${tr === 'none' ? '' : ` stroke-dasharray="${tr}"`}/>`;
      g += marcador(FORMAS[i], gx + i * barraL + barraL / 2, y0 - h, 3, cor);
    });
    g += `<text x="${num(m.e + k * grupoL + grupoL / 2)}" y="${y0 + 16}" font-size="10" text-anchor="middle" fill="#1a1a1a">${esc(e.rotulo)}</text>`;
  });
  const legY = y0 + m.b;
  const alt = legY + lista.length * 24 + 4;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${larg} ${alt}" width="${larg}" height="${alt}" role="img" aria-labelledby="grafico-titulo grafico-desc">` +
    `<title id="grafico-titulo">Gráfico de barras de comparação das ferramentas (escala de 0 a 5)</title>` +
    `<desc id="grafico-desc">${esc(resumo(lista, notas, eixos))}. Avaliação editorial do curso.</desc>` +
    g +
    legenda(lista, 8, legY, larg) +
    `</svg>`
  );
}

/**
 * Alternativa_Textual: tabela com as mesmas notas, aviso editorial e critérios de cada eixo.
 * @returns {string} markup HTML
 */
export function tabelaNotas(selecao, notas, eixos, ferramentas) {
  const lista = series(selecao, ferramentas);
  const cab = lista.map((f) => `<th scope="col">${esc(f.nome)}</th>`).join('');
  const linhas = eixos
    .map((e) => {
      const cel = lista
        .map((f) => {
          const v = nota(notas, f.id, e.id);
          return `<td>${v === null ? 'verificar na fonte' : v}</td>`;
        })
        .join('');
      return `<tr><th scope="row">${esc(e.rotulo)}</th>${cel}</tr>`;
    })
    .join('');
  const criterios = eixos
    .map((e) => `<dt>${esc(e.rotulo)}</dt><dd>${esc(e.criterio)}</dd>`)
    .join('');
  return (
    `<div class="notas-grafico">` +
    `<p class="aviso-editorial">${esc(avisoEditorial)}</p>` +
    `<table class="tabela-notas"><caption>Notas de 0 a 5 por critério (avaliação editorial do curso)</caption>` +
    `<thead><tr><th scope="col">Critério</th>${cab}</tr></thead><tbody>${linhas}</tbody></table>` +
    `<h4>Critérios das notas</h4><dl class="criterios-notas">${criterios}</dl>` +
    `</div>`
  );
}
