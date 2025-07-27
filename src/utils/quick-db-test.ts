import { supabase } from '@/lib/supabaseClient';

// 快速数据库测试工具
export const quickDBTest = async () => {
  console.log('🔍 开始快速数据库测试...');
  
  // 测试1：基础连接
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact' })
      .limit(1);
    
    if (error) {
      console.error('❌ 数据库连接失败:', error);
      if (error.message?.includes('relation "users" does not exist')) {
        console.log('📋 请执行以下步骤：');
        console.log('1. 打开 https://supabase.com/dashboard/projects');
        console.log('2. 选择您的项目');
        console.log('3. 进入 SQL Editor');
        console.log('4. 执行 supabase-schema.sql 文件中的所有SQL代码');
        return false;
      }
    } else {
      console.log('✅ 数据库连接成功!');
      return true;
    }
  } catch (err: any) {
    console.error('❌ 连接测试异常:', err);
    return false;
  }
};

// 在全局暴露快速测试函数
if (typeof window !== 'undefined') {
  (window as any).__quickDBTest = quickDBTest;
  console.log('💡 在控制台运行 __quickDBTest() 可快速测试数据库连接');
} 