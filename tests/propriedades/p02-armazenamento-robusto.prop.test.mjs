import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { criarGerenciador, desserializar, CHAVE } from '../../assets/js/core/progresso.js';
import { NOTA_APROVACAO } from '../../assets/data/quizzes.js';

// Feature: comparacoes-sdds, Property 2: Armazenamento robusto
// **Validates: Requirements 13.7, 13.8**

const id = fc.constantFrom('a', 'b', 'c', 'd');

const arbOperacao = fc.oneof(
  fc.record({ tipo: fc.constant('licao'), id, feito: fc.boolean() }),
  fc.record({ tipo: fc.constant('item'), ferr: id, item: id }),
  fc.record({ tipo: fc.constant('quiz'), id, pct: fc.integer({ min: 0, max: 100 }) }),
);

// Textos inválidos: JSON malformado, versão desconhecida ou tipos errados.
const ehInvalido = (t) => desserializar(t).aviso === 'corrompido';
const arbTextoInvalido = fc
  .oneof(
    fc.string(),
    fc.jsonValue().map((v) => JSON.stringify(v)),
    fc.record({
      versao: fc.oneof(fc.integer(), fc.string(), fc.constant(null)),
      licoes: fc.jsonValue(),
      checklists: fc.jsonValue(),
      quizzes: fc.jsonValue(),
    }).map((o) => JSON.stringify(o)),
    fc.constantFrom(
      '{"versao":1,"licoes":"x","checklists":{},"quizzes":{}}',
      '{"versao":1,"licoes":[1],"checklists":{},"quizzes":{}}',
      '{"versao":1,"licoes":[],"checklists":{"a":[1]},"quizzes":{}}',
      '{"versao":1,"licoes":[],"checklists":{},"quizzes":{"a":{"aprovado":"s","melhorPct":1}}}',
      '{"versao":2,"licoes":[],"checklists":{},"quizzes":{}}',
      '{"versao":1,', '[]', 'null',
    ),
  )
  .filter(ehInvalido);

const novoModelo = () => ({ licoes: new Set(), checklists: new Map(), quizzes: new Map() });

function aplicar(g, m, op) {
  if (op.tipo === 'licao') {
    g.marcarLicao(op.id, op.feito);
    if (op.feito) m.licoes.add(op.id); else m.licoes.delete(op.id);
  } else if (op.tipo === 'item') {
    g.alternarItem(op.ferr, op.item);
    let s = m.checklists.get(op.ferr);
    if (!s) { s = new Set(); m.checklists.set(op.ferr, s); }
    if (s.has(op.item)) s.delete(op.item); else s.add(op.item);
    if (s.size === 0) m.checklists.delete(op.ferr);
  } else {
    g.registrarQuiz(op.id, op.pct);
    const ant = m.quizzes.get(op.id);
    m.quizzes.set(op.id, {
      aprovado: Boolean(ant && ant.aprovado) || op.pct >= NOTA_APROVACAO,
      melhorPct: ant ? Math.max(ant.melhorPct, op.pct) : op.pct,
    });
  }
}

function confere(g, m) {
  const e = g.estado();
  assert.deepEqual([...e.licoes].sort(), [...m.licoes].sort());
  assert.deepEqual(
    [...e.checklists].map(([k, v]) => [k, [...v].sort()]).sort(),
    [...m.checklists].map(([k, v]) => [k, [...v].sort()]).sort(),
  );
  assert.deepEqual([...e.quizzes].sort(), [...m.quizzes].sort());
}

const storageLancando = (modo) => {
  const erro = () => { throw new Error('indisponível'); };
  if (modo === 'fabrica') return () => { throw new DOMException('negado', 'SecurityError'); };
  if (modo === 'nulo') return () => null;
  return () => ({ getItem: erro, setItem: erro, removeItem: erro });
};

test('Feature: comparacoes-sdds, Property 2: storage que lança erro não lança e mantém memória', () => {
  fc.assert(
    fc.property(
      fc.constantFrom('fabrica', 'nulo', 'metodos'),
      fc.array(arbOperacao, { maxLength: 20 }),
      (modo, ops) => {
        const g = criarGerenciador(storageLancando(modo));
        const m = novoModelo();
        confere(g, m);
        for (const op of ops) { aplicar(g, m, op); confere(g, m); }
        g.reiniciar();
        confere(g, novoModelo());
        assert.equal(g.avisos().semArmazenamento, true);
      },
    ),
    { numRuns: 100 },
  );
});

test('Feature: comparacoes-sdds, Property 2: dados inválidos iniciam vazio com aviso e seguem o modelo', () => {
  fc.assert(
    fc.property(arbTextoInvalido, fc.array(arbOperacao, { maxLength: 20 }), (texto, ops) => {
      const guardado = new Map([[CHAVE, texto]]);
      const storage = {
        getItem: (k) => (guardado.has(k) ? guardado.get(k) : null),
        setItem: (k, v) => { guardado.set(k, v); },
        removeItem: (k) => { guardado.delete(k); },
      };
      const g = criarGerenciador(() => storage);
      const m = novoModelo();
      confere(g, m);
      assert.equal(g.avisos().corrompido, true);
      assert.equal(g.avisos().semArmazenamento, false);
      for (const op of ops) { aplicar(g, m, op); confere(g, m); }
    }),
    { numRuns: 100 },
  );
});

test('Feature: comparacoes-sdds, Property 2: desserializar nunca lança para qualquer entrada', () => {
  fc.assert(
    fc.property(fc.anything(), (entrada) => {
      const r = desserializar(entrada);
      assert.ok(r.aviso === null || r.aviso === 'corrompido');
      assert.ok(r.progresso.licoes instanceof Set);
    }),
    { numRuns: 100 },
  );
});
