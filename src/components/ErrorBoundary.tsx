import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Feather, RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by Inkwell ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#F8F6F0] dark:bg-[#1A1816] text-[#2D2A26] dark:text-[#E8E6E3] p-6">
          <div className="max-w-md w-full bg-[#FFFFFF] dark:bg-[#25221F] border border-[#E5E0D8] dark:border-[#38332E] rounded-3xl p-8 shadow-xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#1A73E8] via-[#7B1FA2] to-[#E91E63] flex items-center justify-center mx-auto mb-6 shadow-md">
              <Feather className="w-8 h-8 text-white" />
            </div>
            
            <h1 className="text-2xl font-bold font-serif mb-2 text-[#2D2A26] dark:text-[#FAF8F5]">
              Inkwell
            </h1>
            <p className="text-sm text-[#736B63] dark:text-[#A8A199] mb-6">
              A temporary issue occurred while loading the application.
            </p>

            {this.state.error?.message && (
              <div className="mb-6 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl text-left flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs font-mono text-amber-800 dark:text-amber-300 break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-[#8C6239] hover:bg-[#734F2C] dark:bg-[#E8A33D] dark:hover:bg-[#D4912B] text-white dark:text-[#1A1816] font-medium text-sm transition-all shadow-md active:scale-98 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Inkwell
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
