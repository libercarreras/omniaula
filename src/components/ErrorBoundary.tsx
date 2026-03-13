import React from "react";

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
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
      "| TranslateCrash:", isTranslationCrash
    );
  }

  render() {
    if (this.state.hasError) {
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
