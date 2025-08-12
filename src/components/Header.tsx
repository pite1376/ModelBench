import React, { useState } from 'react';
import { useAppStore } from '@/store';
import { PageMode } from '@/types';
import { formatTokens, formatCost } from '@/utils/helpers';
import { Settings, Download, Upload, RotateCcw } from 'lucide-react';

interface ModeSwitchProps {
  onModeChange: (mode: PageMode, callback: () => void) => void;
}

export const ModeSwitch: React.FC<ModeSwitchProps> = ({ onModeChange }) => {
  const { pageMode } = useAppStore();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleModeSwitch = (newMode: PageMode) => {
    if (newMode === pageMode || isTransitioning) return;
    
    setIsTransitioning(true);
    onModeChange(newMode, () => {
      setIsTransitioning(false);
    });
  };

  return (
    <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
      <button
        onClick={() => handleModeSwitch('simple')}
        disabled={isTransitioning}
        className={`
          px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ease-in-out
          ${pageMode === 'simple' 
            ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm' 
            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          }
          ${isTransitioning ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        单提示词模式
      </button>
      <button
        onClick={() => handleModeSwitch('advanced')}
        disabled={isTransitioning}
        className={`
          px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ease-in-out
          ${pageMode === 'advanced' 
            ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm' 
            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          }
          ${isTransitioning ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        多提示词模式
      </button>
    </div>
  );
};

export const Header: React.FC = () => {
  const { 
    totalTokens, 
    totalCost, 
    currentSession,
    clearAllData,
    exportSession,
    importSession 
  } = useAppStore();

  const handleExport = () => {
    if (currentSession) {
      const data = exportSession(currentSession.id);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `chat-${currentSession.title}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const data = e.target?.result as string;
          const success = importSession(data);
          if (success) {
            alert('导入成功！');
          } else {
            alert('导入失败，请检查文件格式');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleClearData = () => {
    if (confirm('确定要清除所有数据吗？此操作不可恢复。')) {
      clearAllData();
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-gray-900">
            AI模型对比工具
          </h1>
          
          {/* 统计信息 */}
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <span>总Token:</span>
              <span className="font-medium">{formatTokens(totalTokens)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>总成本:</span>
              <span className="font-medium">{formatCost(totalCost)}</span>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center space-x-2">
          {currentSession && (
            <button
              onClick={handleExport}
              className="flex items-center space-x-1 px-3 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              title="导出当前对话"
            >
              <Download size={16} />
              <span>导出</span>
            </button>
          )}
          
          <button
            onClick={handleImport}
            className="flex items-center space-x-1 px-3 py-2 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            title="导入对话"
          >
            <Upload size={16} />
            <span>导入</span>
          </button>

          <button
            onClick={handleClearData}
            className="flex items-center space-x-1 px-3 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            title="清除所有数据"
          >
            <RotateCcw size={16} />
            <span>清除</span>
          </button>

          <button className="flex items-center space-x-1 px-3 py-2 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors">
            <Settings size={16} />
            <span>设置</span>
          </button>
        </div>
      </div>
    </header>
  );
}; 