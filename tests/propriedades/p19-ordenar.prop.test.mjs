import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { verificar, mover } from '../../assets/js/core/ordenar.js';

// Feature: comparacoes-sdds, Property 19: Atividade de ordenar
// **Validates: Requirements 17.10**

const arbCanonica = fc.uniqueArray(fc.string({ minLength: 1, maxLength: 8 }), { minLength: 1, maxLength: 10 });

const arbMovimentos = fc.array(
  fc.record({ i: fc.integer({ min: -2, max: 12 }), delta: fc.constantFrom(-1, 1) }),
  { maxLength: 30 },
);

const ordenado = (a) => a.slice().sort();

test('Feature: comparacoes-sdds, Property 19: movimentos preservam o conjunto de etapas', () => {
  fc.assert(
    fc.property(arbCanonica, arbMovimentos, (canonica, movs) => {
      let ordem = canonica.slice();
      for (const { i, delta } of movs) {
        const antes = ordem;
        ordem = mover(ordem, i, delta);
        assert.notEqual(ordem, antes);
        assert.deepEqual(ordenado(ordem), ordenado(canonica));
      }
    }),
    { numRuns: 100 },
  );
});

test('Feature: comparacoes-sdds, Property 19: verificar indica acerto total sse igual à canônica e conta posições coincidentes', () => {
  fc.assert(
    fc.property(
      arbCanonica.chain((c) => fc.tuple(fc.constant(c), fc.shuffledSubarray(c, { minLength: c.length, maxLength: c.length }))),
      ([canonica, ordem]) => {
        const r = verificar(ordem, canonica);
        const coincidentes = ordem.filter((id, i) => id === canonica[i]).length;
        assert.equal(r.certos, coincidentes);
        assert.equal(r.total, canonica.length);
        const igual = ordem.every((id, i) => id === canonica[i]);
        assert.equal(r.correto, igual);
      },
    ),
    { numRuns: 100 },
  );
});

test('Feature: comparacoes-sdds, Property 19: embaralhar por movimentos e verificar mantém consistência', () => {
  fc.assert(
    fc.property(arbCanonica, arbMovimentos, (canonica, movs) => {
      let ordem = canonica.slice();
      for (const { i, delta } of movs) ordem = mover(ordem, i, delta);
      const r = verificar(ordem, canonica);
      assert.equal(r.correto, ordem.join('\u0000') === canonica.join('\u0000'));
      assert.equal(verificar(canonica, canonica).correto, true);
    }),
    { numRuns: 100 },
  );
});
