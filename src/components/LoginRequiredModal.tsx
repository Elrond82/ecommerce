import { Link } from 'react-router-dom'

type LoginRequiredModalProps = {
  open: boolean
  onClose: () => void
  next?: string
}

export function LoginRequiredModal({
  open,
  onClose,
  next = '/cuenta',
}: LoginRequiredModalProps) {
  if (!open) return null

  const nextParam = encodeURIComponent(next)

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-card panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-required-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="login-required-title" style={{ margin: 0 }}>
          Tenés que estar registrado
        </h2>
        <p className="muted" style={{ margin: '0.75rem 0 1.2rem' }}>
          Para agregar productos al carrito y comprar, ingresá o creá una cuenta.
        </p>
        <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap' }}>
          <Link className="btn btn-primary" to={`/auth?next=${nextParam}`}>
            Ingresar
          </Link>
          <Link className="btn btn-ink" to={`/auth?mode=register&next=${nextParam}`}>
            Registrarme
          </Link>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Seguir mirando
          </button>
        </div>
      </div>
    </div>
  )
}
