import { Outlet } from 'react-router-dom';
import Header from '@/components/Header';
import { Toaster } from 'sonner';

export const Layout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <p
        className="max-w-7xl mx-auto px-4 py-2 text-xs text-muted-foreground"
        role="note"
      >
        AI 检索摘要需核验。按需刷新，浏览器缓存最长 24
        小时；收藏仅保存在当前浏览器。
      </p>
      <main className="w-full">
        <Outlet />
      </main>
      <Toaster theme="dark" richColors />
    </div>
  );
};
