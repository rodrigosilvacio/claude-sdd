// Atividade_Interativa de ordenar (Requisitos 6.10, 17.10, 18.5, 18.6, 18.7).
// Markup base: <div data-componente="ordenar" data-canonica="id1,id2,..."><ol><li data-id="id">texto</li>...</ol></div>
// Sem JS, a lista continua legível. Com JS, cada item recebe botões Subir/Descer (sem arrastar),
// e há um botão Verificar com feedback textual em região aria-live.
import { mover, verificar } from '../core/ordenar.js';
import { anunciar as anunciarPadrao } from './anuncio.js';

/** Texto de feedback da verificação (informa o resultado por texto, não só por cor). */
export function mensagemVerificacao(r) {
  if (r.correto) return `Ordem correta: ${r.total} de ${r.total} etapas na posição certa.`;
  return `${r.certos} de ${r.total} etapas na posição certa. Ajuste a ordem e verifique de novo.`;
}

function criarBotao(doc, texto, rotuloAcessivel) {
  const b = doc.createElement('button');
  b.type = 'button';
  b.textContent = texto;
  b.setAttribute('aria-label', rotuloAcessivel);
  return b;
}

export function ativarOrdenar(raiz, { doc, anunciar }) {
  if (raiz.getAttribute('data-ordenar-ativo') === 'true') return null;
  const lista = raiz.querySelector('ol, ul');
  if (!lista) return null;
  const itens = [...lista.children].filter((el) => el.tagName === 'LI' && el.getAttribute('data-id'));
  const canonica = (raiz.getAttribute('data-canonica') || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (itens.length === 0 || canonica.length !== itens.length) return null;
  raiz.setAttribute('data-ordenar-ativo', 'true');

  const porId = new Map(itens.map((li) => [li.getAttribute('data-id'), li]));
  const textos = new Map(itens.map((li) => [li.getAttribute('data-id'), li.textContent.trim()]));
  let ordem = itens.map((li) => li.getAttribute('data-id'));

  // Move o texto original para um <span> e acrescenta os controles.
  const botoes = new Map();
  for (const [id, li] of porId) {
    const texto = doc.createElement('span');
    texto.className = 'ordenar-texto';
    texto.textContent = textos.get(id);
    const subir = criarBotao(doc, 'Subir', `Subir etapa: ${textos.get(id)}`);
    const descer = criarBotao(doc, 'Descer', `Descer etapa: ${textos.get(id)}`);
    li.textContent = '';
    li.append(texto, ' ', subir, ' ', descer);
    botoes.set(id, { subir, descer });
    subir.addEventListener('click', () => deslocar(id, -1, subir));
    descer.addEventListener('click', () => deslocar(id, 1, descer));
  }

  const verificarBtn = criarBotao(doc, 'Verificar ordem', 'Verificar ordem');
  verificarBtn.classList.add('ordenar-verificar');
  const feedback = doc.createElement('p');
  feedback.className = 'ordenar-feedback';
  feedback.setAttribute('role', 'status');
  feedback.setAttribute('aria-live', 'polite');
  lista.after(verificarBtn, feedback);

  const renderizar = (idAtual) => {
    ordem.forEach((id, i) => {
      const li = porId.get(id);
      lista.appendChild(li); // reposiciona o nó existente
      li.setAttribute('data-posicao', String(i + 1));
      if (id === idAtual) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
      const b = botoes.get(id);
      b.subir.disabled = i === 0;
      b.descer.disabled = i === ordem.length - 1;
    });
  };

  function deslocar(id, delta, botao) {
    const i = ordem.indexOf(id);
    const nova = mover(ordem, i, delta);
    ordem = nova;
    renderizar(id);
    feedback.textContent = '';
    const j = ordem.indexOf(id);
    const b = botoes.get(id);
    // Se o botão usado ficou desabilitado (extremo), o foco vai para o outro botão do mesmo item.
    if (botao.disabled) (botao === b.subir ? b.descer : b.subir).focus(); else botao.focus();
    anunciar(`${textos.get(id)}: posição ${j + 1} de ${ordem.length}`);
  }

  verificarBtn.addEventListener('click', () => {
    const msg = mensagemVerificacao(verificar(ordem, canonica));
    feedback.textContent = msg;
    anunciar(msg);
  });

  renderizar(null);
  return { ordem: () => ordem.slice() };
}

/**
 * @param {Element[]} elementos
 * @param {{doc?:Document, anunciar?:(t:string)=>void}} ctx
 */
export function ativar(elementos, ctx = {}) {
  const doc = ctx.doc ?? globalThis.document;
  const anunciar = ctx.anunciar ?? ((t) => anunciarPadrao(t, doc));
  for (const el of elementos) {
    try { ativarOrdenar(el, { doc, anunciar }); } catch (erro) { console.warn('Falha ao ativar Ordenar:', erro); }
  }
}
