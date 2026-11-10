import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatPrice } from '@/lib/format'
import { publicImageUrl } from '@/lib/supabase'
import type { Product } from '@/types/database'

export function ProductCarousel({ products }: { products: Product[] }) {
  const slides = useMemo(() => products.slice(0, 8), [products])
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (slides.length < 2) return
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length)
    }, 4200)
    return () => window.clearInterval(timer)
  }, [slides.length])

  if (slides.length === 0) return null

  const product = slides[index]
  const image = publicImageUrl(product.product_images?.[0]?.storage_path)

  function go(delta: number) {
    setIndex((current) => (current + delta + slides.length) % slides.length)
  }

  return (
    <section className="section shell">
      <div className="section-head">
        <div>
          <h2>En rotación</h2>
          <p>Un paseo automático por el catálogo.</p>
        </div>
        <div className="carousel-controls">
          <button type="button" className="carousel-nav" onClick={() => go(-1)} aria-label="Anterior">
            <ChevronLeft size={18} />
          </button>
          <button type="button" className="carousel-nav" onClick={() => go(1)} aria-label="Siguiente">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="carousel">
        <div key={product.id} className="carousel-slide">
          <div className="carousel-media">
            {image ? (
              <img src={image} alt={product.name} />
            ) : (
              <div className="product-placeholder">{product.name.slice(0, 1)}</div>
            )}
          </div>
          <div className="carousel-copy">
            <p className="muted">{product.category?.name ?? 'Destacado'}</p>
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <div className="price">{formatPrice(product.price_cents)}</div>
            <Link className="btn btn-primary" to={`/producto/${product.slug}`}>
              Ver producto
            </Link>
          </div>
        </div>

        <div className="carousel-dots" role="tablist" aria-label="Productos del carrusel">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              className={`carousel-dot ${i === index ? 'active' : ''}`}
              aria-label={`Ir al producto ${i + 1}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
