"use client";

import React, { Component, ReactNode } from "react";
import Button from "../../components/ui/Button";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
};

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: undefined,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Erro capturado pelo ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 max-w-lg w-full text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-3">
              Ocorreu um erro
            </h1>

            <p className="text-sm text-slate-500 mb-6">
              Algo inesperado aconteceu ao carregar esta página.
            </p>

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => window.location.reload()}
            >
              Recarregar página
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}