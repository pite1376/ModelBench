import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from './logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('ErrorBoundary caught an error', { error: error.message, stack: error.stack, errorInfo });
    
    this.setState({ errorInfo });
    
    // 调用外部错误处理函数
    this.props.onError?.(error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-800">
                  应用遇到了一个错误
                </h3>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                抱歉，应用遇到了一个意外错误。请尝试刷新页面，如果问题持续存在，请联系技术支持。
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-4">
                <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                  错误详情 (开发模式)
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded-md">
                  <p className="text-xs text-red-600 font-mono">
                    {this.state.error.message}
                  </p>
                  {this.state.error.stack && (
                    <pre className="text-xs text-gray-600 mt-2 whitespace-pre-wrap">
                      {this.state.error.stack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-700 dark:hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
              >
                刷新页面
              </button>
              <button
                onClick={() => window.history.back()}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                返回上页
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 高阶组件，方便包装其他组件
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}