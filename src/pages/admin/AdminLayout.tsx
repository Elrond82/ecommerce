import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export function AdminLayout() {
  const { loading, isAdmin } = useAuth()

  if (loading) return <div className="page shell empty">Cargando…</div>
  if (!isAdmin) return <Navigate to="/" replace />

  return (
    <div className="page shell admin-layout">
      <aside className="panel admin-nav">
        <strong style={{ padding: '0.4rem 0.9rem' }}>Admin</strong>
        <NavLink to="/admin" end>
          Resumen
        </NavLink>
        <NavLink to="/admin/productos">Productos</NavLink>
        <NavLink to="/admin/categorias">Categorías</NavLink>
        <NavLink to="/admin/envios">Envíos</NavLink>
      </aside>
      <div>
        <Outlet />
      </div>
    </div>
  )
}
