import { Link } from 'react-router-dom'
import { formatPrice } from '@/lib/format'
import { publicImageUrl } from '@/lib/supabase'
import type { Product } from '@/types/database'

export function ProductCard({ product }: { product: Product }) {
  const image = publicImageUrl(product.product_images?.[0]?.storage_path)

  return (
    <Link to={`/producto/${product.slug}`} className="product-card">
      <div className="product-media">
        {image ? (
          <img src={image} alt={product.name} />
        ) : (
          <div className="product-placeholder">{product.name.slice(0, 1)}</div>
        )}
      </div>
      <div className="product-meta">
        <h3>{product.name}</h3>
        <p>{product.category?.name ?? 'Sin categoría'}</p>
        <div className="price">{formatPrice(product.price_cents)}</div>
      </div>
    </Link>
  )
}
