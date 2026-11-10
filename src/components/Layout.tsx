import { useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'

export function Layout() {
  const { user, loading, isAdmin, signOut } = useAuth()
  const { itemCount, clear } = useCart()

  useEffect(() => {
    if (!loading && !user && itemCount > 0) {
      clear()
    }
  }, [loading, user, itemCount, clear])

  async function handleSignOut() {
    clear()
    await signOut()
  }

  return (
    <>
      <header className="site-header">
        <div className="shell header-inner">
          <NavLink to="/" className="brand">
            NODO<span>.</span>
          </NavLink>
          <nav className="nav-links">
            <NavLink to="/tienda">Tienda</NavLink>
            {user ? (
              <>
                <NavLink to="/cuenta">Cuenta</NavLink>
                {isAdmin && <NavLink to="/admin">Admin</NavLink>}
                <button type="button" onClick={() => void handleSignOut()}>
                  Salir
                </button>
              </>
            ) : (
              <NavLink to="/auth">Ingresar</NavLink>
            )}
            <NavLink to="/carrito" className="cart-pill">
              <ShoppingBag size={16} />
              Carrito
              <span className="cart-count">{itemCount}</span>
            </NavLink>
          </nav>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="footer">
        <div className="shell">NODO — maqueta de e-commerce. Seguimos armando juntos.</div>
      </footer>
    </>
  )
}
