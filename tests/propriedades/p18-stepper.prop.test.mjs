import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { mover, rotulo } from '../../assets/js/core/stepper-estado.js';

// Feature: comparacoes-sdds, Property 18: Estado do Stepper
// **Validates: Requirements 17.11**

const arbAcoes = fc.array(fc.constantFrom('proximo', 'anterior'), { maxLength: 60 });

test('Feature: comparacoes-sdds, Property 18: passo permanece em [1, M], limites não alteram estado e indicador é "passo N de M"', () => {
  fc.assert(
    fc.property(fc.integer({ min: 1, max: 20 }), arbAcoes, (total, acoes) => {
      let s = { atual: 1, total };
      assert.equal(rotulo(s), `passo 1 de ${total}`);
      for (const acao of acoes) {
        const antes = s;
        s = mover(s, acao);
        assert.ok(s.atual >= 1 && s.atual <= total);
        assert.equal(s.total, total);
        if (acao === 'proximo' && antes.atual === total) assert.deepEqual(s, antes);
        else if (acao === 'anterior' && antes.atual === 1) assert.deepEqual(s, antes);
        else assert.equal(s.atual, antes.atual + (acao === 'proximo' ? 1 : -1));
        assert.equal(rotulo(s), `passo ${s.atual} de ${total}`);
      }
    }),
    { numRuns: 100 },
  );
});
