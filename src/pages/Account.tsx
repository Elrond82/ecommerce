import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { formatPrice } from '@/lib/format'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

type OrderRow = {
  id: string
  status: string
  total_cents: number
  created_at: string
}

export function Account() {
  const { user, profile, loading, refreshProfile } = useAuth()
  const [params] = useSearchParams()
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [message, setMessage] = useState<string | null>(
    params.get('pedido') === 'ok' ? 'Pedido creado. ¡Gracias!' : null,
  )
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    province: '',
    postal_code: '',
  })

  useEffect(() => {
    if (!profile) return
    setForm({
      full_name: profile.full_name ?? '',
      phone: profile.phone ?? '',
      address_line1: profile.address_line1 ?? '',
      address_line2: profile.address_line2 ?? '',
      city: profile.city ?? '',
      province: profile.province ?? '',
      postal_code: profile.postal_code ?? '',
    })
  }, [profile])

  useEffect(() => {
    if (!user) return
    void supabase
      .from('orders')
      .select('id, status, total_cents, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setOrders((data as OrderRow[]) ?? []))
  }, [user])

  if (loading) return <div className="page shell empty">Cargando cuenta…</div>
  if (!user) return <Navigate to="/auth" replace />

  async function onSave(event: FormEvent) {
    event.preventDefault()
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name,
        phone: form.phone,
        address_line1: form.address_line1,
        address_line2: form.address_line2 || null,
        city: form.city,
        province: form.province,
        postal_code: form.postal_code,
      })
      .eq('id', user!.id)

    if (error) {
      setMessage(error.message)
      return
    }
    await refreshProfile()
    setMessage('Datos guardados.')
  }

  return (
    <div className="page shell stack">
      <div>
        <h1 className="page-title">Mi cuenta</h1>
        <p className="page-sub">{user.email}</p>
        {message && <p className="success">{message}</p>}
      </div>

      <div className="cart-layout">
        <form className="panel form-grid" onSubmit={onSave}>
          <h2 style={{ margin: 0 }}>Datos del comprador</h2>
          <label>
            Nombre completo
            <input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </label>
          <label>
            Teléfono
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>
          <label>
            Dirección
            <input
              value={form.address_line1}
              onChange={(e) => setForm({ ...form, address_line1: e.target.value })}
            />
          </label>
          <label>
            Depto / piso
            <input
              value={form.address_line2}
              onChange={(e) => setForm({ ...form, address_line2: e.target.value })}
            />
          </label>
          <div className="form-grid two">
            <label>
              Ciudad
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </label>
            <label>
              Provincia
              <input
                value={form.province}
                onChange={(e) => setForm({ ...form, province: e.target.value })}
              />
            </label>
          </div>
          <label>
            Código postal
            <input
              value={form.postal_code}
              onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
            />
          </label>
          <button className="btn btn-ink" type="submit">
            Guardar datos
          </button>
        </form>

        <div className="panel stack">
          <h2 style={{ margin: 0 }}>Pedidos</h2>
          {orders.length === 0 ? (
            <p className="muted">
              Todavía no hay pedidos. <Link to="/tienda">Ir a la tienda</Link>
            </p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>{new Date(order.created_at).toLocaleDateString('es-AR')}</td>
                    <td>{order.status}</td>
                    <td>{formatPrice(order.total_cents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
