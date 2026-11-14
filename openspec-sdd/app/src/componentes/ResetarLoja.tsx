import { useState } from 'react'
import { useLoja } from '../store/loja'

export function ResetarLoja() {
  const [aberto, setAberto] = useState(false)
  const resetar = useLoja((s) => s.resetar)

  return (
    <>
      <button className="perigo" onClick={() => setAberto(true)}>
        Resetar loja
      </button>
      {aberto && (
        <div className="dialogo-fundo">
          <div className="dialogo" role="dialog" aria-modal="true" aria-labelledby="titulo-reset">
            <h2 id="titulo-reset">Resetar loja?</h2>
            <p>Todos os estoques voltam ao valor inicial e o carrinho é esvaziado.</p>
            <div className="acoes">
              <button onClick={() => setAberto(false)} autoFocus>
                Cancelar
              </button>
              <button
                className="primario"
                onClick={() => {
                  resetar()
                  setAberto(false)
                }}
              >
                Confirmar reset
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
