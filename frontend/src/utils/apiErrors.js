function firstErrorMessage(value) {
  if (Array.isArray(value)) {
    return firstErrorMessage(value[0])
  }

  if (value && typeof value === 'object') {
    const firstValue = Object.values(value)[0]
    return firstErrorMessage(firstValue)
  }

  return typeof value === 'string' ? value : ''
}

export function getApiErrorMessage(error, fallback) {
  if (!error?.response) {
    return 'Não foi possível conectar ao servidor. Tente novamente.'
  }

  const { data, status } = error.response

  if (status === 401) {
    return 'Sua sessão expirou. Entre novamente para continuar.'
  }

  if (status === 403) {
    return 'Você não tem permissão para realizar esta ação.'
  }

  if (status === 404) {
    return 'O cadastro solicitado não foi encontrado.'
  }

  if (status >= 500) {
    return 'O servidor encontrou um problema. Tente novamente em instantes.'
  }

  return firstErrorMessage(data?.detail || data) || fallback || 'Confira os dados e tente novamente.'
}
