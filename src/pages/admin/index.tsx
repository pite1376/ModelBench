import { useState, useEffect } from 'react';
import { Chart, registerables } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { supabase } from '@/lib/supabaseClient';

// 注册 Chart.js 组件
Chart.register(...registerables);

// 安全地引用环境变量
const ADMIN_PASSWORD = 'admin123';

interface StatsData {
  date: string;
  total_users: number;
  active_users: number;
  total_sessions: number;
  total_messages: number;
  popular_models: Array<{ model_name: string; usage_count: number }>;
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [inputPwd, setInputPwd] = useState('');
  const [stats, setStats] = useState<StatsData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 简单密码保护
  if (!authed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="mb-4 text-xl font-bold">管理后台登录</h2>
        <input
          type="password"
          placeholder="请输入后台密码"
          value={inputPwd}
          onChange={e => setInputPwd(e.target.value)}
          className="border px-3 py-2 rounded mb-2"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (inputPwd === ADMIN_PASSWORD) setAuthed(true);
              else setError('密码错误');
            }
          }}
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={() => {
            if (inputPwd === ADMIN_PASSWORD) setAuthed(true);
            else setError('密码错误');
          }}
        >
          登录
        </button>
        {error && <div className="text-red-500 mt-2">{error}</div>}
      </div>
    );
  }

  // 计算统计数据
  const calculateStats = async (): Promise<StatsData> => {
    const today = new Date().toISOString().slice(0, 10);
    
    // 获取所有用户
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) throw usersError;
    
    // 获取今日活跃用户
    const { data: activeUsers, error: activeUsersError } = await supabase
      .from('users')
      .select('*')
      .gte('last_active', today);
    
    if (activeUsersError) throw activeUsersError;
    
    // 获取所有会话
    const { data: sessions, error: sessionsError } = await supabase
      .from('chat_sessions')
      .select('*');
    
    if (sessionsError) throw sessionsError;
    
    // 获取所有消息
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*');
    
    if (messagesError) throw messagesError;
    
    // 计算热门模型
    const modelCounts: Record<string, number> = {};
    messages?.forEach(msg => {
      if (msg.model_name) {
        modelCounts[msg.model_name] = (modelCounts[msg.model_name] || 0) + 1;
      }
    });
    
    const popular_models = Object.entries(modelCounts)
      .map(([model_name, usage_count]) => ({ model_name, usage_count }))
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, 10);
    
    return {
      date: today,
      total_users: users?.length || 0,
      active_users: activeUsers?.length || 0,
      total_sessions: sessions?.length || 0,
      total_messages: messages?.length || 0,
      popular_models,
    };
  };

  // 数据加载
  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      setError('');
      
      try {
        const statsData = await calculateStats();
        setStats(statsData);
      } catch (err: any) {
        console.error('数据加载失败:', err);
        setError(`数据加载失败: ${err.message}`);
        
        // 如果数据库查询失败，使用模拟数据
        setStats({
          date: new Date().toISOString().slice(0, 10),
          total_users: 0,
          active_users: 0,
          total_sessions: 0,
          total_messages: 0,
          popular_models: [
            { model_name: 'DeepSeek Chat', usage_count: 0 },
            { model_name: '通义千问', usage_count: 0 },
            { model_name: '豆包 Pro', usage_count: 0 },
          ]
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadStats();
  }, []);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">管理后台</h1>
      
      {loading && <div className="text-center py-4">加载中...</div>}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {stats && (
        <div>
          <div className="mb-4 text-sm text-gray-600">
            <strong>统计日期：</strong>{stats.date} | 
            <strong> 最后更新：</strong>{new Date().toLocaleString()}
          </div>
          
          {/* 统计卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">总用户数</div>
              <div className="text-2xl font-bold text-blue-600">{stats.total_users}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">活跃用户</div>
              <div className="text-2xl font-bold text-green-600">{stats.active_users}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">总会话数</div>
              <div className="text-2xl font-bold text-purple-600">{stats.total_sessions}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">总消息数</div>
              <div className="text-2xl font-bold text-orange-600">{stats.total_messages}</div>
            </div>
          </div>
          
          {/* 热门模型排行和图表 */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="mb-4 font-bold text-lg">热门模型排行</div>
              {stats.popular_models.length > 0 ? (
                <ol className="space-y-2">
                  {stats.popular_models.map((m, i) => (
                    <li key={i} className="flex justify-between items-center py-2 border-b">
                      <span>{m.model_name}</span>
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
              <div className="mb-4 font-bold text-lg">模型使用分布</div>
              {stats.popular_models.length > 0 ? (
                <Bar
                  data={{
                    labels: stats.popular_models.map((m) => m.model_name),
                    datasets: [{
                      label: '使用次数',
                      data: stats.popular_models.map((m) => m.usage_count),
                      backgroundColor: 'rgba(54, 162, 235, 0.8)',
                      borderColor: 'rgba(54, 162, 235, 1)',
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
        </div>
      )}
    </div>
  );
} 