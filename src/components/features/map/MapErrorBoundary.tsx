import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, MapPin, Home, AlertCircle } from 'lucide-react';

interface Props {
    children: ReactNode;
    onReset?: () => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class MapErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    public static getDerivedStateFromError(error: Error): Partial<State> {
        return {
            hasError: true,
            error,
        };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error('❌ Map component error:', error, errorInfo);
        this.setState({ errorInfo });

        // Send to error tracking service if available
        if (typeof window !== 'undefined') {
            // Check for Sentry
            if ((window as any).Sentry) {
                (window as any).Sentry.captureException(error, {
                    extra: {
                        componentStack: errorInfo.componentStack,
                        context: 'MapErrorBoundary'
                    }
                });
            }

            // Check for LogRocket
            if ((window as any).LogRocket) {
                (window as any).LogRocket.captureException(error, {
                    tags: { component: 'Map' },
                    extra: { errorInfo }
                });
            }
        }
    }

    private handleReset = (): void => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        this.props.onReset?.();
    };

    private handleReload = (): void => {
        if (typeof window !== 'undefined') {
            window.location.reload();
        }
    };

    private handleGoHome = (): void => {
        if (typeof window !== 'undefined') {
            window.location.href = '/chat';
        }
    };

    public render(): ReactNode {
        const { hasError, error, errorInfo } = this.state;
        const { children } = this.props;
        
        if (hasError) {
            return (
                <div className="h-full w-full flex flex-col items-center justify-center bg-red-50 p-8">
                    {/* Error Icon */}
                    <div className="relative mb-6">
                        <MapPin className="h-20 w-20 text-red-400" />
                        <AlertCircle className="h-8 w-8 text-red-600 absolute -top-2 -right-2 bg-white rounded-full" />
                    </div>

                    {/* Error Message */}
                    <h2 className="text-2xl font-semibold text-gray-800 mb-2 text-center">
                        Map Failed to Load
                    </h2>
                    <p className="text-gray-600 mb-2 text-center max-w-md">
                        {error?.message || 'An unexpected error occurred while loading the map'}
                    </p>
                    <p className="text-sm text-gray-500 mb-6 text-center max-w-md">
                        Don&apos;t worry - your chat history and locations are safe
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                        <button
                            type="button"
                            onClick={this.handleReset}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium shadow-md"
                            aria-label="Reset map"
                        >
                            <RefreshCw className="h-5 w-5" />
                            Try Again
                        </button>
                        <button
                            type="button"
                            onClick={this.handleGoHome}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium shadow-md"
                            aria-label="Return to home"
                        >
                            <Home className="h-5 w-5" />
                            Return to Chat
                        </button>
                        <button
                            type="button"
                            onClick={this.handleReload}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                            aria-label="Reload page"
                        >
                            Reload Page
                        </button>
                    </div>

                    {/* Development Mode: Error Details */}
                    {process.env.NODE_ENV === 'development' && errorInfo && (
                        <details className="mt-4 p-4 bg-white rounded-lg border border-red-200 max-w-2xl w-full">
                            <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                                Error Details (Development Mode)
                            </summary>
                            <div className="mt-3 space-y-2">
                                <div className="text-xs">
                                    <strong className="text-red-600">Error Message:</strong>
                                    <pre className="mt-1 p-2 bg-red-50 rounded text-red-800 overflow-auto">
                                        {error?.stack || error?.message}
                                    </pre>
                                </div>
                                <div className="text-xs">
                                    <strong className="text-red-600">Component Stack:</strong>
                                    <pre className="mt-1 p-2 bg-red-50 rounded text-red-800 overflow-auto">
                                        {errorInfo.componentStack}
                                    </pre>
                                </div>
                            </div>
                        </details>
                    )}

                    {/* Help Text */}
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg max-w-md border border-blue-200">
                        <h3 className="text-sm font-semibold text-blue-800 mb-2">
                            What happened?
                        </h3>
                        <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                            <li>The map component encountered an unexpected error</li>
                            <li>This could be due to network issues or invalid data</li>
                            <li>Your chat messages and travel plans are not affected</li>
                            <li>Try clicking &quot;Try Again&quot; to reload the map</li>
                        </ul>
                    </div>
                </div>
            );
        }

        return children;
    }
}

export default MapErrorBoundary;
