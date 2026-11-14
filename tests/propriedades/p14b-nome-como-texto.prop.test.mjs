import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { parseHTML } from 'linkedom';
import { escaparHTML, validarNome } from '../../assets/js/core/certificado.js';
import { ativar, pintarCertificado } from '../../assets/js/ui/certificado-ui.js';

// Feature: comparacoes-sdds, Property 14: Nome não é interpretado como HTML
// **Validates: Requirements 14.8**

const marcacoes = [
  '<img src=x onerror=alert(1)>',
  '<script>alert(1)</script>',
  '<b>negrito</b>',
  '"><svg onload=1>',
  "' onmouseover='x'",
  '&lt;b&gt; &amp; &#39;',
  '</p><h1>x</h1>',
];

// Nomes válidos, inválidos e com marcação, misturados.
const arbNome = fc.oneof(
  fc.string({ maxLength: 100 }),
  fc.stringMatching(/^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ '.-]{2,30}$/),
  fc.array(fc.oneof(fc.constantFrom(...marcacoes), fc.string({ maxLength: 10 }), fc.constantFrom('Ana', ' ', 'Maria da Silva')), { minLength: 1, maxLength: 4 })
    .map((p) => p.join('')),
  fc.constantFrom(...marcacoes),
);

const catalogo = {
  cargaHorariaHoras: 10,
  checklists: {},
  modulos: [{ id: 'm1', itens: [{ id: 'licao:1', tipo: 'licao', titulo: 'L1', url: 'modulos/m1/l1.html' }] }],
};

function montar() {
  const { document, window } = parseHTML('<html><body><section data-componente="certificado"></section></body></html>');
  const progresso = { licoes: new Set(['licao:1']), checklists: new Map(), quizzes: new Map() };
  const gerenciador = { estado: () => progresso, assinar: () => () => {} };
  const raiz = document.querySelector('[data-componente="certificado"]');
  ativar([raiz], { gerenciador, catalogo, doc: document, win: window, anunciar: () => {} });
  return { document, window, raiz };
}

const ENTIDADE = /&(?:amp|lt|gt|quot|#39);/g;

test('Feature: comparacoes-sdds, Property 14: escaparHTML nunca deixa < > " \' ou & sem escape', () => {
  fc.assert(
    fc.property(arbNome, (s) => {
      const saida = escaparHTML(s);
      assert.doesNotMatch(saida, /[<>"']/);
      assert.doesNotMatch(saida.replace(ENTIDADE, ''), /&/);
      const volta = saida
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'").replace(/&amp;/g, '&');
      assert.equal(volta, s);
    }),
    { numRuns: 100 },
  );
});

test('Feature: comparacoes-sdds, Property 14: pintarCertificado escreve o nome como texto, sem criar elementos', () => {
  fc.assert(
    fc.property(arbNome, (nome) => {
      const { document } = parseHTML('<html><body><div id="c"></div></body></html>');
      const el = document.getElementById('c');
      pintarCertificado(el, { nome, titulo: 'T', data: '01/01/2025', cargaHoraria: 10, declaracao: 'D' }, document);
      const campo = el.querySelector('.certificado-nome');
      assert.equal(campo.textContent, nome);
      assert.equal(campo.children.length, 0);
      assert.equal(el.children.length, 6);
      assert.equal(el.querySelectorAll('img, script, svg, b, h1').length, 0);
    }),
    { numRuns: 100 },
  );
});

test('Feature: comparacoes-sdds, Property 14: fluxo de emissão pela UI trata o nome digitado como texto', () => {
  fc.assert(
    fc.property(arbNome, (digitado) => {
      const { document, window, raiz } = montar();
      const antes = document.querySelectorAll('*').length;
      const campoNome = raiz.querySelector('[data-certificado="nome"]');
      campoNome.value = digitado;
      raiz.querySelector('[data-certificado="gerar"]').dispatchEvent(new window.Event('click'));

      const v = validarNome(digitado);
      const resultado = raiz.querySelector('[data-certificado="resultado"]');
      const erro = raiz.querySelector('[data-certificado="erro"]');
      if (v.ok) {
        const campo = resultado.querySelector('.certificado-nome');
        assert.equal(campo.textContent, v.nome);
        assert.equal(campo.children.length, 0);
        assert.equal(resultado.children.length, 6);
      } else {
        assert.equal(resultado.children.length, 0);
        assert.equal(erro.children.length, 0);
        assert.equal(erro.textContent, v.erro);
      }
      // nenhum elemento surge a partir do que foi digitado
      assert.equal(document.querySelectorAll('img, script, svg, b, h1').length, 0);
      assert.ok(document.querySelectorAll('*').length - antes <= 6);
    }),
    { numRuns: 100 },
  );
});
