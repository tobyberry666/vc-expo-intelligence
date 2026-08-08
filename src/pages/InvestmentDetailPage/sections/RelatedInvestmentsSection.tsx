import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Star, Building2, Layers, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { loadLiveFeedCache } from '@/hooks/useLiveFeed';
import type { IInvestment } from '@/data/investments';
import { useFavorites } from '@/hooks/useFavorites';

interface RelatedInvestmentsSectionProps {
  current: IInvestment;
}

export default function RelatedInvestmentsSection({ current }: RelatedInvestmentsSectionProps) {
  const { isFavorited, toggleFavorite } = useFavorites();

  const related = useMemo(() => {
    const cache = loadLiveFeedCache();
    if (!cache?.liveInvestments) return [];

    return cache.liveInvestments
      .filter(
        (item) =>
          item.id !== current.id &&
          (item.institution === current.institution || item.sector === current.sector)
      )
      .map((item) => ({
        ...item,
        imageUrl: '',
        source: 'live' as const,
        matchType:
          item.institution === current.institution && item.sector === current.sector
            ? 'both'
            : item.institution === current.institution
              ? 'institution'
              : 'sector',
      }))
      .sort((a, b) => {
        if (a.matchType === 'both' && b.matchType !== 'both') return -1;
        if (b.matchType === 'both' && a.matchType !== 'both') return 1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      })
      .slice(0, 5);
  }, [current]);

  if (related.length === 0) {
    return null;
  }

  const matchLabel = (type: string) => {
    switch (type) {
      case 'both':
        return '同机构 · 同赛道';
      case 'institution':
        return '同机构';
      default:
        return '同赛道';
    }
  };

  return (
    <Card className="border-border/40 bg-card/60">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-4 text-primary" />
          <CardTitle className="text-lg">相关投资</CardTitle>
          <Badge variant="outline" className="ml-auto text-xs">
            {related.length} 条
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {related.map((item) => (
          <div
            key={item.id}
            className="group relative rounded-xl border border-border/30 bg-muted/20 p-4 transition-colors hover:border-primary/30 hover:bg-muted/40"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <Link
                    to={`/investments/${item.id}`}
                    className="text-base font-semibold text-foreground hover:text-primary transition-colors truncate"
                  >
                    {item.company}
                  </Link>
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    {matchLabel(item.matchType)}
                  </Badge>
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    {item.round}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Building2 className="size-3" />
                    {item.institution}
                  </span>
                  <span className="flex items-center gap-1">
                    <Layers className="size-3" />
                    {item.sector}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3" />
                    {item.date}
                  </span>
                  <span className="text-primary font-medium">{item.amount}</span>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="shrink-0 size-8"
                onClick={() => toggleFavorite(item.id, 'investment')}
                aria-label={isFavorited(item.id, 'investment') ? '取消收藏' : '收藏'}
              >
                <Star
                  className={`size-4 ${
                    isFavorited(item.id, 'investment')
                      ? 'fill-primary text-primary'
                      : 'text-muted-foreground'
                  }`}
                />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
