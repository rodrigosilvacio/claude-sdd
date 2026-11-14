import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import type { Peca, TipoMovel, Vec3 } from '../dados/tipos'
import { formatarPreco } from '../formato'
import { useLoja } from '../store/loja'
import { aparenciaPeca } from './aparencia'
import { usePonteiro } from './ponteiro'

interface Props {
  peca: Peca
  posicao: Vec3
  rotacaoY?: number
  tipoMovel: TipoMovel
}

const DURACAO_PULSO = 0.45

export function Peca3D({ peca, posicao, rotacaoY = 0, tipoMovel }: Props) {
  // Assina apenas o próprio saldo: mudanças em outras peças não re-renderizam esta.
  const saldo = useLoja((s) => s.saldos[peca.id] ?? 0)
  const destacada = usePonteiro((s) => s.destacada === peca.id)
  const seqAceita = useLoja((s) => (s.ultimoEvento?.pecaId === peca.id && s.ultimoEvento.aceita ? s.ultimoEvento.seq : 0))

  const grupo = useRef<Group>(null)
  const pulso = useRef({ seq: 0, inicio: -1 })
  const a = aparenciaPeca(peca.cor, saldo, destacada)

  useFrame(({ clock }) => {
    const g = grupo.current
    if (!g) return
    if (seqAceita && seqAceita !== pulso.current.seq) pulso.current = { seq: seqAceita, inicio: clock.elapsedTime }
    const t = pulso.current.inicio < 0 ? 1 : (clock.elapsedTime - pulso.current.inicio) / DURACAO_PULSO
    const extra = t < 1 ? Math.sin(t * Math.PI) * 0.18 : 0
    g.scale.setScalar(a.escala + extra)
  })

  const material = (
    <meshStandardMaterial
      color={a.cor}
      transparent={a.opacidade < 1}
      opacity={a.opacidade}
      emissive={a.emissiva}
      emissiveIntensity={a.intensidadeEmissiva}
      roughness={0.8}
    />
  )

  return (
    <group position={posicao} rotation={[0, rotacaoY, 0]}>
      <group ref={grupo} userData={{ pecaId: peca.id }} name={`peca-${peca.id}`}>
        {tipoMovel === 'arara' ? (
          <>
            {/* cabide */}
            <mesh position={[0, 0.43, 0]}>
              <torusGeometry args={[0.05, 0.012, 6, 12]} />
              <meshStandardMaterial color="#9ca3af" metalness={0.6} />
            </mesh>
            <mesh position={[0, 0.38, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.012, 0.012, 0.5, 6]} />
              <meshStandardMaterial color="#9ca3af" metalness={0.6} />
            </mesh>
            {/* peça pendurada */}
            <mesh position={[0, 0, 0]} castShadow={false}>
              <boxGeometry args={[0.55, 0.75, 0.05]} />
              {material}
            </mesh>
          </>
        ) : (
          // pilha de peças dobradas
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.6, 0.22, 0.42]} />
            {material}
          </mesh>
        )}
      </group>

      <Html
        position={[0, tipoMovel === 'arara' ? -0.55 : 0.25, 0.1]}
        center
        style={{ pointerEvents: 'none' }}
        zIndexRange={[4, 0]}
      >
        <div className={`rotulo-peca ${a.nivel}`} data-testid={`rotulo-${peca.id}`} data-nivel={a.nivel}>
          {a.rotulo}
        </div>
        {destacada && (
          <div className="tooltip-peca" data-testid="tooltip-peca">
            <strong>{peca.nome}</strong>
            <span>{formatarPreco(peca.preco)}</span>
            <span>{a.nivel === 'esgotado' ? 'Esgotado' : `${saldo} em estoque`}</span>
          </div>
        )}
      </Html>
    </group>
  )
}
