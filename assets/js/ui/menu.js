// Menu recolhível, destaque do Módulo atual e selo "concluída" (Requisitos 3.3, 3.4, 11.2, 11.3, 11.4).
const LARGURA_MIN = 768;
const CLASSE_SELO = 'selo-concluida';

/** Tela larga: o Menu fica sempre expandido (CSS também ignora [hidden] nessa largura). */
const telaLarga = (win) =>
  typeof win.matchMedia === 'function' ? win.matchMedia(`(min-width: ${LARGURA_MIN}px)`).matches : false;

/** Aplica o estado expandido/recolhido ao botão e à lista. */
export function definirExpandido(botao, lista, expandido) {
  botao.setAttribute('aria-expanded', expandido ? 'true' : 'false');
  lista.hidden = !expandido;
}

/** Adiciona ou remove o selo textual "concluída" (texto + ícone, não só cor). */
export function aplicarSelo(link, concluida) {
  const existente = link.querySelector(`.${CLASSE_SELO}`);
  if (concluida && !existente) {
    const selo = link.ownerDocument.createElement('span');
    selo.className = CLASSE_SELO;
    selo.textContent = ' ✓ concluída';
    link.appendChild(selo);
  } else if (!concluida && existente) {
    existente.remove();
  }
}

/** Marca como atual o link do Módulo da página (body[data-modulo]). */
export function destacarModulo(doc) {
  const modulo = doc.body && doc.body.dataset ? doc.body.dataset.modulo : null;
  if (!modulo) return;
  for (const link of doc.querySelectorAll('a[data-modulo]')) {
    const atual = link.getAttribute('data-modulo') === modulo;
    link.classList.toggle('modulo-atual', atual);
    if (atual && !link.hasAttribute('aria-current')) link.setAttribute('aria-current', 'true');
  }
}

/**
 * @param {Element[]} elementos nav[data-componente="menu"]
 * @param {{gerenciador:any, doc?:Document, win?:Window}} ctx
 */
export function ativar(elementos, ctx = {}) {
  const doc = ctx.doc ?? globalThis.document;
  const win = ctx.win ?? globalThis.window ?? {};

  for (const nav of elementos) {
    const botao = nav.querySelector('.menu-botao, button[aria-controls]');
    const lista = botao ? doc.getElementById(botao.getAttribute('aria-controls')) : null;
    if (!botao || !lista) continue; // sem o botão o Menu permanece expandido

    const sincronizar = () => definirExpandido(botao, lista, telaLarga(win) ? true : false);
    sincronizar();

    // Botão nativo: Enter e Espaço acionam o clique sem código extra.
    botao.addEventListener('click', () => {
      definirExpandido(botao, lista, botao.getAttribute('aria-expanded') !== 'true');
    });

    // Esc recolhe o Menu aberto e devolve o foco ao botão (somente em tela estreita).
    nav.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !telaLarga(win) && botao.getAttribute('aria-expanded') === 'true') {
        definirExpandido(botao, lista, false);
        botao.focus();
      }
    });

    if (typeof win.matchMedia === 'function') {
      const mq = win.matchMedia(`(min-width: ${LARGURA_MIN}px)`);
      const aoMudar = () => sincronizar();
      if (typeof mq.addEventListener === 'function') mq.addEventListener('change', aoMudar);
    }
  }

  destacarModulo(doc);

  // Selo "concluída" em links de lição (Menu e índice do Módulo), atualizado por assinar.
  const atualizarSelos = () => {
    const g = ctx.gerenciador;
    if (!g) return;
    for (const link of doc.querySelectorAll('a[data-licao]')) {
      aplicarSelo(link, g.licaoConcluida(link.getAttribute('data-licao')));
    }
  };
  atualizarSelos();
  if (ctx.gerenciador) ctx.gerenciador.assinar(atualizarSelos);
}
