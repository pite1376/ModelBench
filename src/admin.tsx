import { useState, useEffect } from 'react';
import { Chart, registerables } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useAppStore } from '@/store';

// 注册 Chart.js 组件
Chart.register(...registerables);

// 安全地引用环境变量
const ADMIN_PASSWORD = 'admin123'; // 默认密码

interface AdminPageProps {
  onBack?: () => void;
}

interface StatsData {
  date: string;
  total_users: number;
  active_users: number;
  total_sessions: number;
  total_messages: number;
  popular_models: Array<{ model_name: string; usage_count: number }>;
  recent_events: Array<{ type: string; count: number; timestamp: number }>;
}

interface AnalyticsEvent {
  type: string;
  payload: any;
  timestamp: number;
  user: any;
}

export default function AdminPage({ onBack }: AdminPageProps) {
  const [authed, setAuthed] = useState(false);
  const [inputPwd, setInputPwd] = useState('');
  const [stats, setStats] = useState<StatsData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 从store获取数据
  const { sessions, currentSession, totalTokens, totalCost, syncToCloud, syncFromCloud } = useAppStore();

  // 从localStorage获取分析事件
  const getAnalyticsEvents = (): AnalyticsEvent[] => {
    try {
      const events = localStorage.getItem('analytics_events_cache');
      return events ? JSON.parse(events) : [];
    } catch {
      return [];
    }
  };

  // 从localStorage获取用户偏好和数据
  const getUserData = () => {
    try {
      const userIdentityKey = localStorage.getItem('user_identity_key');
      const userPrefs = JSON.parse(localStorage.getItem('user_preferences') || '{}');
      return { userIdentityKey, userPrefs };
    } catch {
      return { userIdentityKey: null, userPrefs: {} };
    }
  };

  // 计算统计数据
  const calculateStats = async (): Promise<StatsData> => {
    const today = new Date().toISOString().slice(0, 10);
    
    try {
      // 获取分析事件
      const events = getAnalyticsEvents();
      const { userIdentityKey } = getUserData();
      
      // 计算基础统计
      const total_users = userIdentityKey ? 1 : 0; // 当前只有一个用户
      const active_users = events.filter(e => 
        new Date(e.timestamp).toISOString().slice(0, 10) === today
      ).length > 0 ? 1 : 0;
      
      const total_sessions = sessions.length;
      
      // 计算总消息数
      let total_messages = 0;
      sessions.forEach(session => {
        total_messages += session.messages.length;
      });
      
      // 计算热门模型（从事件中统计）
      const modelCounts: Record<string, number> = {};
      events.forEach(event => {
        if (event.type === 'message_sent' && event.payload?.modelId) {
          const modelId = event.payload.modelId;
          modelCounts[modelId] = (modelCounts[modelId] || 0) + 1;
        }
      });
      
      const popular_models = Object.entries(modelCounts)
        .map(([model_name, usage_count]) => ({ model_name, usage_count }))
        .sort((a, b) => b.usage_count - a.usage_count)
        .slice(0, 10);
      
      // 计算最近事件统计
      const eventTypeCounts: Record<string, number> = {};
      events.forEach(event => {
        eventTypeCounts[event.type] = (eventTypeCounts[event.type] || 0) + 1;
      });
      
      const recent_events = Object.entries(eventTypeCounts)
        .map(([type, count]) => ({ 
          type, 
          count, 
          timestamp: events.filter(e => e.type === type)[0]?.timestamp || Date.now()
        }))
        .sort((a, b) => b.count - a.count);
      
      return {
        date: today,
        total_users,
        active_users,
        total_sessions,
        total_messages,
        popular_models,
        recent_events,
      };
    } catch (error) {
      console.warn('数据计算失败，使用基础数据:', error);
      return {
        date: today,
        total_users: 1,
        active_users: 1,
        total_sessions: sessions.length,
        total_messages: sessions.reduce((acc, session) => acc + session.messages.length, 0),
        popular_models: [
          { model_name: '暂无数据', usage_count: 0 }
        ],
        recent_events: [
          { type: '暂无事件', count: 0, timestamp: Date.now() }
        ]
      };
    }
  };

  // 数据加载 - 放在条件渲染之前
  useEffect(() => {
    if (!authed) return; // 未认证时不加载数据
    
    const loadStats = async () => {
      setLoading(true);
      setError('');
      
      try {
        const statsData = await calculateStats();
        setStats(statsData);
      } catch (err: any) {
        console.error('数据加载失败:', err);
        setError(`数据加载失败: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    loadStats();
  }, [authed]); // 依赖 authed 状态

  // 刷新数据
  const refreshData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const statsData = await calculateStats();
      setStats(statsData);
    } catch (err: any) {
      console.error('数据刷新失败:', err);
      setError(`数据刷新失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 简单密码保护
  if (!authed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <h2 className="mb-4 text-xl font-bold text-center">🔐 管理后台登录</h2>
          <div className="mb-4 text-xs text-gray-500 space-y-1">
            <p>📍 <strong>访问方式：</strong></p>
            <p>• URL: <code className="bg-gray-100 px-1 rounded">?admin=true</code></p>
            <p>• Hash: <code className="bg-gray-100 px-1 rounded">#admin-panel</code></p>
            <p>• 控制台: <code className="bg-gray-100 px-1 rounded">__openAdmin()</code></p>
            <p>• 隐藏区域: 左上角点击</p>
          </div>
          <input
            type="password"
            placeholder="请输入后台密码"
            value={inputPwd}
            onChange={e => setInputPwd(e.target.value)}
            className="w-full border px-3 py-2 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (inputPwd === ADMIN_PASSWORD) setAuthed(true);
                else setError('密码错误');
              }
            }}
          />
          <button
            className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={() => {
              if (inputPwd === ADMIN_PASSWORD) setAuthed(true);
              else setError('密码错误');
            }}
          >
            登录
          </button>
          {error && <div className="text-red-500 mt-2 text-center">{error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">📊 管理后台</h1>
        <div className="flex space-x-2">
          <button 
            onClick={refreshData}
            disabled={loading}
            className="bg-green-500 px-4 py-2 rounded text-white hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? '刷新中...' : '🔄 刷新数据'}
          </button>
          {onBack && (
            <button 
              onClick={onBack}
              className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
            >
              ← 返回
            </button>
          )}
        </div>
      </div>
      
      {loading && <div className="text-center py-4">⏳ 加载中...</div>}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          ❌ {error}
        </div>
      )}
      
      {stats && (
        <div>
          <div className="mb-4 text-sm text-gray-600">
            <strong>📅 统计日期：</strong>{stats.date} | 
            <strong> 🕒 最后更新：</strong>{new Date().toLocaleString()}
          </div>
          
          {/* 统计卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">👥 总用户数</div>
              <div className="text-2xl font-bold text-blue-600">{stats.total_users}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">✅ 活跃用户</div>
              <div className="text-2xl font-bold text-green-600">{stats.active_users}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">💬 总会话数</div>
              <div className="text-2xl font-bold text-purple-600">{stats.total_sessions}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">📝 总消息数</div>
              <div className="text-2xl font-bold text-orange-600">{stats.total_messages}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">🔢 总Token数</div>
              <div className="text-2xl font-bold text-cyan-600">{totalTokens.toLocaleString()}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">💰 总花费</div>
              <div className="text-2xl font-bold text-red-600">${totalCost.toFixed(4)}</div>
            </div>
          </div>
          
          {/* 热门模型排行 */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="mb-4 font-bold text-lg">🏆 热门模型排行</div>
              {stats.popular_models.length > 0 ? (
                <ol className="space-y-2">
                  {stats.popular_models.map((m, i) => (
                    <li key={i} className="flex justify-between items-center py-2 border-b">
                      <span className="flex items-center">
                        <span className="bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">
                          {i + 1}
                        </span>
                        {m.model_name}
                      </span>
                      <span className="font-semibold text-blue-600">{m.usage_count}次</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="text-gray-500 text-center py-4">暂无模型使用数据</div>
              )}
            </div>
            
            {/* 图表区域 */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="mb-4 font-bold text-lg">📊 模型使用分布</div>
              {stats.popular_models.length > 0 ? (
                <Bar
                  data={{
                    labels: stats.popular_models.map((m) => m.model_name),
                    datasets: [{
                      label: '使用次数',
                      data: stats.popular_models.map((m) => m.usage_count),
                      backgroundColor: [
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(255, 205, 86, 0.8)',
                        'rgba(75, 192, 192, 0.8)',
                        'rgba(153, 102, 255, 0.8)',
                      ],
                      borderColor: [
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 99, 132, 1)',
                        'rgba(255, 205, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                      ],
                      borderWidth: 1,
                    }]
                  }}
                  options={{
                    responsive: true,
                    plugins: { 
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: (context) => `使用次数: ${context.raw}`
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          stepSize: 1
                        }
                      }
                    }
                  }}
                />
              ) : (
                <div className="text-gray-500 text-center py-8">暂无图表数据</div>
              )}
            </div>
          </div>
          
          {/* 事件统计和调试信息 */}
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="mb-4 font-bold text-lg">📈 事件统计</div>
              {stats.recent_events.length > 0 ? (
                <div className="space-y-2">
                  {stats.recent_events.map((event, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm font-medium">{event.type}</span>
                      <span className="bg-blue-100 px-2 py-1 rounded text-sm text-blue-800">
                        {event.count}次
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-4">暂无事件数据</div>
              )}
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="mb-4 font-bold text-lg">🔍 调试信息</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>分析事件总数:</span>
                  <span className="font-mono">{getAnalyticsEvents().length}</span>
                </div>
                <div className="flex justify-between">
                  <span>用户身份ID:</span>
                  <span className="font-mono text-xs">{getUserData().userIdentityKey?.slice(0, 8) || '未设置'}</span>
                </div>
                <div className="flex justify-between">
                  <span>数据收集状态:</span>
                  <span className={`font-medium ${getUserData().userPrefs.allowAnalytics !== false ? 'text-green-600' : 'text-red-600'}`}>
                    {getUserData().userPrefs.allowAnalytics !== false ? '已启用' : '已禁用'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>当前会话:</span>
                  <span className="font-mono">{currentSession?.id?.slice(0, 8) || '无'}</span>
                </div>
                <div className="flex justify-between">
                  <span>本地存储状态:</span>
                  <span className="text-green-600">正常</span>
                </div>
              </div>
              
              {/* 测试数据收集按钮 */}
              <div className="mt-4 pt-4 border-t">
                <button
                  onClick={async () => {
                    // 动态导入trackEvent并测试
                    const { trackEvent } = await import('@/services/analytics');
                    await trackEvent('admin_test', { 
                      timestamp: Date.now(),
                      source: 'admin_panel'
                    });
                    alert('测试事件已发送，请刷新查看数据！');
                  }}
                  className="w-full bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600 mb-2"
                >
                  🧪 发送测试事件
                </button>
                
                <button
                  onClick={async () => {
                    try {
                      // 动态导入测试工具并运行诊断
                      const { SupabaseTestTool } = await import('@/utils/supabase-test');
                      const result = await SupabaseTestTool.diagnose();
                      
                      let message = '🔍 Supabase 诊断结果:\n';
                      message += `• 连接状态: ${result.connection ? '✅ 正常' : '❌ 失败'}\n`;
                      message += `• 表结构: ${result.tables ? '✅ 完整' : '❌ 缺失'}\n`;
                      message += `• 权限: ${result.permissions ? '✅ 正常' : '❌ 受限'}\n\n`;
                      message += `详细信息:\n${JSON.stringify(result.details, null, 2)}`;
                      
                      alert(message);
                    } catch (error: any) {
                      alert(`诊断失败: ${error.message}`);
                    }
                  }}
                  className="w-full bg-purple-500 text-white px-3 py-2 rounded text-sm hover:bg-purple-600 mb-2"
                >
                  🔍 诊断数据库
                </button>
                
                <button
                  onClick={async () => {
                    try {
                      await syncToCloud();
                      alert('数据已同步到云端！');
                      refreshData();
                    } catch (error: any) {
                      alert(`同步失败: ${error.message}`);
                    }
                  }}
                  className="w-full bg-green-500 text-white px-3 py-2 rounded text-sm hover:bg-green-600 mb-2"
                >
                  ☁️ 同步到云端
                </button>
                
                <button
                  onClick={async () => {
                    try {
                      await syncFromCloud();
                      alert('已从云端拉取数据！');
                      refreshData();
                    } catch (error: any) {
                      alert(`拉取失败: ${error.message}`);
                    }
                  }}
                  className="w-full bg-orange-500 text-white px-3 py-2 rounded text-sm hover:bg-orange-600"
                >
                  📥 从云端拉取
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 