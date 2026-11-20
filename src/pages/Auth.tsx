import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

type Mode = 'login' | 'register' | 'recover' | 'update'

export function Auth() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const nextPath = params.get('next')
  const safeNext =
    nextPath && nextPath.startsWith('/') && !nextPath.startsWith('//') ? nextPath : '/cuenta'
  const [mode, setMode] = useState<Mode>('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const requested = params.get('mode')
    if (requested === 'recover' || requested === 'update' || requested === 'register') {
      setMode(requested)
    }

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('update')
        setInfo('Elegí una contraseña nueva para tu cuenta.')
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [params])

  if (user && mode !== 'update') return <Navigate to={safeNext} replace />

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)

    try {
      if (mode === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError
        navigate(safeNext)
      } else if (mode === 'register') {
        const emailRedirectTo = `${window.location.origin}/auth?mode=login&next=${encodeURIComponent(safeNext)}`
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo,
          },
        })
        if (signUpError) throw signUpError

        // Si Supabase pide confirmar email, no hay sesión todavía.
        if (!signUpData.session) {
          setMode('login')
          setInfo(
            '¡Bienvenido/a a NODO! Te enviamos un email de bienvenida para confirmar tu cuenta. Revisá tu bandeja (y spam).',
          )
          return
        }

        setInfo('¡Bienvenido/a a NODO! Tu cuenta ya está lista.')
        navigate(safeNext)
      } else if (mode === 'recover') {
        const redirectTo = `${window.location.origin}/auth?mode=update`
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo,
        })
        if (resetError) throw resetError
        setInfo('Te enviamos un email para recuperar la contraseña. Revisá tu bandeja (y spam).')
      } else {
        const { error: updateError } = await supabase.auth.updateUser({ password })
        if (updateError) throw updateError
        setInfo('Contraseña actualizada. Ya podés usar la tienda.')
        navigate('/cuenta')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo autenticar')
    } finally {
      setLoading(false)
    }
  }

  const title =
    mode === 'login'
      ? 'Ingresar'
      : mode === 'register'
        ? 'Crear cuenta'
        : mode === 'recover'
          ? 'Recuperar contraseña'
          : 'Nueva contraseña'

  return (
    <div className="page shell">
      <div className="auth-wrap panel">
        <h1 className="page-title" style={{ fontSize: '2rem' }}>
          {title}
        </h1>
        <p className="page-sub">
          {mode === 'recover'
            ? 'Te mandamos un link al email para crear una nueva clave.'
            : mode === 'update'
              ? 'Definí tu nueva contraseña.'
              : safeNext === '/checkout'
                ? 'Ingresá o registrate para completar la compra.'
                : 'Registro de comprador para pedidos y cuenta.'}
        </p>

        {(mode === 'login' || mode === 'register') && (
          <div className="tabs">
            <button
              type="button"
              className={mode === 'login' ? 'active' : ''}
              onClick={() => {
                setMode('login')
                setError(null)
                setInfo(null)
              }}
            >
              Ingresar
            </button>
            <button
              type="button"
              className={mode === 'register' ? 'active' : ''}
              onClick={() => {
                setMode('register')
                setError(null)
                setInfo(null)
              }}
            >
              Registrarme
            </button>
          </div>
        )}

        <form className="form-grid" onSubmit={onSubmit}>
          {mode === 'register' && (
            <label>
              Nombre completo
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </label>
          )}

          {mode !== 'update' && (
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
          )}

          {(mode === 'login' || mode === 'register' || mode === 'update') && (
            <label>
              {mode === 'update' ? 'Nueva contraseña' : 'Contraseña'}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </label>
          )}

          {error && <p className="error">{error}</p>}
          {info && <p className="success">{info}</p>}

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading
              ? 'Esperá…'
              : mode === 'login'
                ? 'Entrar'
                : mode === 'register'
                  ? 'Crear cuenta'
                  : mode === 'recover'
                    ? 'Enviar link'
                    : 'Guardar contraseña'}
          </button>
        </form>

        <div className="auth-links">
          {mode === 'login' && (
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                setMode('recover')
                setError(null)
                setInfo(null)
              }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}
          {(mode === 'recover' || mode === 'update') && (
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                setMode('login')
                setError(null)
                setInfo(null)
              }}
            >
              Volver a ingresar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
