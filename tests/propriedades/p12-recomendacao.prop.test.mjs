import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { recomendar } from '../../assets/js/core/comparador.js';
// Feature: comparacoes-sdds, Property 12: Recomendação determinística e válida
// **Validates: Requirements 9.6, 9.7**

const arbPerfil = fc.record({
  tipo: fc.constantFrom('web', 'api', 'cli', 'outro'),
  equipe: fc.constantFrom('solo', 'pequena', 'grande'),
  base: fc.constantFrom('novo', 'existente'),
});
const arbNota = fc.integer({ min: 0, max: 5 });
const arbNotas = fc.record({
  fluxo: arbNota, curva: arbNota, integracao: arbNota, formato: arbNota, equipe: arbNota,
});

// Ferramentas com ids únicos, algumas sem nota (devem ser ignoradas); notas com valores repetidos geram empates.
const arbCenario = fc
  .uniqueArray(fc.stringMatching(/^[a-z][a-z0-9-]{0,8}$/), { minLength: 0, maxLength: 9 })
  .chain((ids) =>
    fc.record({
      ferramentas: fc.constant(
        ids.map((id, i) => ({
          id,
          nome: `Ferramenta ${id}`,
          proposito: i % 3 === 0 ? 'Suporta onboard de projetos existentes' : 'Fluxo guiado',
          comandosPermitidos: [],
          atributos: {},
        })),
      ),
      notas: fc
        .array(fc.option(arbNotas, { nil: undefined }), { minLength: ids.length, maxLength: ids.length })
        .map((arr) => Object.fromEntries(ids.map((id, i) => [id, arr[i]]).filter(([, n]) => n))),
    }),
  );

test('Property 12: recomendação é determinística, válida, ordenada e justificada', () => {
  fc.assert(
    fc.property(arbPerfil, arbCenario, ({ tipo, equipe, base }, { ferramentas, notas }) => {
      const perfil = { tipo, equipe, base };
      const r1 = recomendar(perfil, ferramentas, notas);
      const r2 = recomendar({ ...perfil }, [...ferramentas], { ...notas });
      assert.deepEqual(r1, r2);

      const existentes = new Set(ferramentas.map((f) => f.id));
      const ids = r1.map((r) => r.id);
      assert.ok(ids.every((id) => existentes.has(id)));
      assert.equal(new Set(ids).size, ids.length);
      assert.ok(r1.length <= 3);
      assert.equal(r1.length, Math.min(3, Object.keys(notas).length));

      for (let i = 1; i < r1.length; i++) {
        const a = r1[i - 1];
        const b = r1[i];
        assert.ok(a.pontuacao > b.pontuacao || (a.pontuacao === b.pontuacao && a.id < b.id));
      }
      for (const r of r1) {
        assert.equal(typeof r.justificativa, 'string');
        assert.ok(r.justificativa.trim().length > 0);
      }
    }),
    { numRuns: 100 },
  );
});
