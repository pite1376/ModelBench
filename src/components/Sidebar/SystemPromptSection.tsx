import React, { useState } from 'react';
import { useAppStore } from '@/store';
import { Maximize2, Minimize2, RotateCcw, Wand2 } from 'lucide-react';
import { BigModelService } from '@/services/ai-service';
import { toast } from 'sonner';

export const SystemPromptSection: React.FC = () => {
  const { systemPrompt, setSystemPrompt, getApiKey } = useAppStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const defaultPrompts = [
    '你是一个有用的AI助手。',
    '你是一个创意写作助手，能够帮助用户进行各种文本创作。'
  ];

  const resetToDefault = () => {
    setSystemPrompt('你是一个有用的AI助手。');
  };

  const optimizePrompt = async () => {
    const apiKey = getApiKey('bigmodel');
    if (!apiKey) {
      toast.error('请先配置智谱AI的API密钥');
      return;
    }

    if (!systemPrompt.trim()) {
      toast.error('请先输入要优化的内容');
      return;
    }

    setIsOptimizing(true);
    try {
      const service = new BigModelService(apiKey);
      
      const optimizationPrompt = `你是一个专业的提示词优化专家。请根据用户提供的原始提示词，分析其需求特征并选择最适合的结构化表达方式进行优化。

## 分析维度：
1. **任务复杂度**：简单任务用基础结构，复杂任务用高级结构
2. **输出要求**：是否需要特定格式、结构化数据
3. **推理需求**：是否需要逐步思考、多角度分析
4. **准确性要求**：是否需要示例引导、思维链条

## 结构化方式选择：
- **ICIO**：适用于基础任务，需要明确输入输出
- **CRISPE**：适用于角色扮演、创意任务
- **结构化**：适用于多步骤、条理性强的任务
- **结构化+XML**：适用于复杂格式输出、数据处理

## 技术手段判断：
- **CoT（思维链）**：复杂推理、计算、分析类任务
- **示例（Few-shot）**：需要特定格式、风格模仿
- **ToT（思维树）**：需要多方案比较、决策类任务

## 输出要求：
直接输出优化后的提示词，不包含任何解释、分析或其他内容。

请优化以下提示词：
${systemPrompt}`;

      const response = await service.sendMessage({
        model: 'glm-4.5',
        messages: [{ 
          id: 'temp-optimization-' + Date.now(),
          role: 'user', 
          content: optimizationPrompt,
          timestamp: new Date()
        }],
        temperature: 0.7,
        maxTokens: 4096
      });

      if (response.content) {
        setSystemPrompt(response.content.trim());
        toast.success('提示词优化完成！');
      } else {
        toast.error('优化失败，请重试');
      }
    } catch (error: any) {
      console.error('AI优化错误:', error);
      toast.error(`优化失败: ${error.message || '未知错误'}`);
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">当前长度: {systemPrompt.length} 字符</span>
        <div className="flex items-center space-x-1">
          <button
            onClick={optimizePrompt}
            disabled={isOptimizing}
            className={`p-1 text-gray-400 hover:text-gray-600 transition-all duration-200 ${
              isOptimizing ? 'animate-spin' : ''
            }`}
            title="AI优化"
          >
            <Wand2 size={12} />
          </button>
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
        className={`w-full border border-gray-300 rounded-md px-1 py-1 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
          isExpanded ? 'h-96' : 'h-48'
        }`}
      />

      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">快速选择:</label>
        <div className="space-y-1">
          {defaultPrompts.map((prompt, index) => (
            <button
              key={index}
              onClick={() => setSystemPrompt(prompt)}
              className={`w-full text-left text-xs p-2 rounded border transition-colors ${
                systemPrompt === prompt
                  ? 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200'
                  : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {prompt.length > 50 ? `${prompt.substring(0, 50)}...` : prompt}
            </button>
          ))}
        </div>
      </div>

      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
        💡 系统提示词将应用于所有选中的模型，影响AI的回答。
      </div>
    </div>
  );
};