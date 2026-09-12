import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Caught by boundary:', error, info);
    this.setState({ info });
    // Prevent webpack overlay from taking over
    if (window.__REACT_ERROR_OVERLAY__) {
      window.__REACT_ERROR_OVERLAY__.close?.();
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: 24,
          background: '#3b0f0f',
          color: '#fff',
          fontFamily: 'monospace',
          minHeight: '100vh',
        }}>
          <h2 style={{ color: '#ff6b6b' }}>⚠ App crashed — real error shown below</h2>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {String(this.state.error)}
          </pre>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', opacity: 0.7 }}>
            {this.state.info?.componentStack}
          </pre>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ marginTop: 20, padding: '10px 20px', fontSize: 16, cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;