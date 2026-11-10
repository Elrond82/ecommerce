export type Category = {
  id: string
  name: string
  slug: string
  description: string | null
  sort_order: number
}

export type Product = {
  id: string
  category_id: string | null
  name: string
  slug: string
  description: string
  price_cents: number
  stock: number
  is_active: boolean
  created_at: string
  category?: Category | null
  product_images?: ProductImage[]
}

export type ProductImage = {
  id: string
  product_id: string
  storage_path: string
  alt_text: string | null
  sort_order: number
}

export type ShippingMethod = {
  id: string
  name: string
  description: string | null
  price_cents: number
  estimated_days_min: number | null
  estimated_days_max: number | null
  is_active: boolean
  sort_order: number
}

export type Profile = {
  id: string
  full_name: string | null
  phone: string | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  province: string | null
  postal_code: string | null
  is_admin: boolean
}

export type CartItem = {
  product: Product
  quantity: number
}
