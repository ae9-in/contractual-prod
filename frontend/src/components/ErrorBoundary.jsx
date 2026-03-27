import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[UI_ERROR_BOUNDARY]', error?.message || error, info?.componentStack || '');
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', padding: '24px' }}>
          <div style={{ maxWidth: '520px', textAlign: 'center' }}>
            <h2>Something went wrong.</h2>
            <p>Please refresh the page and try again.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
