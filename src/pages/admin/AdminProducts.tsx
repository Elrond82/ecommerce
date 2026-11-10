import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { formatPrice, slugify } from '@/lib/format'
import { publicImageUrl, supabase } from '@/lib/supabase'
import type { Category, Product, ProductImage } from '@/types/database'

const MAX_PRODUCT_IMAGES = 4

const emptyForm = {
  name: '',
  description: '',
  price: '',
  stock: '1',
  category_id: '',
}

export function AdminProducts() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [files, setFiles] = useState<FileList | null>(null)

  const editingProduct = useMemo(
    () => products.find((product) => product.id === editingId) ?? null,
    [products, editingId],
  )

  const editingImages = useMemo(() => {
    const images = editingProduct?.product_images ?? []
    return [...images].sort((a, b) => a.sort_order - b.sort_order)
  }, [editingProduct])

  async function load() {
    const [{ data: cats }, { data: prods }] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase
        .from('products')
        .select('*, category:categories(*), product_images(*)')
        .order('created_at', { ascending: false }),
    ])
    setCategories((cats as Category[]) ?? [])
    setProducts((prods as Product[]) ?? [])
    if (cats?.[0] && !form.category_id && !editingId) {
      setForm((prev) => ({ ...prev, category_id: cats[0].id }))
    }
  }

  useEffect(() => {
    void load()
  }, [])

  function resetForm(keepCategory = true) {
    setEditingId(null)
    setFiles(null)
    setForm({
      ...emptyForm,
      category_id: keepCategory ? form.category_id : '',
    })
  }

  function startEdit(product: Product) {
    setEditingId(product.id)
    setFiles(null)
    setMessage(null)
    setError(null)
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price_cents / 100),
      stock: String(product.stock),
      category_id: product.category_id ?? '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const currentImageCount = editingId ? editingImages.length : 0
  const remainingSlots = MAX_PRODUCT_IMAGES - currentImageCount

  function onFilesChange(selected: FileList | null) {
    if (!selected || selected.length === 0) {
      setFiles(null)
      return
    }

    if (selected.length > remainingSlots) {
      setError(
        remainingSlots <= 0
          ? `Este producto ya tiene el máximo de ${MAX_PRODUCT_IMAGES} fotos.`
          : `Podés agregar hasta ${remainingSlots} foto${remainingSlots === 1 ? '' : 's'} más (máximo ${MAX_PRODUCT_IMAGES}).`,
      )
      setFiles(null)
      return
    }

    setError(null)
    setFiles(selected)
  }

  async function uploadImages(productId: string, productName: string, startOrder: number) {
    if (!files || files.length === 0) return

    const existingCount = editingId === productId ? editingImages.length : 0
    const selected = Array.from(files).slice(0, MAX_PRODUCT_IMAGES - existingCount)
    if (selected.length === 0) {
      throw new Error(`Este producto ya tiene el máximo de ${MAX_PRODUCT_IMAGES} fotos.`)
    }

    let order = startOrder
    for (const file of selected) {
      const path = `${productId}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(path, file)
      if (uploadError) throw uploadError

      const { error: imageError } = await supabase.from('product_images').insert({
        product_id: productId,
        storage_path: path,
        alt_text: productName,
        sort_order: order,
      })
      if (imageError) throw imageError
      order += 1
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setMessage(null)
    setError(null)
    setSaving(true)

    try {
      const price_cents = Math.round(Number(form.price.replace(',', '.')) * 100)
      const stock = Number(form.stock)
      if (!form.name || Number.isNaN(price_cents) || Number.isNaN(stock)) {
        throw new Error('Completá nombre, precio y stock')
      }

      const incomingCount = files?.length ?? 0
      if (editingId) {
        if (editingImages.length + incomingCount > MAX_PRODUCT_IMAGES) {
          throw new Error(`Máximo ${MAX_PRODUCT_IMAGES} fotos por producto.`)
        }

        const { error: updateError } = await supabase
          .from('products')
          .update({
            name: form.name,
            description: form.description,
            price_cents,
            stock,
            category_id: form.category_id || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId)

        if (updateError) throw updateError

        await uploadImages(editingId, form.name, editingImages.length)
        setMessage('Producto actualizado.')
        setFiles(null)
        await load()
      } else {
        if (incomingCount > MAX_PRODUCT_IMAGES) {
          throw new Error(`Máximo ${MAX_PRODUCT_IMAGES} fotos por producto.`)
        }

        const slug = `${slugify(form.name)}-${Date.now().toString(36)}`
        const { data: product, error: createError } = await supabase
          .from('products')
          .insert({
            name: form.name,
            slug,
            description: form.description,
            price_cents,
            stock,
            category_id: form.category_id || null,
            is_active: true,
          })
          .select('id')
          .single()

        if (createError) throw createError

        await uploadImages(product.id, form.name, 0)
        resetForm()
        setMessage('Producto creado.')
        await load()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el producto')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(product: Product) {
    setError(null)
    const { error: toggleError } = await supabase
      .from('products')
      .update({ is_active: !product.is_active })
      .eq('id', product.id)
    if (toggleError) {
      setError(toggleError.message)
      return
    }
    await load()
  }

  async function removeImage(image: ProductImage) {
    const ok = window.confirm('¿Borrar esta foto del producto?')
    if (!ok) return

    setError(null)
    const { error: storageError } = await supabase.storage
      .from('product-images')
      .remove([image.storage_path])
    if (storageError) {
      setError(storageError.message)
      return
    }

    const { error: deleteError } = await supabase
      .from('product_images')
      .delete()
      .eq('id', image.id)
    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setMessage('Foto eliminada.')
    await load()
  }

  return (
    <div className="stack">
      <div>
        <h1 className="page-title" style={{ fontSize: '2rem' }}>
          Productos
        </h1>
        <p className="page-sub">
          {editingId
            ? 'Editá datos, stock y sumá más fotos al producto.'
            : 'Alta con fotos, stock, precio y categoría.'}
        </p>
        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}
      </div>

      <form className="panel form-grid" onSubmit={onSubmit}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.8rem', flexWrap: 'wrap' }}>
          <strong>{editingId ? 'Editar producto' : 'Nuevo producto'}</strong>
          {editingId && (
            <button type="button" className="btn btn-ghost" onClick={() => resetForm()}>
              Cancelar edición
            </button>
          )}
        </div>

        <div className="form-grid two">
          <label>
            Nombre
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label>
            Categoría
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            >
              <option value="">Sin categoría</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </div>

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
              inputMode="decimal"
              placeholder="12999"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </label>
          <label>
            Stock
            <input
              required
              type="number"
              min={0}
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
            />
          </label>
        </div>

        {editingId && editingImages.length > 0 && (
          <div className="stack">
            <strong>Fotos actuales</strong>
            <div className="admin-image-grid">
              {editingImages.map((image) => {
                const url = publicImageUrl(image.storage_path)
                return (
                  <div className="admin-image-card" key={image.id}>
                    {url ? <img src={url} alt={image.alt_text ?? form.name} /> : null}
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => void removeImage(image)}
                    >
                      Borrar foto
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <label>
          {editingId ? 'Agregar más fotos' : 'Fotos'}
          <input
            key={`${editingId ?? 'new'}-${currentImageCount}-${files?.length ?? 0}`}
            type="file"
            accept="image/*"
            multiple
            disabled={remainingSlots <= 0}
            onChange={(e) => onFilesChange(e.target.files)}
          />
          <span className="muted">
            {remainingSlots <= 0
              ? `Ya tiene ${MAX_PRODUCT_IMAGES} fotos (máximo).`
              : `Hasta ${MAX_PRODUCT_IMAGES} por producto. Te quedan ${remainingSlots}.`}
          </span>
        </label>

        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving
            ? 'Guardando…'
            : editingId
              ? 'Guardar cambios'
              : 'Publicar producto'}
        </button>
      </form>

      <div className="panel" style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Foto</th>
              <th>Producto</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const images = [...(product.product_images ?? [])].sort(
                (a, b) => a.sort_order - b.sort_order,
              )
              const image = publicImageUrl(images[0]?.storage_path)
              return (
                <tr key={product.id}>
                  <td>
                    <div className="cart-thumb">
                      {image ? <img src={image} alt={product.name} /> : null}
                    </div>
                  </td>
                  <td>
                    <strong>{product.name}</strong>
                    <div className="muted">
                      {product.category?.name ?? 'Sin categoría'}
                      {images.length > 0 ? ` · ${images.length} foto${images.length > 1 ? 's' : ''}` : ''}
                    </div>
                  </td>
                  <td>{formatPrice(product.price_cents)}</td>
                  <td>{product.stock}</td>
                  <td>{product.is_active ? 'Activo' : 'Oculto'}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="btn btn-ink"
                        onClick={() => startEdit(product)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => void toggleActive(product)}
                      >
                        {product.is_active ? 'Ocultar' : 'Activar'}
                      </button>
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
