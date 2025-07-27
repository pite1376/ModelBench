import React, { memo, useState } from 'react';
import { ChatSession, ModelResponse } from '@/types';
import { AVAILABLE_MODELS } from '@/lib/models';
import { formatTokens, formatCost, copyToClipboard } from '@/utils/helpers';
import { Copy, Check, AlertCircle, Loader, Zap } from 'lucide-react';
import TypewriterEffect from '../TypewriterEffect';
import ReasoningDisplay from '../ReasoningDisplay';

interface ModelResponseGridProps {
  session: ChatSession;
  selectedModels: string[];
}

interface ModelCardProps {
  modelId: string;
  response: ModelResponse | undefined;
  messageId: string;
}

const ModelCard = memo<ModelCardProps>(({ modelId, response, messageId }) => {
  const [copied, setCopied] = useState(false);
  const model = AVAILABLE_MODELS.find(m => m.id === modelId);
  
  if (!model) return null;

  const handleCopy = async () => {
    if (response?.content) {
      const success = await copyToClipboard(response.content);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const getStatusColor = () => {
    if (response?.error) return 'border-red-200 bg-red-50';
    if (response?.loading) return 'border-yellow-200 bg-yellow-50';
    if (response?.isComplete) return 'border-green-200 bg-green-50';
    return 'border-gray-200 bg-white';
  };

  const getStatusIcon = () => {
    if (response?.error) return <AlertCircle size={14} className="text-red-500" />;
    if (response?.loading) return <Loader size={14} className="text-yellow-500 animate-spin" />;
    if (response?.isComplete) return <Check size={14} className="text-green-500" />;
    return null;
  };

  return (
    <div className={`rounded-lg border p-4 transition-all duration-200 ${getStatusColor()}`}>
      {/* 模型头部 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full bg-${model.provider === 'deepseek' ? 'blue' : 
            model.provider === 'aliyun' ? 'orange' : 
            model.provider === 'volcengine' ? 'purple' :
            model.provider === 'kimi' ? 'green' : 'gray'}-500`}></div>
          <h3 className="font-medium text-sm text-gray-800">{model.name}</h3>
          {model.isReasoner && (
            <Zap size={12} className="text-purple-500" />
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          {response?.content && (
            <button
              onClick={handleCopy}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="复制回答"
            >
              {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* 响应内容 */}
      <div className="min-h-[100px] max-h-[400px] overflow-y-auto">
        {response?.error ? (
          <div className="text-red-600 text-sm bg-red-100 p-3 rounded">
            <p className="font-medium mb-1">请求失败</p>
            <p className="text-xs">{response.error}</p>
          </div>
        ) : response?.loading ? (
          <div className="text-gray-600 text-sm">
            <div className="flex items-center space-x-2 mb-2">
              <Loader size={14} className="animate-spin" />
              <span>生成中...</span>
            </div>
            {/* 实时思考过程显示 */}
            {response.reasoning_content && (
              <ReasoningDisplay 
                content={response.reasoning_content}
                isLoading={response.loading}
              />
            )}
            {response.content && (
              <div className="text-gray-800">
                <TypewriterEffect text={response.content} />
              </div>
            )}
          </div>
        ) : response?.content ? (
          <div>
            {/* 完成状态的思考过程显示 */}
            {response.reasoning_content && (
              <ReasoningDisplay 
                content={response.reasoning_content}
                isLoading={false}
              />
            )}
            <div className="text-gray-800 text-sm whitespace-pre-wrap">
              {response.content}
            </div>
          </div>
        ) : (
          <div className="text-gray-400 text-sm italic">
            等待响应...
          </div>
        )}
      </div>

      {/* 统计信息 */}
      {response && (response.tokens || response.cost || response.responseTime) && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-3">
              {response.tokens && (
                <span>Tokens: {formatTokens(response.tokens)}</span>
              )}
              {response.cost && (
                <span>成本: {formatCost(response.cost)}</span>
              )}
            </div>
            {response.responseTime && (
              <span>{response.responseTime.toFixed(0)}ms</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

ModelCard.displayName = 'ModelCard';

export const ModelResponseGrid: React.FC<ModelResponseGridProps> = memo(({ session, selectedModels }) => {
  if (selectedModels.length === 0) return null;

  // 获取最后一条用户消息
  const lastUserMessage = [...session.messages].reverse().find(m => m.role === 'user');
  if (!lastUserMessage) return null;

  const messageId = lastUserMessage.id;
  const responses = session.responses[messageId] || {};

  return (
    <div className="border-t border-gray-200 bg-gray-50 p-4">
      <div className={`grid gap-4 ${
        selectedModels.length === 1 ? 'grid-cols-1' :
        selectedModels.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
        selectedModels.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
        'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      }`}>
        {selectedModels.map(modelId => (
          <ModelCard
            key={modelId}
            modelId={modelId}
            response={responses[modelId]}
            messageId={messageId}
          />
        ))}
      </div>
    </div>
  );
});

ModelResponseGrid.displayName = 'ModelResponseGrid'; 