import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Star, TrendingUp, Building2, Calendar, Banknote, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { IInvestment } from '@/data/investments';

interface InvestmentTimelineSectionProps {
  investments: IInvestment[];
  isFavorited: (id: string, type: 'investment') => boolean;
  toggleFavorite: (id: string, type: 'investment') => void;
}

interface IGroup {
  monthKey: string;
  monthLabel: string;
  items: IInvestment[];
}

const SECTOR_VARIANT: Record<string, 'default' | 'outline' | 'secondary'> = {
  '人工智能': 'default',
  '大模型': 'default',
  'AI基础设施': 'default',
};

function getSectorVariant(sector: string): 'default' | 'outline' | 'secondary' {
  return SECTOR_VARIANT[sector] ?? 'outline';
}

export default function InvestmentTimelineSection({
  investments,
  isFavorited,
  toggleFavorite,
}: InvestmentTimelineSectionProps) {
  const navigate = useNavigate();

  const groups = useMemo<IGroup[]>(() => {
    const map = new Map<string, IInvestment[]>();
    for (const inv of investments) {
      const key = inv.date === '未披露' ? '未披露' : inv.date.slice(0, 7); // YYYY-MM
      const arr = map.get(key);
      if (arr) arr.push(inv);
      else map.set(key, [inv]);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => {
        // Push '未披露' group to the end
        if (a === '未披露') return 1;
        if (b === '未披露') return -1;
        return a > b ? -1 : 1;
      })
      .map(([monthKey, items]) => {
        const monthLabel = monthKey === '未披露'
          ? '日期未知'
          : format(parseISO(`${monthKey}-01`), 'yyyy年M月', { locale: zhCN });
        return { monthKey, monthLabel, items };
      });
  }, [investments]);

  if (investments.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <TrendingUp className="size-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">暂无匹配的投资事件</p>
          <p className="text-xs text-muted-foreground mt-1">尝试调整筛选条件以查看更多结果</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative space-y-8">
      {groups.map((group, gi) => (
        <motion.div
          key={group.monthKey}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.45, delay: gi * 0.04, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4"
        >
          {/* Month Header */}
          <div className="flex items-center gap-3 sticky top-16 z-10 py-2 bg-background/80 backdrop-blur-sm">
            <div className="size-3 rounded-full bg-primary ring-4 ring-primary/20 shrink-0" />
            <h3 className="text-sm font-semibold text-foreground tracking-wide">
              {group.monthLabel}
            </h3>
            <div className="flex-1 h-px bg-border/50" />
            <Badge variant="outline" className="text-xs shrink-0">
              {group.items.length} 笔交易
            </Badge>
          </div>

          {/* Timeline Items */}
          <div className="relative pl-[22px] border-l-2 border-border/40 ml-1.5 space-y-3">
            {group.items.map((inv, ii) => {
              const favorited = isFavorited(inv.id, 'investment');
              return (
                <motion.div
                  key={inv.id}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: ii * 0.03 }}
                  className="relative"
                >
                  {/* Timeline dot */}
                  <div className="absolute -left-[27px] top-5 size-2 rounded-full bg-muted-foreground/60 border-2 border-background" />

                  <Card
                    className={cn(
                      'group cursor-pointer border-border/50 hover:border-primary/40 transition-colors',
                      favorited && 'border-primary/30'
                    )}
                    onClick={() => navigate(`/investments/${inv.id}`)}
                  >
                    <CardContent className="p-4 md:p-5">
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Icon */}
                        <div className="shrink-0 size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                          <TrendingUp className="size-5" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start justify-between gap-3 min-w-0">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                  {inv.company}
                                </h4>
                                {(inv.source === 'live' || inv.id.startsWith('live-')) && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-primary border-primary/30 gap-0.5 shrink-0">
                                    <Sparkles className="size-2" />
                                    AI实时
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                {inv.summary}
                              </p>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="shrink-0 size-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(inv.id, 'investment');
                              }}
                              aria-label={favorited ? '取消收藏' : '收藏'}
                            >
                              <Star
                                className={cn(
                                  'size-4 transition-colors',
                                  favorited
                                    ? 'fill-primary text-primary'
                                    : 'text-muted-foreground'
                                )}
                              />
                            </Button>
                          </div>

                          {/* Meta row */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
                            <span className="inline-flex items-center gap-1 text-muted-foreground">
                              <Building2 className="size-3.5 shrink-0" />
                              <span className="truncate max-w-[120px]">{inv.institution}</span>
                            </span>
                            <Badge
                              variant={getSectorVariant(inv.sector)}
                              className="text-[11px] h-5 px-1.5"
                            >
                              {inv.sector}
                            </Badge>
                            <Badge variant="secondary" className="text-[11px] h-5 px-1.5">
                              {inv.round}
                            </Badge>
                            <span className="inline-flex items-center gap-1 text-primary font-medium">
                              <Banknote className="size-3.5 shrink-0" />
                              {inv.amount}
                            </span>
                            <span className="inline-flex items-center gap-1 text-muted-foreground ml-auto">
                              <Calendar className="size-3.5 shrink-0" />
                              {inv.date}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
