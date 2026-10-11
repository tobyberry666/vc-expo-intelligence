import { useMemo } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { TrendingUp, ArrowLeft } from 'lucide-react';

import type { IInvestment } from '@/data/investments';
import { useLiveFeed } from '@/hooks/useLiveFeed';
import { Button } from '@/components/ui/button';
import LiveIndicator from '@/components/LiveIndicator';
import InvestmentInfoSection from './sections/InvestmentInfoSection';
import RelatedInvestmentsSection from './sections/RelatedInvestmentsSection';

export default function InvestmentDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { search } = useLocation();
  const { liveInvestments, isLoading, lastUpdate, error, refresh, resolveItemId } = useLiveFeed();
  const investment = useMemo<IInvestment | undefined>(() => {
    const item = liveInvestments.find((entry) => entry.id === resolveItemId(id ?? '', 'investment'));
    return item ? { ...item, imageUrl: '' } : undefined;
  }, [id, liveInvestments, resolveItemId]);
  if (isLoading && !investment) return <p role="status" className="p-8">正在加载情报…</p>;

  if (!investment) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center space-y-4">
        <div className="size-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
          <TrendingUp className="size-8" />
        </div>
        <h1 className="text-xl font-bold text-foreground">未找到该投资事件</h1>
        <LiveIndicator isLoading={isLoading} lastUpdate={lastUpdate} error={error} onRefresh={refresh} />
        <p className="text-sm text-muted-foreground max-w-sm">
          您查看的投资记录不存在或已被移除，请返回投资事件库浏览最新数据。
        </p>
        <Link to={`/investments${search}`}>
          <Button variant="outline" className="gap-1.5">
            <ArrowLeft className="size-4" />
            返回投资事件库
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <main className="space-y-8 md:space-y-12 py-8 md:py-12">
      <div className="max-w-5xl mx-auto px-4"><LiveIndicator isLoading={isLoading} lastUpdate={lastUpdate} error={error} onRefresh={refresh} /></div>
      <InvestmentInfoSection investment={investment} />
      <section className="w-full">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <RelatedInvestmentsSection current={investment} />
        </div>
      </section>
    </main>
  );
}
