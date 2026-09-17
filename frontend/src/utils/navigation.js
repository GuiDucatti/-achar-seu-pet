export function getReturnPath(from, fallback = '/minha-conta') {
  if (!from?.pathname || !from.pathname.startsWith('/') || from.pathname.startsWith('//')) {
    return fallback
  }

  return `${from.pathname}${from.search || ''}${from.hash || ''}`
}
