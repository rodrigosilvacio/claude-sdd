import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { avaliar } from '../../assets/js/core/quiz.js';
import { NOTA_APROVACAO } from '../../assets/data/quizzes.js';

// Feature: comparacoes-sdds, Property 7: Avaliação do Quiz
// **Validates: Requirements 8.2, 8.3, 8.4, 8.5, 8.6**

const NOPCOES = 4;

// Quiz com 1..12 questões e vetor de respostas completo (índices válidos).
const arbQuizCompleto = fc
  .array(
    fc.record({
      correta: fc.integer({ min: 0, max: NOPCOES - 1 }),
      explicacao: fc.string({ minLength: 1, maxLength: 20 }),
      resposta: fc.integer({ min: 0, max: NOPCOES - 1 }),
    }),
    { minLength: 1, maxLength: 12 },
  )
  .map((qs) => ({
    quiz: { questoes: qs.map(({ correta, explicacao }) => ({ correta, explicacao })) },
    respostas: qs.map((q) => q.resposta),
  }));

// Quiz com vetor de respostas em que ao menos uma posição está ausente.
const arbQuizIncompleto = fc
  .array(
    fc.record({
      correta: fc.integer({ min: 0, max: NOPCOES - 1 }),
      explicacao: fc.string({ minLength: 1, maxLength: 20 }),
      resposta: fc.option(fc.integer({ min: 0, max: NOPCOES - 1 }), {
        nil: undefined,
      }),
      usaNull: fc.boolean(),
    }),
    { minLength: 1, maxLength: 12 },
  )
  .chain((qs) =>
    fc.integer({ min: 0, max: qs.length - 1 }).map((forcado) => {
      const respostas = qs.map((q, i) =>
        i === forcado || q.resposta === undefined
          ? q.usaNull
            ? null
            : undefined
          : q.resposta,
      );
      return {
        quiz: { questoes: qs.map(({ correta, explicacao }) => ({ correta, explicacao })) },
        respostas,
      };
    }),
  );

test('Property 7: respostas completas geram nota, feedback e aprovação corretos', () => {
  fc.assert(
    fc.property(arbQuizCompleto, ({ quiz, respostas }) => {
      const r = avaliar(quiz, respostas);
      const total = quiz.questoes.length;
      const acertos = quiz.questoes.filter((q, i) => q.correta === respostas[i]).length;
      assert.equal(r.ok, true);
      assert.equal(r.total, total);
      assert.equal(r.acertos, acertos);
      assert.equal(r.pct, Math.round((acertos / total) * 100));
      assert.equal(r.aprovado, r.pct >= NOTA_APROVACAO);
      assert.equal(NOTA_APROVACAO, 70);
      assert.equal(r.detalhes.length, total);
      r.detalhes.forEach((d, i) => {
        assert.equal(d.correta, quiz.questoes[i].correta === respostas[i]);
        assert.equal(d.explicacao, quiz.questoes[i].explicacao);
      });
    }),
    { numRuns: 100 },
  );
});

test('Property 7: respostas ausentes listam exatamente as questões sem resposta e não calculam nota', () => {
  fc.assert(
    fc.property(arbQuizIncompleto, ({ quiz, respostas }) => {
      const r = avaliar(quiz, respostas);
      const esperado = respostas.map((x, i) => (x == null ? i : -1)).filter((i) => i >= 0);
      assert.equal(r.ok, false);
      assert.deepEqual(r.faltando, esperado);
      assert.ok(esperado.length >= 1);
      assert.equal('pct' in r, false);
      assert.equal('aprovado' in r, false);
      assert.equal('acertos' in r, false);
    }),
    { numRuns: 100 },
  );
});
