import React from "react";

interface Props {
  children: React.ReactNode;
  /** When this value changes, the boundary resets automatically (e.g. pass location.pathname). */
  resetKey?: string;
  /** Render a contained card instead of a full-screen fallback. */
  inline?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null });
    }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const isTranslationCrash = error.message?.includes("removeChild") || error.message?.includes("insertBefore") || error.message?.includes("NotFoundError");
    console.error(
      "[OmniAula][ErrorBoundary] Crash capturado:",
      error.message,
      "| Stack:", error.stack,
      "| ComponentStack:", info.componentStack,
      "| Timestamp:", new Date().toISOString(),
      "| UA:", navigator.userAgent,
      "| Lang:", document.documentElement.lang,
      "| NavLang:", navigator.language,
      "| TranslateCrash:", isTranslationCrash,
      "| Inline:", this.props.inline ?? false
    );
  }

  render() {
    if (this.state.hasError) {
      if (this.props.inline) {
        return (
          <div className="flex flex-col items-center justify-center h-full min-h-[40vh] p-6 text-center gap-4">
            <h2 className="text-lg font-bold text-destructive">Esta página tuvo un error</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Ocurrió un error inesperado en esta sección. Podés reintentar o volver al inicio.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
              >
                Reintentar
              </button>
              <a
                href="/"
                className="px-4 py-2 border rounded-md text-sm font-medium text-foreground hover:bg-muted"
              >
                Ir al inicio
              </a>
            </div>
          </div>
        );
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center gap-4">
          <h1 className="text-xl font-bold text-destructive">Algo salió mal</h1>
          <p className="text-sm text-muted-foreground max-w-md">
            Ocurrió un error inesperado. Tocá el botón para recargar la aplicación.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
          >
            Recargar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
