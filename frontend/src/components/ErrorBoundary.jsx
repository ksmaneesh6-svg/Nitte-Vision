import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Application Error</h2>
              <p className="text-xs text-slate-500 mt-1">
                An unexpected UI error occurred. Captured photos and database sessions remain secure.
              </p>
            </div>
            {this.state.error && (
              <div className="bg-slate-100 rounded-xl p-3 text-left overflow-auto max-h-32 text-[11px] font-mono text-slate-700">
                {this.state.error.toString()}
              </div>
            )}
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-2.5 bg-nitte-700 hover:bg-nitte-800 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Page</span>
              </button>
              <a
                href="/dashboard"
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all"
              >
                <Home className="w-4 h-4" />
                <span>Dashboard</span>
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
