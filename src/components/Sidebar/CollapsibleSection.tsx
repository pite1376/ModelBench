import React, { forwardRef, useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CollapsibleSectionProps {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  icon?: React.ReactNode;
  onToggle: () => void;
  isOpen: boolean;
  className?: string;
  stickyOffset?: number; // 用于设置sticky偏移量
}

export const CollapsibleSection = forwardRef<HTMLDivElement, CollapsibleSectionProps>(({
  title,
  children,
  icon,
  onToggle,
  isOpen,
  className,
  stickyOffset = 0,
}, ref) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSticky(!entry.isIntersecting);
      },
      {
        root: null,
        threshold: 1.0,
        rootMargin: `-${stickyOffset + 1}px 0px 0px 0px`,
      }
    );

    observer.observe(button);
    return () => observer.disconnect();
  }, [stickyOffset]);

  return (
    <div ref={ref} className={`border-b border-gray-200 dark:border-gray-700 ${className || ''}`}>
      <button
        ref={buttonRef}
        onClick={onToggle}
        className={`
          sticky z-20 w-full text-left p-4 flex items-center justify-between 
          hover:bg-gray-100 dark:hover:bg-gray-700 
          bg-white dark:bg-gray-800 
          transition-all duration-200 ease-in-out
          ${isSticky ? 'shadow-md border-b border-gray-200 dark:border-gray-700' : 'border-b-0'}
        `}
        style={{ top: `${stickyOffset}px` }}
        type="button"
      >
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2">
          {icon && icon}
          <span>{title}</span>
        </h3>
        {isOpen ? (
          <ChevronDown size={16} className="text-gray-500 dark:text-gray-400" />
        ) : (
          <ChevronRight size={16} className="text-gray-500 dark:text-gray-400" />
        )}
      </button>
      {isOpen && <div className="p-2">{children}</div>}
    </div>
  );
});