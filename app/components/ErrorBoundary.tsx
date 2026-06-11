'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-red-100">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Ops! Algo deu errado.</h2>
            <p className="text-slate-600 mb-6">
              Ocorreu um erro inesperado na interface. Tente recarregar a página.
            </p>
            <div className="bg-slate-50 p-4 rounded-xl mb-6 overflow-auto max-h-40">
              <code className="text-xs text-red-500">{this.state.error?.message}</code>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-slate-900 text-white py-3 rounded-2xl font-bold hover:bg-slate-800 transition"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      )
    }

    return this.children
  }
}

export default ErrorBoundary
