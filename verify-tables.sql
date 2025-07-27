-- 验证所有表是否创建成功
SELECT 
    table_name, 
    table_type,
    is_insertable_into
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'users', 
    'chat_sessions', 
    'messages', 
    'user_settings', 
    'model_usage_stats', 
    'system_stats', 
    'user_subscriptions', 
    'analytics_events'
)
ORDER BY table_name;

-- 查看users表结构
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 检查RLS策略
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('users', 'chat_sessions', 'messages', 'analytics_events')
ORDER BY tablename, policyname; 