import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import fc from 'fast-check';
import { ferramentas } from '../../assets/data/ferramentas.js';
import {
  PARES_CONTRASTE,
  CONTRASTE_TEXTO,
  CONTRASTE_NAO_TEXTO,
  razaoContraste,
  variaveisCss,
  verificarContraste,
} from '../../tools/verificar-conteudo.mjs';
// Feature: comparacoes-sdds, Property 22: Contraste dos tokens de cor
// **Validates: Requirements 11.1, 18.4**
const css = readFileSync(new URL('../../assets/css/tokens.css', import.meta.url), 'utf8');
const vars = variaveisCss(css);
const fundo = vars['--cor-fundo'];

test('Feature: comparacoes-sdds, Property 22: todo par de tokens atinge 4,5:1 (texto) ou 3:1 (linhas, ícones, destaques)', () => {
  assert.ok(PARES_CONTRASTE.length > 0);
  fc.assert(
    fc.property(fc.constantFrom(...PARES_CONTRASTE), ([fg, bg, min]) => {
      assert.ok(vars[fg] && vars[bg], `token ausente: ${fg}/${bg}`);
      const r = razaoContraste(vars[fg], vars[bg]);
      assert.ok(r >= min, `${fg}/${bg} = ${r}:1 < ${min}:1`);
      assert.ok(min === CONTRASTE_TEXTO || min === CONTRASTE_NAO_TEXTO);
      assert.ok(Math.abs(razaoContraste(vars[bg], vars[fg]) - r) < 1e-9); // simetria
    }),
    { numRuns: 100 },
  );
});

test('Feature: comparacoes-sdds, Property 22: a cor de identidade de cada ferramenta tem ao menos 3:1 sobre o fundo', () => {
  assert.ok(ferramentas.length > 0);
  fc.assert(
    fc.property(fc.constantFrom(...ferramentas), (f) => {
      const r = razaoContraste(f.identidade.cor, fundo);
      assert.ok(r >= CONTRASTE_NAO_TEXTO, `${f.id} (${f.identidade.cor}) = ${r}:1`);
    }),
    { numRuns: 100 },
  );
});

test('Feature: comparacoes-sdds, Property 22: verificarContraste não reporta erros para os tokens e ferramentas reais', () => {
  assert.deepEqual(verificarContraste(css, ferramentas), []);
});
