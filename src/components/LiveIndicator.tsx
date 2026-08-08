import { memo } from 'react';
import { RefreshCw, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import type { FeedPhase } from '@/hooks/useLiveFeed';

interface LiveIndicatorProps {
  isLoading: boolean;
  lastUpdate: number | null;
  error: string | null;
  onRefresh: () => void;
  phase?: FeedPhase;
  className?: string;
}

function formatTimeSince(timestamp: number | null): string {
  if (!timestamp) return '';
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  return `${days} 天前`;
}

export default memo(function LiveIndicator({
  isLoading,
  lastUpdate,
  error,
  onRefresh,
  phase,
  className,
}: LiveIndicatorProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border/40 text-xs',
        className
      )}
    >
      {isLoading ? (
        <>
          <RefreshCw className="size-3.5 text-primary animate-spin" />
          <span className="text-primary font-medium">
            {phase === 'searching' ? '正在并行搜索 15 路情报源…'
              : phase === 'extracting' ? '正在 AI 结构化提取…'
              : '正在搜索全网最新情报...'}
          </span>
        </>
      ) : error ? (
        <>
          <WifiOff className="size-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">{error}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs gap-1"
            onClick={onRefresh}
          >
            <RefreshCw className="size-3" />
            重试
          </Button>
        </>
      ) : lastUpdate ? (
        <>
          <Wifi className="size-3.5 text-primary" />
          <span className="text-foreground">
            数据更新于{' '}
            <span className="font-medium text-primary">
              {formatTimeSince(lastUpdate)}
            </span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs gap-1"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className="size-3" />
            刷新
          </Button>
        </>
      ) : (
        <>
          <AlertCircle className="size-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">等待数据加载</span>
        </>
      )}
    </div>
  );
});
