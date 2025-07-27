import { supabase } from '@/lib/supabaseClient';

// API密钥权限测试工具
export const testAPIPermissions = async () => {
  console.log('🔐 测试API密钥权限...');
  
  try {
    // 测试1：检查当前用户角色
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('当前用户:', user ? '已认证' : '匿名用户');
    
    // 测试2：尝试简单的SELECT操作
    const { data: selectData, error: selectError } = await supabase
      .from('users')
      .select('count', { count: 'exact' })
      .limit(1);
    
    if (selectError) {
      console.error('❌ SELECT权限测试失败:', selectError);
    } else {
      console.log('✅ SELECT权限正常');
    }
    
    // 测试3：尝试INSERT操作
    const testUser = {
      anonymous_id: `test-${Date.now()}`,
      user_type: 'anonymous',
      email_verified: false,
      total_sessions: 0,
      total_messages: 0,
      preferences: {},
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert([testUser])
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ INSERT权限测试失败:', insertError);
      
      // 分析具体错误类型
      if (insertError.message?.includes('row-level security')) {
        console.log('🔒 问题：RLS策略阻止了数据插入');
        console.log('💡 解决方案：执行 fix-rls-policies.sql 或 disable-rls-temp.sql');
      } else if (insertError.message?.includes('401') || insertError.message?.includes('Unauthorized')) {
        console.log('🔑 问题：API密钥权限不足');
        console.log('💡 解决方案：检查Supabase项目设置中的API密钥权限');
      }
      
      return false;
    } else {
      console.log('✅ INSERT权限正常');
      
      // 清理测试数据
      await supabase.from('users').delete().eq('id', insertData.id);
      console.log('🧹 测试数据已清理');
      
      return true;
    }
    
  } catch (error: any) {
    console.error('❌ 权限测试异常:', error);
    return false;
  }
};

// 重新初始化用户（从本地模式切换到云端模式）
export const reinitializeUser = async () => {
  console.log('🔄 重新初始化用户...');
  
  try {
    // 动态导入store
    const { useAppStore } = await import('@/store');
    const { initUser } = useAppStore.getState();
    
    // 强制重新初始化用户
    await initUser();
    
    const { currentUser, cloudSyncStatus } = useAppStore.getState();
    
    if (currentUser && currentUser.id !== 'LOCAL_MODE') {
      console.log('✅ 成功切换到云端模式，用户ID:', currentUser.id);
      console.log('🔄 开始同步数据...');
      
      // 同步数据
      const { syncToCloud, syncFromCloud } = useAppStore.getState();
      await syncToCloud();
      await syncFromCloud();
      
      return true;
    } else {
      console.log('❌ 仍处于本地模式');
      return false;
    }
  } catch (error: any) {
    console.error('❌ 重新初始化失败:', error);
    return false;
  }
};

// 在全局暴露权限测试函数
if (typeof window !== 'undefined') {
  (window as any).__testAPIPermissions = testAPIPermissions;
  (window as any).__reinitializeUser = reinitializeUser;
  console.log('💡 控制台命令:');
  console.log('  __testAPIPermissions() - 测试API权限');
  console.log('  __reinitializeUser() - 重新初始化用户（切换到云端模式）');
} 