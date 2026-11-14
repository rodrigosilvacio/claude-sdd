// Botão de copiar comando (Requisito 5.4): navigator.clipboard com fallback execCommand.
import { anunciar } from './anuncio.js';

/**
 * Copia o texto. Tenta navigator.clipboard e, se indisponível ou recusado,
 * seleciona o conteúdo do bloco e usa document.execCommand('copy').
 * @param {string} texto
 * @param {Element|null} [bloco] elemento cujo conteúdo é selecionado no fallback
 * @returns {Promise<boolean>} true se a cópia foi feita
 */
export async function copiarTexto(texto, bloco = null, doc = globalThis.document, nav = globalThis.navigator) {
  try {
    if (nav && nav.clipboard && typeof nav.clipboard.writeText === 'function') {
      await nav.clipboard.writeText(texto);
      return true;
    }
  } catch {
    /* segue para o fallback */
  }
  try {
    if (!doc || typeof doc.execCommand !== 'function') return false;
    let temporario = null;
    let alvo = bloco;
    if (!alvo) {
      temporario = doc.createElement('textarea');
      temporario.value = texto;
      temporario.setAttribute('readonly', '');
      temporario.className = 'visualmente-oculto';
      doc.body.appendChild(temporario);
      alvo = temporario;
    }
    selecionar(alvo, doc);
    const ok = Boolean(doc.execCommand('copy'));
    if (temporario) temporario.remove();
    return ok;
  } catch {
    return false;
  }
}

function selecionar(alvo, doc) {
  if (typeof alvo.select === 'function') {
    alvo.select();
    return;
  }
  const win = doc.defaultView;
  const sel = win && win.getSelection ? win.getSelection() : null;
  if (!sel) return;
  const faixa = doc.createRange();
  faixa.selectNodeContents(alvo);
  sel.removeAllRanges();
  sel.addRange(faixa);
}

/** Encontra o bloco de código do botão: data-alvo (id) ou o <pre> do bloco que o contém. */
export function blocoDoBotao(botao, doc) {
  const id = botao.getAttribute('data-alvo');
  if (id) return doc.getElementById(id);
  const pai = botao.closest('.bloco-codigo, figure, div');
  return pai ? pai.querySelector('pre, code') : null;
}

/**
 * @param {Element[]} elementos button[data-componente="copiar"]
 */
export function ativar(elementos, ctx = {}) {
  const doc = ctx.doc ?? globalThis.document;
  for (const botao of elementos) {
    const rotuloOriginal = botao.textContent;
    botao.hidden = false;
    botao.disabled = false;
    botao.addEventListener('click', async () => {
      const bloco = blocoDoBotao(botao, doc);
      if (!bloco) return;
      const ok = await copiarTexto(bloco.textContent.trim(), bloco, doc);
      const msg = ok ? 'Comando copiado' : 'Não foi possível copiar. Selecione o texto e copie manualmente.';
      botao.textContent = ok ? 'Copiado' : 'Falhou';
      anunciar(msg, doc);
      const win = doc.defaultView;
      if (win && typeof win.setTimeout === 'function') {
        win.setTimeout(() => { botao.textContent = rotuloOriginal; }, 2000);
      }
    });
  }
}
