import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store';
import { aiServiceManager } from '@/services/ai-service-manager';
import { ChatInput } from './ChatInput';
import { MessageList } from './MessageList';
import { ModelResponseGrid } from './ModelResponseGrid';
// import { ReportGenerationModal } from '@/components/ReportGeneration';
// import { saveReport, exportReportAsHTML } from '@/services/reportStorageService';
import { toast } from 'sonner';
import { AVAILABLE_MODELS } from '@/lib/models';
import { logger } from '@/utils/logger';
import { usePerformanceMonitor, useDebounce } from '@/hooks/usePerformance';
import { ErrorBoundary } from '@/utils/errorBoundary';
import { AIProvider, ChatRequest } from '@/types';

export const ChatInterface: React.FC = () => {
  const {
    currentSession,
    selectedModels,
    apiKeys,
    isLoading,
    setLoading,
    addMessage,
    addModelResponse,
    appendToModelResponse,
    updateModelResponse,
    systemPrompt,
    addTokens,
    addCost,
    getAllModels
  } = useAppStore();

  const [inputMessage, setInputMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 报告生成模态框状态
  // const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // 性能监控
  usePerformanceMonitor('ChatInterface');

  // 自动滚动到底部
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentSession?.messages]);

  // 防抖的发送消息函数
  const debouncedSendMessage = useDebounce(async (message: string, images?: string[]) => {
    if (!message.trim() || selectedModels.length === 0) return;

    setLoading(true);
    
    try {
      // 添加用户消息
      const messageId = addMessage(message, images);
      
      // 准备请求
      const chatRequest: ChatRequest = {
        messages: [...(currentSession?.messages || []), {
          id: messageId,
          role: 'user',
          content: message,
          timestamp: new Date(),
          images
        }],
        model: selectedModels[0], // 主要模型
        systemPrompt,
        temperature: 0.7,
        maxTokens: 4096,
        stream: true
      };

      // 为每个选中的模型发送请求
      const promises = selectedModels.map(async (modelId) => {
        const model = getAllModels().find(m => m.id === modelId);
        if (!model) return;

        const provider = model.provider as AIProvider;
        const apiKey = apiKeys[provider];
        
        if (!apiKey) {
          logger.warn(`No API key for provider ${provider}`);
          return;
        }

        // 设置API密钥
        aiServiceManager.setApiKey(provider, apiKey);

        // 初始化模型响应
        addModelResponse(modelId, messageId, {
          content: '',
          loading: true,
          timestamp: new Date(),
          modelId
        });

        try {
          // 发送流式请求
          const response = await aiServiceManager.sendMessageStream(
            provider,
            { ...chatRequest, model: modelId },
            (chunk) => {
              if (chunk.finished) {
                updateModelResponse(modelId, messageId, {
                  loading: false,
                  isComplete: true,
                  tokens: chunk.tokens,
                  cost: chunk.cost
                });
              } else {
                appendToModelResponse(modelId, messageId, chunk.content);
              }
            }
          );

          // 更新最终响应
          updateModelResponse(modelId, messageId, {
            responseTime: response.responseTime,
            tokens: response.tokens,
            cost: response.cost,
            loading: false,
            isComplete: true
          });

          // 更新统计
          if (response.tokens) addTokens(response.tokens);
          if (response.cost) addCost(response.cost);

          logger.info(`Model ${modelId} completed response`, {
            tokens: response.tokens,
            cost: response.cost,
            responseTime: response.responseTime
          });

        } catch (error) {
          logger.error(`Error from model ${modelId}`, error);
          updateModelResponse(modelId, messageId, {
            error: error instanceof Error ? error.message : String(error),
            loading: false,
            isComplete: true
          });
        }
      });

      await Promise.allSettled(promises);
      
    } catch (error) {
      logger.error('Error sending message', error);
    } finally {
      setLoading(false);
    }
  }, 300);

  const handleSendMessage = async () => {
    const message = inputMessage.trim();
    if (!message) return;

    // 处理文件上传
    const images: string[] = [];
    for (const file of selectedFiles) {
      if (file.type.startsWith('image/')) {
        try {
          const base64 = await fileToBase64(file);
          images.push(base64);
        } catch (error) {
          logger.error('Error processing image file', error);
        }
      }
    }

    // 清空输入
    setInputMessage('');
    setSelectedFiles([]);

    // 发送消息
    await debouncedSendMessage(message, images.length > 0 ? images : undefined);
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const fileArray = Array.from(files);
    const imageFiles = fileArray.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== fileArray.length) {
      logger.warn('Some files were ignored (only images are supported)');
    }
    
    setSelectedFiles(prev => [...prev, ...imageFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // 处理生成报告
  // const handleGenerateReport = () => {
  //   if (currentSession && currentSession.messages.length > 0) {
  //     setIsReportModalOpen(true);
  //   }
  // };

  // 处理报告保存
  // const handleSaveReport = (report: any) => {
  //   try {
  //     const reportId = saveReport({
  //       title: report.title || `AI模型对比报告 - ${new Date().toLocaleDateString()}`,
  //       htmlContent: report.htmlContent,
  //       sessionData: currentSession
  //     });
  //     
  //     toast.success('报告保存成功！', {
  //       description: `报告ID: ${reportId}`
  //     });
  //     
  //     logger.info('Report saved successfully', { reportId, sessionId: currentSession?.id });
  //   } catch (error) {
  //     const errorMessage = error instanceof Error ? error.message : '保存失败';
  //     toast.error('保存报告失败', {
  //       description: errorMessage
  //     });
  //     
  //     logger.error('Failed to save report', error);
  //   }
  // };

  // 处理报告导出
  // const handleExportReport = (report: any) => {
  //   try {
  //     // 创建临时报告ID用于导出
  //     const tempReportId = saveReport({
  //       title: report.title || `AI模型对比报告 - ${new Date().toLocaleDateString()}`,
  //       htmlContent: report.htmlContent,
  //       sessionData: currentSession
  //     });
  //     
  //     // 导出HTML文件
  //     exportReportAsHTML(tempReportId);
  //     
  //     toast.success('报告导出成功！');
  //     
  //     logger.info('Report exported successfully', { sessionId: currentSession?.id });
  //   } catch (error) {
  //     const errorMessage = error instanceof Error ? error.message : '导出失败';
  //     toast.error('导出报告失败', {
  //       description: errorMessage
  //     });
  //     
  //     logger.error('Failed to export report', error);
  //   }
  // };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  // 如果没有当前会话，显示欢迎界面
  if (!currentSession) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            欢迎使用 AI 模型对比工具
          </h2>
          <p className="text-gray-500 mb-6">
            请在左侧选择模型并开始新的对话
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex-1 flex flex-col h-full bg-gray-50">
        {/* 消息列表 */}
        <div className="flex-1 overflow-hidden">
          <MessageList 
            session={currentSession}
            selectedModels={selectedModels}
          />
        </div>

        {/* 模型响应网格 */}
        {currentSession.messages.length > 0 && (
          <ModelResponseGrid 
            session={currentSession}
            selectedModels={selectedModels}
          />
        )}

        {/* 输入区域 */}
        <ChatInput
          value={inputMessage}
          onChange={setInputMessage}
          onSend={handleSendMessage}
          onFileSelect={handleFileSelect}
          selectedFiles={selectedFiles}
          onRemoveFile={removeFile}
          // onGenerateReport={handleGenerateReport}
          isLoading={isLoading}
          disabled={selectedModels.length === 0}
          fileInputRef={fileInputRef}
          hasMessages={currentSession.messages.length > 0}
        />

        {/* 底部滚动锚点 */}
        <div ref={messageEndRef} />
        
        {/* 报告生成模态框 */}
        {/* <ReportGenerationModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          conversationData={currentSession}
          onSave={handleSaveReport}
          onExport={handleExportReport}
        /> */}
      </div>
    </ErrorBoundary>
  );
};