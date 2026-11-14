import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { parseHTML } from 'linkedom';
import { apresentar, estadoBotao, anuncioDe, ativar } from '../../assets/js/ui/botao-concluir.js';
import { criarGerenciador } from '../../assets/js/core/progresso.js';

// Feature: comparacoes-sdds, Property 26: Apresentação do Botão_Concluir
// **Validates: Requirements 19.1, 19.4, 19.5, 19.7, 19.9**

const arbId = fc.stringMatching(/^[a-z][a-z0-9-]{0,8}$/);

test('Feature: comparacoes-sdds, Property 26: apresentar/estadoBotao/anuncioDe refletem o estado e o texto difere entre estados', () => {
  fc.assert(
    fc.property(fc.boolean(), (concluida) => {
      const ap = apresentar(concluida);
      const eb = estadoBotao(concluida);
      assert.equal(ap.texto, concluida ? 'Concluída (desmarcar)' : 'Marcar como concluída');
      assert.equal(ap.pressed, concluida ? 'true' : 'false');
      assert.equal(eb.texto, ap.texto);
      assert.equal(eb.pressed, ap.pressed);
      assert.equal(ap.icone !== '', concluida);
      assert.equal(anuncioDe(concluida), concluida ? 'Lição marcada como concluída' : 'Lição desmarcada');
      assert.notEqual(apresentar(true).texto, apresentar(false).texto);
      assert.notEqual(anuncioDe(true), anuncioDe(false));
    }),
    { numRuns: 100 },
  );
});

test('Feature: comparacoes-sdds, Property 26: ativar pinta o estado inicial, alterna ao clicar e anuncia', () => {
  fc.assert(
    fc.property(
      arbId,
      fc.boolean(),
      fc.integer({ min: 0, max: 8 }),
      (id, inicial, cliques) => {
        const { document } = parseHTML(
          `<html><body><button type="button" data-componente="botao-concluir" data-licao="${id}">x</button></body></html>`,
        );
        const botao = document.querySelector('button');
        const g = criarGerenciador(() => null);
        if (inicial) g.marcarLicao(id, true);
        const anuncios = [];
        const limpar = ativar([botao], { gerenciador: g, anunciar: (t) => anuncios.push(t) });

        let atual = inicial;
        const confere = () => {
          const esperado = apresentar(atual);
          assert.equal(botao.textContent, esperado.texto);
          assert.equal(botao.getAttribute('aria-pressed'), esperado.pressed);
        };
        confere();
        for (let i = 0; i < cliques; i++) {
          botao.click();
          atual = !atual;
          confere();
          assert.equal(anuncios[i], anuncioDe(atual));
        }
        assert.equal(anuncios.length, cliques);
        assert.equal(g.licaoConcluida(id), atual);
        limpar();
      },
    ),
    { numRuns: 100 },
  );
});
