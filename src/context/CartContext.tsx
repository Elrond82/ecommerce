import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { CartItem, Product } from '@/types/database'

type CartContextValue = {
  items: CartItem[]
  itemCount: number
  subtotalCents: number
  addItem: (product: Product, quantity?: number) => void
  setQuantity: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | undefined>(undefined)
const STORAGE_KEY = 'nodo-cart-v1'

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as CartItem[]) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
    const subtotalCents = items.reduce(
      (sum, item) => sum + item.product.price_cents * item.quantity,
      0,
    )

    return {
      items,
      itemCount,
      subtotalCents,
      addItem: (product, quantity = 1) => {
        setItems((prev) => {
          const existing = prev.find((item) => item.product.id === product.id)
          if (existing) {
            return prev.map((item) =>
              item.product.id === product.id
                ? {
                    ...item,
                    quantity: Math.min(
                      item.quantity + quantity,
                      product.stock || item.quantity + quantity,
                    ),
                  }
                : item,
            )
          }
          return [...prev, { product, quantity }]
        })
      },
      setQuantity: (productId, quantity) => {
        setItems((prev) =>
          prev
            .map((item) =>
              item.product.id === productId
                ? { ...item, quantity: Math.max(1, quantity) }
                : item,
            )
            .filter((item) => item.quantity > 0),
        )
      },
      removeItem: (productId) => {
        setItems((prev) => prev.filter((item) => item.product.id !== productId))
      },
      clear: () => setItems([]),
    }
  }, [items])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider')
  return ctx
}
