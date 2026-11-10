import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { formatPrice } from '@/lib/format'
import { publicImageUrl, supabase } from '@/lib/supabase'
import { useCart } from '@/context/CartContext'
import type { Product } from '@/types/database'

export function ProductDetail() {
  const { slug } = useParams()
  const { addItem } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [imageIndex, setImageIndex] = useState(0)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (!slug) return
    void supabase
      .from('products')
      .select('*, category:categories(*), product_images(*)')
      .eq('slug', slug)
      .maybeSingle()
      .then(({ data }) => {
        setProduct((data as Product | null) ?? null)
        setImageIndex(0)
      })
  }, [slug])

  const images = useMemo(() => {
    const list = product?.product_images ?? []
    return [...list].sort((a, b) => a.sort_order - b.sort_order)
  }, [product])

  if (!product) {
    return <div className="page shell empty">Cargando producto…</div>
  }

  const activeImage = publicImageUrl(images[imageIndex]?.storage_path)

  return (
    <div className="page shell detail-layout">
      <div className="stack">
        <div className="product-media" style={{ minHeight: 420 }}>
          {activeImage ? (
            <img src={activeImage} alt={product.name} />
          ) : (
            <div className="product-placeholder">{product.name.slice(0, 1)}</div>
          )}
        </div>
        {images.length > 1 && (
          <div className="admin-image-grid">
            {images.map((image, index) => {
              const url = publicImageUrl(image.storage_path)
              return (
                <button
                  key={image.id}
                  type="button"
                  className="admin-image-card"
                  onClick={() => setImageIndex(index)}
                  style={{
                    borderColor: index === imageIndex ? 'var(--accent)' : undefined,
                    cursor: 'pointer',
                  }}
                >
                  {url ? <img src={url} alt={image.alt_text ?? product.name} /> : null}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="stack">
        <div>
          <p className="muted">{product.category?.name ?? 'Sin categoría'}</p>
          <h1 className="page-title">{product.name}</h1>
          <p className="price" style={{ fontSize: '1.5rem' }}>
            {formatPrice(product.price_cents)}
          </p>
        </div>
        <p style={{ lineHeight: 1.6 }}>{product.description}</p>
        <p className="muted">Stock disponible: {product.stock}</p>

        <div className="qty">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Menos"
          >
            −
          </button>
          <strong>{quantity}</strong>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
            aria-label="Más"
          >
            +
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary"
            disabled={product.stock < 1}
            onClick={() => {
              addItem(product, quantity)
              setAdded(true)
            }}
          >
            Agregar al carrito
          </button>
          <Link className="btn btn-ghost" to="/carrito">
            Ir al carrito
          </Link>
        </div>
        {added && <p className="success">Listo, quedó en el carrito.</p>}
      </div>
    </div>
  )
}
