import { useEffect, useRef } from 'react'
import { useGestos } from './controlador'

/** Botão de ativar/desativar gestos, aviso de privacidade e indicador de câmera ativa. */
export function ControleGestos() {
  const { estado, erro, pedirAtivacao, cancelarAviso, ativar, desativar } = useGestos()

  return (
    <div className="controle-gestos">
      {estado === 'ativo' ? (
        <>
          <span className="camera-ativa" role="status" data-testid="camera-ativa">
            <span className="ponto-rec" aria-hidden /> Câmera ativa
          </span>
          <button onClick={desativar}>Desativar gestos</button>
        </>
      ) : (
        <button onClick={pedirAtivacao} disabled={estado === 'carregando' || estado === 'aviso'}>
          {estado === 'carregando' ? 'Ativando gestos…' : '✋ Ativar gestos'}
        </button>
      )}

      {erro && (
        <p className="erro-gestos" role="alert">
          {erro}
        </p>
      )}

      {estado === 'aviso' && (
        <div className="dialogo-fundo">
          <div className="dialogo" role="dialog" aria-modal="true" aria-labelledby="titulo-gestos">
            <h2 id="titulo-gestos">Ativar seleção por gestos</h2>
            <p>
              Vamos usar a sua webcam para acompanhar a sua mão. <strong>O vídeo é processado só neste dispositivo</strong>: nenhuma imagem é
              gravada, salva ou enviada pela internet.
            </p>
            <p>Aponte com o dedo indicador e junte polegar e indicador (pinça) para selecionar uma peça.</p>
            <div className="acoes">
              <button onClick={cancelarAviso}>Cancelar</button>
              <button className="primario" onClick={() => void ativar()} autoFocus>
                Permitir câmera
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** Miniatura espelhada da câmera, para o usuário se orientar. */
export function PreviaCamera() {
  const stream = useGestos((s) => s.stream)
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream
  }, [stream])

  if (!stream) return null
  return <video ref={ref} className="previa-camera" autoPlay muted playsInline aria-label="Prévia da câmera" />
}

/** Cursor da mão desenhado sobre a cena, com estado visual da pinça. */
export function CursorMao() {
  const cursor = useGestos((s) => s.cursor)
  const pinca = useGestos((s) => s.pinca)
  if (!cursor) return null
  return (
    <div
      className={`cursor-mao ${pinca}`}
      data-testid="cursor-mao"
      data-pinca={pinca}
      style={{ left: `${cursor.x * 100}%`, top: `${cursor.y * 100}%` }}
      aria-hidden
    />
  )
}
