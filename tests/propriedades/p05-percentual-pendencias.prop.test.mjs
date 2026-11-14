import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { vazio, percentual, pendencias, conclusaoTotal } from '../../assets/js/core/progresso.js';

// Feature: comparacoes-sdds, Property 5: Percentual e pendências formam uma partição
// **Validates: Requirements 2.5, 3.2, 14.2**

const arbEspecItem = fc.record({
  tipo: fc.constantFrom('licao', 'tutorial', 'exercicio', 'quiz'),
  feito: fc.boolean(),
  nItens: fc.integer({ min: 1, max: 3 }), // tamanho do checklist (exercícios)
  marcados: fc.integer({ min: 0, max: 2 }), // itens marcados quando não concluído
});

const arbModulos = fc.array(fc.array(arbEspecItem, { maxLength: 6 }), { maxLength: 5 });

// Constrói catálogo com ids únicos e um progresso coerente com as flags geradas.
const construir = (especModulos) => {
  const catalogo = { modulos: [], checklists: {} };
  const p = vazio();
  let n = 0;
  especModulos.forEach((itens, mi) => {
    const modulo = { id: `m${mi}`, itens: [] };
    for (const e of itens) {
      const k = n++;
      const id = e.tipo === 'exercicio' ? `exercicio:f${k}` : e.tipo === 'quiz' ? `quiz:q${k}` : `${e.tipo}:${k}`;
      modulo.itens.push({ id, tipo: e.tipo, titulo: `T${k}`, url: `/u/${k}` });
      if (e.tipo === 'licao' || e.tipo === 'tutorial') {
        if (e.feito) p.licoes.add(id);
      } else if (e.tipo === 'exercicio') {
        const ids = Array.from({ length: e.nItens }, (_, j) => `c${k}-${j}`);
        catalogo.checklists[`f${k}`] = ids.map((i) => ({ id: i }));
        const qtd = e.feito ? ids.length : Math.min(e.marcados, ids.length - 1);
        if (qtd > 0) p.checklists.set(`f${k}`, new Set(ids.slice(0, qtd)));
      } else {
        p.quizzes.set(`q${k}`, { aprovado: e.feito, melhorPct: e.feito ? 80 : 40 });
      }
    }
    catalogo.modulos.push(modulo);
  });
  return { catalogo, p };
};

test('Feature: comparacoes-sdds, Property 5: concluídos e pendências particionam o total; percentual e conclusaoTotal coerentes', () => {
  fc.assert(
    fc.property(arbModulos, (espec) => {
      const { catalogo, p } = construir(espec);
      const total = espec.flat().length;
      const concluidos = espec.flat().filter((e) => e.feito).length;

      const pend = pendencias(p, catalogo);
      const lista = [...pend.licoes, ...pend.exercicios, ...pend.quizzes];
      const ids = lista.map((x) => x.id);

      assert.equal(new Set(ids).size, ids.length);
      assert.equal(concluidos + lista.length, total);
      assert.equal(lista.length, espec.flat().filter((e) => !e.feito).length);
      for (const x of lista) assert.ok(x.titulo && x.url);

      const esperado = total === 0 ? 0 : Math.round((concluidos / total) * 100);
      const pct = percentual(p, catalogo);
      assert.equal(pct, esperado);
      assert.ok(Number.isInteger(pct) && pct >= 0 && pct <= 100);

      // Catálogo vazio: sem pendências, conclusaoTotal verdadeira e percentual 0.
      assert.equal(conclusaoTotal(p, catalogo), lista.length === 0);
      if (total > 0) assert.equal(conclusaoTotal(p, catalogo), lista.length === 0 && pct === 100);
    }),
    { numRuns: 100 },
  );
});
