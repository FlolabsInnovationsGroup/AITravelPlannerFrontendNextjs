import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class MapErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
        };
    }

    public static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
        };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Map Error:', error);
        console.error('Error Info:', errorInfo);
    }

    public render() {
        const { hasError, error } = this.state;
        const { children } = this.props;
        
        if (hasError) {
            return (
                <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
                    <h2 className="text-lg font-semibold text-red-700 mb-2">
                        🗺️ Travel Map Temporarily Unavailable
                    </h2>
                    <p className="text-red-600 mb-4">
                        {error?.message || 'An error occurred while loading your travel map. Don\'t worry - your planning can continue!'}
                    </p>
                    <div className="space-y-2 mb-4 text-sm text-red-600">
                        <p>• Your locations and travel plans are still saved</p>
                        <p>• Try refreshing the page or check your internet connection</p>
                        <p>• Contact support if this persists</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => this.setState({ hasError: false, error: null })}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                            Try Again
                        </button>
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                        >
                            Refresh Page
                        </button>
                    </div>
                </div>
            );
        }

        return children;
    }
}

export default MapErrorBoundary;
