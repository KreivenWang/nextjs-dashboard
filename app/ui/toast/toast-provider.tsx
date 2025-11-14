'use client';

import { Toaster } from 'react-hot-toast';

// 这是一个 Client Component，只渲染一次 Toaster 容器
export function ToastProvider() {
  // 您可以在这里设置全局的 position 和样式
  return <Toaster position="bottom-right" />;
}