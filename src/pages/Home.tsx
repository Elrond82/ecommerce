import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ProductCard } from '@/components/ProductCard'
import { ProductCarousel } from '@/components/ProductCarousel'
import { supabase } from '@/lib/supabase'
import type { Product } from '@/types/database'

export function Home() {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    void supabase
      .from('products')
      .select('*, category:categories(*), product_images(*)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(8)
      .then(({ data }) => setProducts((data as Product[]) ?? []))
  }, [])

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <h1 className="hero-brand">
            NODO<span>.</span>
          </h1>
          <p>
            Una tienda moderna para vender lo que quieras: hogar, tech, moda y más.
            Catálogo vivo, carrito y panel para cargar productos.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary" to="/tienda">
              Ver catálogo
            </Link>
            <Link className="btn btn-secondary" to="/auth">
              Crear cuenta
            </Link>
          </div>
        </div>
      </section>

      <ProductCarousel products={products} />

      <section className="section shell">
        <div className="section-head">
          <div>
            <h2>Recién llegados</h2>
            <p>Productos de ejemplo para empezar a toquetear la maqueta.</p>
          </div>
          <Link className="btn btn-ghost" to="/tienda">
            Ver todos
          </Link>
        </div>
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </>
  )
}
