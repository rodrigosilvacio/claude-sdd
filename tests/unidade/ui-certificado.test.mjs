// Testes de unidade da UI do Certificado. Requisitos: 14.2 a 14.4, 14.8, 14.15, 14.17, 14.18.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarDom, gerenciadorMemoria, capturaAnuncios, disparar, concluirTudo } from '../auxiliar/dom.mjs';
import { ativar, ANUNCIO_GERADO } from '../../assets/js/ui/certificado-ui.js';
import catalogo from '../../assets/data/catalogo.js';

function montar(g = gerenciadorMemoria(), win) {
  const { window, document } = criarDom('<section data-componente="certificado"></section>');
  const anunciar = capturaAnuncios();
  const raiz = document.querySelector('section');
  const desativar = ativar([raiz], { gerenciador: g, catalogo, anunciar, doc: document, win: win ?? window });
  const q = (n) => raiz.querySelector(`[data-certificado="${n}"]`);
  return { window, document, raiz, g, anunciar, q, desativar };
}

test('certificado (gate): sem Conclusão_Total mostra percentual e pendências com links; campo e botão ocultos e desabilitados', () => {
  const t = montar();
  assert.equal(t.q('percentual').textContent, 'Progresso: 0%');
  const links = [...t.q('pendencias').querySelectorAll('a')];
  assert.ok(links.length > 0);
  assert.ok(links.every((a) => a.getAttribute('href') && a.textContent));
  assert.equal(t.q('pendencias').hidden, false);
  assert.equal(t.q('form').hidden, true);
  assert.equal(t.q('nome').disabled, true);
  assert.equal(t.q('gerar').disabled, true);
  assert.equal(t.q('resultado').hidden, true);
});

test('certificado (gate): ao concluir tudo (assinatura), libera o formulário e esconde pendências', () => {
  const t = montar();
  concluirTudo(t.g, catalogo);
  assert.equal(t.q('percentual').textContent, 'Progresso: 100%');
  assert.equal(t.q('pendencias').hidden, true);
  assert.equal(t.q('form').hidden, false);
  assert.equal(t.q('nome').disabled, false);
  assert.equal(t.q('gerar').disabled, false);
});

test('certificado: perder a conclusão volta a bloquear e esconde o certificado emitido', () => {
  const t = montar();
  concluirTudo(t.g, catalogo);
  t.q('nome').value = 'Ana Souza';
  disparar(t.window, t.q('gerar'), 'click');
  assert.equal(t.q('resultado').hidden, false);
  t.g.marcarLicao(catalogo.modulos.flatMap((m) => m.itens).find((i) => i.tipo === 'tutorial').id, false);
  assert.equal(t.q('form').hidden, true);
  assert.equal(t.q('resultado').hidden, true);
  assert.equal(t.q('gerar').disabled, true);
});

test('certificado: nome inválido mostra erro em role="alert" ligado ao campo por aria-describedby e não emite', () => {
  const t = montar();
  concluirTudo(t.g, catalogo);
  for (const ruim of ['', 'ab', '<b>Ana</b>', 'Ana123', 'x'.repeat(81)]) {
    t.q('nome').value = ruim;
    disparar(t.window, t.q('gerar'), 'click');
    assert.equal(t.q('resultado').hidden, true, `não emite para ${JSON.stringify(ruim)}`);
    assert.equal(t.q('erro').hidden, false);
    assert.ok(t.q('erro').textContent.length > 0);
    assert.equal(t.anunciar.lista.at(-1), t.q('erro').textContent);
  }
  assert.equal(t.q('erro').getAttribute('role'), 'alert');
  assert.equal(t.q('nome').getAttribute('aria-describedby'), t.q('erro').id);
  assert.ok(t.q('erro').id);
});

test('certificado: nome válido emite o certificado, limpa o erro, anuncia, foca e usa só texto', () => {
  const t = montar();
  concluirTudo(t.g, catalogo);
  t.q('nome').value = '';
  disparar(t.window, t.q('gerar'), 'click');
  assert.equal(t.q('erro').hidden, false);
  t.q('nome').value = '  Maria D\'Ávila-Souza  ';
  disparar(t.window, t.q('gerar'), 'click');
  assert.equal(t.q('erro').hidden, true);
  const res = t.q('resultado');
  assert.equal(res.hidden, false);
  assert.equal(res.querySelector('.certificado-nome').textContent, "Maria D'Ávila-Souza");
  assert.match(res.querySelector('.certificado-carga').textContent, new RegExp(`${catalogo.cargaHorariaHoras} horas`));
  assert.match(res.querySelector('.certificado-data').textContent, /^Data de emissão: /);
  assert.match(res.querySelector('.certificado-declaracao').textContent, /autodeclarado/);
  assert.equal(res.getAttribute('tabindex'), '-1');
  assert.equal(t.q('controles').hidden, false);
  assert.equal(t.anunciar.lista.at(-1), ANUNCIO_GERADO);
  assert.equal(res.querySelector('script, img'), null);
});

test('certificado: imprimir chama window.print', () => {
  let impresso = 0;
  const t = montar(gerenciadorMemoria(), { print: () => { impresso += 1; } });
  concluirTudo(t.g, catalogo);
  disparar(t.window, t.q('imprimir'), 'click');
  assert.equal(impresso, 1);
});

test('certificado: a função devolvida remove a assinatura do gerenciador', () => {
  const t = montar();
  t.desativar();
  concluirTudo(t.g, catalogo);
  assert.equal(t.q('percentual').textContent, 'Progresso: 0%');
});
