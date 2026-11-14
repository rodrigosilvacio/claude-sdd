import { CATALOGO } from '../dados/catalogo'
import { formatarPreco } from '../formato'
import { useLoja } from '../store/loja'

const porId = new Map(CATALOGO.map((p) => [p.id, p]))

export function Carrinho() {
  const carrinho = useLoja((s) => s.carrinho)
  const remover = useLoja((s) => s.remover)
  const esvaziar = useLoja((s) => s.esvaziar)

  const linhas = Object.entries(carrinho)
    .map(([id, quantidade]) => ({ peca: porId.get(id)!, quantidade }))
    .filter((l) => l.peca)
  const total = linhas.reduce((soma, l) => soma + l.peca.preco * l.quantidade, 0)

  return (
    <section aria-labelledby="titulo-carrinho">
      <h2 id="titulo-carrinho">Carrinho</h2>
      {linhas.length === 0 ? (
        <p className="vazio">Carrinho vazio</p>
      ) : (
        <>
          <ul className="lista" aria-label="Itens do carrinho">
            {linhas.map(({ peca, quantidade }) => (
              <li key={peca.id} className="item" data-testid={`carrinho-${peca.id}`}>
                <span className="amostra" style={{ background: peca.cor }} />
                <span className="nome">{peca.nome}</span>
                <span className="meta" aria-label={`Quantidade de ${peca.nome}`}>
                  x{quantidade}
                </span>
                <button onClick={() => remover(peca.id)} aria-label={`Remover 1 ${peca.nome}`}>
                  −1
                </button>
              </li>
            ))}
          </ul>
          <div className="total">
            <span>Total</span>
            <span data-testid="total-carrinho">{formatarPreco(total)}</span>
          </div>
          <button onClick={() => esvaziar()} style={{ marginTop: 8 }}>
            Esvaziar carrinho
          </button>
        </>
      )}
    </section>
  )
}

export function ContadorCarrinho() {
  const total = useLoja((s) => Object.values(s.carrinho).reduce((a, b) => a + b, 0))
  return (
    <span className="contador-carrinho" data-testid="contador-carrinho" aria-label={`${total} itens no carrinho`}>
      🛒 {total}
    </span>
  )
}
