// Cartão_Comparativo compartilhado entre lições e Comparador (Requisitos 9.8, 17.7, 17.8, 18.x).
// Todo texto entra por textContent; nenhum valor de dado passa por innerHTML.
export const SEM_VERSAO = 'versão não informada na fonte';
export const VERIFICAR = 'verificar na fonte';

/** Resolve o caminho do ícone (relativo à raiz do Site) a partir deste módulo, em qualquer profundidade. */
function urlIcone(icone) {
  try {
    return new URL(`../../../${icone}`, import.meta.url).href;
  } catch {
    return icone;
  }
}

/**
 * @param {import('../../data/ferramentas.js').Ferramenta} ferramenta
 * @param {Document} [doc]
 * @returns {HTMLElement}
 */
export function criarCartao(ferramenta, doc = globalThis.document) {
  const f = ferramenta;
  const cartao = doc.createElement('article');
  cartao.className = 'cartao';
  cartao.setAttribute('data-ferramenta', f.id);
  cartao.style.setProperty('--cor-ferramenta', f.identidade?.cor ?? '');

  const titulo = doc.createElement('h3');
  if (f.identidade?.icone) {
    const img = doc.createElement('img');
    img.src = urlIcone(f.identidade.icone);
    img.alt = ''; // decorativo: o nome da ferramenta está no texto ao lado
    img.setAttribute('aria-hidden', 'true');
    img.width = 40;
    img.height = 40;
    titulo.appendChild(img);
  }
  const nome = doc.createElement('span');
  nome.textContent = f.nome;
  titulo.appendChild(nome);
  cartao.appendChild(titulo);

  if (f.proposito) {
    const p = doc.createElement('p');
    p.textContent = f.proposito;
    cartao.appendChild(p);
  }

  const dl = doc.createElement('dl');
  const linha = (rotulo, preencher) => {
    const dt = doc.createElement('dt');
    dt.textContent = rotulo;
    const dd = doc.createElement('dd');
    preencher(dd);
    dl.append(dt, dd);
  };
  const texto = (valor, ausente) => (dd) => { dd.textContent = valor || ausente; };

  linha('Instalação', (dd) => {
    const passo = (f.passos || []).find((x) => x && x.comando);
    if (!passo) { dd.textContent = VERIFICAR; return; }
    const code = doc.createElement('code');
    code.textContent = passo.comando;
    dd.appendChild(code);
  });
  linha('Agentes suportados', texto(Array.isArray(f.agentes) && f.agentes.length ? f.agentes.join(', ') : '', VERIFICAR));
  linha('Artefatos principais', (dd) => {
    const lista = Array.isArray(f.artefatos) ? f.artefatos : [];
    if (lista.length === 0) { dd.textContent = VERIFICAR; return; }
    lista.forEach((a, i) => {
      if (i > 0) dd.appendChild(doc.createTextNode(', '));
      const code = doc.createElement('code');
      code.textContent = a;
      dd.appendChild(code);
    });
  });
  linha('Versão', texto(f.versao, SEM_VERSAO));
  linha('Licença', texto(f.licenca, VERIFICAR));
  linha('Custo', texto(f.custo, VERIFICAR));
  linha('Fonte oficial', (dd) => {
    const a = doc.createElement('a');
    a.href = f.urlOficial;
    a.textContent = f.urlOficial;
    a.rel = 'noopener noreferrer';
    dd.appendChild(a);
  });
  linha('Data da consulta', texto(f.dataConsulta, VERIFICAR));
  cartao.appendChild(dl);
  return cartao;
}
