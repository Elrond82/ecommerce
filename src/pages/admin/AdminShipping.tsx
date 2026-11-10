import { useEffect, useState, type FormEvent } from 'react'
import { formatPrice } from '@/lib/format'
import { supabase } from '@/lib/supabase'
import type { ShippingMethod } from '@/types/database'

const emptyForm = {
  name: '',
  description: '',
  price: '',
  minDays: '',
  maxDays: '',
}

export function AdminShipping() {
  const [methods, setMethods] = useState<ShippingMethod[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)

  async function load() {
    const { data } = await supabase
      .from('shipping_methods')
      .select('*')
      .order('sort_order')
    setMethods((data as ShippingMethod[]) ?? [])
  }

  useEffect(() => {
    void load()
  }, [])

  function resetForm() {
    setEditingId(null)
    setForm(emptyForm)
  }

  function startEdit(method: ShippingMethod) {
    setEditingId(method.id)
    setMessage(null)
    setError(null)
    setForm({
      name: method.name,
      description: method.description ?? '',
      price: String(method.price_cents / 100),
      minDays: method.estimated_days_min != null ? String(method.estimated_days_min) : '',
      maxDays: method.estimated_days_max != null ? String(method.estimated_days_max) : '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setMessage(null)
    setError(null)
    setSaving(true)

    try {
      const price_cents = Math.round(Number(form.price.replace(',', '.')) * 100)
      if (!form.name.trim() || Number.isNaN(price_cents) || price_cents < 0) {
        throw new Error('Completá nombre y un precio válido')
      }

      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price_cents,
        estimated_days_min: form.minDays ? Number(form.minDays) : null,
        estimated_days_max: form.maxDays ? Number(form.maxDays) : null,
      }

      if (editingId) {
        const { error: updateError } = await supabase
          .from('shipping_methods')
          .update(payload)
          .eq('id', editingId)
        if (updateError) throw updateError
        setMessage('Método de envío actualizado.')
        resetForm()
      } else {
        const { error: createError } = await supabase.from('shipping_methods').insert({
          ...payload,
          sort_order: methods.length + 1,
          is_active: true,
        })
        if (createError) throw createError
        setMessage('Método de envío creado.')
        resetForm()
      }

      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el envío')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(method: ShippingMethod) {
    setError(null)
    const { error: toggleError } = await supabase
      .from('shipping_methods')
      .update({ is_active: !method.is_active })
      .eq('id', method.id)
    if (toggleError) {
      setError(toggleError.message)
      return
    }
    await load()
  }

  async function removeMethod(method: ShippingMethod) {
    const ok = window.confirm(`¿Borrar el método “${method.name}”?`)
    if (!ok) return

    setError(null)
    const { error: deleteError } = await supabase
      .from('shipping_methods')
      .delete()
      .eq('id', method.id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    if (editingId === method.id) resetForm()
    setMessage('Método de envío eliminado.')
    await load()
  }

  return (
    <div className="stack">
      <div>
        <h1 className="page-title" style={{ fontSize: '2rem' }}>
          Envíos
        </h1>
        <p className="page-sub">
          {editingId
            ? 'Editá precio, tiempos y descripción del envío.'
            : 'Agregá, editá o desactivá métodos de envío.'}
        </p>
        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}
      </div>

      <form className="panel form-grid" onSubmit={onSubmit}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.8rem', flexWrap: 'wrap' }}>
          <strong>{editingId ? 'Editar envío' : 'Nuevo envío'}</strong>
          {editingId && (
            <button type="button" className="btn btn-ghost" onClick={resetForm}>
              Cancelar edición
            </button>
          )}
        </div>

        <label>
          Nombre
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <label>
          Descripción
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>
        <div className="form-grid two">
          <label>
            Precio (ARS)
            <input
              required
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </label>
          <label>
            Días (mín–máx)
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="number"
                placeholder="1"
                value={form.minDays}
                onChange={(e) => setForm({ ...form, minDays: e.target.value })}
              />
              <input
                type="number"
                placeholder="5"
                value={form.maxDays}
                onChange={(e) => setForm({ ...form, maxDays: e.target.value })}
              />
            </div>
          </label>
        </div>
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Agregar envío'}
        </button>
      </form>

      <div className="panel" style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Método</th>
              <th>Precio</th>
              <th>Tiempo</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {methods.map((method) => (
              <tr key={method.id}>
                <td>
                  <strong>{method.name}</strong>
                  <div className="muted">{method.description}</div>
                </td>
                <td>{formatPrice(method.price_cents)}</td>
                <td>
                  {method.estimated_days_min ?? '—'}–{method.estimated_days_max ?? '—'} días
                </td>
                <td>{method.is_active ? 'Activo' : 'Oculto'}</td>
                <td>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="btn btn-ink"
                      onClick={() => startEdit(method)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => void toggleActive(method)}
                    >
                      {method.is_active ? 'Ocultar' : 'Activar'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => void removeMethod(method)}
                    >
                      Borrar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
