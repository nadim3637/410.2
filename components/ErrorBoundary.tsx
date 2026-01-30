import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

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
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-200">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <AlertTriangle size={32} />
            </div>
            <h1 className="text-2xl font-black text-slate-800 mb-2">Something went wrong</h1>
            <p className="text-slate-500 text-sm mb-6">
              The application encountered an unexpected error.
            </p>
            
            {this.state.error && (
              <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-left mb-6 overflow-auto max-h-40">
                <p className="text-xs font-mono text-red-700 break-words">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="space-y-3 w-full">
                <button
                  onClick={() => {
                      localStorage.setItem('nst_active_student_tab', 'HOME'); // Reset tab
                      localStorage.removeItem('nst_active_view'); // Reset detailed view if any
                      window.location.reload();
                  }}
                  className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                >
                  <Home size={18} /> Go to Home
                </button>

                <button
                  onClick={() => {
                      localStorage.clear(); 
                      window.location.reload();
                  }}
                  className="w-full bg-slate-100 text-slate-600 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors"
                >
                  <RefreshCcw size={18} /> Reset App
                </button>
            </div>
            
            <p className="text-[10px] text-slate-400 mt-4">
                Use 'Go to Home' to return to dashboard safely.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
