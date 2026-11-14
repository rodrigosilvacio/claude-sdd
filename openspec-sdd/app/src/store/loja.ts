import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { CATALOGO } from '../dados/catalogo'
import type { Peca } from '../dados/tipos'
import * as dominio from '../dominio/estoque'
import type { EstadoLoja, MotivoRecusa, Resultado } from '../dominio/estoque'

export const CHAVE_PERSISTENCIA = 'loja-estoque'
export const VERSAO_PERSISTENCIA = 1

export type OrigemSelecao = 'mouse' | 'toque' | 'mao' | 'lista'

export interface EventoSelecao {
  /** Contador crescente, para a UI reagir a eventos repetidos na mesma peça. */
  seq: number
  pecaId: string
  aceita: boolean
  motivo?: MotivoRecusa
  origem: OrigemSelecao
}

export interface LojaStore extends EstadoLoja {
  ultimoEvento: EventoSelecao | null
  selecionar: (pecaId: string, origem?: OrigemSelecao) => Resultado
  remover: (pecaId: string) => Resultado
  esvaziar: () => Resultado
  resetar: () => Resultado
}

export function criarStoreLoja(catalogo: Peca[] = CATALOGO, storage: Storage = localStorage) {
  return create<LojaStore>()(
    persist(
      (set, get) => {
        // Cada ação é uma transição síncrona: duas seleções em sequência são
        // processadas em ordem, e a segunda já enxerga o saldo atualizado.
        const aplicar = (r: Resultado) => {
          if (r.ok) set({ saldos: r.estado.saldos, carrinho: r.estado.carrinho })
          return r
        }
        return {
          ...dominio.criarEstadoSemente(catalogo),
          ultimoEvento: null,
          selecionar: (pecaId, origem = 'mouse') => {
            const r = aplicar(dominio.selecionar(get(), pecaId))
            set({
              ultimoEvento: {
                seq: (get().ultimoEvento?.seq ?? 0) + 1,
                pecaId,
                aceita: r.ok,
                motivo: r.ok ? undefined : r.motivo,
                origem,
              },
            })
            return r
          },
          remover: (pecaId) => aplicar(dominio.remover(get(), pecaId)),
          esvaziar: () => aplicar(dominio.esvaziar(get())),
          resetar: () => aplicar(dominio.resetar(catalogo)),
        }
      },
      {
        name: CHAVE_PERSISTENCIA,
        version: VERSAO_PERSISTENCIA,
        storage: createJSONStorage(() => storage),
        // Só o estado de domínio é persistido; eventos de UI são efêmeros.
        partialize: (s) => ({ saldos: s.saldos, carrinho: s.carrinho }),
        // Versão diferente: descarta o estado salvo.
        migrate: () => undefined as unknown as EstadoLoja,
        merge: (salvo, atual) => {
          if (dominio.estadoValido(salvo, catalogo)) {
            return { ...atual, saldos: salvo.saldos, carrinho: salvo.carrinho }
          }
          return atual
        },
      },
    ),
  )
}

export const useLoja = criarStoreLoja()
