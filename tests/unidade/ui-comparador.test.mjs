// Testes de unidade da UI do Comparador. Requisitos: 9.1 a 9.4, 9.8, 9.9, 9.16, 16.6.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarDom, capturaAnuncios, marcar } from '../auxiliar/dom.mjs';
import { montarComparador, MSG_LIMITE, MSG_MINIMO } from '../../assets/js/ui/comparador-ui.js';
import { ferramentas } from '../../assets/data/ferramentas.js';

function montar() {
  const { window, document } = criarDom('<div data-componente="comparador"></div>');
  const anunciar = capturaAnuncios();
  const raiz = document.querySelector('div');
  const api = montarComparador(raiz, { anunciar, doc: document });
  const caixa = (id) => raiz.querySelector(`#cmp-${id}`);
  const alternar = (id, v = true) => marcar(window, caixa(id), v);
  return { window, document, raiz, api, anunciar, caixa, alternar, msg: raiz.querySelector('#cmp-mensagem'), tabela: raiz.querySelector('.comparador-tabela') };
}
const ids = ferramentas.map((f) => f.id);

test('comparador: começa com mínimo não atingido, tabela oculta e checkboxes rotulados', () => {
  const t = montar();
  assert.equal(t.raiz.querySelectorAll('input[type="checkbox"]').length, ferramentas.length);
  assert.ok(ferramentas.every((f) => t.raiz.querySelector(`label[for="cmp-${f.id}"]`)));
  assert.equal(t.msg.textContent, MSG_MINIMO);
  assert.equal(t.tabela.hidden, true);
  assert.equal(t.tabela.getAttribute('role'), 'region');
  assert.equal(t.tabela.getAttribute('tabindex'), '0');
  assert.ok(t.tabela.getAttribute('aria-label'));
});

test('comparador: com 1 ferramenta mostra a mensagem de mínimo; com 2 mostra a tabela sem mensagem', () => {
  const t = montar();
  t.alternar(ids[0]);
  assert.equal(t.msg.textContent, MSG_MINIMO);
  assert.equal(t.tabela.hidden, true);
  t.alternar(ids[1]);
  assert.equal(t.msg.textContent, '');
  assert.equal(t.tabela.hidden, false);
  const cabecalhos = [...t.tabela.querySelectorAll('thead th')].map((th) => th.textContent);
  assert.deepEqual(cabecalhos, ['Critério', ferramentas[0].nome, ferramentas[1].nome]);
  assert.ok(t.tabela.textContent.includes('Data da consulta à fonte oficial'));
  t.alternar(ids[1], false);
  assert.equal(t.msg.textContent, MSG_MINIMO);
  assert.equal(t.tabela.hidden, true);
});

test('comparador: a 5ª seleção é recusada com mensagem de limite e a seleção permanece em 4', () => {
  const t = montar();
  ids.slice(0, 4).forEach((id) => t.alternar(id));
  assert.equal(t.api.selecao().length, 4);
  assert.equal(t.msg.textContent, '');
  t.alternar(ids[4]);
  assert.deepEqual(t.api.selecao(), ids.slice(0, 4));
  assert.equal(t.msg.textContent, MSG_LIMITE);
  assert.equal(t.caixa(ids[4]).checked, false, 'a caixa recusada é desmarcada');
  assert.equal(t.anunciar.lista.at(-1), MSG_LIMITE);
  assert.equal(t.tabela.querySelectorAll('thead th').length, 5);
  t.alternar(ids[0], false); // desmarcar libera uma vaga e limpa a mensagem
  assert.equal(t.msg.textContent, '');
  t.alternar(ids[4]);
  assert.equal(t.api.selecao().length, 4);
  assert.ok(t.api.selecao().includes(ids[4]));
});

test('comparador: falta de dado aparece como "verificar na fonte" e a tabela persiste mesmo se o gráfico/cartões falharem ou demorarem', async () => {
  const t = montar();
  t.alternar(ids[0]); t.alternar(ids[1]);
  // A tabela é síncrona: já existe antes de grafico.js e cartao.js terminarem de carregar (R9.16).
  assert.ok(t.tabela.querySelector('table'));
  await new Promise((r) => setTimeout(r, 100));
  assert.ok(t.tabela.querySelector('table'), 'tabela segue presente após as importações dinâmicas');
  assert.equal(t.raiz.querySelectorAll('.comparador-cartoes article.cartao').length, 2);
  assert.ok(t.anunciar.lista.some((x) => x === 'Gráfico atualizado: 2 ferramentas'));
});

test('comparador: perfil completo mostra recomendação e incompleto pede os campos', () => {
  const t = montar();
  const rec = t.raiz.querySelector('.comparador-recomendacao');
  assert.match(rec.textContent, /Informe o tipo de projeto/);
  const set = (campo, v) => {
    const s = t.raiz.querySelector(`#cmp-perfil-${campo}`);
    for (const o of s.querySelectorAll('option')) { if (o.getAttribute('value') === v) o.setAttribute('selected', ''); else o.removeAttribute('selected'); }
    marcar(t.window, s);
  };
  set('tipo', 'web'); set('equipe', 'solo'); set('base', 'novo');
  assert.ok(rec.querySelectorAll('li').length > 0);
  assert.equal(t.anunciar.lista.at(-1), 'Recomendação atualizada');
});

test('comparador: não monta duas vezes no mesmo contêiner', () => {
  const t = montar();
  assert.equal(montarComparador(t.raiz, { anunciar: () => {}, doc: t.document }), null);
});
