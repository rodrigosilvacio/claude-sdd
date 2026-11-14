import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { criarGerenciador } from '../../assets/js/core/progresso.js';

// Feature: comparacoes-sdds, Property 27: Botão_Concluir sem localStorage
// **Validates: Requirements 19.10, 13.7**

const arbId = fc.stringMatching(/^[a-z][a-z0-9-]{0,8}$/);

const erro = () => { throw new Error('storage indisponível'); };
const fabricas = {
  'acesso ao storage lança': () => erro,
  'storage ausente': () => () => null,
  'operações do storage lançam': () => () => ({ getItem: erro, setItem: erro, removeItem: erro }),
  'só setItem lança (cota)': () => () => ({ getItem: () => null, setItem: erro, removeItem: erro }),
};

test('Feature: comparacoes-sdds, Property 27: sem storage, Botão_Concluir não lança, segue paridade em memória e avisa semArmazenamento', () => {
  fc.assert(
    fc.property(
      fc.constantFrom(...Object.keys(fabricas)),
      fc.uniqueArray(arbId, { minLength: 1, maxLength: 6 }),
      fc.array(fc.nat(), { maxLength: 40 }),
      (modo, licoes, acionamentos) => {
        const g = criarGerenciador(fabricas[modo]());
        const contagem = new Map(licoes.map((id) => [id, 0]));

        for (const n of acionamentos) {
          const id = licoes[n % licoes.length];
          const antes = g.licaoConcluida(id);
          assert.doesNotThrow(() => g.marcarLicao(id, !g.licaoConcluida(id)));
          contagem.set(id, contagem.get(id) + 1);
          assert.equal(g.licaoConcluida(id), !antes);
        }

        for (const id of licoes) {
          assert.equal(g.licaoConcluida(id), contagem.get(id) % 2 === 1);
        }
        if (acionamentos.length > 0) assert.equal(g.avisos().semArmazenamento, true);
        if (modo !== 'só setItem lança (cota)') assert.equal(g.avisos().semArmazenamento, true);
      },
    ),
    { numRuns: 100 },
  );
});
