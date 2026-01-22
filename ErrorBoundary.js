"use client";
import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught Error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div style={{
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f8fafc',
                    color: '#334155',
                    fontFamily: 'sans-serif',
                    padding: '2rem',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🤕</div>
                    <h2 style={{ color: '#dc2626', marginBottom: '0.5rem' }}>Something went wrong.</h2>
                    <p style={{ maxWidth: '500px', margin: '0 auto 2rem', color: '#64748b' }}>
                        The application encountered an unexpected error. We've logged this issue.
                    </p>

                    <div style={{
                        background: 'white',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                        textAlign: 'left',
                        maxWidth: '600px',
                        width: '100%',
                        overflow: 'auto',
                        marginBottom: '2rem',
                        border: '1px solid #e2e8f0'
                    }}>
                        <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#dc2626' }}>Error: {this.state.error?.toString()}</strong>
                        <details style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.8rem', color: '#475569' }}>
                            <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>View Component Stack</summary>
                            {this.state.errorInfo?.componentStack}
                        </details>
                    </div>

                    <button
                        onClick={() => window.location.href = '/'}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: '#0ea5e9',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            fontWeight: 600,
                            boxShadow: '0 4px 6px -1px rgba(14, 165, 233, 0.4)'
                        }}
                    >
                        Return to Home
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
