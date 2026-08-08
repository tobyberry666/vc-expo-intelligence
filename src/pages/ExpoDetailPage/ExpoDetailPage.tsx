import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';

import type { IExpo } from '@/data/expos';
import { loadLiveFeedCache } from '@/hooks/useLiveFeed';
import { Button } from '@/components/ui/button';
import ExpoInfoSection from './sections/ExpoInfoSection';
import ExhibitorTableSection from './sections/ExhibitorTableSection';

export default function ExpoDetailPage() {
  const { id } = useParams<{ id: string }>();

  const expo = useMemo<IExpo | undefined>(() => {
    // Search live cache for the item
    const cache = loadLiveFeedCache();
    if (cache?.liveExpos) {
      const liveItem = cache.liveExpos.find((e) => e.id === id);
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
                <p className="text-muted-foreground text-sm">
                  该展会信息可能已下架或链接无效
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <Link to="/expos">
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
          <ExpoInfoSection expo={expo} />
          <ExhibitorTableSection expoId={expo.id} />
        </div>
      </section>
    </div>
  );
}
