import React, { memo } from 'react';
import { ChatSession } from '@/types';
import { formatTime } from '@/utils/helpers';
import { User, Bot } from 'lucide-react';

interface MessageListProps {
  session: ChatSession;
  selectedModels: string[];
}

const MessageItem = memo<{
  message: any;
  isLast: boolean;
}>(({ message, isLast }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start space-x-3`}>
        {/* 头像 */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-blue-500 text-white ml-3' : 'bg-gray-200 text-gray-600 mr-3'
        }`}>
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>
        
        {/* 消息内容 */}
        <div className={`rounded-lg px-4 py-3 ${
          isUser 
            ? 'bg-blue-500 text-white' 
            : 'bg-white border border-gray-200 text-gray-800'
        }`}>
          <div className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </div>
          
          {/* 图片显示 */}
          {message.images && message.images.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.images.map((image: string, index: number) => (
                <img
                  key={index}
                  src={`data:image/jpeg;base64,${image}`}
                  alt={`上传的图片 ${index + 1}`}
                  className="max-w-sm rounded-lg border"
                />
              ))}
            </div>
          )}
          
          {/* 时间戳 */}
          <div className={`text-xs mt-2 ${
            isUser ? 'text-blue-100' : 'text-gray-500'
          }`}>
            {formatTime(new Date(message.timestamp))}
          </div>
        </div>
      </div>
    </div>
  );
});

MessageItem.displayName = 'MessageItem';

export const MessageList: React.FC<MessageListProps> = memo(({ session, selectedModels }) => {
  if (!session.messages || session.messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <Bot size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">开始新的对话</p>
          <p className="text-sm">
            已选择 {selectedModels.length} 个模型
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {session.messages.map((message, index) => (
        <MessageItem
          key={message.id}
          message={message}
          isLast={index === session.messages.length - 1}
        />
      ))}
    </div>
  );
});

MessageList.displayName = 'MessageList'; 