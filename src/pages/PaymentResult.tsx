import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { formatPrice } from '@/lib/format'
import { sendPurchaseReceipts } from '@/lib/sendReceiptEmail'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

type ResultKind = 'exito' | 'error' | 'pendiente'

type ConfirmPayload = {
  order_id?: string
  status?: string
  mp_status?: string | null
  total_cents?: number
  buyer_full_name?: string
  buyer_receipt?: string | null
  seller_receipt?: string | null
  buyer_subject?: string | null
  seller_subject?: string | null
  error?: string
}

export function PaymentResult({ kind }: { kind: ResultKind }) {
  const { session } = useAuth()
  const [params] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [info, setInfo] = useState<ConfirmPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mailNote, setMailNote] = useState<string | null>(null)

  const orderId = params.get('external_reference') ?? params.get('order_id')
  const paymentId = params.get('payment_id') ?? params.get('collection_id')
  const mpStatus = params.get('status') ?? params.get('collection_status')

  const title = useMemo(() => {
    if (kind === 'exito') return '¡Compra realizada!'
    if (kind === 'pendiente') return 'Pago pendiente'
    return 'No se pudo completar el pago'
  }, [kind])

  useEffect(() => {
    async function confirm() {
      if (!session?.access_token) {
        setLoading(false)
        setError('Tenés que estar logueado para ver el resultado del pago.')
        return
      }

      try {
        const { data, error: fnError } = await supabase.functions.invoke('confirm-mp-payment', {
          body: {
            order_id: orderId,
            payment_id: paymentId,
            status: mpStatus,
          },
        })

        if (fnError) throw fnError
        const payload = data as ConfirmPayload
        if (payload.error) throw new Error(payload.error)
        setInfo(payload)

        if (
          kind === 'exito' &&
          payload.status === 'paid' &&
          payload.buyer_receipt &&
          payload.seller_receipt
        ) {
          const mail = await sendPurchaseReceipts({
            buyerSubject:
              payload.buyer_subject ??
              `NODO — Realizaste una compra por ${formatPrice(payload.total_cents ?? 0)}`,
            buyerBody: payload.buyer_receipt,
            sellerSubject:
              payload.seller_subject ??
              `NODO — Realizaste una venta por ${formatPrice(payload.total_cents ?? 0)}`,
            sellerBody: payload.seller_receipt,
          })

          if (mail.buyer.needsActivation || mail.seller.needsActivation) {
            setMailNote(
              'FormSubmit te mandó un mail a xyairx1@gmail.com para activar el envío. Abrí el link “Activate Form” (mirá spam). Después de activarlo, los próximos comprobantes llegan solos a ese mismo mail.',
            )
          } else if (mail.buyer.ok && mail.seller.ok) {
            setMailNote('Comprobantes enviados a xyairx1@gmail.com (compra + venta).')
          } else {
            setMailNote(
              `No se pudo enviar el mail (${mail.buyer.message}). El comprobante igual quedó en Cuenta.`,
            )
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo confirmar el pago')
      } finally {
        setLoading(false)
      }
    }

    void confirm()
  }, [session?.access_token, orderId, paymentId, mpStatus, kind])

  return (
    <div className="page shell">
      <div className="auth-wrap panel stack" style={{ width: 'min(520px, 100%)' }}>
        <h1 className="page-title" style={{ fontSize: '2rem' }}>
          {title}
        </h1>

        {kind === 'exito' && (
          <p>
            Simulación de Mercado Pago en modo <strong>prueba</strong>. No se cobró plata real.
          </p>
        )}
        {kind === 'pendiente' && (
          <p className="muted">Mercado Pago dejó el pago en pendiente. Podés revisar más tarde en tu cuenta.</p>
        )}
        {kind === 'error' && (
          <p className="muted">El pago fue cancelado o rechazado. Podés volver a intentar desde el carrito.</p>
        )}

        {loading && <p className="muted">Confirmando con Mercado Pago…</p>}
        {error && <p className="error">{error}</p>}
        {mailNote && <p className={mailNote.includes('Activate') ? 'error' : 'success'}>{mailNote}</p>}

        {info && !loading && (
          <div className="stack">
            {kind === 'exito' && (
              <p className="success">
                ¡Listo{info.buyer_full_name ? `, ${info.buyer_full_name}` : ''}! Compraste por{' '}
                <strong>{formatPrice(info.total_cents ?? 0)}</strong>.
              </p>
            )}
            <div className="summary-row">
              <span>Pedido</span>
              <span className="muted">{info.order_id?.slice(0, 8)}…</span>
            </div>
            <div className="summary-row">
              <span>Estado MP</span>
              <span>{info.mp_status ?? '—'}</span>
            </div>
            <div className="summary-row">
              <span>Estado en NODO</span>
              <span>{info.status ?? '—'}</span>
            </div>
            {info.buyer_receipt && (
              <article className="receipt-card">
                <strong>Comprobante para el comprador</strong>
                <pre className="receipt-body">{info.buyer_receipt}</pre>
              </article>
            )}
            {info.seller_receipt && (
              <article className="receipt-card">
                <strong>Comprobante para el vendedor</strong>
                <pre className="receipt-body">{info.seller_receipt}</pre>
              </article>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap' }}>
          <Link className="btn btn-primary" to="/cuenta">
            Ver mis pedidos
          </Link>
          <Link className="btn btn-ghost" to="/tienda">
            Seguir comprando
          </Link>
        </div>
      </div>
    </div>
  )
}
