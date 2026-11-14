import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { linhasTabela, CRITERIOS } from '../../assets/js/core/comparador.js';
import { radarSVG, tabelaNotas } from '../../assets/js/core/grafico.js';

// Feature: comparacoes-sdds, Property 10: Tabela e gráfico consistentes com os dados
// **Validates: Requirements 9.5, 9.10, 9.11, 9.13, 9.14**

const EIXOS = [
  { id: 'fluxo', rotulo: 'Fluxo de trabalho', criterio: 'Clareza do fluxo.' },
  { id: 'curva', rotulo: 'Curva de aprendizado', criterio: 'Facilidade de começar.' },
  { id: 'integracao', rotulo: 'Integração com agentes', criterio: 'Suporte a agentes.' },
  { id: 'formato', rotulo: 'Formato dos artefatos', criterio: 'Qualidade dos artefatos.' },
  { id: 'equipe', rotulo: 'Adoção em equipe', criterio: 'Uso em equipe.' },
];
const TAM = 360;
const C = TAM / 2;
const R = TAM * 0.34;

const arbNota = fc.integer({ min: 0, max: 50 }).map((n) => n / 10);
const arbCenario = fc
  .uniqueArray(fc.stringMatching(/^[a-z][a-z0-9]{1,8}$/), { minLength: 2, maxLength: 4 })
  .chain((ids) =>
    fc.record({
      ids: fc.constant(ids),
      cores: fc.array(fc.constantFrom('#0b5fa5', '#a31515', '#116611', '#6b2d90'), {
        minLength: ids.length,
        maxLength: ids.length,
      }),
      textos: fc.array(fc.array(fc.stringMatching(/^[A-Za-z0-9]{1,12}$/), { minLength: 6, maxLength: 6 }), {
        minLength: ids.length,
        maxLength: ids.length,
      }),
      notas: fc.array(fc.array(arbNota, { minLength: 5, maxLength: 5 }), {
        minLength: ids.length,
        maxLength: ids.length,
      }),
    }),
  )
  .map(({ ids, cores, textos, notas }) => {
    const ferramentas = ids.map((id, i) => ({
      id,
      nome: `Nome${id}`,
      identidade: { cor: cores[i], icone: `assets/svg/${id}.svg` },
      atributos: Object.fromEntries(CRITERIOS.map((c, j) => [c.id, textos[i][j]])),
    }));
    const mapaNotas = Object.fromEntries(
      ids.map((id, i) => [id, Object.fromEntries(EIXOS.map((e, k) => [e.id, notas[i][k]]))]),
    );
    return { ids, ferramentas, mapaNotas };
  });

test('Feature: comparacoes-sdds, Property 10: tabela tem uma coluna por ferramenta e uma linha por critério', () => {
  fc.assert(
    fc.property(arbCenario, ({ ids, ferramentas }) => {
      const linhas = linhasTabela(ids, ferramentas);
      assert.deepEqual(linhas.map((l) => l.id), CRITERIOS.map((c) => c.id));
      for (const l of linhas) {
        assert.deepEqual(l.valores.map((v) => v.ferramenta), ids);
      }
    }),
    { numRuns: 100 },
  );
});

test('Feature: comparacoes-sdds, Property 10: SVG tem uma série e uma legenda por ferramenta, com valores 0 a 5 iguais aos da tabela textual', () => {
  fc.assert(
    fc.property(arbCenario, ({ ids, ferramentas, mapaNotas }) => {
      const svg = radarSVG(ids, mapaNotas, EIXOS, ferramentas, { tamanho: TAM });
      const html = tabelaNotas(ids, mapaNotas, EIXOS, ferramentas);

      // Uma série (polígono) por ferramenta, na ordem da seleção.
      const series = [...svg.matchAll(/<polygon data-ferramenta="([^"]+)" points="([^"]+)"/g)];
      assert.deepEqual(series.map((m) => m[1]), ids);

      // Uma legenda por ferramenta, com nome, ícone e cor.
      const legendas = [...svg.matchAll(/<g data-legenda="([^"]+)">([\s\S]*?)<\/g>/g)];
      assert.deepEqual(legendas.map((m) => m[1]), ids);
      legendas.forEach((m, i) => {
        assert.ok(m[2].includes(ferramentas[i].nome));
        assert.ok(m[2].includes(ferramentas[i].identidade.icone));
        assert.ok(m[2].includes(ferramentas[i].identidade.cor));
      });

      // Valores do gráfico (recuperados pela distância ao centro) em [0,5] e iguais à tabela.
      const tbody = html.match(/<tbody>([\s\S]*?)<\/tbody>/)[1];
      const linhas = [...tbody.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((m) =>
        [...m[1].matchAll(/<td>([^<]*)<\/td>/g)].map((x) => x[1]),
      );
      assert.equal(linhas.length, EIXOS.length);
      series.forEach((s, i) => {
        const pts = s[2].split(' ').map((p) => p.split(',').map(Number));
        assert.equal(pts.length, EIXOS.length);
        pts.forEach(([x, y], k) => {
          const v = (Math.hypot(x - C, y - C) / R) * 5;
          assert.ok(v >= -0.01 && v <= 5.01, `valor ${v} fora da escala`);
          assert.equal(linhas[k].length, ids.length);
          assert.ok(Math.abs(v - Number(linhas[k][i])) < 0.02, `gráfico ${v} difere da tabela ${linhas[k][i]}`);
        });
      });
    }),
    { numRuns: 100 },
  );
});
