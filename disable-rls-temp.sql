-- 临时禁用RLS进行测试（不推荐用于生产环境）

-- 禁用所有表的RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE model_usage_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events DISABLE ROW LEVEL SECURITY;

-- 验证RLS状态
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('users', 'chat_sessions', 'messages', 'analytics_events')
ORDER BY tablename; 