import React, { useState } from 'react';
import { useAppStore } from '@/store';
import { Maximize2, Minimize2, RotateCcw } from 'lucide-react';

export const SystemPromptSection: React.FC = () => {
  const { systemPrompt, setSystemPrompt } = useAppStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const defaultPrompts = [
    '你是一个有用的AI助手。',
    '你是一个专业的编程助手，擅长代码分析和问题解决。',
    '你是一个创意写作助手，能够帮助用户进行各种文本创作。'
  ];

  const resetToDefault = () => {
    setSystemPrompt('你是一个有用的AI助手。');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">当前长度: {systemPrompt.length} 字符</span>
        <div className="flex items-center space-x-1">
          <button
            onClick={resetToDefault}
            className="p-1 text-gray-400 hover:text-gray-600"
            title="重置为默认"
          >
            <RotateCcw size={12} />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-gray-400 hover:text-gray-600"
            title={isExpanded ? "收起" : "展开"}
          >
            {isExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>
        </div>
      </div>

      <textarea
        value={systemPrompt}
        onChange={(e) => setSystemPrompt(e.target.value)}
        placeholder="输入系统提示词..."
        className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
          isExpanded ? 'h-96' : 'h-48'
        }`}
      />

      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-600">快速选择:</label>
        <div className="space-y-1">
          {defaultPrompts.map((prompt, index) => (
            <button
              key={index}
              onClick={() => setSystemPrompt(prompt)}
              className={`w-full text-left text-xs p-2 rounded border transition-colors ${
                systemPrompt === prompt
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {prompt.length > 50 ? `${prompt.substring(0, 50)}...` : prompt}
            </button>
          ))}
        </div>
      </div>

      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
        💡 系统提示词将应用于所有选中的模型，影响AI的回答风格和行为。
      </div>
    </div>
  );
}; 