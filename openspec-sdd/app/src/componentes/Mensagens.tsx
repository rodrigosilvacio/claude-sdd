import { useEffect } from 'react'
import { CATALOGO } from '../dados/catalogo'
import { useLoja } from '../store/loja'
import { useMensagens } from './mensagens-store'

const nomes = new Map(CATALOGO.map((p) => [p.id, p.nome]))

/** Exibe mensagens breves: seleções aceitas, "Esgotado" e avisos dos gestos. */
export function Mensagens() {
  const mensagens = useMensagens((s) => s.mensagens)

  // Reage a cada novo evento de seleção (inclusive repetidos na mesma peça).
  useEffect(
    () =>
      useLoja.subscribe((estado, anterior) => {
        const evento = estado.ultimoEvento
        if (!evento || evento.seq === anterior.ultimoEvento?.seq) return
        const nome = nomes.get(evento.pecaId) ?? evento.pecaId
        const { mostrar } = useMensagens.getState()
        if (evento.aceita) mostrar(`${nome} adicionada ao carrinho`, 'ok', 1500)
        else if (evento.motivo === 'ESGOTADO') mostrar(`Esgotado: ${nome}`, 'erro')
      }),
    [],
  )

  return (
    <div className="mensagens" role="status" aria-live="polite">
      {mensagens.map((m) => (
        <div key={m.id} className={`mensagem ${m.tipo}`}>
          {m.texto}
        </div>
      ))}
    </div>
  )
}
