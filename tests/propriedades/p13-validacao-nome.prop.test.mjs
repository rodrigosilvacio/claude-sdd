import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { validarNome } from '../../assets/js/core/certificado.js';

// Feature: comparacoes-sdds, Property 13: Validação do nome
// **Validates: Requirements 14.5, 14.6, 14.7**

const CONFIG = { numRuns: 100 };
const LETRA = /^[\p{L}\p{M}]$/u;
const PERMITIDO = /^[\p{L}\p{M} '’.\-]$/u;

// Oráculo independente: texto sem espaços nas extremidades, 3 a 80 pontos de código,
// apenas caracteres permitidos (e iniciando com letra, regra adicional da implementação).
function esperado(bruto) {
  const nome = String(bruto).trim().normalize('NFC');
  const cps = [...nome];
  return cps.length >= 3 && cps.length <= 80 && LETRA.test(cps[0]) && cps.every((c) => PERMITIDO.test(c));
}

const letras = fc.constantFrom(...'abcxyzABCXYZáéíóúâêôãõçÁÉÇñüßøåÿ', 'ж', '中', 'α');
const meio = fc.constantFrom(...'abcdeXYZáéç', ' ', "'", '’', '-', '.');
const arbValido = fc
  .tuple(letras, fc.array(fc.oneof(letras, meio), { minLength: 2, maxLength: 79 }))
  .map(([a, r]) => a + r.join(''))
  .filter((s) => [...s.trim()].length >= 3);

const arbQualquer = fc.oneof(
  fc.string({ unit: 'binary', maxLength: 100 }),
  fc.string({ maxLength: 100 }),
  arbValido,
  arbValido.map((s) => `  ${s}\t\n`),
  fc.string({ minLength: 81, maxLength: 120, unit: fc.constantFrom(...'abcdé') }),
);

function mensagemPt(erro) {
  return typeof erro === 'string' && erro.length > 0 && /[áéíóúãõçê]|nome|Use|Informe/.test(erro);
}

test('P13: aceita se e somente se o nome atende tamanho e caracteres permitidos', () => {
  fc.assert(
    fc.property(arbQualquer, (entrada) => {
      const r = validarNome(entrada);
      assert.equal(r.ok, esperado(entrada));
    }),
    CONFIG,
  );
});

test('P13: nomes válidos são aceitos e devolvidos sem espaços nas extremidades', () => {
  fc.assert(
    fc.property(arbValido, (s) => {
      const r = validarNome(`  ${s} `);
      assert.equal(r.ok, true);
      assert.equal(r.nome, s.trim().normalize('NFC'));
    }),
    CONFIG,
  );
});

test('P13: toda rejeição traz mensagem em português e nenhum nome', () => {
  fc.assert(
    fc.property(arbQualquer, (entrada) => {
      const r = validarNome(entrada);
      fc.pre(!r.ok);
      assert.ok(mensagemPt(r.erro), `mensagem inesperada: ${r.erro}`);
      assert.equal('nome' in r, false);
    }),
    CONFIG,
  );
});

test('P13: caracteres proibidos (dígitos, símbolos, marcação) são rejeitados', () => {
  const proibido = fc.constantFrom(...'0123456789<>&"/\\@#$%*_+=()[]{}|;:,!?', '\u0000', '\u200b', '😀');
  fc.assert(
    fc.property(arbValido, proibido, fc.nat(), (s, p, i) => {
      const pos = i % (s.length + 1);
      const entrada = s.slice(0, pos) + p + s.slice(pos);
      assert.equal(validarNome(entrada).ok, false);
    }),
    CONFIG,
  );
});

test('P13: entradas não textuais não lançam e são rejeitadas', () => {
  for (const v of [null, undefined, '', '   ']) {
    assert.equal(validarNome(v).ok, false);
  }
});
