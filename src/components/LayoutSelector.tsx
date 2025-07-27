import React from 'react';
import { Grid, Grid3X3, MoreHorizontal, Sparkles } from 'lucide-react';

interface LayoutSelectorProps {
  selectedMode: 'auto' | 'single' | 'double' | 'triple';
  onChange: (mode: 'auto' | 'single' | 'double' | 'triple') => void;
  className?: string;
}

export const LayoutSelector: React.FC<LayoutSelectorProps> = ({
  selectedMode,
  onChange,
  className = ''
}) => {
  const options = [
    {
      mode: 'auto' as const,
      icon: <Sparkles size={16} />,
      label: '自动',
      tooltip: '根据模型数量自动调整布局'
    },
    {
      mode: 'single' as const,
      icon: <MoreHorizontal size={16} className="rotate-90" />,
      label: '单排',
      tooltip: '单列垂直排列'
    },
    {
      mode: 'double' as const,
      icon: <Grid size={16} />,
      label: '双排',
      tooltip: '双列网格排列'
    },
    {
      mode: 'triple' as const,
      icon: <Grid3X3 size={16} />,
      label: '三排',
      tooltip: '三列网格排列'
    }
  ];

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <span className="text-xs text-gray-600 dark:text-gray-400 mr-1">排列:</span>
      {options.map((option) => (
        <button
          key={option.mode}
          onClick={() => onChange(option.mode)}
          className={`
            inline-flex items-center space-x-1 px-1.5 py-1 rounded-md text-xs font-medium transition-all duration-150 active:scale-95
            ${selectedMode === option.mode
              ? 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700'
              : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
            }
          `}
          title={option.tooltip}
        >
          <span className="w-3 h-3 flex items-center justify-center">
            {React.cloneElement(option.icon, { size: 12 })}
          </span>
          <span className="hidden sm:inline">{option.label}</span>
        </button>
      ))}
    </div>
  );
}; 