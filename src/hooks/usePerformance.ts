import React, { useCallback, useEffect, useRef, useMemo, useState } from 'react';
import { logger } from '@/utils/logger';

// 性能监控hook
export function usePerformanceMonitor(componentName: string) {
  const renderCountRef = useRef(0);
  const mountTimeRef = useRef<number>(0);
  
  useEffect(() => {
    renderCountRef.current += 1;
    
    if (renderCountRef.current === 1) {
      mountTimeRef.current = performance.now();
      logger.debug(`Component ${componentName} mounted`);
    }
    
    // 频繁重渲染警告
    if (renderCountRef.current > 10) {
      logger.warn(`Component ${componentName} has rendered ${renderCountRef.current} times`, {
        component: componentName,
        renderCount: renderCountRef.current
      });
    }
    
    return () => {
      if (renderCountRef.current === 1) {
        const unmountTime = performance.now();
        const lifetime = unmountTime - mountTimeRef.current;
        logger.debug(`Component ${componentName} unmounted after ${lifetime.toFixed(2)}ms`);
      }
    };
  });
  
  return {
    renderCount: renderCountRef.current,
    getRenderCount: () => renderCountRef.current
  };
}

// 防抖hook
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
}

// 节流hook
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallRef.current;
    
    if (timeSinceLastCall >= delay) {
      lastCallRef.current = now;
      callback(...args);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        lastCallRef.current = Date.now();
        callback(...args);
      }, delay - timeSinceLastCall);
    }
  }, [callback, delay]);
}

// 异步操作状态管理hook
export function useAsyncOperation<T>() {
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: Error | null;
  }>({
    data: null,
    loading: false,
    error: null
  });
  
  const execute = useCallback(async (asyncFunction: () => Promise<T>) => {
    setState((prev: any) => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await asyncFunction();
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      setState((prev: any) => ({ ...prev, loading: false, error: errorObj }));
      logger.error('Async operation failed', errorObj);
      throw errorObj;
    }
  }, []);
  
  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);
  
  return {
    ...state,
    execute,
    reset
  };
}

// 内存泄漏检测hook
export function useMemoryLeakDetection(componentName: string) {
  const cleanupFunctionsRef = useRef<Array<() => void>>([]);
  
  const addCleanup = useCallback((cleanupFn: () => void) => {
    cleanupFunctionsRef.current.push(cleanupFn);
  }, []);
  
  useEffect(() => {
    return () => {
      cleanupFunctionsRef.current.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          logger.error(`Cleanup function failed in ${componentName}`, error);
        }
      });
      cleanupFunctionsRef.current = [];
    };
  }, [componentName]);
  
  return { addCleanup };
}

// 大列表虚拟化计算hook
export function useVirtualization(
  itemCount: number,
  itemHeight: number,
  containerHeight: number,
  scrollTop: number = 0
) {
  return useMemo(() => {
    const visibleItemCount = Math.ceil(containerHeight / itemHeight);
    const bufferSize = Math.min(5, Math.floor(visibleItemCount / 2));
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize);
    const endIndex = Math.min(itemCount - 1, startIndex + visibleItemCount + 2 * bufferSize);
    
    return {
      startIndex,
      endIndex,
      visibleItemCount: endIndex - startIndex + 1,
      offsetY: startIndex * itemHeight
    };
  }, [itemCount, itemHeight, containerHeight, scrollTop]);
}

// 性能监控高阶组件
export function withPerformanceMonitor<P extends object>(
  componentName: string,
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function PerformanceMonitoredComponent(props: P) {
    usePerformanceMonitor(componentName);
    return React.createElement(Component, props);
  };
}