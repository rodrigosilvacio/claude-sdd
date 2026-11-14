import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { analisar, errosDeDados } from '../../tools/verificar-links.mjs';

// Feature: comparacoes-sdds, Property 24: Verificador de links
// **Validates: Requirements 12.1, 12.2, 12.7**

const idx = fc.integer({ min: 0, max: 9 });

// Cada origem tem um conjunto único de destinos internos (alvoN.html) e URLs externas (com/sem utm_source).
const arvore = fc.record({
  existentes: fc.uniqueArray(idx, { maxLength: 10 }),
  paginas: fc.uniqueArray(
    fc.record({
      nome: fc.integer({ min: 0, max: 5 }),
      internos: fc.uniqueArray(idx, { maxLength: 6 }),
      externos: fc.uniqueArray(fc.tuple(idx, fc.boolean()), { maxLength: 4, selector: ([i]) => i }),
    }),
    { maxLength: 6, selector: (p) => p.nome },
  ),
});

const urlExterna = (i, utm) => `https://ext${i}.example.com/doc${utm ? '?utm_source=x' : ''}`;

test('Feature: comparacoes-sdds, Property 24: lista exatamente os links internos quebrados e as URLs com utm_source', () => {
  fc.assert(
    fc.property(arvore, ({ existentes, paginas }) => {
      const existe = (rel) => existentes.some((i) => rel === `alvo${i}.html`);
      const fontes = paginas.map((p) => ({
        arquivo: `pag${p.nome}.html`,
        texto: '<html>' + [
          ...p.internos.map((i) => `<a href="alvo${i}.html">x</a>`),
          ...p.externos.map(([i, utm]) => `<a href="${urlExterna(i, utm)}">e</a>`),
        ].join('') + '</html>',
      }));

      const esperadoQuebrados = paginas.flatMap((p) =>
        p.internos.filter((i) => !existentes.includes(i))
          .map((i) => ({ origem: `pag${p.nome}.html`, destino: `alvo${i}.html` })));
      const esperadoRevisao = paginas.flatMap((p) =>
        p.externos.filter(([, utm]) => utm)
          .map(([i, utm]) => ({ origem: `pag${p.nome}.html`, destino: urlExterna(i, utm), motivo: 'utm_source' })));

      const r = analisar(fontes, existe);
      assert.deepEqual(r.quebrados, esperadoQuebrados);
      assert.deepEqual(r.revisao, esperadoRevisao);
    }),
    { numRuns: 100 },
  );
});

test('Feature: comparacoes-sdds, Property 24: erros de dados correspondem exatamente às ferramentas inválidas', () => {
  fc.assert(
    fc.property(
      fc.uniqueArray(fc.record({ id: fc.stringMatching(/^[a-z]{1,8}$/), ok: fc.boolean() }), {
        maxLength: 8,
        selector: (f) => f.id,
      }),
      (ferrs) => {
        const validar = (f) => (f.ok ? [] : ['campo inválido', 'outro erro']);
        const erros = errosDeDados(ferrs, validar);
        const esperado = ferrs.filter((f) => !f.ok).flatMap((f) =>
          ['campo inválido', 'outro erro'].map((erro) => ({ ferramenta: f.id, erro })));
        assert.deepEqual(erros, esperado);
      },
    ),
    { numRuns: 100 },
  );
});
