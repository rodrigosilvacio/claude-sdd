import { create } from 'zustand'

export type TipoMensagem = 'ok' | 'erro' | 'info'

interface Mensagem {
  id: number
  texto: string
  tipo: TipoMensagem
}

interface MensagensStore {
  mensagens: Mensagem[]
  mostrar: (texto: string, tipo?: TipoMensagem, duracaoMs?: number) => void
}

let proximoId = 1

export const useMensagens = create<MensagensStore>()((set) => ({
  mensagens: [],
  mostrar: (texto, tipo = 'info', duracaoMs = 2500) => {
    const id = proximoId++
    set((s) => ({ mensagens: [...s.mensagens.slice(-2), { id, texto, tipo }] }))
    setTimeout(() => set((s) => ({ mensagens: s.mensagens.filter((m) => m.id !== id) })), duracaoMs)
  },
}))
