import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { ferramentas, validarFerramenta } from '../../assets/data/ferramentas.js';

// Feature: comparacoes-sdds, Property 23: Dados de ferramentas válidos e fonte registrada
// **Validates: Requirements 5.7, 5.8, 12.6, 16.2**

const RE_DATA = /^\d{2}\/\d{2}\/\d{4}$/;

test('Feature: comparacoes-sdds, Property 23: toda ferramenta tem URL oficial válida sem utm_* e Data_Consulta dd/mm/aaaa', () => {
  assert.ok(ferramentas.length > 0);
  fc.assert(
    fc.property(fc.constantFrom(...ferramentas), (f) => {
      const url = new URL(f.urlOficial); // lança se inválida
      assert.ok(['http:', 'https:'].includes(url.protocol));
      for (const chave of url.searchParams.keys()) {
        assert.ok(!chave.toLowerCase().startsWith('utm_'), `utm em ${f.id}`);
      }
      assert.ok(!/utm_/i.test(f.urlOficial));
      for (const extra of f.fontesAdicionais ?? []) {
        assert.ok(!/utm_/i.test(extra));
        new URL(extra);
      }
      assert.match(f.dataConsulta, RE_DATA);
      assert.deepEqual(validarFerramenta(f), []);
    }),
    { numRuns: 100 },
  );
});

test('Feature: comparacoes-sdds, Property 23: validarFerramenta devolve [] se, e somente se, há URL oficial e Data_Consulta', () => {
  const arbCampo = fc.oneof(fc.constant(undefined), fc.constant(null), fc.constant(''), fc.string({ minLength: 1 }));
  fc.assert(
    fc.property(fc.constantFrom(...ferramentas), arbCampo, arbCampo, (base, url, data) => {
      const f = { ...base, urlOficial: url, dataConsulta: data };
      const erros = validarFerramenta(f);
      const completa = Boolean(url) && Boolean(data);
      assert.equal(erros.length === 0, completa);
      if (!url) assert.ok(erros.length >= 1);
      if (!data) assert.ok(erros.length >= 1);
    }),
    { numRuns: 100 },
  );
});
