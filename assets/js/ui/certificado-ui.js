// UI do Certificado (Requisito 14). Todo texto vindo do aluno é escrito com textContent;
// innerHTML nunca é usado. Ganchos opcionais dentro do elemento [data-componente="certificado"]:
// [data-certificado="percentual|pendencias|form|nome|gerar|erro|resultado|imprimir"].
// Elementos ausentes são criados.
import { emitir, TITULO_CURSO, DECLARACAO } from '../core/certificado.js';
import { conclusaoTotal, pendencias, percentual } from '../core/progresso.js';

export const ANUNCIO_GERADO = 'Certificado gerado';
export const GRUPOS = [
  ['licoes', 'Lições pendentes'],
  ['exercicios', 'Exercícios pendentes'],
  ['quizzes', 'Quizzes pendentes'],
];

/** Texto "Progresso: N%" (R14.2). */
export const textoPercentual = (pct) => `Progresso: ${pct}%`;

function achar(raiz, doc, nome, tag, classe, pai) {
  let el = raiz.querySelector(`[data-certificado="${nome}"]`);
  if (!el) {
    el = doc.createElement(tag);
    el.setAttribute('data-certificado', nome);
    if (classe) el.className = classe;
    (pai || raiz).appendChild(el);
  }
  return el;
}

/** Preenche a lista de pendências somente com textContent e links relativos do catálogo. */
export function pintarPendencias(container, pend, doc) {
  container.textContent = '';
  for (const [chave, rotulo] of GRUPOS) {
    const itens = pend[chave] || [];
    if (!itens.length) continue;
    const h = doc.createElement('h3');
    h.textContent = rotulo;
    const ul = doc.createElement('ul');
    for (const it of itens) {
      const li = doc.createElement('li');
      const a = doc.createElement('a');
      a.setAttribute('href', it.url);
      a.textContent = it.titulo;
      li.appendChild(a);
      ul.appendChild(li);
    }
    container.append(h, ul);
  }
}

/** Escreve o modelo no contêiner do certificado (R14.8, R14.10, R14.11). */
export function pintarCertificado(el, modelo, doc) {
  el.textContent = '';
  const campo = (tag, classe, texto) => {
    const e = doc.createElement(tag);
    e.className = classe;
    e.textContent = texto;
    el.appendChild(e);
  };
  campo('h2', 'certificado-titulo', modelo.titulo || TITULO_CURSO);
  campo('p', 'certificado-texto', 'Certificamos a participação de');
  campo('p', 'certificado-nome', modelo.nome);
  campo('p', 'certificado-carga', `Carga horária estimada: ${modelo.cargaHoraria} horas`);
  campo('p', 'certificado-data', `Data de emissão: ${modelo.data}`);
  campo('p', 'certificado-declaracao', modelo.declaracao || DECLARACAO);
}

export const PNG_LARGURA = 1754;
export const PNG_ALTURA = 1240;
export const PNG_NOME_ARQUIVO = 'certificado-sdd.png';

/** Contexto 2D do canvas, ou null se o navegador não suporta canvas (R14.14). */
export function contexto2d(canvas) {
  try {
    if (!canvas || typeof canvas.getContext !== 'function') return null;
    return canvas.getContext('2d') || null;
  } catch { return null; }
}

/** Quebra o texto em linhas que cabem em maxLargura (medido pelo próprio contexto). */
function quebrar(ctx, texto, maxLargura) {
  const linhas = [];
  let atual = '';
  for (const palavra of String(texto).split(' ')) {
    const tent = atual ? `${atual} ${palavra}` : palavra;
    if (atual && ctx.measureText(tent).width > maxLargura) { linhas.push(atual); atual = palavra; } else atual = tent;
  }
  if (atual) linhas.push(atual);
  return linhas;
}

/** Desenha o certificado com fillText (o nome entra como texto, sem HTML). R14.13. */
export function desenharCertificado(canvas, modelo) {
  const ctx = contexto2d(canvas);
  if (!ctx) return false;
  const L = PNG_LARGURA, A = PNG_ALTURA, cx = L / 2;
  canvas.width = L; canvas.height = A;
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, L, A);
  ctx.strokeStyle = '#000000'; ctx.lineWidth = 6; ctx.strokeRect(60, 60, L - 120, A - 120);
  ctx.lineWidth = 2; ctx.strokeRect(80, 80, L - 160, A - 160);
  ctx.fillStyle = '#000000'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const fonte = (px, peso = '400') => `${peso} ${px}px sans-serif`;
  ctx.font = fonte(64, '700'); ctx.fillText(modelo.titulo || TITULO_CURSO, cx, 260, L - 300);
  ctx.font = fonte(40); ctx.fillText('Certificamos a participação de', cx, 420);
  let px = 84;
  ctx.font = fonte(px, '700');
  while (px > 24 && ctx.measureText(modelo.nome).width > L - 300) { px -= 4; ctx.font = fonte(px, '700'); }
  ctx.fillText(modelo.nome, cx, 560, L - 300);
  ctx.font = fonte(36);
  ctx.fillText(`Carga horária estimada: ${modelo.cargaHoraria} horas`, cx, 720);
  ctx.fillText(`Data de emissão: ${modelo.data}`, cx, 790);
  ctx.font = fonte(28);
  const decl = quebrar(ctx, modelo.declaracao || DECLARACAO, L - 300);
  decl.forEach((l, i) => ctx.fillText(l, cx, 980 + i * 42));
  return true;
}

/**
 * @param {Iterable<Element>} elementos
 * @param {{gerenciador:object, catalogo:object, anunciar?:Function, doc?:Document, win?:Window}} ctx
 * @returns {() => void} remove assinaturas e ouvintes
 */
export function ativar(elementos, ctx = {}) {
  const { gerenciador, catalogo, anunciar } = ctx;
  const limpezas = [];
  if (!gerenciador || !catalogo) return () => {};

  for (const raiz of elementos || []) {
    const doc = ctx.doc || raiz.ownerDocument;
    const win = ctx.win || doc.defaultView;

    const pct = achar(raiz, doc, 'percentual', 'p', 'certificado-percentual');
    const lista = achar(raiz, doc, 'pendencias', 'div', 'certificado-pendencias');
    const form = achar(raiz, doc, 'form', 'div', 'certificado-form');
    const rotulo = form.querySelector('label') || (() => {
      const l = doc.createElement('label'); l.textContent = 'Nome completo'; form.appendChild(l); return l;
    })();
    const nome = form.querySelector('[data-certificado="nome"]') || (() => {
      const i = doc.createElement('input');
      i.setAttribute('type', 'text'); i.setAttribute('data-certificado', 'nome');
      i.setAttribute('autocomplete', 'name'); form.appendChild(i); return i;
    })();
    if (nome.id && !rotulo.getAttribute('for')) rotulo.setAttribute('for', nome.id);
    const gerar = form.querySelector('[data-certificado="gerar"]') || (() => {
      const b = doc.createElement('button');
      b.setAttribute('type', 'button'); b.setAttribute('data-certificado', 'gerar');
      b.textContent = 'Gerar certificado'; form.appendChild(b); return b;
    })();
    const erro = achar(raiz, doc, 'erro', 'p', 'certificado-erro', form);
    erro.setAttribute('role', 'alert');
    // Erro ligado ao campo de nome (R14.15): leitores de tela leem a mensagem junto com o campo.
    if (!erro.id) erro.id = `certificado-erro-${limpezas.length}`;
    nome.setAttribute('aria-describedby', erro.id);
    const resultado = achar(raiz, doc, 'resultado', 'div', 'certificado');
    resultado.setAttribute('tabindex', '-1');
    const controles = achar(raiz, doc, 'controles', 'div', 'certificado-controles');
    const imprimir = controles.querySelector('[data-certificado="imprimir"]') || (() => {
      const b = doc.createElement('button');
      b.setAttribute('type', 'button'); b.setAttribute('data-certificado', 'imprimir');
      b.textContent = 'Imprimir ou salvar como PDF'; controles.appendChild(b); return b;
    })();

    // Botão "Baixar PNG" (R14.13); fica oculto sem suporte a canvas (R14.14).
    const suportaCanvas = !!contexto2d(doc.createElement('canvas'));
    const png = controles.querySelector('[data-certificado="png"]') || (() => {
      const b = doc.createElement('button');
      b.setAttribute('type', 'button'); b.setAttribute('data-certificado', 'png');
      b.textContent = 'Baixar PNG'; controles.appendChild(b); return b;
    })();
    png.hidden = !suportaCanvas;
    let modeloAtual = null;
    const limparErro = () => { erro.textContent = ''; erro.hidden = true; };
    const mostrarErro = (msg) => { erro.textContent = msg; erro.hidden = false; };

    /** Reflete o progresso atual (R14.2 a R14.4, R14.17). */
    const atualizar = () => {
      const p = gerenciador.estado();
      if (conclusaoTotal(p, catalogo)) {
        pct.textContent = textoPercentual(100);
        lista.textContent = '';
        lista.hidden = true;
        form.hidden = false;
        nome.disabled = false;
        gerar.disabled = false;
      } else {
        pct.textContent = textoPercentual(percentual(p, catalogo));
        pintarPendencias(lista, pendencias(p, catalogo), doc);
        lista.hidden = false;
        form.hidden = true;
        nome.disabled = true;
        gerar.disabled = true;
        limparErro();
        resultado.textContent = '';
        resultado.hidden = true;
        controles.hidden = true;
      }
    };

    const aoGerar = () => {
      limparErro();
      // Progresso lido no momento do clique (R14.18).
      const r = emitir({
        entrada: nome.value,
        lerProgresso: () => gerenciador.estado(),
        catalogo,
        hoje: new Date(),
      });
      if (!r.ok) {
        if (r.erro === 'nome') {
          mostrarErro(r.mensagem);
          if (typeof anunciar === 'function') anunciar(r.mensagem);
        } else {
          atualizar(); // conclusão perdida: volta a bloquear
          if (typeof anunciar === 'function') anunciar('Conclua todos os itens do curso para gerar o certificado.');
        }
        return;
      }
      modeloAtual = r.modelo;
      pintarCertificado(resultado, r.modelo, doc);
      resultado.hidden = false;
      controles.hidden = false;
      resultado.focus();
      if (typeof anunciar === 'function') anunciar(ANUNCIO_GERADO);
    };

    const aoImprimir = () => { if (win && typeof win.print === 'function') win.print(); };

    const aoBaixar = () => {
      if (!modeloAtual) return;
      const canvas = doc.createElement('canvas');
      if (!desenharCertificado(canvas, modeloAtual)) { png.hidden = true; return; }
      canvas.toBlob((blob) => {
        const U = win && win.URL;
        if (!blob || !U || typeof U.createObjectURL !== 'function') return;
        const url = U.createObjectURL(blob);
        const a = doc.createElement('a');
        a.setAttribute('href', url); a.setAttribute('download', PNG_NOME_ARQUIVO);
        doc.body.appendChild(a); a.click(); a.remove();
        if (typeof U.revokeObjectURL === 'function') U.revokeObjectURL(url);
      }, 'image/png');
    };
    gerar.addEventListener('click', aoGerar);
    imprimir.addEventListener('click', aoImprimir);
    png.addEventListener('click', aoBaixar);
    limpezas.push(() => {
      png.removeEventListener('click', aoBaixar);
      gerar.removeEventListener('click', aoGerar);
      imprimir.removeEventListener('click', aoImprimir);
    });

    resultado.hidden = true;
    controles.hidden = true;
    limparErro();
    atualizar();

    if (typeof gerenciador.assinar === 'function') {
      const cancelar = gerenciador.assinar(atualizar);
      if (typeof cancelar === 'function') limpezas.push(cancelar);
    }
  }

  return () => { for (const l of limpezas) l(); };
}
