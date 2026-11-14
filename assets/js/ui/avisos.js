// Avisos de progresso e reinício com confirmação (Requisitos 13.4 a 13.9, 11.9).
import { anunciar } from './anuncio.js';

export const TEXTOS = {
  semArmazenamento: 'O armazenamento local está indisponível: o progresso não será salvo.',
  corrompido: 'Os dados de progresso estavam corrompidos e foram descartados. O progresso começou vazio.',
  local: 'O progresso fica apenas neste navegador e não é sincronizado entre dispositivos.',
};

/** Lista de avisos a exibir, a partir de gerenciador.avisos(). */
export function avisosAtuais(avisos) {
  const lista = [];
  if (avisos.semArmazenamento) lista.push(TEXTOS.semArmazenamento);
  if (avisos.corrompido) lista.push(TEXTOS.corrompido);
  lista.push(TEXTOS.local);
  return lista;
}

function obterContainer(doc) {
  let c = doc.querySelector('[data-componente="avisos-progresso"]');
  if (!c) {
    c = doc.createElement('div');
    c.setAttribute('data-componente', 'avisos-progresso');
    (doc.body || doc.documentElement).insertBefore(c, (doc.body || doc.documentElement).firstChild);
  }
  c.classList.add('avisos-progresso');
  return c;
}

/** Pede confirmação com <dialog>; usa window.confirm se showModal não existir. */
export function confirmarReinicio(doc, win) {
  return new Promise((resolve) => {
    const dialogo = doc.createElement('dialog');
    if (typeof dialogo.showModal !== 'function') {
      resolve(typeof win.confirm === 'function' ? win.confirm('Apagar todo o progresso deste navegador?') : false);
      return;
    }
    dialogo.setAttribute('aria-labelledby', 'dialogo-reiniciar-titulo');
    const titulo = doc.createElement('h2');
    titulo.id = 'dialogo-reiniciar-titulo';
    titulo.textContent = 'Reiniciar progresso?';
    const texto = doc.createElement('p');
    texto.textContent = 'Todo o progresso salvo neste navegador será apagado. Esta ação não pode ser desfeita.';
    const cancelar = doc.createElement('button');
    cancelar.type = 'button';
    cancelar.textContent = 'Cancelar';
    const confirmar = doc.createElement('button');
    confirmar.type = 'button';
    confirmar.textContent = 'Apagar progresso';
    dialogo.append(titulo, texto, cancelar, confirmar);
    doc.body.appendChild(dialogo);
    let resultado = false;
    cancelar.addEventListener('click', () => dialogo.close());
    confirmar.addEventListener('click', () => { resultado = true; dialogo.close(); });
    dialogo.addEventListener('close', () => { dialogo.remove(); resolve(resultado); });
    dialogo.showModal();
    cancelar.focus();
  });
}

/**
 * Ativa os avisos e os botões de reinício.
 * @param {Element[]} elementos
 * @param {{gerenciador:any, doc?:Document, win?:Window}} ctx
 */
export function ativar(elementos, ctx = {}) {
  const doc = ctx.doc ?? globalThis.document;
  const win = ctx.win ?? globalThis.window ?? {};
  const g = ctx.gerenciador;
  if (!g) return;

  const container = obterContainer(doc);
  let anteriores = '';
  const renderizar = () => {
    const lista = avisosAtuais(g.avisos());
    const chave = lista.join('|');
    if (chave === anteriores) return;
    anteriores = chave;
    container.textContent = '';
    for (const t of lista) {
      const p = doc.createElement('p');
      p.textContent = t;
      container.appendChild(p);
    }
    // Os avisos de falha são anunciados; o aviso fixo "local ao navegador" só é lido no texto.
    const falhas = lista.filter((t) => t !== TEXTOS.local);
    if (falhas.length) anunciar(falhas.join(' '), doc);
  };
  renderizar();
  g.assinar(renderizar);

  for (const botao of doc.querySelectorAll('[data-componente="reiniciar-progresso"]')) {
    botao.addEventListener('click', async () => {
      if (!(await confirmarReinicio(doc, win))) return;
      g.reiniciar();
      anunciar('Progresso reiniciado. Progresso em 0%.', doc);
    });
  }
}
