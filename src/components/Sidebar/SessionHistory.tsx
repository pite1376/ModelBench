import React, { useState } from 'react';
import { ChatSession } from '@/types';
import { formatRelativeTime, truncateText } from '@/utils/helpers';
import { MessageSquare, Trash2, Download } from 'lucide-react';
import { useAppStore } from '@/store';

interface SessionHistoryProps {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  loadSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
}

export const SessionHistory: React.FC<SessionHistoryProps> = ({
  sessions,
  currentSession,
  loadSession,
  deleteSession
}) => {
  const { exportSession } = useAppStore();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (confirmDeleteId === sessionId) {
      deleteSession(sessionId);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(sessionId);
      // 3秒后自动取消确认
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  const handleExport = (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const data = exportSession(sessionId);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-${sessionId.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };



  // 按日期分组会话
  const groupedSessions = sessions.reduce((groups, session) => {
    const date = new Date(session.createdAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(session);
    return groups;
  }, {} as Record<string, ChatSession[]>);

  const sortedGroups = Object.entries(groupedSessions).sort(
    ([a], [b]) => new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="space-y-4">
      {/* 会话列表 */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {sortedGroups.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">还没有会话记录</p>
            <p className="text-xs">点击上方按钮开始新对话</p>
          </div>
        ) : (
          sortedGroups.map(([date, dateSessions]) => (
            <div key={date}>
              <h4 className="text-xs font-medium text-gray-500 mb-2">
                {formatRelativeTime(new Date(date))}
              </h4>
              <div className="space-y-1">
                {dateSessions.map(session => {
                  const isActive = currentSession?.id === session.id;
                  const firstMessage = session.messages.find(m => m.role === 'user');
                  const title = session.title || 
                    (firstMessage ? truncateText(firstMessage.content, 30) : '新会话');

                  return (
                    <div
                      key={session.id}
                      onClick={() => loadSession(session.id)}
                      className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-blue-50 border-blue-200 border'
                          : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${
                            isActive ? 'text-blue-700' : 'text-gray-900'
                          }`}>
                            {title}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-500">
                              {session.messages.length} 条消息
                            </span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">
                              {session.tokenCount} tokens
                            </span>
                          </div>
                        </div>
                        
                        {/* 操作按钮 */}
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleExport(session.id, e)}
                            className="p-1 text-gray-400 hover:text-blue-600"
                            title="导出会话"
                          >
                            <Download size={12} />
                          </button>
                          <button
                            onClick={(e) => handleDelete(session.id, e)}
                            className={`p-1 transition-colors ${
                              confirmDeleteId === session.id
                                ? 'text-red-600'
                                : 'text-gray-400 hover:text-red-600'
                            }`}
                            title={confirmDeleteId === session.id ? '确认删除' : '删除会话'}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      
                      {confirmDeleteId === session.id && (
                        <div className="absolute inset-0 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center">
                          <span className="text-xs text-red-600 font-medium">
                            再次点击确认删除
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}; 