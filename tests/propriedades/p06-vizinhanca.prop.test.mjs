import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { vizinhas, proximaLicao, vazio } from '../../assets/js/core/progresso.js';

// Feature: comparacoes-sdds, Property 6: Vizinhança de lições
// **Validates: Requirements 3.2, 2.5**

const arbTipo = fc.constantFrom('licao', 'tutorial', 'exercicio', 'quiz');

// Catálogo com ids únicos globalmente; módulos podem ter 1..8 itens.
const arbCatalogo = fc
  .array(fc.array(arbTipo, { minLength: 1, maxLength: 8 }), { minLength: 1, maxLength: 6 })
  .map((modulos) => ({
    modulos: modulos.map((tipos, m) => ({
      id: `m${m}`,
      itens: tipos.map((tipo, i) => ({ id: `${tipo}:m${m}-i${i}`, tipo, titulo: `t${m}.${i}`, url: `#/m${m}/i${i}` })),
    })),
  }));

test('Feature: comparacoes-sdds, Property 6: vizinhas devolve adjacentes imediatos e null nas extremidades', () => {
  fc.assert(
    fc.property(arbCatalogo, (catalogo) => {
      for (const mod of catalogo.modulos) {
        mod.itens.forEach((item, idx) => {
          const v = vizinhas(mod.id, item.id, catalogo);
          assert.equal(v.anterior, idx === 0 ? null : mod.itens[idx - 1]);
          assert.equal(v.proxima, idx === mod.itens.length - 1 ? null : mod.itens[idx + 1]);
        });
        // item inexistente
        assert.deepEqual(vizinhas(mod.id, 'inexistente', catalogo), { anterior: null, proxima: null });
      }
    }),
    { numRuns: 100 },
  );
});

test('Feature: comparacoes-sdds, Property 6: proximaLicao é a primeira lição não concluída na ordem do catálogo', () => {
  fc.assert(
    fc.property(arbCatalogo, fc.array(fc.boolean(), { maxLength: 60 }), (catalogo, marcas) => {
      const licoes = catalogo.modulos
        .flatMap((m) => m.itens)
        .filter((i) => i.tipo === 'licao' || i.tipo === 'tutorial');
      const p = vazio();
      licoes.forEach((l, i) => { if (marcas[i]) p.licoes.add(l.id); });

      const esperado = licoes.find((l) => !p.licoes.has(l.id)) ?? null;
      assert.equal(proximaLicao(p, catalogo), esperado);
      if (esperado) assert.equal(p.licoes.has(esperado.id), false);
    }),
    { numRuns: 100 },
  );
});
