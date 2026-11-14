import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { montarCertificado, emitir, escaparHTML, validarNome, TITULO_CURSO, DECLARACAO } from '../../assets/js/core/certificado.js';
import { formatarData } from '../../assets/js/core/formato.js';
import { vazio } from '../../assets/js/core/progresso.js';

// Feature: comparacoes-sdds, Property 16: Conteúdo do certificado
// **Validates: Requirements 14.10, 14.11**
// (Arquivo p15 conforme a tarefa 6.4; a numeração do design para esta propriedade é 16.)

// Nome válido: inicia com letra; demais caracteres entre letras, espaço, apóstrofo, hífen e ponto.
const arbNome = fc
  .tuple(
    fc.constantFrom('A', 'b', 'Z', 'é', 'Ç', 'ñ', 'ö', 'ж', '李'),
    fc.array(fc.constantFrom('a', 'M', 'ã', 'ü', ' ', "'", '-', '.', 'ç'), { minLength: 1, maxLength: 60 }),
  )
  .map(([p, resto]) => (p + resto.join('')).trim())
  .filter((n) => validarNome(n).ok);

const arbData = fc.date({ min: new Date(1971, 0, 2), max: new Date(2100, 0, 1), noInvalidDate: true });
const arbCarga = fc.integer({ min: 1, max: 500 });

test('Feature: comparacoes-sdds, Property 16: modelo contém nome, título, data dd/mm/aaaa, carga horária e declaração', () => {
  fc.assert(
    fc.property(arbNome, arbData, arbCarga, (nome, hoje, cargaHoraria) => {
      const catalogo = { modulos: [], checklists: {}, cargaHorariaHoras: cargaHoraria };
      const r = emitir({ entrada: nome, lerProgresso: vazio, catalogo, hoje });
      assert.equal(r.ok, true);
      const m = r.modelo;
      assert.equal(m.nome, validarNome(nome).nome);
      assert.equal(m.titulo, TITULO_CURSO);
      assert.match(m.data, /^\d{2}\/\d{2}\/\d{4}$/);
      assert.equal(m.data, formatarData(hoje));
      assert.equal(m.cargaHoraria, cargaHoraria);
      assert.equal(
        m.declaracao,
        'Certificado de participação autodeclarado, sem verificação de autenticidade',
      );
      assert.equal(m.declaracao, DECLARACAO);

      const direto = montarCertificado({ nome, hoje, cargaHoraria, titulo: TITULO_CURSO });
      assert.equal(direto.nome, nome);
      assert.equal(direto.data, m.data);
      assert.equal(direto.cargaHoraria, cargaHoraria);
      assert.equal(direto.declaracao, DECLARACAO);
    }),
    { numRuns: 100 },
  );
});

test('Feature: comparacoes-sdds, Property 16: escaparHTML não deixa < > & " \' sem escape', () => {
  fc.assert(
    fc.property(fc.string({ unit: fc.constantFrom('<', '>', '&', '"', "'", 'a', ' ', ';', '#') }), (s) => {
      const saida = escaparHTML(s);
      assert.doesNotMatch(saida, /[<>"']/);
      assert.doesNotMatch(saida, /&(?!(amp|lt|gt|quot|#39);)/);
    }),
    { numRuns: 100 },
  );
});
