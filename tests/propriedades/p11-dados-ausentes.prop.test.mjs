import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { linhasTabela, NAO_INFORMADO } from '../../assets/js/core/comparador.js';

// Feature: comparacoes-sdds, Property 11: Dados ausentes são exibidos como "verificar na fonte"
// **Validates: Requirements 9.15, 16.3**

const CAMPOS = ['licenca', 'custo', 'integracao'];

const arbAusente = fc.constantFrom(undefined, null, '', ' ', '   ', '\t\n');
const arbPresente = fc
  .stringMatching(/^[A-Za-z0-9][A-Za-z0-9 .\-]{0,30}$/)
  .filter((t) => t.trim() !== '' && t.trim() !== NAO_INFORMADO);

// Cada campo é ausente (valor nulo/vazio ou chave omitida) ou presente; a posição é topo ou "atributos".
const arbCampo = fc.record({
  ausente: fc.boolean(),
  omitir: fc.boolean(),
  noAtributos: fc.boolean(),
  vazio: arbAusente,
  valor: arbPresente,
});

const arbFerramentas = fc
  .uniqueArray(fc.stringMatching(/^[a-z][a-z0-9-]{0,10}$/), { minLength: 2, maxLength: 4 })
  .chain((ids) =>
    fc.tuple(...ids.map(() => fc.tuple(arbCampo, arbCampo, arbCampo))).map((campos) =>
      ids.map((id, i) => {
        const f = { id, nome: id, atributos: {} };
        const esperado = {};
        CAMPOS.forEach((c, j) => {
          const { ausente, omitir, noAtributos, vazio, valor } = campos[i][j];
          const alvo = noAtributos ? f.atributos : f;
          if (ausente) {
            if (!omitir) alvo[c] = vazio;
            esperado[c] = NAO_INFORMADO;
          } else {
            alvo[c] = valor;
            esperado[c] = valor.trim();
          }
        });
        return { f, esperado };
      }),
    ),
  );

test('Feature: comparacoes-sdds, Property 11: campos ausentes de licença, custo e agentes viram "verificar na fonte"', () => {
  fc.assert(
    fc.property(arbFerramentas, (itens) => {
      const ferramentas = itens.map((x) => x.f);
      const selecao = ferramentas.map((f) => f.id);
      const linhas = linhasTabela(selecao, ferramentas);
      for (const campo of CAMPOS) {
        const linha = linhas.find((l) => l.id === campo);
        assert.ok(linha, `linha ${campo} existe`);
        assert.equal(linha.valores.length, ferramentas.length);
        linha.valores.forEach((v, i) => {
          assert.equal(v.ferramenta, ferramentas[i].id);
          assert.equal(v.texto, itens[i].esperado[campo]);
        });
      }
    }),
    { numRuns: 100 },
  );
});

test('Feature: comparacoes-sdds, Property 11: ferramenta sem nenhum atributo exibe "verificar na fonte" em todos os critérios', () => {
  fc.assert(
    fc.property(
      fc.uniqueArray(fc.stringMatching(/^[a-z][a-z0-9-]{0,10}$/), { minLength: 2, maxLength: 4 }),
      (ids) => {
        const ferramentas = ids.map((id) => ({ id, nome: id }));
        const linhas = linhasTabela(ids, ferramentas);
        for (const linha of linhas) {
          for (const v of linha.valores) assert.equal(v.texto, NAO_INFORMADO);
        }
      },
    ),
    { numRuns: 100 },
  );
});
