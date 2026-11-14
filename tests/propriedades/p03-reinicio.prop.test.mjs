import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { criarGerenciador, CHAVE, desserializar } from '../../assets/js/core/progresso.js';

// Feature: comparacoes-sdds, Property 3: Reinício apaga todo o progresso
// **Validates: Requirements 13.6**

const arbId = fc.stringMatching(/^[a-z0-9:-]{1,12}$/);

const arbOperacoes = fc.array(
  fc.oneof(
    fc.record({ t: fc.constant('licao'), id: arbId, feito: fc.boolean() }),
    fc.record({ t: fc.constant('item'), f: arbId, i: arbId }),
    fc.record({ t: fc.constant('quiz'), m: arbId, pct: fc.integer({ min: 0, max: 100 }) }),
  ),
  { maxLength: 40 },
);

const criarStorage = () => {
  const dados = new Map();
  return {
    dados,
    getItem: (k) => (dados.has(k) ? dados.get(k) : null),
    setItem: (k, v) => { dados.set(k, String(v)); },
    removeItem: (k) => { dados.delete(k); },
  };
};

test('Feature: comparacoes-sdds, Property 3: reiniciar deixa progresso vazio, percentual 0 e storage sem dados de progresso', () => {
  fc.assert(
    fc.property(arbOperacoes, fc.integer({ min: 1, max: 50 }), (ops, totalLicoes) => {
      const storage = criarStorage();
      const g = criarGerenciador(() => storage);
      for (const op of ops) {
        if (op.t === 'licao') g.marcarLicao(op.id, op.feito);
        else if (op.t === 'item') g.alternarItem(op.f, op.i);
        else g.registrarQuiz(op.m, op.pct);
      }

      g.reiniciar();

      const e = g.estado();
      assert.equal(e.licoes.size, 0);
      assert.equal(e.checklists.size, 0);
      assert.equal(e.quizzes.size, 0);
      assert.equal((e.licoes.size / totalLicoes) * 100, 0);
      assert.equal(storage.getItem(CHAVE), null);
      assert.equal(storage.dados.has(CHAVE), false);

      // Um novo gerenciador sobre o mesmo storage também começa vazio, sem aviso.
      const g2 = criarGerenciador(() => storage);
      assert.equal(g2.estado().licoes.size, 0);
      assert.equal(g2.estado().checklists.size, 0);
      assert.equal(g2.estado().quizzes.size, 0);
      assert.equal(g2.avisos().corrompido, false);
      assert.equal(desserializar(storage.getItem(CHAVE)).progresso.licoes.size, 0);
    }),
    { numRuns: 100 },
  );
});
