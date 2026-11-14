// Bloco de progresso da página inicial (Requisitos 2.5, 13.2).
// Mostra o percentual e o link "continuar" somente quando há ao menos uma Lição concluída.
import { percentual, proximaLicao } from '../core/progresso.js';

/** Dados de apresentação, sem DOM. */
export function resumo(progresso, catalogo) {
  const concluidas = progresso.licoes.size;
  return {
    visivel: concluidas > 0,
    pct: percentual(progresso, catalogo),
    proxima: proximaLicao(progresso, catalogo),
  };
}

/**
 * @param {Element[]} elementos [data-componente="progresso-inicio"]
 * @param {{gerenciador:any, catalogo:any}} ctx
 */
export function ativar(elementos, ctx = {}) {
  const g = ctx.gerenciador;
  if (!g || !ctx.catalogo) return;
  const renderizar = () => {
    const r = resumo(g.estado(), ctx.catalogo);
    for (const el of elementos) {
      el.hidden = !r.visivel;
      const pct = el.querySelector('[data-campo="percentual"]');
      if (pct) pct.textContent = `${r.pct}%`;
      const barra = el.querySelector('progress');
      if (barra) barra.value = r.pct;
      const link = el.querySelector('[data-campo="continuar"]');
      if (link) {
        link.hidden = !r.proxima;
        if (r.proxima) {
          link.setAttribute('href', r.proxima.url);
          link.textContent = `Continuar: ${r.proxima.titulo}`;
        }
      }
    }
  };
  renderizar();
  g.assinar(renderizar);
}
