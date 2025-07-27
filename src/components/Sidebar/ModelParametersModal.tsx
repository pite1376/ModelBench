import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store';
import { getModelById } from '@/lib/models';
import { X, Settings } from 'lucide-react';

interface ModelParametersModalProps {
  isOpen: boolean;
  onClose: () => void;
  modelId: string;
}

export const ModelParametersModal: React.FC<ModelParametersModalProps> = ({
  isOpen,
  onClose,
  modelId,
}) => {
  const { getModelParameters, setModelParameters } = useAppStore();
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(0.95);

  const model = getModelById(modelId);

  useEffect(() => {
    if (isOpen && modelId) {
      const params = getModelParameters(modelId);
      setTemperature(params.temperature);
      setTopP(params.top_p);
    }
  }, [isOpen, modelId, getModelParameters]);

  const handleSave = () => {
    setModelParameters(modelId, {
      temperature,
      top_p: topP,
    });
    onClose();
  };

  const handleReset = () => {
    if (model) {
      setTemperature(model.temperature || 0.7);
      setTopP(model.top_p || 0.95);
    }
  };

  if (!isOpen || !model) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-96 max-w-[90vw]">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Settings size={20} className="text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              模型参数设置
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-4 space-y-6">
          {/* 模型信息 */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <h4 className="font-medium text-gray-900 dark:text-white mb-1">{model.name}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{model.description}</p>
            
            {/* 模型规格信息 */}
            <div className="flex flex-wrap gap-3 text-xs">
              {model.maxTokens && (
                <div className="flex items-center space-x-1">
                  <span className="text-gray-500">最大输出:</span>
                  <span className="font-medium text-blue-600">
                    {model.maxTokens.toLocaleString()} tokens
                  </span>
                </div>
              )}
              {model.isReasoner && (
                <div className="flex items-center space-x-1">
                  <svg 
                    width="12" 
                    height="12" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="text-gray-600"
                  >
                    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.96-3A2.5 2.5 0 0 1 9.5 2Z"/>
                    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.96-3A2.5 2.5 0 0 0 14.5 2Z"/>
                  </svg>
                  <span className="font-medium text-purple-600">推理模型</span>
                </div>
              )}
            </div>
          </div>

          {/* 温度设置 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              温度 (Temperature): {temperature.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.01"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0 (确定性)</span>
              <span>1 (平衡)</span>
              <span>2 (创造性)</span>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              控制输出的随机性。较低的值更确定，较高的值更有创造性。
            </p>
          </div>

          {/* Top-p 设置 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Top-p: {topP.toFixed(2)}
            </label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.01"
              value={topP}
              onChange={(e) => setTopP(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0.1 (精确)</span>
              <span>0.5 (平衡)</span>
              <span>1.0 (多样)</span>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              控制候选词的多样性。较低的值更聚焦，较高的值更多样。
            </p>
          </div>
        </div>

        {/* 按钮栏 */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            重置默认值
          </button>
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 