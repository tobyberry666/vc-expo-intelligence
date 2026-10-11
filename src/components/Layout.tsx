import { Outlet } from 'react-router-dom';
import Header from '@/components/Header';
import { Toaster } from 'sonner';
import { publicFeed } from '@/infrastructure/runtime';

export const Layout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <p
        className="max-w-7xl mx-auto px-4 py-2 text-xs text-muted-foreground"
        role="note"
      >
        {publicFeed
          ? '每小时采集公开来源，页面每 5 分钟检查新快照；日期为报道日期，数据不代表全市场。'
          : '平台 AI 检索结果需核验，未知字段不推测。'}
        收藏仅保存在当前浏览器。
      </p>
      <main className="w-full">
        <Outlet />
      </main>
      <Toaster theme="dark" richColors />
    </div>
  );
};
