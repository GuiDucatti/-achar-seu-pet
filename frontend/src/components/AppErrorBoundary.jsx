import { Component } from 'react'

class AppErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="app-error-view">
          <h1>O site precisa ser recarregado</h1>
          <p>Ocorreu um erro inesperado ao montar esta página.</p>
          <button className="primary-action" onClick={() => window.location.reload()} type="button">
            Recarregar página
          </button>
        </main>
      )
    }

    return this.props.children
  }
}

export default AppErrorBoundary
