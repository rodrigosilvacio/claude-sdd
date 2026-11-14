import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { emitir, validarNome } from '../../assets/js/core/certificado.js';
import { vazio, conclusaoTotal, pendencias } from '../../assets/js/core/progresso.js';

// Feature: comparacoes-sdds, Property 15: Gate de emissão sobre o progresso do momento
// **Validates: Requirements 14.1, 14.2, 14.18**

const arbEspecItem = fc.record({
  tipo: fc.constantFrom('licao', 'tutorial', 'exercicio', 'quiz'),
  feitoAntes: fc.boolean(), // progresso com que a tela foi renderizada
  feito: fc.boolean(), // progresso lido no momento do clique
});
const arbModulos = fc.array(fc.array(arbEspecItem, { maxLength: 5 }), { maxLength: 4 });
const arbNome = fc.constantFrom('Maria Silva', "Ana D'Ávila", 'José-Carlos Jr.', 'Zoë Müller');

const construir = (espec, campo) => {
  const catalogo = { modulos: [], checklists: {}, cargaHorariaHoras: 10 };
  const p = vazio();
  let n = 0;
  espec.forEach((itens, mi) => {
    const modulo = { id: `m${mi}`, itens: [] };
    for (const e of itens) {
      const k = n++;
      const id = e.tipo === 'exercicio' ? `exercicio:f${k}` : e.tipo === 'quiz' ? `quiz:q${k}` : `${e.tipo}:${k}`;
      modulo.itens.push({ id, tipo: e.tipo, titulo: `T${k}`, url: `/u/${k}` });
      if (e.tipo === 'licao' || e.tipo === 'tutorial') {
        if (e[campo]) p.licoes.add(id);
      } else if (e.tipo === 'exercicio') {
        catalogo.checklists[`f${k}`] = [{ id: `c${k}-0` }, { id: `c${k}-1` }];
        if (e[campo]) p.checklists.set(`f${k}`, new Set([`c${k}-0`, `c${k}-1`]));
        else p.checklists.set(`f${k}`, new Set([`c${k}-0`]));
      } else {
        p.quizzes.set(`q${k}`, { aprovado: e[campo], melhorPct: e[campo] ? 80 : 40 });
      }
    }
    catalogo.modulos.push(modulo);
  });
  return { catalogo, p };
};

test('Property 15: emite se, e somente se, Conclusão_Total vale no progresso lido no momento da emissão', () => {
  fc.assert(
    fc.property(arbModulos, arbNome, (espec, nome) => {
      const { catalogo, p: atual } = construir(espec, 'feito');
      const { p: anterior } = construir(espec, 'feitoAntes');
      const hoje = new Date(2024, 0, 15);

      // A tela foi renderizada com `anterior`, mas a emissão lê `atual` no clique.
      const chamadas = { n: 0 };
      const lerProgresso = () => { chamadas.n++; return atual; };
      const r = emitir({ entrada: nome, lerProgresso, catalogo, hoje });
      assert.ok(chamadas.n >= 1);

      const total = conclusaoTotal(atual, catalogo);
      assert.equal(r.ok, total);
      if (total) {
        assert.equal(r.modelo.nome, validarNome(nome).nome);
        assert.equal(r.modelo.cargaHoraria, 10);
      } else {
        assert.equal(r.erro, 'conclusao');
        assert.deepEqual(r.pendencias, pendencias(atual, catalogo));
        const n = r.pendencias.licoes.length + r.pendencias.exercicios.length + r.pendencias.quizzes.length;
        assert.ok(n > 0);
      }

      // O resultado não depende do progresso usado na renderização anterior.
      const r2 = emitir({ entrada: nome, lerProgresso: () => atual, catalogo, hoje });
      assert.equal(r2.ok, r.ok);
      void anterior;
    }),
    { numRuns: 100 },
  );
});
