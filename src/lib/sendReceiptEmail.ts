// Hash de FormSubmit (activado para xyairx1@gmail.com / ecommerce-5u1c.vercel.app)
const FORMSUBMIT_ID = '67603160087fb98767fd39af196f12ad'

type SendResult = {
  ok: boolean
  needsActivation: boolean
  message: string
}

export async function sendReceiptEmail(subject: string, body: string): Promise<SendResult> {
  try {
    const res = await fetch(`https://formsubmit.co/ajax/${FORMSUBMIT_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        _subject: subject,
        message: body,
        _template: 'box',
        _captcha: 'false',
        _url: window.location.origin,
      }),
    })

    const data = (await res.json().catch(() => null)) as
      | { success?: string | boolean; message?: string }
      | null

    const success = String(data?.success) === 'true'
    const message = data?.message ?? (res.ok ? 'Enviado' : 'No se pudo enviar el mail')
    const needsActivation = /activat/i.test(message)

    return { ok: success, needsActivation, message }
  } catch (err) {
    return {
      ok: false,
      needsActivation: false,
      message: err instanceof Error ? err.message : 'Error al enviar mail',
    }
  }
}

export async function sendPurchaseReceipts(input: {
  buyerSubject: string
  buyerBody: string
  sellerSubject: string
  sellerBody: string
}) {
  const buyer = await sendReceiptEmail(input.buyerSubject, input.buyerBody)
  const seller = await sendReceiptEmail(input.sellerSubject, input.sellerBody)
  return { buyer, seller }
}
