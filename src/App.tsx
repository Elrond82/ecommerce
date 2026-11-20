import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { CartProvider } from '@/context/CartContext'
import { Layout } from '@/components/Layout'
import { Home } from '@/pages/Home'
import { Catalog } from '@/pages/Catalog'
import { ProductDetail } from '@/pages/ProductDetail'
import { Cart } from '@/pages/Cart'
import { Checkout } from '@/pages/Checkout'
import { Auth } from '@/pages/Auth'
import { Account } from '@/pages/Account'
import { PaymentResult } from '@/pages/PaymentResult'
import { AdminLayout } from '@/pages/admin/AdminLayout'
import { AdminHome } from '@/pages/admin/AdminHome'
import { AdminProducts } from '@/pages/admin/AdminProducts'
import { AdminCategories } from '@/pages/admin/AdminCategories'
import { AdminShipping } from '@/pages/admin/AdminShipping'

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="tienda" element={<Catalog />} />
              <Route path="producto/:slug" element={<ProductDetail />} />
              <Route path="carrito" element={<Cart />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="auth" element={<Auth />} />
              <Route path="cuenta" element={<Account />} />
              <Route path="pago/exito" element={<PaymentResult kind="exito" />} />
              <Route path="pago/error" element={<PaymentResult kind="error" />} />
              <Route path="pago/pendiente" element={<PaymentResult kind="pendiente" />} />
              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<AdminHome />} />
                <Route path="productos" element={<AdminProducts />} />
                <Route path="categorias" element={<AdminCategories />} />
                <Route path="envios" element={<AdminShipping />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  )
}
