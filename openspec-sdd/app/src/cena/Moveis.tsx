import { Html } from '@react-three/drei'
import type { Movel } from '../dados/tipos'

const METAL = '#a1a1aa'
const MADEIRA = '#8b6b4a'

function Arara({ movel }: { movel: Movel }) {
  const largura = movel.slots.length * 0.7 + 0.3
  return (
    <group>
      {[-largura / 2, largura / 2].map((x) => (
        <mesh key={x} position={[x, 0.8, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 1.6, 8]} />
          <meshStandardMaterial color={METAL} metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[0, 1.6, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.025, 0.025, largura, 8]} />
        <meshStandardMaterial color={METAL} metalness={0.7} roughness={0.3} />
      </mesh>
      {[-largura / 2, largura / 2].map((x) => (
        <mesh key={`pe-${x}`} position={[x, 0.02, 0]}>
          <boxGeometry args={[0.08, 0.04, 0.6]} />
          <meshStandardMaterial color={METAL} />
        </mesh>
      ))}
    </group>
  )
}

function Prateleira() {
  const largura = 1.9
  const profundidade = 0.6
  return (
    <group>
      {[-largura / 2, largura / 2].map((x) => (
        <mesh key={x} position={[x, 0.7, 0]}>
          <boxGeometry args={[0.05, 1.4, profundidade]} />
          <meshStandardMaterial color={MADEIRA} />
        </mesh>
      ))}
      {[0.02, 0.42, 1.02, 1.4].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[largura, 0.04, profundidade]} />
          <meshStandardMaterial color={MADEIRA} />
        </mesh>
      ))}
      <mesh position={[0, 0.7, -profundidade / 2]}>
        <boxGeometry args={[largura, 1.4, 0.02]} />
        <meshStandardMaterial color="#5b4532" />
      </mesh>
    </group>
  )
}

export function MovelLoja({ movel }: { movel: Movel }) {
  return (
    <group position={movel.posicao} rotation={[0, movel.rotacaoY, 0]} name={movel.id}>
      {movel.tipo === 'arara' ? <Arara movel={movel} /> : <Prateleira />}
      {/* Rótulo em HTML: evita baixar fontes de terceiros em tempo de execução. */}
      <Html position={[0, movel.tipo === 'arara' ? 1.85 : 1.65, 0]} center style={{ pointerEvents: 'none' }} zIndexRange={[3, 0]}>
        <div className="rotulo-movel">{movel.nome}</div>
      </Html>
    </group>
  )
}
