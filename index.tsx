/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled runtime error in App:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#FAF6EE',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'monospace'
        }}>
          <div style={{
            maxWidth: '560px',
            width: '100%',
            backgroundColor: '#ffffff',
            border: '3px solid #000000',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '6px 6px 0px #000000'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{
                backgroundColor: '#FFE600',
                border: '2px solid #000000',
                borderRadius: '8px',
                padding: '4px 8px',
                fontWeight: '900',
                fontSize: '12px'
              }}>RUNTIME ERROR CAUGHT</span>
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: '900', color: '#000000', marginBottom: '8px' }}>
              Something went wrong while rendering
            </h1>
            <p style={{ fontSize: '13px', color: '#444444', marginBottom: '16px' }}>
              {this.state.error?.message || 'An unknown error occurred.'}
            </p>
            <div style={{
              backgroundColor: '#f5f5f5',
              padding: '12px',
              border: '2px solid #000',
              borderRadius: '8px',
              fontSize: '11px',
              overflowX: 'auto',
              marginBottom: '16px'
            }}>
              <code>{this.state.error?.stack || String(this.state.error)}</code>
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#FFE600',
                border: '2px solid #000000',
                borderRadius: '10px',
                padding: '10px 18px',
                fontWeight: '900',
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '3px 3px 0px #000'
              }}
            >
              RELOAD APPLICATION
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>
);
