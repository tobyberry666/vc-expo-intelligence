import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Star,
  Copy,
  Check,
  Users,
  ChevronRight,
  Globe,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useFavorites } from '@/hooks/useFavorites';
import { IExpo } from '@/data/expos';
import { resolveAppUrl } from '@lark-apaas/client-toolkit-lite';

interface ExpoInfoSectionProps {
  expo: IExpo;
}

const TYPE_LABELS: Record<IExpo['type'], string> = {
  consumer: '消费电子',
  ai: '人工智能',
  auto: '汽车科技',
  industrial: '工业制造',
};

const TYPE_COLORS: Record<IExpo['type'], string> = {
  consumer: 'bg-primary/15 text-primary border-primary/20',
  ai: 'bg-chart-3/15 text-chart-3 border-chart-3/20',
  auto: 'bg-chart-1/15 text-chart-1 border-chart-1/20',
  industrial: 'bg-chart-4/15 text-chart-4 border-chart-4/20',
};

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const sMonth = s.getMonth() + 1;
  const eMonth = e.getMonth() + 1;
  if (sMonth === eMonth) {
    return `${s.getFullYear()}年${sMonth}月${s.getDate()}日 - ${e.getDate()}日`;
  }
  return `${s.getFullYear()}年${sMonth}月${s.getDate()}日 - ${eMonth}月${e.getDate()}日`;
}

function getExpoStatus(startDate: string, endDate: string): { label: string; variant: string } {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (now < start) {
    const diffDays = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return { label: `${diffDays}天后开展`, variant: 'bg-warning/15 text-warning border-warning/20' };
  }
  if (now >= start && now <= end) {
    return { label: '进行中', variant: 'bg-success/15 text-success border-success/20' };
  }
  return { label: '已结束', variant: 'bg-muted text-muted-foreground border-border' };
}

export default function ExpoInfoSection({ expo }: ExpoInfoSectionProps) {
  const { isFavorited, toggleFavorite } = useFavorites();
  const [copied, setCopied] = useState(false);
  const favorited = isFavorited(expo.id, 'expo');
  const status = useMemo(() => getExpoStatus(expo.startDate, expo.endDate), [expo.startDate, expo.endDate]);

  const handleCopyLink = async () => {
    const url = resolveAppUrl(`/expos/${expo.id}`);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('链接已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('复制失败，请手动复制链接');
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link
          to="/expos"
          className="flex items-center gap-1.5 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>科技展会</span>
        </Link>
        <ChevronRight className="size-3.5 shrink-0" />
        <span className="text-foreground font-medium truncate">{expo.name}</span>
      </nav>

      {/* Main Info Card */}
      <Card className="border-border/40 bg-card/80 backdrop-blur-sm overflow-hidden">
        {/* Top accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-primary via-chart-2 to-chart-4" />
        <CardContent className="p-6 md:p-8 space-y-6">
          {/* Title row */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-2 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                  {expo.name}
                </h1>
                <Badge variant="outline" className={`${TYPE_COLORS[expo.type]} border text-xs shrink-0`}>
                  {TYPE_LABELS[expo.type]}
                </Badge>
                <Badge variant="outline" className={`${status.variant} border text-xs shrink-0`}>
                  {status.label}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                {expo.description}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant={favorited ? 'default' : 'outline'}
                size="sm"
                className="gap-1.5"
                onClick={() => toggleFavorite(expo.id, 'expo')}
              >
                <Star className={`size-4 ${favorited ? 'fill-current' : ''}`} />
                {favorited ? '已收藏' : '收藏'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleCopyLink}
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? '已复制' : '分享'}
              </Button>
            </div>
          </div>

          <Separator className="bg-border/40" />

          {/* Detail grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
              <div className="size-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <CalendarDays className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">展会时间</p>
                <p className="text-sm font-medium text-foreground leading-snug">
                  {formatDateRange(expo.startDate, expo.endDate)}
                </p>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
              <div className="size-9 rounded-md bg-chart-1/10 text-chart-1 flex items-center justify-center shrink-0">
                <MapPin className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">展会地点</p>
                <p className="text-sm font-medium text-foreground truncate">{expo.location}</p>
              </div>
            </div>

            {/* Exhibitor count */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
              <div className="size-9 rounded-md bg-chart-3/10 text-chart-3 flex items-center justify-center shrink-0">
                <Users className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">中国参展企业</p>
                <p className="text-sm font-medium text-foreground">
                  <span className="text-lg font-bold tabular-nums">{expo.chineseExhibitorCount}</span> 家
                </p>
              </div>
            </div>

            {/* Type */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
              <div className="size-9 rounded-md bg-chart-5/10 text-chart-5 flex items-center justify-center shrink-0">
                <Globe className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">展会类型</p>
                <p className="text-sm font-medium text-foreground">{TYPE_LABELS[expo.type]}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
