import { useEffect, useState, type FormEvent } from 'react'
import { slugify } from '@/lib/format'
import { supabase } from '@/lib/supabase'
import type { Category } from '@/types/database'

export function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    const { data } = await supabase.from('categories').select('*').order('sort_order')
    setCategories((data as Category[]) ?? [])
  }

  useEffect(() => {
    void load()
  }, [])

  async function onCreate(event: FormEvent) {
    event.preventDefault()
    setError(null)
    const slug = slugify(name)
    const { error: createError } = await supabase.from('categories').insert({
      name,
      slug,
      description: description || null,
      sort_order: categories.length + 1,
    })
    if (createError) {
      setError(createError.message)
      return
    }
    setName('')
    setDescription('')
    setMessage('Categoría creada.')
    await load()
  }

  function startEdit(category: Category) {
    setEditingId(category.id)
    setEditName(category.name)
    setEditDescription(category.description ?? '')
    setMessage(null)
    setError(null)
  }

  async function saveEdit(category: Category) {
    setError(null)
    const nextName = editName.trim()
    if (!nextName) {
      setError('El nombre no puede quedar vacío.')
      return
    }

    const { error: updateError } = await supabase
      .from('categories')
      .update({
        name: nextName,
        slug: slugify(nextName),
        description: editDescription.trim() || null,
      })
      .eq('id', category.id)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setEditingId(null)
    setMessage('Categoría actualizada.')
    await load()
  }

  async function removeCategory(category: Category) {
    const ok = window.confirm(
      `¿Borrar la categoría “${category.name}”? Los productos quedan sin categoría.`,
    )
    if (!ok) return

    setError(null)
    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .eq('id', category.id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    if (editingId === category.id) setEditingId(null)
    setMessage('Categoría eliminada.')
    await load()
  }

  return (
    <div className="stack">
      <div>
        <h1 className="page-title" style={{ fontSize: '2rem' }}>
          Categorías
        </h1>
        <p className="page-sub">Agregá, editá o borrá categorías desde acá.</p>
        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}
      </div>

      <form className="panel form-grid" onSubmit={onCreate}>
        <label>
          Nombre
          <input required value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          Descripción
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <button className="btn btn-primary" type="submit">
          Agregar categoría
        </button>
      </form>

      <div className="panel" style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Slug</th>
              <th>Descripción</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => {
              const isEditing = editingId === category.id
              return (
                <tr key={category.id}>
                  <td>
                    {isEditing ? (
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    ) : (
                      category.name
                    )}
                  </td>
                  <td className="muted">{category.slug}</td>
                  <td>
                    {isEditing ? (
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                      />
                    ) : (
                      category.description
                    )}
                  </td>
                  <td>
                    <div className="row-actions">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            className="btn btn-ink"
                            onClick={() => void saveEdit(category)}
                          >
                            Guardar
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => setEditingId(null)}
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => startEdit(category)}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => void removeCategory(category)}
                          >
                            Borrar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
