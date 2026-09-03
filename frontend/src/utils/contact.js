export function normalizeBrazilianPhone(value) {
  const digits = String(value || '').replace(/\D/g, '').replace(/^0+/, '')

  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`
  }

  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
    return digits
  }

  return ''
}

export function buildWhatsAppUrl(phone, message) {
  return phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : ''
}

export function buildTelephoneUrl(phone) {
  return phone ? `tel:+${phone}` : ''
}
