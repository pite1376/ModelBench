import { supabase } from '@/lib/supabaseClient';

// 通用查询
export const fetchFromTable = async <T>(table: string, filters: Record<string, any> = {}) => {
  let query = supabase.from(table).select('*');
  Object.entries(filters).forEach(([key, value]) => {
    query = query.eq(key, value);
  });
  const { data, error } = await query;
  if (error) throw error;
  return data as T[];
};

// 插入数据
export const insertToTable = async <T>(table: string, values: Partial<T>) => {
  const { data, error } = await supabase.from(table).insert([values]).select();
  if (error) throw error;
  return data as T[];
};

// 更新数据
export const updateTable = async <T>(table: string, id: string, values: Partial<T>) => {
  const { data, error } = await supabase.from(table).update(values).eq('id', id).select();
  if (error) throw error;
  return data as T[];
};

// 删除数据
export const deleteFromTable = async (table: string, id: string) => {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
  return true;
}; 