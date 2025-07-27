import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Brain } from 'lucide-react';
import TypewriterEffect from './TypewriterEffect';

interface ReasoningDisplayProps {
  content: string;
  isLoading?: boolean;
  className?: string;
}

export const ReasoningDisplay: React.FC<ReasoningDisplayProps> = ({
  content,
  isLoading = false,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // 固定高度（折叠状态）
  const collapsedHeight = 120;

  useEffect(() => {
    if (content.trim()) {
      setShowContent(true);
    }
  }, [content]);

  useEffect(() => {
    if (containerRef.current && contentRef.current) {
      if (isExpanded) {
        containerRef.current.style.height = `${contentRef.current.scrollHeight + 40}px`;
      } else {
        containerRef.current.style.height = `${collapsedHeight}px`;
      }
    }
  }, [isExpanded, content]);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  if (!showContent && !isLoading) {
    return null;
  }

  return (
    <div className={`mb-3 ${className}`}>
      <div
        ref={containerRef}
        className="relative overflow-hidden transition-all duration-300 ease-in-out bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg"
        style={{ height: `${collapsedHeight}px` }}
      >
        {/* 标题栏 */}
        <div className="sticky top-0 bg-amber-100 dark:bg-amber-900/40 px-3 py-2 border-b border-amber-200 dark:border-amber-700 flex items-center justify-between z-10">
          <div className="flex items-center space-x-2">
            <Brain size={14} className="text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-medium text-amber-800 dark:text-amber-200">
              思考过程
            </span>
            {isLoading && (
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
            )}
          </div>
          
          <button
            onClick={handleToggle}
            className="flex items-center space-x-1 px-2 py-1 text-xs text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800/50 rounded transition-colors"
            title={isExpanded ? '收起' : '展开'}
          >
            <span>{isExpanded ? '收起' : '展开'}</span>
            {isExpanded ? (
              <ChevronUp size={12} />
            ) : (
              <ChevronDown size={12} />
            )}
          </button>
        </div>

        {/* 内容区域 */}
        <div
          ref={contentRef}
          className="p-3 text-xs text-amber-800 dark:text-amber-200 leading-relaxed overflow-y-auto"
          style={{
            maxHeight: isExpanded ? 'none' : `${collapsedHeight - 40}px`,
            scrollbarWidth: 'thin'
          }}
        >
          {isLoading ? (
            <div className="whitespace-pre-wrap">
              <TypewriterEffect 
                text={content}
                delay={20}
              />
            </div>
          ) : (
            <div className="whitespace-pre-wrap">{content}</div>
          )}
        </div>

        {/* 折叠状态下的渐变遮罩 */}
        {!isExpanded && content.length > 200 && (
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-amber-50 dark:from-amber-900/20 to-transparent pointer-events-none"></div>
        )}
      </div>

      {/* 展开状态下的滚动提示 */}
      {isExpanded && contentRef.current && contentRef.current.scrollHeight > 400 && (
        <div className="text-xs text-amber-600 dark:text-amber-400 mt-1 text-center">
          内容较长，可以滚动查看
        </div>
      )}
    </div>
  );
};

export default ReasoningDisplay; 