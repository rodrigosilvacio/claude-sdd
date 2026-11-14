import { lazy, Suspense } from 'react'
import { Carrinho, ContadorCarrinho } from './componentes/Carrinho'
import { ListaCatalogo } from './componentes/ListaCatalogo'
import { Mensagens } from './componentes/Mensagens'
import { ResetarLoja } from './componentes/ResetarLoja'
import { ControleGestos, CursorMao, PreviaCamera } from './gestos/ControleGestos'

const Cena = lazy(() => import('./cena/Cena').then((m) => ({ default: m.Cena })))

export default function App() {
  return (
    <div className="app">
      <header className="topo">
        <h1>Loja Gêmeo Digital</h1>
        <ControleGestos />
        <ContadorCarrinho />
        <ResetarLoja />
      </header>
      <main className="corpo">
        <div className="cena-area">
          <Suspense fallback={<div className="carregando">Carregando gêmeo digital…</div>}>
            <Cena />
          </Suspense>
          <CursorMao />
          <PreviaCamera />
          <Mensagens />
        </div>
        <aside className="lateral">
          <Carrinho />
          <ListaCatalogo />
        </aside>
      </main>
    </div>
  )
}
