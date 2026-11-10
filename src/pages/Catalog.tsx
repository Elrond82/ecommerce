import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ProductCard } from '@/components/ProductCard'
import { supabase } from '@/lib/supabase'
import type { Category, Product } from '@/types/database'

export function Catalog() {
  const [params, setParams] = useSearchParams()
  const selected = params.get('cat') ?? 'todas'
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase
        .from('products')
        .select('*, category:categories(*), product_images(*)')
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
    ]).then(([cats, prods]) => {
      setCategories((cats.data as Category[]) ?? [])
      setProducts((prods.data as Product[]) ?? [])
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(() => {
    if (selected === 'todas') return products
    return products.filter((p) => p.category?.slug === selected)
  }, [products, selected])

  return (
    <div className="page shell">
      <h1 className="page-title">Tienda</h1>
      <p className="page-sub">Filtrá por categoría y explorá el catálogo.</p>

      <div className="category-row">
        <button
          type="button"
          className={`chip ${selected === 'todas' ? 'active' : ''}`}
          onClick={() => setParams({})}
        >
          Todas
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            className={`chip ${selected === category.slug ? 'active' : ''}`}
            onClick={() => setParams({ cat: category.slug })}
          >
            {category.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="empty">Cargando productos…</div>
      ) : filtered.length === 0 ? (
        <div className="empty">No hay productos en esta categoría.</div>
      ) : (
        <div className="product-grid">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
