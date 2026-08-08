import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Brain, Loader2, TrendingUp, Calendar, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import LiveIndicator from '@/components/LiveIndicator';

interface AiIntelligenceSectionProps {
  fullSummary: string;
  isLoading: boolean;
  lastUpdate: number | null;
  error: string | null;
  onRefresh: () => void;
  liveInvestmentCount: number;
  liveExpoCount: number;
}

export default memo(function AiIntelligenceSection({
  fullSummary,
  isLoading,
  lastUpdate,
  error,
  onRefresh,
  liveInvestmentCount,
  liveExpoCount,
}: AiIntelligenceSectionProps) {
  const hasData = fullSummary.length > 0;

  const investmentSection = useMemo(() => {
    if (!fullSummary) return '';
    return extractByKeywords(fullSummary, ['投资', '融资', 'PE/VC', '轮']);
  }, [fullSummary]);

  const expoSection = useMemo(() => {
    if (!fullSummary) return '';
    return extractByKeywords(fullSummary, ['展会', '参展', 'CES', 'MWC', 'WAIC', '展商']);
  }, [fullSummary]);

  return (
    <section className="w-full py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Brain className="size-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                AI 实时情报
                <Badge variant="outline" className="text-primary border-primary/30 text-xs">
                  <Sparkles className="size-3 mr-1" />
                  LIVE
                </Badge>
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                AI 全网搜索最新创投与展会动态
              </p>
            </div>
          </div>
          <LiveIndicator
            isLoading={isLoading}
            lastUpdate={lastUpdate}
            error={error}
            onRefresh={onRefresh}
          />
        </div>

        {/* Loading skeleton */}
        {isLoading && !hasData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-border/40 bg-card/60">
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
            <Card className="border-border/40 bg-card/60">
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Content */}
        {hasData && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            {/* Investment Intelligence */}
            <Card className="border-border/40 bg-card/60 overflow-hidden">
              <CardHeader className="pb-3 border-b border-border/20">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="size-4 text-primary" />
                  投资动态情报
                  {liveInvestmentCount > 0 && (
                    <Badge variant="secondary" className="text-xs tabular-nums">
                      {liveInvestmentCount} 条
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {investmentSection || fullSummary.slice(0, 2000)}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>

            {/* Expo Intelligence */}
            <Card className="border-border/40 bg-card/60 overflow-hidden">
              <CardHeader className="pb-3 border-b border-border/20">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="size-4 text-primary" />
                  科技展会情报
                  {liveExpoCount > 0 && (
                    <Badge variant="secondary" className="text-xs tabular-nums">
                      {liveExpoCount} 条
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {expoSection || '暂无展会相关情报'}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Streaming indicator — show while loading AND has partial data */}
        {isLoading && hasData && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin text-primary" />
            正在接收更多情报...
          </div>
        )}
      </div>
    </section>
  );
});

function extractByKeywords(text: string, keywords: string[]): string {
  const lines = text.split('\n');
  const relevant: string[] = [];
  let collecting = false;

  for (const line of lines) {
    const hasKw = keywords.some((k) => line.includes(k));
    if (hasKw && /^#{1,3}\s/.test(line)) {
      collecting = true;
    }
    if (collecting && /^#{1,3}\s/.test(line) && !keywords.some((k) => line.includes(k))) {
      break;
    }
    if (collecting) {
      relevant.push(line);
    }
  }

  return relevant.length > 0 ? relevant.join('\n') : '';
}
