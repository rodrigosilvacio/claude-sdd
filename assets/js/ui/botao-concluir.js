// Botão_Concluir (Requisito 19). Sem acesso ao DOM na importação.
// O ícone de verificação visual vem do CSS (::before em [aria-pressed="true"]); aqui o
// estado também é refletido no texto e em data-concluida, de modo que não dependa só de cor.

export const TEXTO_CONCLUIDA = 'Concluída (desmarcar)';
export const TEXTO_PENDENTE = 'Marcar como concluída';

/** Função pura: texto e aria-pressed do botão (R19.1, R19.4, R19.5). */
export function estadoBotao(concluida) {
  return concluida
    ? { texto: TEXTO_CONCLUIDA, pressed: 'true' }
    : { texto: TEXTO_PENDENTE, pressed: 'false' };
}

/** Função pura de apresentação, incluindo o ícone textual (✓ quando concluída). */
export function apresentar(concluida) {
  const { texto, pressed } = estadoBotao(concluida);
  return { pressed, texto, icone: concluida ? '\u2713' : '' };
}

/** Texto anunciado na região aria-live (R19.7). */
export function anuncioDe(concluida) {
  return concluida ? 'Lição marcada como concluída' : 'Lição desmarcada';
}

function pintar(botao, concluida) {
  const { texto, pressed } = estadoBotao(concluida);
  botao.setAttribute('aria-pressed', pressed);
  botao.setAttribute('data-concluida', concluida ? 'true' : 'false');
  if (botao.textContent !== texto) botao.textContent = texto;
}

/**
 * Ativa cada botão. Retorna uma função que remove as assinaturas e ouvintes.
 * @param {Iterable<Element>} elementos
 * @param {{gerenciador:object, anunciar?:(t:string)=>void}} ctx
 */
export function ativar(elementos, { gerenciador, anunciar } = {}) {
  const limpezas = [];
  if (!gerenciador) return () => {};

  for (const botao of elementos || []) {
    const id = botao.getAttribute('data-licao');
    if (!id) continue;

    const lerEstado = () => {
      try { return !!gerenciador.licaoConcluida(id); } catch { return false; }
    };

    pintar(botao, lerEstado()); // estado inicial antes da interação (R19.6)
    botao.removeAttribute('disabled');

    const aoClicar = () => {
      const nova = !lerEstado();
      gerenciador.marcarLicao(id, nova); // síncrono (R19.2, R19.3); em memória sem storage (R19.10)
      const efetiva = lerEstado();
      pintar(botao, efetiva);
      if (typeof anunciar === 'function') anunciar(anuncioDe(efetiva));
    };
    botao.addEventListener('click', aoClicar);
    limpezas.push(() => botao.removeEventListener('click', aoClicar));

    // Mudanças locais ou de outra aba: apenas repinta, sem anunciar de novo.
    if (typeof gerenciador.assinar === 'function') {
      const cancelar = gerenciador.assinar(() => pintar(botao, lerEstado()));
      if (typeof cancelar === 'function') limpezas.push(cancelar);
    }
  }

  return () => { for (const l of limpezas) l(); };
}
