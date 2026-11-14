import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { criarGerenciador, exercicioConcluido } from '../../assets/js/core/progresso.js';

// Feature: comparacoes-sdds, Property 4: Checklist restaura o estado e define a conclusão
// **Validates: Requirements 6.3, 6.4, 6.5**

const criarStorage = () => {
  const dados = new Map();
  return {
    getItem: (k) => (dados.has(k) ? dados.get(k) : null),
    setItem: (k, v) => { dados.set(k, String(v)); },
    removeItem: (k) => { dados.delete(k); },
  };
};

// Checklist de 5 a 8 itens e uma sequência de alternâncias sobre índices desses itens.
const arbCenario = fc.integer({ min: 5, max: 8 }).chain((n) => fc.record({
  n: fc.constant(n),
  toggles: fc.array(fc.integer({ min: 0, max: n - 1 }), { maxLength: 60 }),
}));

test('Feature: comparacoes-sdds, Property 4: recarregar devolve os itens marcados e a conclusão equivale a todos marcados', () => {
  fc.assert(
    fc.property(arbCenario, ({ n, toggles }) => {
      const ferramenta = 'openspec';
      const itens = Array.from({ length: n }, (_, i) => ({ id: `${ferramenta}/c${i + 1}`, texto: `item ${i + 1}` }));
      const catalogo = { modulos: [], checklists: { [ferramenta]: itens } };
      const storage = criarStorage();
      const g = criarGerenciador(() => storage, catalogo);

      const esperado = new Set();
      for (const idx of toggles) {
        const id = itens[idx].id;
        const marcado = g.alternarItem(ferramenta, id);
        if (esperado.has(id)) esperado.delete(id); else esperado.add(id);
        assert.equal(marcado, esperado.has(id));
        assert.equal(exercicioConcluido(g.estado(), ferramenta, catalogo), esperado.size === n);
      }

      // Recarregar: novo gerenciador sobre o mesmo storage.
      const g2 = criarGerenciador(() => storage, catalogo);
      const restaurado = g2.estado().checklists.get(ferramenta) ?? new Set();
      assert.deepEqual([...restaurado].sort(), [...esperado].sort());
      assert.equal(exercicioConcluido(g2.estado(), ferramenta, catalogo), esperado.size === n);

      // Desmarcar qualquer item de um exercício concluído remove a conclusão.
      if (esperado.size === n) {
        for (const item of itens) {
          g2.alternarItem(ferramenta, item.id);
          assert.equal(exercicioConcluido(g2.estado(), ferramenta, catalogo), false);
          g2.alternarItem(ferramenta, item.id);
          assert.equal(exercicioConcluido(g2.estado(), ferramenta, catalogo), true);
        }
      }
    }),
    { numRuns: 100 },
  );
});
