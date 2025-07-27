import { getUserById, createUser } from './supabase-db-advanced';

// 导出测试函数，可在浏览器控制台中手动调用
export async function testUserCrud() {
  try {
    console.log('开始测试用户CRUD操作...');
    
    // 创建测试用户
    const user = await createUser({
      anonymous_id: 'test-anon-' + Date.now(),
      user_type: 'anonymous',
      email_verified: false,
      total_sessions: 0,
      total_messages: 0,
      preferences: {},
      created_at: new Date().toISOString(),
      last_active: new Date().toISOString(),
    });
    
    console.log('用户创建成功:', user);
    
    // 获取用户
    const fetched = await getUserById(user.id);
    console.log('用户获取成功:', fetched);
    
    return { success: true, userId: user.id };
  } catch (error) {
    console.error('测试失败:', error);
    return { success: false, error };
  }
}

// 在开发环境下自动暴露测试函数到全局
if (typeof window !== 'undefined') {
  (window as any).testUserCrud = testUserCrud;
} 