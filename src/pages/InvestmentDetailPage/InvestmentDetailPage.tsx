import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { TrendingUp, ArrowLeft } from 'lucide-react';

import type { IInvestment } from '@/data/investments';
import { loadLiveFeedCache } from '@/hooks/useLiveFeed';
import { Button } from '@/components/ui/button';
import InvestmentInfoSection from './sections/InvestmentInfoSection';
import RelatedInvestmentsSection from './sections/RelatedInvestmentsSection';

export default function InvestmentDetailPage() {
  const { id } = useParams<{ id: string }>();

  const investment = useMemo<IInvestment | undefined>(() => {
    // Search live cache for the item
    const cache = loadLiveFeedCache();
    if (cache?.liveInvestments) {
      const liveItem = cache.liveInvestments.find((item) => item.id === id);
      if (liveItem) {
        return {
          ...liveItem,
          imageUrl: '',
          source: 'live' as const,
        };
      }
    }

    return undefined;
  }, [id]);

  if (!investment) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center space-y-4">
        <div className="size-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
          <TrendingUp className="size-8" />
        </div>
        <h1 className="text-xl font-bold text-foreground">未找到该投资事件</h1>
        <p className="text-sm text-muted-foreground max-w-sm">
          您查看的投资记录不存在或已被移除，请返回投资事件库浏览最新数据。
        </p>
        <Link to="/investments">
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
      <InvestmentInfoSection investment={investment} />
      <section className="w-full">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <RelatedInvestmentsSection current={investment} />
        </div>
      </section>
    </main>
  );
}
