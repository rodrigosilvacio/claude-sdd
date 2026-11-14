// Checklist do Exercício (Requisitos 6.2 a 6.6, 18.7).
// Markup base: <ul data-componente="checklist" data-ferramenta="openspec"> com, opcionalmente,
// <li><input type="checkbox" id data-item="openspec/c1"><label for>texto</label></li>.
// Se o contêiner estiver vazio, os itens são gerados a partir de catalogo.checklists[ferramenta].
import { exercicioConcluido } from '../core/progresso.js';
import { anunciar as anunciarPadrao } from './anuncio.js';

/** Texto do progresso "x de y". */
export const textoProgresso = (feitos, total) => `${feitos} de ${total} itens concluídos`;

function gerarItens(doc, raiz, ferramenta, itens) {
  itens.forEach((item, i) => {
    const li = doc.createElement('li');
    const input = doc.createElement('input');
    input.type = 'checkbox';
    input.id = `chk-${ferramenta}-${i + 1}`;
    input.setAttribute('data-item', item.id);
    const label = doc.createElement('label');
    label.setAttribute('for', input.id);
    label.textContent = item.texto;
    li.append(input, ' ', label);
    raiz.appendChild(li);
  });
}

export function ativarChecklist(raiz, { gerenciador, catalogo, anunciar, doc }) {
  if (raiz.getAttribute('data-checklist-ativo') === 'true') return null;
  const ferramenta = raiz.getAttribute('data-ferramenta');
  const itensCatalogo = (catalogo.checklists && catalogo.checklists[ferramenta]) || [];
  if (!ferramenta) return null;
  if (!raiz.querySelector('input[type="checkbox"]')) gerarItens(doc, raiz, ferramenta, itensCatalogo);
  const caixas = [...raiz.querySelectorAll('input[type="checkbox"][data-item]')];
  if (caixas.length === 0) return null;
  raiz.setAttribute('data-checklist-ativo', 'true');

  // Progresso e selo ficam logo após a lista (fora dela, para manter a lista válida).
  const progresso = doc.createElement('p');
  progresso.className = 'checklist-progresso';
  const selo = doc.createElement('p');
  selo.className = 'checklist-selo';
  selo.hidden = true;
  selo.textContent = 'Exercício concluído';
  raiz.after(progresso, selo);

  let concluidoAntes = null;
  const renderizar = (anunciarMudanca) => {
    const p = gerenciador.estado();
    const marcados = p.checklists.get(ferramenta) ?? new Set();
    let feitos = 0;
    for (const c of caixas) {
      const m = marcados.has(c.getAttribute('data-item'));
      c.checked = m;
      if (m) feitos += 1;
    }
    progresso.textContent = textoProgresso(feitos, caixas.length);
    const concluido = exercicioConcluido(p, ferramenta, catalogo);
    selo.hidden = !concluido;
    if (anunciarMudanca && concluidoAntes !== null && concluido !== concluidoAntes) {
      anunciar(concluido ? 'Exercício concluído' : 'Exercício não está mais concluído');
    }
    concluidoAntes = concluido;
  };

  for (const c of caixas) {
    c.addEventListener('change', () => {
      // alternarItem notifica os assinantes, que redesenham a lista.
      const id = c.getAttribute('data-item');
      const marcado = gerenciador.estado().checklists.get(ferramenta)?.has(id) ?? false;
      if (marcado !== c.checked) gerenciador.alternarItem(ferramenta, id);
      renderizar(true);
    });
  }
  gerenciador.assinar(() => renderizar(true));

  renderizar(false);
  return { atualizar: () => renderizar(false) };
}

/**
 * @param {Element[]} elementos
 * @param {{gerenciador:any, catalogo:any, anunciar?:(t:string)=>void, doc?:Document}} ctx
 */
export function ativar(elementos, ctx = {}) {
  const doc = ctx.doc ?? globalThis.document;
  const { gerenciador, catalogo } = ctx;
  if (!gerenciador || !catalogo) return;
  const anunciar = ctx.anunciar ?? ((t) => anunciarPadrao(t, doc));
  for (const el of elementos) {
    try { ativarChecklist(el, { gerenciador, catalogo, anunciar, doc }); } catch (erro) { console.warn('Falha ao ativar Checklist:', erro); }
  }
}
