-- 修复Supabase RLS策略，允许匿名用户操作

-- 1. 删除现有的限制性策略
DROP POLICY IF EXISTS "允许所有操作" ON users;
DROP POLICY IF EXISTS "允许所有操作" ON chat_sessions;
DROP POLICY IF EXISTS "允许所有操作" ON messages;
DROP POLICY IF EXISTS "允许所有操作" ON user_settings;
DROP POLICY IF EXISTS "允许所有操作" ON model_usage_stats;
DROP POLICY IF EXISTS "允许所有操作" ON system_stats;
DROP POLICY IF EXISTS "允许所有操作" ON user_subscriptions;
DROP POLICY IF EXISTS "允许所有操作" ON analytics_events;

-- 2. 创建更宽松的策略，允许匿名用户完全访问
CREATE POLICY "Enable all access for anon users" ON users
    FOR ALL 
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all access for anon users" ON chat_sessions
    FOR ALL 
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all access for anon users" ON messages
    FOR ALL 
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all access for anon users" ON user_settings
    FOR ALL 
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all access for anon users" ON model_usage_stats
    FOR ALL 
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all access for anon users" ON system_stats
    FOR ALL 
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all access for anon users" ON user_subscriptions
    FOR ALL 
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all access for anon users" ON analytics_events
    FOR ALL 
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 3. 确保anon角色有必要的权限
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 4. 验证策略是否生效
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('users', 'chat_sessions', 'messages', 'analytics_events')
ORDER BY tablename, policyname; 