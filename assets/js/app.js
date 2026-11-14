// Ponto de entrada (Requisitos 1.1, 1.7, 11.x, 13.7).
// Inicializa o Gerenciador_Progresso e o Menu e ativa os componentes presentes na
// página, detectados por data-componente, com import() dinâmico e try/catch por módulo.
// Sem recursos externos. Caminhos relativos ao próprio arquivo.
import { criarGerenciador } from './core/progresso.js';
import { catalogo } from '../data/catalogo.js';
import { anunciar } from './ui/anuncio.js';

/** Módulo de UI responsável por cada valor de data-componente. */
export const MODULOS = {
  menu: './ui/menu.js',
  copiar: './ui/copiar.js',
  'avisos-progresso': './ui/avisos.js',
  'reiniciar-progresso': './ui/avisos.js',
  'progresso-inicio': './ui/inicio.js',
  'botao-concluir': './ui/botao-concluir.js',
  stepper: './ui/stepper.js',
  ordenar: './ui/ordenar.js',
  checklist: './ui/checklist.js',
  quiz: './ui/quiz-ui.js',
  comparador: './ui/comparador-ui.js',
  certificado: './ui/certificado-ui.js',
};

/** localStorage dentro de try/catch (o próprio acesso à propriedade pode lançar SecurityError). */
export function obterStorage() {
  try {
    return window.localStorage;
  } catch {
    return null; // o gerenciador segue em memória e avisa o aluno
  }
}

const importar = (caminho) => import(caminho);

export async function iniciar(doc = document) {
  let gerenciador;
  try {
    gerenciador = criarGerenciador(obterStorage, catalogo);
  } catch (erro) {
    console.warn('Falha ao iniciar o gerenciador de progresso:', erro);
    return;
  }
  const ctx = { gerenciador, catalogo, anunciar: (t) => anunciar(t, doc), doc, win: window };

  // Agrupa por módulo os elementos de cada componente presente na página.
  const porModulo = new Map();
  const nomes = new Set(['menu', 'avisos-progresso']); // sempre ativos
  for (const el of doc.querySelectorAll('[data-componente]')) nomes.add(el.getAttribute('data-componente'));

  for (const nome of nomes) {
    const caminho = MODULOS[nome];
    if (!caminho) continue;
    const elementos = [...doc.querySelectorAll(`[data-componente="${nome}"]`)];
    if (!porModulo.has(caminho)) porModulo.set(caminho, []);
    porModulo.get(caminho).push(...elementos);
  }

  // Menu e avisos primeiro; demais módulos em seguida, cada um isolado por try/catch.
  const ordem = ['./ui/menu.js', './ui/avisos.js'];
  const caminhos = [...porModulo.keys()].sort((a, b) => {
    const ia = ordem.indexOf(a); const ib = ordem.indexOf(b);
    return (ia < 0 ? ordem.length : ia) - (ib < 0 ? ordem.length : ib);
  });

  await Promise.all(caminhos.map(async (caminho) => {
    try {
      const modulo = await importar(caminho);
      if (typeof modulo.ativar === 'function') modulo.ativar(porModulo.get(caminho), ctx);
    } catch (erro) {
      console.warn(`Falha ao ativar ${caminho}:`, erro);
    }
  }));
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { iniciar(); });
  } else {
    iniciar();
  }
}
