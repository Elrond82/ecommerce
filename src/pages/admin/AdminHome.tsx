import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

type NotificationRow = {
  id: string
  subject: string
  body: string
  created_at: string
  email_sent: boolean
  recipient_email: string | null
}

export function AdminHome() {
  const [stats, setStats] = useState({ products: 0, categories: 0, orders: 0 })
  const [salesMail, setSalesMail] = useState<NotificationRow[]>([])

  useEffect(() => {
    void Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('categories').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase
        .from('order_notifications')
        .select('id, subject, body, created_at, email_sent, recipient_email')
        .eq('recipient_role', 'seller')
        .order('created_at', { ascending: false })
        .limit(10),
    ]).then(([products, categories, orders, notifications]) => {
      setStats({
        products: products.count ?? 0,
        categories: categories.count ?? 0,
        orders: orders.count ?? 0,
      })
      setSalesMail((notifications.data as NotificationRow[]) ?? [])
    })
  }, [])

  return (
    <div className="stack">
      <div>
        <h1 className="page-title" style={{ fontSize: '2rem' }}>
          Panel
        </h1>
        <p className="page-sub">Administrá catálogo, categorías, envíos y ventas.</p>
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

      <div className="panel stack">
        <h2 style={{ margin: 0 }}>Avisos de venta</h2>
        <p className="muted">
          Cuando alguien paga, el vendedor (admin) recibe el detalle de la venta.
        </p>
        {salesMail.length === 0 ? (
          <p className="muted">Todavía no hay ventas registradas.</p>
        ) : (
          salesMail.map((note) => (
            <article key={note.id} className="receipt-card">
              <strong>{note.subject}</strong>
              <div className="muted" style={{ margin: '0.35rem 0 0.7rem' }}>
                {new Date(note.created_at).toLocaleString('es-AR')}
                {note.recipient_email ? ` · ${note.recipient_email}` : ''}
                {note.email_sent ? ' · enviado por email' : ' · guardado en el panel'}
              </div>
              <pre className="receipt-body">{note.body}</pre>
            </article>
          ))
        )}
      </div>
    </div>
  )
}
