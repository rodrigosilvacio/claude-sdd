import { OrbitControls } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type PointerEvent as ReactPointerEvent } from 'react'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { LAYOUT } from '../dados/layout'
import type { OrigemSelecao } from '../store/loja'
import { MovelLoja } from './Moveis'
import { Peca3D } from './Peca3D'
import { ALVO_INICIAL, CAMERA_INICIAL, pecasPosicionadas } from './posicionamento'
import { apontar, limparDestaque, posicaoCamera, projetarParaTela, registrarCena, selecionarEmPonto } from './ponteiro'


/** Distância máxima (px) entre pointerdown e pointerup para contar como clique, e não arrasto. */
const LIMIAR_CLIQUE = 6

function RegistroCena() {
  const { camera, scene, gl } = useThree()
  useEffect(() => {
    registrarCena({ camera, cena: scene, elemento: gl.domElement })
    return () => registrarCena(null)
  }, [camera, scene, gl])
  return null
}

export function Cena() {
  const controles = useRef<OrbitControlsImpl>(null)
  const inicioClique = useRef<{ x: number; y: number } | null>(null)
  const pecas = useMemo(() => pecasPosicionadas(), [])

  // Gancho para testes e2e (só em builds com VITE_E2E=1).
  useEffect(() => {
    if (import.meta.env.VITE_E2E !== '1') return
    const w = window as unknown as Record<string, unknown>
    w.__gemeo = {
      projetarPeca: (id: string) => {
        const p = pecas.find((x) => x.peca.id === id)
        return p ? projetarParaTela(p.posicao) : null
      },
      posicaoCamera,
    }
  }, [pecas])

  const origemDe = (e: ReactPointerEvent): OrigemSelecao => (e.pointerType === 'touch' ? 'toque' : 'mouse')

  return (
    <div className="cena-wrap" data-testid="cena">
      <Canvas
        camera={{ position: CAMERA_INICIAL, fov: 50 }}
        dpr={[1, 2]}
        onPointerMove={(e) => apontar(e.clientX, e.clientY, origemDe(e) === 'toque' ? 'toque' : 'mouse')}
        onPointerLeave={() => limparDestaque('mouse')}
        onPointerDown={(e) => {
          inicioClique.current = { x: e.clientX, y: e.clientY }
          if (e.pointerType === 'touch') apontar(e.clientX, e.clientY, 'toque')
        }}
        onPointerUp={(e) => {
          const inicio = inicioClique.current
          inicioClique.current = null
          if (!inicio || Math.hypot(e.clientX - inicio.x, e.clientY - inicio.y) > LIMIAR_CLIQUE) return
          selecionarEmPonto(e.clientX, e.clientY, origemDe(e))
        }}
      >
        <color attach="background" args={['#12151c']} />
        <hemisphereLight args={['#dbe4ff', '#1b1e26', 0.9]} />
        <directionalLight position={[4, 8, 5]} intensity={1.4} />
        <RegistroCena />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[12, 8]} />
          <meshStandardMaterial color="#2a2f3a" />
        </mesh>
        <gridHelper args={[12, 12, '#3a4150', '#323846']} position={[0, 0.001, 0]} />

        {LAYOUT.map((m) => (
          <MovelLoja key={m.id} movel={m} />
        ))}
        {pecas.map(({ peca, posicao, rotacaoY, tipoMovel }) => (
          <Peca3D key={peca.id} peca={peca} posicao={posicao} rotacaoY={rotacaoY} tipoMovel={tipoMovel} />
        ))}

        <OrbitControls
          ref={controles}
          makeDefault
          target={ALVO_INICIAL}
          enablePan={false}
          minDistance={4}
          maxDistance={14}
          minPolarAngle={0.2}
          maxPolarAngle={1.35}
        />
      </Canvas>

      <div className="controles-cena">
        <button
          onClick={() => {
            const c = controles.current
            if (!c) return
            // Com damping ligado, a inércia do último arrasto continuaria movendo a câmera.
            // Desliga o damping, consome o movimento residual e reposiciona.
            const damping = c.enableDamping
            c.enableDamping = false
            c.update()
            c.object.position.set(...CAMERA_INICIAL)
            c.target.set(...ALVO_INICIAL)
            c.update()
            c.enableDamping = damping
          }}
        >
          Vista inicial
        </button>
      </div>
    </div>
  )
}
