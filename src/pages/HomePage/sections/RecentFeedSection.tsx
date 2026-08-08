import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp, MapPin, Building2, Star, Loader2, Sparkles } from 'lucide-react';
import { type LiveInvestmentItem, type LiveExpoItem } from '@/hooks/useLiveFeed';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFavorites } from '@/hooks/useFavorites';

interface FeedItem {
  id: string;
  type: 'investment' | 'expo';
  title: string;
  subtitle: string;
  date: string;
  tag: string;
  tagVariant: 'default' | 'secondary';
  isLive: boolean;
}

interface RecentFeedSectionProps {
  liveInvestments: LiveInvestmentItem[];
  liveExpos: LiveExpoItem[];
  isLiveLoading: boolean;
  hasLiveData: boolean;
}

export default function RecentFeedSection({
  liveInvestments,
  liveExpos,
  isLiveLoading,
  hasLiveData,
}: RecentFeedSectionProps) {
  const navigate = useNavigate();
  const { isFavorited, toggleFavorite } = useFavorites();

  const feedItems = useMemo<FeedItem[]>(() => {
    const liveInvItems: FeedItem[] = liveInvestments.map((inv) => ({
      id: `live-inv-${inv.id}`,
      type: 'investment' as const,
      title: `${inv.company} 完成 ${inv.round} 融资`,
      subtitle: `${inv.institution} · ${inv.amount}`,
      date: inv.date,
      tag: inv.sector,
      tagVariant: 'default' as const,
      isLive: true,
    }));

    const liveExpoItems: FeedItem[] = liveExpos.map((exp) => ({
      id: `live-expo-${exp.id}`,
      type: 'expo' as const,
      title: exp.name,
      subtitle: `${exp.chineseExhibitorCount} 家中国企业参展`,
      date: exp.startDate,
      tag: exp.location,
      tagVariant: 'secondary' as const,
      isLive: true,
    }));

    return [...liveInvItems, ...liveExpoItems].sort((a, b) => {
      const aValid = a.date !== '未披露';
      const bValid = b.date !== '未披露';
      if (!aValid && bValid) return 1;
      if (aValid && !bValid) return -1;
      if (!aValid && !bValid) return 0;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [liveInvestments, liveExpos]);

  if (!hasLiveData && !isLiveLoading && feedItems.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">最新动态</h2>
            <p className="text-sm text-muted-foreground mt-1">
              实时追踪全球创投与科技展会动态
            </p>
          </div>
          {isLiveLoading && (
            <span className="inline-flex items-center gap-1.5 text-xs text-primary">
              <Loader2 className="size-3.5 animate-spin" />
              搜索中
            </span>
          )}
        </div>

        <div className="space-y-3">
          {feedItems.map((item, i) => {
            const favId = item.id.replace(/^(live-inv-|live-expo-)/, '');
            const favType = item.type;
            const isFav = isFavorited(favId, favType);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.3), ease: [0.16, 1, 0.3, 1] as const }}
              >
                <Card
                  className="group relative overflow-hidden border-border/40 bg-card/50 hover:bg-card/80 hover:border-border transition-all cursor-pointer"
                  onClick={() => {
                    if (item.type === 'investment') {
                      navigate(`/investments/${favId}`);
                    } else {
                      navigate(`/expos/${favId}`);
                    }
                  }}
                >
                  <div className="p-4 md:p-5 flex items-start gap-4">
                    <div className="shrink-0 size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      {item.type === 'investment' ? (
                        <TrendingUp className="size-5" />
                      ) : (
                        <Calendar className="size-5" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                          {item.title}
                        </h3>
                        <Badge variant={item.tagVariant} className="shrink-0 text-xs">
                          {item.tag}
                        </Badge>
                        {item.isLive && (
                          <Badge variant="outline" className="shrink-0 text-xs text-primary border-primary/30 gap-0.5">
                            <Sparkles className="size-2.5" />
                            AI实时
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          {item.type === 'investment' ? (
                            <Building2 className="size-3.5" />
                          ) : (
                            <MapPin className="size-3.5" />
                          )}
                          {item.subtitle}
                        </span>
                        <span className="text-xs tabular-nums">{item.date}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="shrink-0 p-2 rounded-lg hover:bg-accent/50 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(favId, favType);
                      }}
                      aria-label={isFav ? '取消收藏' : '收藏'}
                    >
                      <Star
                        className={`size-4 transition-colors ${
                          isFav ? 'fill-primary text-primary' : 'text-muted-foreground'
                        }`}
                      />
                    </button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
