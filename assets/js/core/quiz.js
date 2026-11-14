// Avaliação de Quiz: função pura, sem DOM nem localStorage (R8.2 a R8.6).
import { NOTA_APROVACAO } from '../../data/quizzes.js';

/**
 * @param {{questoes: {correta:number, explicacao:string}[]}} quiz
 * @param {Array<number|null|undefined>} respostas índice da opção escolhida por questão
 */
export function avaliar(quiz, respostas) {
  const resp = Array.isArray(respostas) ? respostas : [];
  const faltando = quiz.questoes.map((_, i) => i).filter((i) => resp[i] == null);
  if (faltando.length) return { ok: false, faltando };
  const detalhes = quiz.questoes.map((q, i) => ({
    correta: resp[i] === q.correta,
    explicacao: q.explicacao,
  }));
  const total = quiz.questoes.length;
  const acertos = detalhes.filter((d) => d.correta).length;
  const pct = Math.round((acertos / total) * 100);
  return { ok: true, acertos, total, pct, aprovado: pct >= NOTA_APROVACAO, detalhes };
}
