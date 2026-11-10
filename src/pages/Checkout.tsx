import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { formatPrice } from '@/lib/format'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import type { ShippingMethod } from '@/types/database'

export function Checkout() {
  const { user, profile } = useAuth()
  const { items, subtotalCents, clear } = useCart()
  const navigate = useNavigate()
  const [methods, setMethods] = useState<ShippingMethod[]>([])
  const [shippingId, setShippingId] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    province: '',
    postal_code: '',
    notes: '',
  })

  useEffect(() => {
    void supabase
      .from('shipping_methods')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => {
        const list = (data as ShippingMethod[]) ?? []
        setMethods(list)
        if (list[0]) setShippingId(list[0].id)
      })
  }, [])

  useEffect(() => {
    if (!profile) return
    setForm((prev) => ({
      ...prev,
      full_name: profile.full_name ?? '',
      phone: profile.phone ?? '',
      address_line1: profile.address_line1 ?? '',
      address_line2: profile.address_line2 ?? '',
      city: profile.city ?? '',
      province: profile.province ?? '',
      postal_code: profile.postal_code ?? '',
    }))
  }, [profile])

  const shipping = useMemo(
    () => methods.find((m) => m.id === shippingId) ?? null,
    [methods, shippingId],
  )
  const total = subtotalCents + (shipping?.price_cents ?? 0)

  if (!user) return <Navigate to="/auth" replace />
  if (items.length === 0) return <Navigate to="/tienda" replace />

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!user || !shipping) return
    setLoading(true)
    setError(null)

    try {
      await supabase.from('profiles').update({
        full_name: form.full_name,
        phone: form.phone,
        address_line1: form.address_line1,
        address_line2: form.address_line2 || null,
        city: form.city,
        province: form.province,
        postal_code: form.postal_code,
      }).eq('id', user.id)

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          shipping_method_id: shipping.id,
          shipping_price_cents: shipping.price_cents,
          subtotal_cents: subtotalCents,
          total_cents: total,
          buyer_full_name: form.full_name,
          buyer_email: user.email,
          buyer_phone: form.phone,
          shipping_address_line1: form.address_line1,
          shipping_address_line2: form.address_line2 || null,
          shipping_city: form.city,
          shipping_province: form.province,
          shipping_postal_code: form.postal_code,
          notes: form.notes || null,
          status: 'pending',
        })
        .select('id')
        .single()

      if (orderError) throw orderError

      const lines = items.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        unit_price_cents: item.product.price_cents,
        quantity: item.quantity,
        line_total_cents: item.product.price_cents * item.quantity,
      }))

      const { error: itemsError } = await supabase.from('order_items').insert(lines)
      if (itemsError) throw itemsError

      clear()
      navigate('/cuenta?pedido=ok')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el pedido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page shell checkout-layout">
      <form className="panel stack" onSubmit={onSubmit}>
        <h1 className="page-title" style={{ fontSize: '2rem' }}>
          Checkout
        </h1>
        <p className="muted">Datos del comprador y envío.</p>

        <div className="form-grid two">
          <label>
            Nombre completo
            <input
              required
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </label>
          <label>
            Teléfono
            <input
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>
        </div>
        <label>
          Dirección
          <input
            required
            value={form.address_line1}
            onChange={(e) => setForm({ ...form, address_line1: e.target.value })}
          />
        </label>
        <label>
          Depto / piso / referencia
          <input
            value={form.address_line2}
            onChange={(e) => setForm({ ...form, address_line2: e.target.value })}
          />
        </label>
        <div className="form-grid two">
          <label>
            Ciudad
            <input
              required
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </label>
          <label>
            Provincia
            <input
              required
              value={form.province}
              onChange={(e) => setForm({ ...form, province: e.target.value })}
            />
          </label>
        </div>
        <label>
          Código postal
          <input
            required
            value={form.postal_code}
            onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
          />
        </label>

        <div className="stack">
          <strong>Método de envío</strong>
          {methods.map((method) => (
            <label
              key={method.id}
              className={`shipping-option ${shippingId === method.id ? 'selected' : ''}`}
            >
              <input
                type="radio"
                name="shipping"
                checked={shippingId === method.id}
                onChange={() => setShippingId(method.id)}
              />
              <span>
                <strong>{method.name}</strong>
                <div className="muted">{method.description}</div>
              </span>
              <strong>{formatPrice(method.price_cents)}</strong>
            </label>
          ))}
        </div>

        <label>
          Notas
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </label>

        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Confirmando…' : 'Confirmar pedido'}
        </button>
      </form>

      <aside className="panel stack">
        <h2 style={{ margin: 0 }}>Tu pedido</h2>
        {items.map((item) => (
          <div className="summary-row" key={item.product.id}>
            <span>
              {item.product.name} × {item.quantity}
            </span>
            <span>{formatPrice(item.product.price_cents * item.quantity)}</span>
          </div>
        ))}
        <div className="summary-row">
          <span>Subtotal</span>
          <span>{formatPrice(subtotalCents)}</span>
        </div>
        <div className="summary-row">
          <span>Envío</span>
          <span>{formatPrice(shipping?.price_cents ?? 0)}</span>
        </div>
        <div className="summary-row total">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
        <Link className="btn btn-ghost" to="/carrito">
          Volver al carrito
        </Link>
      </aside>
    </div>
  )
}
