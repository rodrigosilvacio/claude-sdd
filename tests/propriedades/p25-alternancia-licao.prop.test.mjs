import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { criarGerenciador, serializar } from '../../assets/js/core/progresso.js';

// Feature: comparacoes-sdds, Property 25: Alternância da lição pelo Botão_Concluir
// **Validates: Requirements 13.2, 19.2, 19.3, 19.6**

const arbId = fc.stringMatching(/^[a-z][a-z0-9-]{0,8}$/);

const arbCenario = fc
  .record({
    licoes: fc.uniqueArray(arbId, { minLength: 1, maxLength: 8 }),
    concluidasInicial: fc.array(fc.boolean(), { minLength: 8, maxLength: 8 }),
    checklists: fc.dictionary(arbId, fc.uniqueArray(arbId, { minLength: 1, maxLength: 4 }), { maxKeys: 3 }),
    quizzes: fc.dictionary(
      arbId,
      fc.record({ aprovado: fc.boolean(), melhorPct: fc.integer({ min: 0, max: 100 }) }),
      { maxKeys: 3 },
    ),
    // índices de lições acionadas, em sequência
    acionamentos: fc.array(fc.nat(), { maxLength: 40 }),
  });

const armazenamento = () => {
  const dados = new Map();
  return {
    getItem: (k) => (dados.has(k) ? dados.get(k) : null),
    setItem: (k, v) => { dados.set(k, String(v)); },
    removeItem: (k) => { dados.delete(k); },
  };
};

test('Feature: comparacoes-sdds, Property 25: lição concluída sse nº de acionamentos ímpar; só ela muda; recarga preserva', () => {
  fc.assert(
    fc.property(arbCenario, (c) => {
      const storage = armazenamento();
      const g = criarGerenciador(() => storage);
      // estado inicial
      c.licoes.forEach((id, i) => { if (c.concluidasInicial[i]) g.marcarLicao(id, true); });
      for (const [k, itens] of Object.entries(c.checklists)) itens.forEach(() => {});
      const base = g.estado();
      for (const [k, itens] of Object.entries(c.checklists)) base.checklists.set(k, new Set(itens));
      for (const [k, q] of Object.entries(c.quizzes)) base.quizzes.set(k, { ...q });
      g.marcarLicao(c.licoes[0], g.licaoConcluida(c.licoes[0])); // força gravação do estado completo

      const inicial = c.licoes.map((id) => g.licaoConcluida(id));
      const contagem = new Map(c.licoes.map((id) => [id, 0]));
      const semLicoes = (p) => JSON.stringify({ ...serializar(p), licoes: [] });

      for (const n of c.acionamentos) {
        const id = c.licoes[n % c.licoes.length];
        const antes = new Map(c.licoes.map((l) => [l, g.licaoConcluida(l)]));
        const outrosAntes = semLicoes(g.estado());
        // Botão_Concluir: alterna conforme o estado atual
        g.marcarLicao(id, !g.licaoConcluida(id));
        contagem.set(id, contagem.get(id) + 1);
        assert.equal(g.licaoConcluida(id), !antes.get(id));
        for (const l of c.licoes) if (l !== id) assert.equal(g.licaoConcluida(l), antes.get(l));
        assert.equal(semLicoes(g.estado()), outrosAntes);
      }

      c.licoes.forEach((id, i) => {
        assert.equal(g.licaoConcluida(id), inicial[i] !== (contagem.get(id) % 2 === 1));
      });

      // recarregar devolve o mesmo estado
      const recarregado = criarGerenciador(() => storage);
      for (const id of c.licoes) assert.equal(recarregado.licaoConcluida(id), g.licaoConcluida(id));
      assert.deepEqual(serializar(recarregado.estado()), serializar(g.estado()));
    }),
    { numRuns: 100 },
  );
});
