import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { serializar, desserializar, criarGerenciador, vazio } from '../../assets/js/core/progresso.js';

// Feature: comparacoes-sdds, Property 1: Round trip do progresso
// **Validates: Requirements 13.2, 13.3**

const arbId = fc.stringMatching(/^[a-z0-9][a-z0-9-]{0,15}$/);
const arbPct = fc.integer({ min: 0, max: 1000 }).map((n) => n / 10);

const arbProgresso = fc.record({
  licoes: fc.uniqueArray(arbId, { maxLength: 15 }),
  checklists: fc.uniqueArray(
    fc.tuple(arbId, fc.uniqueArray(arbId, { minLength: 1, maxLength: 8 })),
    { selector: ([k]) => k, maxLength: 6 },
  ),
  quizzes: fc.uniqueArray(
    fc.tuple(arbId, fc.boolean(), arbPct),
    { selector: ([k]) => k, maxLength: 6 },
  ),
}).map(({ licoes, checklists, quizzes }) => ({
  licoes: new Set(licoes),
  checklists: new Map(checklists.map(([k, itens]) => [k, new Set(itens)])),
  quizzes: new Map(quizzes.map(([k, aprovado, melhorPct]) => [k, { aprovado, melhorPct }])),
}));

const equivalentes = (a, b) => {
  assert.deepEqual(a.licoes, b.licoes);
  assert.deepEqual(a.checklists, b.checklists);
  assert.deepEqual(a.quizzes, b.quizzes);
};

const criarStorage = () => {
  const dados = new Map();
  return {
    getItem: (k) => (dados.has(k) ? dados.get(k) : null),
    setItem: (k, v) => { dados.set(k, String(v)); },
    removeItem: (k) => { dados.delete(k); },
  };
};

test('Feature: comparacoes-sdds, Property 1: desserializar(serializar(p)) é equivalente a p, inclusive via JSON', () => {
  fc.assert(
    fc.property(arbProgresso, (p) => {
      const direto = desserializar(JSON.stringify(serializar(p)));
      assert.equal(direto.aviso, null);
      equivalentes(direto.progresso, p);
      // Serializar é idempotente após o round trip.
      assert.deepEqual(serializar(direto.progresso), serializar(p));
    }),
    { numRuns: 100 },
  );
});

test('Feature: comparacoes-sdds, Property 1: gravar no storage e recarregar devolve o mesmo estado', () => {
  fc.assert(
    fc.property(
      fc.uniqueArray(arbId, { maxLength: 15 }),
      fc.uniqueArray(fc.tuple(arbId, arbId), { maxLength: 15, selector: ([a, b]) => `${a}\u0000${b}` }),
      fc.array(fc.tuple(arbId, arbPct), { maxLength: 10 }),
      (licoes, itens, resultados) => {
        const storage = criarStorage();
        const g1 = criarGerenciador(() => storage);
        for (const id of licoes) g1.marcarLicao(id);
        for (const [f, i] of itens) g1.alternarItem(f, i);
        for (const [m, pct] of resultados) g1.registrarQuiz(m, pct);

        const g2 = criarGerenciador(() => storage);
        equivalentes(g2.estado(), g1.estado());
        assert.deepEqual(g2.avisos(), { semArmazenamento: false, corrompido: false });
      },
    ),
    { numRuns: 100 },
  );
});

test('Feature: comparacoes-sdds, Property 1: progresso vazio faz round trip para vazio', () => {
  const { progresso, aviso } = desserializar(JSON.stringify(serializar(vazio())));
  assert.equal(aviso, null);
  equivalentes(progresso, vazio());
});
