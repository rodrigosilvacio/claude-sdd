import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { alternar, tabelaVisivel, MIN, MAX } from '../../assets/js/core/comparador.js';
// Feature: comparacoes-sdds, Property 9: Invariante de seleção do Comparador
// **Validates: Requirements 9.1, 9.2, 9.3**

const arbIds = fc.array(fc.constantFrom('a', 'b', 'c', 'd', 'e', 'f', 'g'), { maxLength: 40 });

test('Feature: comparacoes-sdds, Property 9: Invariante de seleção do Comparador', () => {
  fc.assert(
    fc.property(arbIds, (ids) => {
      let selecao = [];
      for (const id of ids) {
        const antes = selecao;
        const r = alternar(antes, id);
        if (!antes.includes(id) && antes.length >= MAX) {
          assert.equal(r.erro, 'limite');
          assert.deepEqual(r.selecao, antes);
        } else {
          assert.equal(r.erro, null);
        }
        selecao = r.selecao;
        assert.ok(selecao.length >= 0 && selecao.length <= MAX);
        assert.equal(new Set(selecao).size, selecao.length);
        assert.equal(tabelaVisivel(selecao), selecao.length >= MIN && selecao.length <= MAX);
      }
    }),
    { numRuns: 100 },
  );
});
