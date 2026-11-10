import { Link } from 'react-router-dom'
import { formatPrice } from '@/lib/format'
import { publicImageUrl } from '@/lib/supabase'
import { useCart } from '@/context/CartContext'

export function Cart() {
  const { items, subtotalCents, setQuantity, removeItem } = useCart()

  if (items.length === 0) {
    return (
      <div className="page shell">
        <h1 className="page-title">Carrito</h1>
        <div className="panel empty">
          Todavía no hay productos.
          <div style={{ marginTop: '1rem' }}>
            <Link className="btn btn-primary" to="/tienda">
              Ir a la tienda
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page shell cart-layout">
      <div className="panel">
        <h1 className="page-title" style={{ fontSize: '2rem' }}>
          Carrito
        </h1>
        {items.map((item) => {
          const image = publicImageUrl(item.product.product_images?.[0]?.storage_path)
          return (
            <div className="cart-line" key={item.product.id}>
              <div className="cart-thumb">
                {image ? <img src={image} alt={item.product.name} /> : null}
              </div>
              <div>
                <strong>{item.product.name}</strong>
                <div className="muted">{formatPrice(item.product.price_cents)}</div>
                <div className="qty" style={{ marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setQuantity(item.product.id, item.quantity - 1)}
                  >
                    −
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(item.product.id, item.quantity + 1)}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ marginLeft: '0.4rem', padding: '0.35rem 0.7rem' }}
                    onClick={() => removeItem(item.product.id)}
                  >
                    Quitar
                  </button>
                </div>
              </div>
              <strong>{formatPrice(item.product.price_cents * item.quantity)}</strong>
            </div>
          )
        })}
      </div>

      <aside className="panel stack">
        <h2 style={{ margin: 0 }}>Resumen</h2>
        <div className="summary-row">
          <span>Subtotal</span>
          <span>{formatPrice(subtotalCents)}</span>
        </div>
        <p className="muted">El envío lo elegís en el checkout.</p>
        <Link className="btn btn-primary" to="/checkout">
          Continuar compra
        </Link>
      </aside>
    </div>
  )
}
