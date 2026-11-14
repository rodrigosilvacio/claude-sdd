import { CATALOGO } from '../dados/catalogo'
import { formatarPreco, nivelEstoque } from '../formato'
import { useLoja } from '../store/loja'

/** Lista do catálogo: alternativa acessível à seleção na cena 3D. */
export function ListaCatalogo() {
  const saldos = useLoja((s) => s.saldos)
  const selecionar = useLoja((s) => s.selecionar)

  return (
    <section aria-labelledby="titulo-catalogo">
      <h2 id="titulo-catalogo">Catálogo</h2>
      <ul className="lista">
        {CATALOGO.map((peca) => {
          const saldo = saldos[peca.id] ?? 0
          const nivel = nivelEstoque(saldo)
          return (
            <li key={peca.id} className="item" data-testid={`catalogo-${peca.id}`}>
              <span className="amostra" style={{ background: peca.cor }} />
              <span className="nome">
                {peca.nome}
                <br />
                <span className="meta">
                  {formatarPreco(peca.preco)} · <span data-testid={`saldo-${peca.id}`}>{saldo}</span> em estoque
                </span>
              </span>
              {nivel === 'esgotado' && <span className="selo esgotado">Esgotado</span>}
              {nivel === 'baixo' && <span className="selo baixo">Últimas</span>}
              <button
                onClick={() => selecionar(peca.id, 'lista')}
                disabled={nivel === 'esgotado'}
                aria-label={nivel === 'esgotado' ? `${peca.nome} esgotado` : `Adicionar ${peca.nome}`}
              >
                +1
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
