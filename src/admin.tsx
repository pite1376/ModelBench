import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Calendar, Users, Activity, TrendingUp, Clock, Database, Download, RefreshCw, MessageSquare, Zap, BarChart3, PieChart, ArrowLeft } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// 安全地引用环境变量
const ADMIN_PASSWORD = 'admin123'; // 默认密码

interface AdminPageProps {
  onBack?: () => void;
}

interface StatsData {
  total_users: number;
  active_users: number;
  total_sessions: number;
  total_messages: number;
  total_tokens: number;
  total_cost: number;
  popular_models: Array<{ model_name: string; usage_count: number }>;
  recent_events: Array<{ type: string; count: number; timestamp: number }>;
  daily_stats: Array<{ date: string; users: number; sessions: number; messages: number; tokens: number; cost: number }>;
  weekly_stats: Array<{ week: string; users: number; sessions: number; messages: number; tokens: number; cost: number }>;
  monthly_stats: Array<{ month: string; users: number; sessions: number; messages: number; tokens: number; cost: number }>;
  user_list: Array<{ id: string; anonymous_id: string; first_seen: number; last_active: number; session_count: number; message_count: number; total_tokens: number; total_cost: number }>;
}

type TimeRange = 'today' | 'week' | 'month' | 'all';
type ViewMode = 'overview' | 'users' | 'analytics' | 'charts';

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
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

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

  // 计算时间维度统计的辅助函数
  const calculateDailyStats = (events: AnalyticsEvent[], sessions: any[]) => {
    const dailyData: Record<string, any> = {};
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().slice(0, 10);
    }).reverse();

    last7Days.forEach(date => {
      const dayEvents = events.filter(e => 
        new Date(e.timestamp).toISOString().slice(0, 10) === date
      );
      const activeUsers = new Set(dayEvents.map(e => e.user?.anonymousId).filter(Boolean)).size;
      
      dailyData[date] = {
        date,
        users: activeUsers,
        sessions: dayEvents.filter(e => e.type === 'session_start').length,
        messages: dayEvents.filter(e => e.type === 'message_sent').length,
        tokens: dayEvents.reduce((acc, e) => acc + (e.payload?.tokens || 0), 0),
        cost: dayEvents.reduce((acc, e) => acc + (e.payload?.cost || 0), 0)
      };
    });

    return Object.values(dailyData);
  };

  const calculateWeeklyStats = (events: AnalyticsEvent[], sessions: any[]) => {
    const weeklyData = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const weekEvents = events.filter(e => {
        const eventDate = new Date(e.timestamp);
        return eventDate >= weekStart && eventDate <= weekEnd;
      });
      
      weeklyData.unshift({
        week: `${weekStart.toISOString().slice(0, 10)} - ${weekEnd.toISOString().slice(0, 10)}`,
        users: new Set(weekEvents.map(e => e.user?.anonymousId).filter(Boolean)).size,
        sessions: weekEvents.filter(e => e.type === 'session_start').length,
        messages: weekEvents.filter(e => e.type === 'message_sent').length,
        tokens: weekEvents.reduce((acc, e) => acc + (e.payload?.tokens || 0), 0),
        cost: weekEvents.reduce((acc, e) => acc + (e.payload?.cost || 0), 0)
      });
    }
    return weeklyData;
  };

  const calculateMonthlyStats = (events: AnalyticsEvent[], sessions: any[]) => {
    const monthlyData = [];
    for (let i = 0; i < 3; i++) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i, 1);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1, 0);
      
      const monthEvents = events.filter(e => {
        const eventDate = new Date(e.timestamp);
        return eventDate >= monthStart && eventDate <= monthEnd;
      });
      
      monthlyData.unshift({
        month: monthStart.toISOString().slice(0, 7),
        users: new Set(monthEvents.map(e => e.user?.anonymousId).filter(Boolean)).size,
        sessions: monthEvents.filter(e => e.type === 'session_start').length,
        messages: monthEvents.filter(e => e.type === 'message_sent').length,
        tokens: monthEvents.reduce((acc, e) => acc + (e.payload?.tokens || 0), 0),
        cost: monthEvents.reduce((acc, e) => acc + (e.payload?.cost || 0), 0)
      });
    }
    return monthlyData;
  };

  const generateUserList = (events: AnalyticsEvent[], sessions: any[], userIds: string[]) => {
    return userIds.map(userId => {
      const userEvents = events.filter(e => e.user?.anonymousId === userId);
      const userSessions = sessions.filter(s => s.userId === userId);
      
      return {
        id: userId,
        anonymous_id: userId,
        first_seen: userEvents.length > 0 ? Math.min(...userEvents.map(e => e.timestamp)) : Date.now(),
        last_active: userEvents.length > 0 ? Math.max(...userEvents.map(e => e.timestamp)) : Date.now(),
        session_count: userSessions.length,
        message_count: userEvents.filter(e => e.type === 'message_sent').length,
        total_tokens: userEvents.reduce((acc, e) => acc + (e.payload?.tokens || 0), 0),
        total_cost: userEvents.reduce((acc, e) => acc + (e.payload?.cost || 0), 0)
      };
    });
  };

  // 计算统计数据
  const calculateStats = async (): Promise<StatsData> => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    
    try {
      // 获取分析事件和用户数据
      const events = getAnalyticsEvents();
      const allSessions = sessions || [];
      
      // 获取所有唯一用户ID
      const allUserIds = new Set<string>();
      events.forEach(e => {
        if (e.user?.anonymousId) {
          allUserIds.add(e.user.anonymousId);
        }
      });
      allSessions.forEach(s => {
        if (s.id) {
          allUserIds.add(s.id);
        }
      });
      
      const userIdArray = Array.from(allUserIds);
      
      // 计算基础统计
      const todayEvents = events.filter(e => 
        new Date(e.timestamp).toISOString().slice(0, 10) === today
      );
      
      const activeUsersToday = new Set(
        todayEvents.map(e => e.user?.anonymousId).filter(Boolean)
      ).size;
      
      // 计算模型使用统计
      const modelUsage: Record<string, number> = {};
      events.forEach(e => {
        if (e.type === 'message_sent' && e.payload?.model) {
          modelUsage[e.payload.model] = (modelUsage[e.payload.model] || 0) + 1;
        }
      });
      
      const popularModels = Object.entries(modelUsage)
        .map(([model_name, usage_count]) => ({ model_name, usage_count }))
        .sort((a, b) => b.usage_count - a.usage_count)
        .slice(0, 10);
      
      if (popularModels.length === 0) {
        popularModels.push({ model_name: '暂无数据', usage_count: 0 });
      }
      
      // 计算事件统计
      const eventCounts: Record<string, number> = {};
      events.forEach(e => {
        eventCounts[e.type] = (eventCounts[e.type] || 0) + 1;
      });
      
      const recentEvents = Object.entries(eventCounts)
        .map(([type, count]) => ({ type, count, timestamp: Date.now() }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      
      if (recentEvents.length === 0) {
        recentEvents.push({ type: '暂无事件', count: 0, timestamp: Date.now() });
      }
      
      // 计算时间维度统计
      const dailyStats = calculateDailyStats(events, allSessions);
      const weeklyStats = calculateWeeklyStats(events, allSessions);
      const monthlyStats = calculateMonthlyStats(events, allSessions);
      
      // 生成用户列表
      const userList = generateUserList(events, allSessions, userIdArray);
      
      return {
        total_users: userIdArray.length,
        active_users: activeUsersToday,
        total_sessions: allSessions.length,
        total_messages: events.filter(e => e.type === 'message_sent').length,
        total_tokens: events.reduce((acc, e) => acc + (e.payload?.tokens || 0), 0),
        total_cost: events.reduce((acc, e) => acc + (e.payload?.cost || 0), 0),
        popular_models: popularModels,
        recent_events: recentEvents,
        daily_stats: dailyStats,
        weekly_stats: weeklyStats,
        monthly_stats: monthlyStats,
        user_list: userList
      };
    } catch (error) {
      console.error('计算统计数据时出错:', error);
      throw new Error('统计数据计算失败');
    }
  };

  const handleLogin = () => {
    if (inputPwd === ADMIN_PASSWORD) {
      setAuthed(true);
      setError('');
      refreshData();
    } else {
      setError('密码错误');
    }
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      const newStats = await calculateStats();
      setStats(newStats);
    } catch (err: any) {
      setError(err.message || '数据加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authed) {
      refreshData();
    }
  }, [authed]);

  // 辅助函数
  const generateUserCSV = (users: any[]) => {
    const headers = ['用户ID', '首次访问', '最后活跃', '会话数', '消息数', 'Token数', '花费'];
    const rows = users.map(user => [
      user.anonymous_id,
      new Date(user.first_seen).toLocaleDateString(),
      new Date(user.last_active).toLocaleDateString(),
      user.session_count,
      user.message_count,
      user.total_tokens,
      user.total_cost.toFixed(4)
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };
  
  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // 用户管理视图
  function renderUsersView(stats: StatsData) {
    return (
      <div>
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-500" />
              用户管理
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const csvContent = generateUserCSV(stats.user_list);
                  downloadCSV(csvContent, 'users.csv');
                }}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                导出用户数据
              </button>
            </div>
          </div>
          
          {/* 用户统计概览 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.user_list.length}</div>
              <div className="text-sm text-blue-600">总用户数</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.active_users}</div>
              <div className="text-sm text-green-600">活跃用户</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {stats.user_list.reduce((acc, user) => acc + user.session_count, 0)}
              </div>
              <div className="text-sm text-purple-600">总会话数</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {stats.user_list.reduce((acc, user) => acc + user.message_count, 0)}
              </div>
              <div className="text-sm text-orange-600">总消息数</div>
            </div>
          </div>
          
          {/* 用户列表 */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    用户ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    首次访问
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    最后活跃
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    会话数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    消息数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Token数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    花费
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.user_list.map((user, index) => (
                  <tr key={user.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {user.anonymous_id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.first_seen).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.last_active).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.session_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.message_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.total_tokens.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${user.total_cost.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

   // 数据分析视图
   function renderAnalyticsView(stats: StatsData) {
     const getTimeRangeData = () => {
       switch (timeRange) {
         case 'today':
           return stats.daily_stats.slice(-1);
         case 'week':
           return stats.daily_stats;
         case 'month':
           return stats.weekly_stats;
         case 'all':
           return stats.monthly_stats;
         default:
           return stats.daily_stats;
       }
     };
     
     const timeData = getTimeRangeData();
     
     return (
       <div>
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
           {/* 时间趋势图 */}
           <div className="bg-white rounded-lg shadow p-6">
             <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
               <TrendingUp className="w-5 h-5 text-blue-500" />
               用户活跃趋势
             </h3>
             {timeData.length > 0 ? (
               <Line
                 data={{
                   labels: timeData.map(d => (d as any).date || (d as any).week || (d as any).month),
                   datasets: [
                     {
                       label: '活跃用户',
                       data: timeData.map(d => d.users),
                       borderColor: 'rgb(59, 130, 246)',
                       backgroundColor: 'rgba(59, 130, 246, 0.1)',
                       tension: 0.4
                     },
                     {
                       label: '消息数',
                       data: timeData.map(d => d.messages),
                       borderColor: 'rgb(16, 185, 129)',
                       backgroundColor: 'rgba(16, 185, 129, 0.1)',
                       tension: 0.4
                     }
                   ]
                 }}
                 options={{
                   responsive: true,
                   plugins: {
                     legend: {
                       position: 'top' as const,
                     },
                   },
                   scales: {
                     y: {
                       beginAtZero: true
                     }
                   }
                 }}
               />
             ) : (
               <div className="text-gray-500 text-center py-8">暂无趋势数据</div>
             )}
           </div>
           
           {/* 模型使用分布饼图 */}
           <div className="bg-white rounded-lg shadow p-6">
             <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
               <Activity className="w-5 h-5 text-green-500" />
               模型使用分布
             </h3>
             {stats.popular_models.length > 0 && stats.popular_models[0].model_name !== '暂无数据' ? (
               <Pie
                 data={{
                   labels: stats.popular_models.slice(0, 5).map(m => m.model_name),
                   datasets: [{
                     data: stats.popular_models.slice(0, 5).map(m => m.usage_count),
                     backgroundColor: [
                       '#3B82F6',
                       '#10B981',
                       '#F59E0B',
                       '#EF4444',
                       '#8B5CF6'
                     ]
                   }]
                 }}
                 options={{
                   responsive: true,
                   plugins: {
                     legend: {
                       position: 'bottom' as const,
                     },
                   }
                 }}
               />
             ) : (
               <div className="text-gray-500 text-center py-8">暂无模型数据</div>
             )}
           </div>
         </div>
         
         {/* 详细统计表格 */}
         <div className="bg-white rounded-lg shadow p-6">
           <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
             <Database className="w-5 h-5 text-purple-500" />
             详细统计数据
           </h3>
           <div className="overflow-x-auto">
             <table className="min-w-full divide-y divide-gray-200">
               <thead className="bg-gray-50">
                 <tr>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     时间
                   </th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     活跃用户
                   </th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     会话数
                   </th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     消息数
                   </th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     Token数
                   </th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     花费
                   </th>
                 </tr>
               </thead>
               <tbody className="bg-white divide-y divide-gray-200">
                 {timeData.map((item, index) => (
                   <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                       {(item as any).date || (item as any).week || (item as any).month}
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                       {item.users}
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                       {item.sessions}
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                       {item.messages}
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                       {item.tokens.toLocaleString()}
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                       ${item.cost.toFixed(4)}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         </div>
       </div>
     );
   }

   // 图表统计视图
   function renderChartsView(stats: StatsData) {
     return (
       <div>
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
           {/* 模型使用柱状图 */}
           <div className="bg-white rounded-lg shadow p-6">
             <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
               <BarChart3 className="w-5 h-5 text-blue-500" />
               模型使用统计
             </h3>
             {stats.popular_models.length > 0 && stats.popular_models[0].model_name !== '暂无数据' ? (
               <Bar
                 data={{
                   labels: stats.popular_models.slice(0, 8).map(m => m.model_name),
                   datasets: [{
                     label: '使用次数',
                     data: stats.popular_models.slice(0, 8).map(m => m.usage_count),
                     backgroundColor: 'rgba(59, 130, 246, 0.8)',
                     borderColor: 'rgba(59, 130, 246, 1)',
                     borderWidth: 1
                   }]
                 }}
                 options={{
                   responsive: true,
                   plugins: {
                     legend: {
                       position: 'top' as const,
                     },
                   },
                   scales: {
                     y: {
                       beginAtZero: true
                     }
                   }
                 }}
               />
             ) : (
               <div className="text-gray-500 text-center py-8">暂无模型数据</div>
             )}
           </div>
           
           {/* Token使用统计图 */}
           <div className="bg-white rounded-lg shadow p-6">
             <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
               <Zap className="w-5 h-5 text-yellow-500" />
               Token使用统计
             </h3>
             {stats.daily_stats.length > 0 ? (
               <Bar
                 data={{
                   labels: stats.daily_stats.slice(-7).map(d => d.date),
                   datasets: [{
                     label: 'Token数量',
                     data: stats.daily_stats.slice(-7).map(d => d.tokens),
                     backgroundColor: 'rgba(245, 158, 11, 0.8)',
                     borderColor: 'rgba(245, 158, 11, 1)',
                     borderWidth: 1
                   }]
                 }}
                 options={{
                   responsive: true,
                   plugins: {
                     legend: {
                       position: 'top' as const,
                     },
                   },
                   scales: {
                     y: {
                       beginAtZero: true
                     }
                   }
                 }}
               />
             ) : (
               <div className="text-gray-500 text-center py-8">暂无Token数据</div>
             )}
           </div>
         </div>
         
         {/* 用户活跃度热力图 */}
         <div className="bg-white rounded-lg shadow p-6">
           <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
             <TrendingUp className="w-5 h-5 text-green-500" />
             用户活跃度趋势
           </h3>
           {stats.daily_stats.length > 0 ? (
             <Line
               data={{
                 labels: stats.daily_stats.map(d => d.date),
                 datasets: [
                   {
                     label: '活跃用户数',
                     data: stats.daily_stats.map(d => d.users),
                     borderColor: 'rgb(16, 185, 129)',
                     backgroundColor: 'rgba(16, 185, 129, 0.1)',
                     tension: 0.4,
                     fill: true
                   },
                   {
                     label: '会话数',
                     data: stats.daily_stats.map(d => d.sessions),
                     borderColor: 'rgb(59, 130, 246)',
                     backgroundColor: 'rgba(59, 130, 246, 0.1)',
                     tension: 0.4,
                     fill: true
                   }
                 ]
               }}
               options={{
                 responsive: true,
                 plugins: {
                   legend: {
                     position: 'top' as const,
                   },
                 },
                 scales: {
                   y: {
                     beginAtZero: true
                   }
                 }
               }}
             />
           ) : (
             <div className="text-gray-500 text-center py-8">暂无活跃度数据</div>
           )}
         </div>
       </div>
     );
   }

   // 概览视图
  function renderOverviewView(stats: StatsData) {
    return (
      <div>
        {/* 数据范围和更新时间 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="text-blue-700 font-medium">
                数据范围: {timeRange === 'today' ? '今天' : timeRange === 'week' ? '本周' : timeRange === 'month' ? '本月' : '全部'}
              </span>
            </div>
            <div className="text-blue-600 text-sm">
              最后更新: {new Date().toLocaleString()}
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总用户数</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total_users}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">活跃用户</p>
                <p className="text-2xl font-bold text-green-600">{stats.active_users}</p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总会话数</p>
                <p className="text-2xl font-bold text-purple-600">{stats.total_sessions}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总消息数</p>
                <p className="text-2xl font-bold text-orange-600">{stats.total_messages}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总Token数</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.total_tokens.toLocaleString()}</p>
              </div>
              <Zap className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总花费</p>
                <p className="text-2xl font-bold text-red-600">${stats.total_cost.toFixed(4)}</p>
              </div>
              <Database className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* 热门模型和最近事件 */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              热门模型排行
            </h3>
            {stats.popular_models.length > 0 && stats.popular_models[0].model_name !== '暂无数据' ? (
              <div className="space-y-3">
                {stats.popular_models.slice(0, 5).map((model, index) => (
                  <div key={model.model_name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                      <span className="font-medium">{model.model_name}</span>
                    </div>
                    <span className="bg-blue-100 px-3 py-1 rounded-full text-blue-800 font-semibold">
                      {model.usage_count}次
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-8">暂无模型数据</div>
            )}
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-500" />
              最近事件
            </h3>
            {stats.recent_events.length > 0 && stats.recent_events[0].type !== '暂无事件' ? (
              <div className="space-y-3">
                {stats.recent_events.slice(0, 5).map((event, index) => (
                  <div key={`${event.type}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium">{event.type}</span>
                    </div>
                    <span className="bg-green-100 px-3 py-1 rounded-full text-green-800 font-semibold">
                      {event.count}次
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-8">暂无事件数据</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {!authed ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-white p-8 rounded-lg shadow-md w-96">
            <h2 className="text-2xl font-bold mb-6 text-center">管理后台登录</h2>
            <div className="space-y-4">
              <input
                type="password"
                placeholder="请输入管理密码"
                value={inputPwd}
                onChange={(e) => setInputPwd(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleLogin}
                className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition-colors"
              >
                登录
              </button>
              {error && (
                <div className="text-red-500 text-sm text-center">{error}</div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6">
          {/* 顶部导航 */}
          <div className="bg-white rounded-lg shadow mb-6 p-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={onBack}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                >
                  <ArrowLeft className="w-5 h-5" />
                  返回
                </button>
                <h1 className="text-2xl font-bold text-gray-800">管理后台</h1>
              </div>
              
              {/* 导航标签 */}
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'overview', label: '概览', icon: BarChart3 },
                  { key: 'users', label: '用户管理', icon: Users },
                  { key: 'analytics', label: '数据分析', icon: TrendingUp },
                  { key: 'charts', label: '图表统计', icon: PieChart }
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setViewMode(key as ViewMode)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      viewMode === key
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
              
              {/* 时间范围选择器 */}
              <div className="flex gap-2">
                {[
                  { key: 'today', label: '今天' },
                  { key: 'week', label: '本周' },
                  { key: 'month', label: '本月' },
                  { key: 'all', label: '全部' }
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setTimeRange(key as TimeRange)}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      timeRange === key
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              
              {/* 操作按钮 */}
              <div className="flex gap-2">
                <button
                  onClick={refreshData}
                  disabled={loading}
                  className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  刷新数据
                </button>
              </div>
            </div>
          </div>
          
          {/* 内容区域 */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-lg text-gray-600">加载中...</div>
            </div>
          ) : stats ? (
            <div>
              {viewMode === 'overview' && renderOverviewView(stats)}
               {viewMode === 'users' && renderUsersView(stats)}
               {viewMode === 'analytics' && renderAnalyticsView(stats)}
               {viewMode === 'charts' && renderChartsView(stats)}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-lg text-gray-600 mb-4">暂无数据</div>
              <button
                onClick={refreshData}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
              >
                加载数据
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}