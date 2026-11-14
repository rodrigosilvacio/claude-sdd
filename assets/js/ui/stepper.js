// Stepper (Requisitos 17.5, 17.11, 17.12, 18.6, 18.7).
// Aprimoramento progressivo: sem JS, o <ol class="stepper"> é uma lista numerada legível.
// Com JS, exibe um passo por vez, com botões Anterior/Próximo, rótulo "passo N de M" e anúncio aria-live.
import { mover, rotulo } from '../core/stepper-estado.js';
import { anunciar as anunciarPadrao } from './anuncio.js';

/** Título curto de um passo: data-titulo, primeiro título/strong interno ou primeira linha do texto. */
export function tituloDoPasso(li) {
  const dado = li.getAttribute('data-titulo');
  if (dado) return dado.trim();
  const forte = li.querySelector('h2, h3, h4, h5, h6, strong');
  const texto = (forte ? forte.textContent : li.textContent) || '';
  return texto.trim().split('\n')[0].trim();
}

function criarBotao(doc, texto) {
  const b = doc.createElement('button');
  b.type = 'button';
  b.className = 'stepper-botao';
  b.textContent = texto;
  return b;
}

/** Ativa um Stepper. Devolve a API mínima usada nos testes. */
export function ativarStepper(lista, { doc, anunciar }) {
  if (lista.getAttribute('data-stepper-ativo') === 'true') return null;
  const passos = [...lista.children].filter((el) => el.tagName === 'LI');
  if (passos.length === 0) return null;
  lista.setAttribute('data-stepper-ativo', 'true');

  let estado = { atual: 1, total: passos.length };

  const controles = doc.createElement('div');
  controles.className = 'stepper-controles';
  controles.setAttribute('role', 'group');
  controles.setAttribute('aria-label', 'Navegação do passo a passo');
  const anterior = criarBotao(doc, 'Anterior');
  const proximo = criarBotao(doc, 'Próximo');
  const indicador = doc.createElement('span');
  indicador.className = 'stepper-indicador';
  controles.append(anterior, indicador, proximo);
  lista.after(controles);

  const renderizar = () => {
    passos.forEach((li, i) => {
      const atual = i + 1 === estado.atual;
      li.hidden = !atual;
      if (atual) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    indicador.textContent = rotulo(estado);
    anterior.disabled = estado.atual <= 1;
    proximo.disabled = estado.atual >= estado.total;
  };

  const ir = (acao) => {
    const novo = mover(estado, acao);
    if (novo.atual === estado.atual) return;
    estado = novo;
    renderizar();
    // Botão que ficou desabilitado perde o foco: passa para o outro, para o teclado não se perder.
    const ativo = doc.activeElement;
    if ((ativo === anterior && anterior.disabled) || (ativo === proximo && proximo.disabled)) {
      (ativo === anterior ? proximo : anterior).focus();
    }
    const li = passos[estado.atual - 1];
    anunciar(`Passo ${estado.atual} de ${estado.total}: ${tituloDoPasso(li)}`);
  };

  anterior.addEventListener('click', () => ir('anterior'));
  proximo.addEventListener('click', () => ir('proximo'));
  controles.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); ir('proximo'); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); ir('anterior'); }
  });

  renderizar();
  return { estado: () => ({ ...estado }), ir };
}

/**
 * @param {Element[]} elementos
 * @param {{doc?:Document, anunciar?:(t:string)=>void}} ctx
 */
export function ativar(elementos, ctx = {}) {
  const doc = ctx.doc ?? globalThis.document;
  const anunciar = ctx.anunciar ?? ((t) => anunciarPadrao(t, doc));
  for (const el of elementos) {
    try { ativarStepper(el, { doc, anunciar }); } catch (erro) { console.warn('Falha ao ativar Stepper:', erro); }
  }
}
