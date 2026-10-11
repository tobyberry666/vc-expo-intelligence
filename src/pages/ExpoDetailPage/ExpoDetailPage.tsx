import { useMemo } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';

import type { IExpo } from '@/data/expos';
import { useLiveFeed } from '@/hooks/useLiveFeed';
import { Button } from '@/components/ui/button';
import LiveIndicator from '@/components/LiveIndicator';
import ExpoInfoSection from './sections/ExpoInfoSection';
import ExhibitorTableSection from './sections/ExhibitorTableSection';

export default function ExpoDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { search } = useLocation();
  const { liveExpos, isLoading, lastUpdate, error, refresh, resolveItemId } = useLiveFeed();
  const expo = useMemo<IExpo | undefined>(() => {
    const item = liveExpos.find((entry) => entry.id === resolveItemId(id ?? '', 'expo'));
    return item ? { ...item, imageUrl: '' } : undefined;
  }, [id, liveExpos, resolveItemId]);
  if (isLoading && !expo) return <p role="status" className="p-8">正在加载情报…</p>;

  if (!expo) {
    return (
      <div className="py-20 md:py-32">
        <section className="w-full">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center text-center space-y-6 py-16">
              <div className="size-16 rounded-2xl bg-muted flex items-center justify-center">
                <Calendar className="size-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-foreground">展会未找到</h2>
        <LiveIndicator isLoading={isLoading} lastUpdate={lastUpdate} error={error} onRefresh={refresh} />
                <p className="text-muted-foreground text-sm">
                  该展会信息可能已下架或链接无效
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <Link to={`/expos${search}`}>
                  <ArrowLeft className="size-4" />
                  返回展会列表
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="py-8 md:py-12">
      <section className="w-full">
        <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-8">
          <LiveIndicator isLoading={isLoading} lastUpdate={lastUpdate} error={error} onRefresh={refresh} />
          <ExpoInfoSection expo={expo} />
          <ExhibitorTableSection key={expo.id} expo={expo} />
        </div>
      </section>
    </div>
  );
}
