import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export function AdminHome() {
  const [stats, setStats] = useState({ products: 0, categories: 0, orders: 0 })

  useEffect(() => {
    void Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('categories').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
    ]).then(([products, categories, orders]) => {
      setStats({
        products: products.count ?? 0,
        categories: categories.count ?? 0,
        orders: orders.count ?? 0,
      })
    })
  }, [])

  return (
    <div className="stack">
      <div>
        <h1 className="page-title" style={{ fontSize: '2rem' }}>
          Panel
        </h1>
        <p className="page-sub">Administrá catálogo, categorías y envíos.</p>
      </div>
      <div className="product-grid">
        <div className="panel">
          <div className="muted">Productos</div>
          <strong style={{ fontSize: '2rem' }}>{stats.products}</strong>
        </div>
        <div className="panel">
          <div className="muted">Categorías</div>
          <strong style={{ fontSize: '2rem' }}>{stats.categories}</strong>
        </div>
        <div className="panel">
          <div className="muted">Pedidos</div>
          <strong style={{ fontSize: '2rem' }}>{stats.orders}</strong>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap' }}>
        <Link className="btn btn-primary" to="/admin/productos">
          Cargar producto
        </Link>
        <Link className="btn btn-ghost" to="/admin/categorias">
          Nueva categoría
        </Link>
      </div>
    </div>
  )
}
