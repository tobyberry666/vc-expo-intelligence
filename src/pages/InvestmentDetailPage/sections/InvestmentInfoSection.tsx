import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Building2,
  Calendar,
  DollarSign,
  Layers,
  MapPin,
  Star,
  TrendingUp,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useFavorites } from '@/hooks/useFavorites';
import type { IInvestment } from '@/data/investments';

interface InvestmentInfoSectionProps {
  investment: IInvestment;
}

export default function InvestmentInfoSection({ investment }: InvestmentInfoSectionProps) {
  const navigate = useNavigate();
  const { isFavorited, toggleFavorite } = useFavorites();
  const favorited = isFavorited(investment.id, 'investment');

  const infoItems = [
    { icon: Building2, label: '投资机构', value: investment.institution },
    { icon: Layers, label: '所属赛道', value: investment.sector },
    { icon: TrendingUp, label: '融资轮次', value: investment.round },
    { icon: DollarSign, label: '融资金额', value: investment.amount },
    { icon: Calendar, label: '投资日期', value: investment.date },
    { icon: MapPin, label: '信息来源', value: '全球创投情报库' },
  ];

  return (
    <section className="w-full">
      <div className="max-w-5xl mx-auto px-4 md:px-6 space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">情报概览</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/investments">投资事件</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{investment.company}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          返回列表
        </Button>

        {/* Hero card */}
        <Card className="overflow-hidden border-border/40 bg-card/60 backdrop-blur">
          <CardHeader className="pb-4 space-y-4">
            <div className="flex items-start justify-between gap-4 min-w-0">
              <div className="flex items-start gap-4 min-w-0 flex-1">
                {/* Company icon */}
                <div className="size-14 shrink-0 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                  <Sparkles className="size-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground truncate">
                    {investment.company}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge variant="default" className="bg-primary text-primary-foreground">
                      {investment.institution}
                    </Badge>
                    <Badge variant="secondary">{investment.sector}</Badge>
                    <Badge variant="outline">{investment.round}</Badge>
                  </div>
                </div>
              </div>

              <Button
                variant={favorited ? 'default' : 'outline'}
                size="icon"
                className="shrink-0 size-10"
                onClick={() => toggleFavorite(investment.id, 'investment')}
                aria-label={favorited ? '取消收藏' : '收藏'}
              >
                <Star
                  className={`size-4 ${favorited ? 'fill-current' : ''}`}
                />
              </Button>
            </div>
          </CardHeader>

          <Separator className="bg-border/40" />

          <CardContent className="pt-6 space-y-6">
            {/* Info grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {infoItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex items-start gap-3 p-4 rounded-lg bg-muted/40 border border-border/30"
                  >
                    <div className="size-9 shrink-0 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground mb-0.5">{item.label}</p>
                      <p className={`text-sm font-semibold truncate ${item.value === '未披露' ? 'text-muted-foreground italic' : 'text-foreground'}`}>
                        {item.value}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="size-1 rounded-full bg-primary" />
                企业概述
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed pl-4">
                {investment.summary}
              </p>
            </div>

            {/* Action bar */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Button
                variant="default"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  window.open(`https://www.bing.com/search?q=${encodeURIComponent(investment.company)}`, '_blank', 'noopener,noreferrer');
                }}
              >
                <ExternalLink className="size-3.5" />
                搜索企业
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  toggleFavorite(investment.id, 'investment');
                  const nowFav = !isFavorited(investment.id, 'investment');
                  toast.success(nowFav ? `已开启跟踪「${investment.company}」` : `已取消跟踪「${investment.company}」`);
                }}
              >
                <TrendingUp className="size-3.5" />
                {isFavorited(investment.id, 'investment') ? '取消跟踪' : '跟踪动态'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
