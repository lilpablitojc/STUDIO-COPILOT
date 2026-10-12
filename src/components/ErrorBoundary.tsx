import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Technical log without exposing credentials
    console.error('[Studio Copilot - ErrorBoundary caught]:', error.message, errorInfo.componentStack);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Sanitize error string to prevent leaking secrets/keys
      const rawMessage = this.state.error?.message || 'Error inesperado durante la ejecución';
      const sanitizedMessage = rawMessage.replace(/AIza[0-9A-Za-z-_]{35}/g, '***HIDDEN_KEY***');

      return (
        <div className="min-h-screen w-full bg-[#0c0d10] text-[#dfe2f0] flex items-center justify-center p-6 selection:bg-[#d6403a]/30 selection:text-white font-sans">
          <div className="w-full max-w-lg bg-[#14151a] border border-[#262832] rounded-2xl p-6 md:p-8 shadow-2xl flex flex-col gap-6 text-center animate-fade-in">
            {/* Header Icon */}
            <div className="w-14 h-14 rounded-2xl bg-[#d6403a]/15 border border-[#d6403a]/30 text-[#d6403a] flex items-center justify-center mx-auto shadow-lg shadow-[#d6403a]/10">
              <span className="material-symbols-outlined text-3xl">error_outline</span>
            </div>

            {/* Title & Subtitle */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-mono-code font-bold text-[#8a8f9d] uppercase tracking-wider">
                STUDIO COPILOT • PABLITO STUDIOS
              </span>
              <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
                Se detectó una interrupción inesperada
              </h1>
              <p className="text-xs text-[#8a8f9d] leading-relaxed">
                Studio Copilot protegió tu espacio de trabajo para evitar pérdida de datos. Puedes reintentar la acción o recargar la aplicación.
              </p>
            </div>

            {/* Error preview snippet */}
            <div className="bg-[#0c0d10] border border-[#1a1c23] rounded-xl p-3.5 text-left text-xs font-mono-code text-[#ffb4ab] overflow-x-auto max-h-32">
              <div className="text-[10px] uppercase text-[#626775] mb-1 font-bold">Mensaje de diagnóstico:</div>
              <code className="text-[11px] break-words">{sanitizedMessage}</code>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-[#d6403a] hover:bg-[#b8332d] text-white text-xs font-bold transition-all shadow-md shadow-[#d6403a]/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">refresh</span>
                <span>Volver a intentar</span>
              </button>
              <button
                onClick={this.handleReload}
                className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-[#1a1c23] hover:bg-[#262832] border border-[#262832] text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">restart_alt</span>
                <span>Recargar aplicación</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
