import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { criarGerenciador } from '../../assets/js/core/progresso.js';
import { NOTA_APROVACAO } from '../../assets/data/quizzes.js';

// Feature: comparacoes-sdds, Property 8: Aprovação do Quiz é monotônica
// **Validates: Requirements 8.5, 8.6, 8.7**

const criarStorage = () => {
  const dados = new Map();
  return {
    getItem: (k) => (dados.has(k) ? dados.get(k) : null),
    setItem: (k, v) => { dados.set(k, String(v)); },
    removeItem: (k) => { dados.delete(k); },
  };
};

test('Feature: comparacoes-sdds, Property 8: aprovado nunca volta a falso, melhorPct é o máximo e o valor persiste ao reabrir', () => {
  fc.assert(
    fc.property(
      fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 1, maxLength: 30 }),
      (tentativas) => {
        const storage = criarStorage();
        const g = criarGerenciador(() => storage);
        let aprovadoAnterior = false;
        let maximo = -Infinity;
        for (const pct of tentativas) {
          const r = g.registrarQuiz('mod', pct);
          maximo = Math.max(maximo, pct);
          if (aprovadoAnterior) assert.equal(r.aprovado, true); // nunca volta a falso
          assert.equal(r.aprovado, maximo >= NOTA_APROVACAO);
          assert.equal(r.melhorPct, maximo);
          aprovadoAnterior = r.aprovado;
        }
        // Ao reabrir, o status exibido reflete o valor final.
        const reaberto = criarGerenciador(() => storage).estado().quizzes.get('mod');
        assert.deepEqual(reaberto, { aprovado: aprovadoAnterior, melhorPct: maximo });
      },
    ),
    { numRuns: 100 },
  );
});
