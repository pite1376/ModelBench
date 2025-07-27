// 这是原始的 App.tsx 文件的备份版本，用于对比新架构的改进
// 新的架构实现请参考 src/components/optimized-demo.tsx

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { useAppStore } from './store';

// 原始的巨大组件（1256行），包含所有功能
export const LegacyApp: React.FC = () => {
  // 这里原本有大量的状态管理、API调用、UI渲染逻辑
  // 所有功能都混在一个组件中，违反了单一职责原则
  
  console.log('Legacy App component rendered'); // 这是300+个console.log之一
  
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          旧版架构（已弃用）
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          这是原始的1256行巨型组件实现，存在以下问题：
        </p>
        <ul className="text-left text-gray-600 max-w-2xl mx-auto mt-4 space-y-2">
          <li>• 单一组件过大（1256行），违反单一职责原则</li>
          <li>• 300+ console.log污染生产环境</li>
          <li>• 缺乏错误边界处理</li>
          <li>• 性能优化缺失（无防抖、节流、虚拟化）</li>
          <li>• 状态管理混乱（665行store）</li>
          <li>• AI服务耦合度高（1019行单文件）</li>
        </ul>
        <div className="mt-8">
          <p className="text-blue-600 font-medium">
            请使用新的优化架构：src/components/optimized-demo.tsx
          </p>
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
};

export default LegacyApp; 