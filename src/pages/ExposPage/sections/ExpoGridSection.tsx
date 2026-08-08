import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarDays, MapPin, Users, ArrowRight, CalendarClock, Sparkles } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import type { IExpo } from '@/data/expos';

interface ExpoGridSectionProps {
  expos: IExpo[];
}

const TYPE_LABEL: Record<IExpo['type'], string> = {
  consumer: '消费电子',
  ai: '人工智能',
  auto: '汽车科技',
  industrial: '工业制造',
};

const TYPE_VARIANT: Record<IExpo['type'], 'default' | 'secondary' | 'outline' | 'destructive'> = {
  consumer: 'default',
  ai: 'secondary',
  auto: 'outline',
  industrial: 'outline',
};

const EASE = [0.16, 1, 0.3, 1] as const;

function ExpoGridSection({ expos }: ExpoGridSectionProps) {
  const navigate = useNavigate();

  if (expos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <CalendarClock className="size-12 mb-3 opacity-40" />
        <p className="text-sm">没有匹配的展会信息</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {expos.map((expo, i) => (
        <motion.div
          key={expo.id}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: i * 0.06, ease: EASE }}
        >
          <Card
            className="group overflow-hidden border-border/40 bg-card/60 hover:bg-card/80 hover-elevate transition-colors cursor-pointer"
            onClick={() => navigate(`/expos/${expo.id}`)}
          >
            {/* Cover image */}
            <div className="relative aspect-[16/9] overflow-hidden bg-muted">
              {expo.imageUrl ? (
                <Image
                  src={expo.imageUrl}
                  alt={expo.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 via-muted to-secondary/20">
                  <CalendarDays className="size-10 text-muted-foreground/30" />
                </div>
              )}
              {/* Type badge + AI live badge */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <Badge variant={TYPE_VARIANT[expo.type]} className="text-xs">
                  {TYPE_LABEL[expo.type]}
                </Badge>
                {(expo.source === 'live' || expo.id.startsWith('live-')) && (
                  <Badge variant="outline" className="bg-background/70 backdrop-blur-sm text-xs text-primary border-primary/30 gap-0.5">
                    <Sparkles className="size-2" />
                    AI实时
                  </Badge>
                )}
              </div>
              {/* Exhibitor count badge */}
              <div className="absolute top-3 right-3">
                <Badge variant="outline" className="bg-background/70 backdrop-blur-sm text-xs gap-1">
                  <Users className="size-3" />
                  {expo.chineseExhibitorCount} 家中国企业
                </Badge>
              </div>
            </div>

            {/* Card body */}
            <CardContent className="p-4 space-y-2.5">
              <h3 className="text-base font-semibold text-foreground truncate">{expo.name}</h3>

              <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">
                {expo.description}
              </p>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CalendarDays className="size-3.5 shrink-0" />
                  {expo.startDate}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5 shrink-0" />
                  {expo.location}
                </span>
              </div>

              <div className="pt-1 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {expo.endDate && expo.endDate !== expo.startDate
                    ? `${expo.startDate} — ${expo.endDate}`
                    : expo.startDate}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  查看详情
                  <ArrowRight className="size-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

export default memo(ExpoGridSection);
