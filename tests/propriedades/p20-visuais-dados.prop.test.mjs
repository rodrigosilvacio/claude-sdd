import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fc from 'fast-check';
import { catalogo } from '../../assets/data/catalogo.js';
import { ferramentas } from '../../assets/data/ferramentas.js';
import { criarCartao } from '../../assets/js/ui/cartao.js';
import { parsear, verificarContagens, verificarComandos, verificarAlternativasOl } from '../../tools/verificar-conteudo.mjs';
// Feature: comparacoes-sdds, Property 20: Elementos visuais derivados dos dados
// **Validates: Requirements 5.3, 6.2, 6.10, 17.3, 17.4, 17.5, 17.6, 17.7, 17.10, 18.3**
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// Ferramentas publicáveis = com módulo (e tutorial) no catálogo.
const publicaveis = catalogo.modulos
  .filter((m) => m.ferramenta && m.itens.some((i) => i.tipo === 'tutorial'))
  .map((m) => ({
    f: ferramentas.find((x) => x.id === m.ferramenta),
    tutorial: m.itens.find((i) => i.tipo === 'tutorial').url,
    exercicio: m.itens.find((i) => i.tipo === 'exercicio')?.url,
  }));

const lerDoc = (rel) => parsear(readFileSync(path.join(RAIZ, rel), 'utf8'));
const arbPublicavel = fc.constantFrom(...publicaveis);
const NUM_RUNS = 100;

test('Feature: comparacoes-sdds, Property 20: há ferramentas publicáveis para amostrar', () => {
  assert.ok(publicaveis.length >= 7);
  for (const p of publicaveis) assert.ok(p.f, 'ferramenta do módulo existe nos dados');
});

test('Feature: comparacoes-sdds, Property 20: Tutorial tem Diagrama, <ol>, Linha_Tempo, Stepper e Mockup derivados dos dados', () => {
  fc.assert(
    fc.property(arbPublicavel, ({ f, tutorial }) => {
      const doc = lerDoc(tutorial);
      assert.deepEqual(verificarContagens(doc, f), []);
      assert.deepEqual(verificarAlternativasOl(doc, f), []);
      assert.deepEqual(verificarComandos(doc, f), []);
      const diagrama = doc.querySelector('.diagrama');
      assert.ok(diagrama, 'Diagrama_Fluxo presente');
      assert.equal(diagrama.querySelectorAll('svg .etapa').length, f.ciclo.length);
      assert.equal(diagrama.querySelectorAll('ol > li').length, f.ciclo.length);
      const linha = doc.querySelector('ol.linha-tempo, .linha-tempo');
      assert.ok(linha, 'Linha_Tempo presente');
      assert.equal(linha.querySelectorAll('li').length, f.ciclo.length);
      const stepper = doc.querySelector('.stepper, [data-componente="stepper"]');
      assert.equal([...stepper.children].filter((c) => c.tagName.toLowerCase() === 'li').length, f.passos.length);
      // Sem árvore na fonte (ex.: BMAD), o tutorial omite o mockup de propósito.
      const mockup = doc.querySelector('.mockup');
      if (f.arvore?.filhos?.length) {
        assert.ok(mockup, 'Mockup_Estrutura presente');
        assert.match(mockup.textContent, /Ilustrativo/);
      } else {
        assert.equal(mockup, null, 'sem árvore nos dados, não deve haver Mockup_Estrutura');
      }
    }),
    { numRuns: NUM_RUNS },
  );
});

test('Feature: comparacoes-sdds, Property 20: Exercício tem Checklist com ao menos 5 itens e Atividade_Interativa', () => {
  fc.assert(
    fc.property(arbPublicavel, ({ exercicio }) => {
      assert.ok(exercicio, 'módulo tem exercício');
      const doc = lerDoc(exercicio);
      const itens = doc.querySelectorAll('[data-componente="checklist"] input[type="checkbox"]');
      assert.ok(itens.length >= 5, `checklist com ${itens.length} itens`);
      assert.ok(doc.querySelector('.atividade, [data-componente="ordenar"]'), 'Atividade_Interativa presente');
    }),
    { numRuns: NUM_RUNS },
  );
});

test('Feature: comparacoes-sdds, Property 20: Cartão_Comparativo gerado a partir dos dados traz os campos exigidos', () => {
  fc.assert(
    fc.property(arbPublicavel, ({ f }) => {
      const document = parsear('<html><body></body></html>');
      const cartao = criarCartao(f, document);
      assert.equal(cartao.getAttribute('data-ferramenta'), f.id);
      assert.ok(cartao.textContent.includes(f.nome));
      assert.ok(cartao.textContent.includes(f.proposito));
      const rotulos = [...cartao.querySelectorAll('dt')].map((d) => d.textContent);
      assert.deepEqual(rotulos, ['Instalação', 'Agentes suportados', 'Artefatos principais', 'Versão', 'Licença', 'Custo', 'Fonte oficial', 'Data da consulta']);
      assert.equal(cartao.querySelectorAll('dd').length, 8);
    }),
    { numRuns: NUM_RUNS },
  );
});

// ---- O verificador detecta divergências entre dados e página ----
const arbMutacao = fc.record({
  alvo: arbPublicavel,
  tipo: fc.constantFrom('ciclo-extra', 'ciclo-menos', 'passo-extra', 'passo-menos', 'rotulo-trocado', 'comando-proibido'),
});

function mutar({ f }, tipo) {
  const c = structuredClone(f);
  if (tipo === 'ciclo-extra') c.ciclo.push({ id: 'x', rotulo: 'Etapa inexistente zzz', comando: 'zzz' });
  if (tipo === 'ciclo-menos') c.ciclo.pop();
  if (tipo === 'passo-extra') c.passos.push({ titulo: 'Extra', comando: 'zzz' });
  if (tipo === 'passo-menos') c.passos.pop();
  if (tipo === 'rotulo-trocado') c.ciclo[0].rotulo = 'RotuloInexistenteZzz';
  if (tipo === 'comando-proibido') c.comandosPermitidos = ['comando-que-nao-existe-zzz'];
  return c;
}

test('Feature: comparacoes-sdds, Property 20: dados mutados fazem o verificador reportar divergência', () => {
  fc.assert(
    fc.property(arbMutacao, ({ alvo, tipo }) => {
      const doc = lerDoc(alvo.tutorial);
      const dados = mutar(alvo, tipo);
      const erros = [...verificarContagens(doc, dados), ...verificarAlternativasOl(doc, dados), ...verificarComandos(doc, dados)];
      assert.ok(erros.length > 0, `mutação ${tipo} em ${alvo.f.id} não foi detectada`);
    }),
    { numRuns: NUM_RUNS },
  );
});

test('Feature: comparacoes-sdds, Property 20: remover Stepper ou Diagrama da página é detectado', () => {
  fc.assert(
    fc.property(arbPublicavel, fc.constantFrom('.stepper', '.diagrama'), ({ f, tutorial }, seletor) => {
      const doc = lerDoc(tutorial);
      doc.querySelector(seletor).remove();
      assert.ok(verificarContagens(doc, f).length > 0);
    }),
    { numRuns: NUM_RUNS },
  );
});
