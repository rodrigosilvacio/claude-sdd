import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { formatarData, lerData, formatarNumero } from '../../assets/js/core/formato.js';

// Feature: comparacoes-sdds, Property 17: Round trip de formatação de data
// **Validates: Requirements 10.3**

// Data válida do calendário real (ano 1..9999), construída em calendário local.
const arbData = fc
  .record({
    ano: fc.integer({ min: 1, max: 9999 }),
    mes: fc.integer({ min: 1, max: 12 }),
    dia: fc.integer({ min: 1, max: 31 }),
  })
  .map(({ ano, mes, dia }) => {
    const d = new Date(2000, 0, 1);
    d.setFullYear(ano, mes - 1, 1);
    const ultimo = new Date(d.getTime());
    ultimo.setFullYear(ano, mes, 0);
    d.setFullYear(ano, mes - 1, Math.min(dia, ultimo.getDate()));
    d.setHours(0, 0, 0, 0);
    return d;
  });

test('Feature: comparacoes-sdds, Property 17: lerData(formatarData(d)) devolve a mesma data e o padrão é dd/mm/aaaa', () => {
  fc.assert(
    fc.property(arbData, (d) => {
      const texto = formatarData(d);
      assert.match(texto, /^\d{2}\/\d{2}\/\d{4}$/);
      const volta = lerData(texto);
      assert.notEqual(volta, null);
      assert.equal(volta.getFullYear(), d.getFullYear());
      assert.equal(volta.getMonth(), d.getMonth());
      assert.equal(volta.getDate(), d.getDate());
      assert.equal(formatarData(volta), texto);
    }),
    { numRuns: 100 },
  );
});

test('Feature: comparacoes-sdds, Property 17: formatarNumero usa vírgula como separador decimal', () => {
  fc.assert(
    fc.property(
      fc.double({ min: -1e6, max: 1e6, noNaN: true }),
      fc.integer({ min: 1, max: 4 }),
      (n, casas) => {
        const texto = formatarNumero(n, casas);
        assert.ok(!texto.includes('.'));
        assert.match(texto, new RegExp(`^-?\\d+,\\d{${casas}}$`));
      },
    ),
    { numRuns: 100 },
  );
});
