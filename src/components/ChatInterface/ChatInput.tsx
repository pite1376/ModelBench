import React, { KeyboardEvent } from 'react';
import { Send, Paperclip, X } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onFileSelect: (files: FileList | null) => void;
  selectedFiles: File[];
  onRemoveFile: (index: number) => void;
  onGenerateReport?: () => void;
  isLoading: boolean;
  disabled: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  hasMessages?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  onFileSelect,
  selectedFiles,
  onRemoveFile,
  isLoading,
  disabled,
  fileInputRef
}) => {
  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && !isLoading && value.trim()) {
        onSend();
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileSelect(e.target.files);
    // 重置input值，允许重复选择同一文件
    e.target.value = '';
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      {/* 文件预览区 */}
      {selectedFiles.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {selectedFiles.map((file, index) => (
            <div key={index} className="relative group">
              <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-300 bg-gray-100">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Upload ${index}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={() => onRemoveFile(index)}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                title="移除图片"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 输入区域 */}
      <div className="flex items-end space-x-3">
        {/* 文件上传按钮 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          title="上传图片"
        >
          <Paperclip size={20} />
        </button>

        {/* 文本输入 */}
        <div className="flex-1 relative">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={disabled ? "请先选择至少一个模型..." : "输入消息..."}
            disabled={disabled || isLoading}
            className="w-full resize-none border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed max-h-32 min-h-[48px]"
            rows={1}
            style={{
              height: 'auto',
              minHeight: '48px',
              maxHeight: '128px'
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 128) + 'px';
            }}
          />
          
          {/* 发送按钮 */}
          <button
            onClick={onSend}
            disabled={disabled || isLoading || !value.trim()}
            className="absolute right-2 bottom-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="发送消息"
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* 提示文本 */}
      <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
        <span>按 Enter 发送，Shift + Enter 换行</span>
        {selectedFiles.length > 0 && (
          <span>{selectedFiles.length} 个文件已选择</span>
        )}
      </div>
    </div>
  );
};