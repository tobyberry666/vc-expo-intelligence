import { useMemo } from 'react';
import { Search, RotateCcw, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { IExpo } from '@/data/expos';

interface ExpoFilterAsideProps {
  /** 展会数据（用于提取筛选项） */
  expos: IExpo[];
  /** 关键词 */
  keyword: string;
  onKeywordChange: (v: string) => void;
  /** 展会类型筛选（多选） */
  selectedTypes: string[];
  onSelectedTypesChange: (v: string[]) => void;
  /** 地区筛选 */
  location: string;
  onLocationChange: (v: string) => void;
  /** 排序方式 */
  sortBy: string;
  onSortByChange: (v: string) => void;
  /** 只看收藏 */
  onlyFavorites: boolean;
  onOnlyFavoritesChange: (v: boolean) => void;
  /** 收藏数量 */
  favoriteCount: number;
  /** 重置 */
  onReset: () => void;
  /** 当前结果数 */
  resultCount: number;
}

const EXPO_TYPE_OPTIONS = [
  { value: 'consumer', label: '消费电子', color: 'bg-primary/15 text-primary' },
  { value: 'ai', label: '人工智能', color: 'bg-info/15 text-info' },
  { value: 'auto', label: '汽车科技', color: 'bg-success/15 text-success' },
  { value: 'industrial', label: '工业制造', color: 'bg-warning/15 text-warning' },
] as const;

export default function ExpoFilterAside({
  expos,
  keyword,
  onKeywordChange,
  selectedTypes,
  onSelectedTypesChange,
  location,
  onLocationChange,
  sortBy,
  onSortByChange,
  onlyFavorites,
  onOnlyFavoritesChange,
  favoriteCount,
  onReset,
  resultCount,
}: ExpoFilterAsideProps) {
  const locations = useMemo(() => {
    const set = new Set(expos.map((e) => e.location));
    return Array.from(set).sort();
  }, [expos]);

  const hasActiveFilter =
    keyword !== '' ||
    selectedTypes.length > 0 ||
    location !== 'all' ||
    sortBy !== 'date_desc' ||
    onlyFavorites;

  const handleTypeToggle = (type: string) => {
    if (selectedTypes.includes(type)) {
      onSelectedTypesChange(selectedTypes.filter((t) => t !== type));
    } else {
      onSelectedTypesChange([...selectedTypes, type]);
    }
  };

  return (
    <aside className="w-full lg:w-72 shrink-0 space-y-6">
      {/* 搜索框 */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
          placeholder="搜索展会名称..."
          className="pl-9 bg-card/50 border-border/50"
        />
      </div>

      {/* 结果统计 + 重置 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="size-3.5" />
          <span>
            共 <span className="font-semibold text-foreground">{resultCount}</span> 个展会
          </span>
        </div>
        {hasActiveFilter && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground"
            onClick={onReset}
          >
            <RotateCcw className="size-3 mr-1" />
            重置
          </Button>
        )}
      </div>

      <Separator className="bg-border/40" />

      {/* 展会类型 */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          展会类型
        </h3>
        <div className="space-y-2">
          {EXPO_TYPE_OPTIONS.map((opt) => {
            const checked = selectedTypes.includes(opt.value);
            return (
              <label
                key={opt.value}
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => handleTypeToggle(opt.value)}
                />
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs font-medium border-none transition-colors',
                    checked ? opt.color : 'bg-muted/30 text-muted-foreground'
                  )}
                >
                  {opt.label}
                </Badge>
              </label>
            );
          })}
        </div>
      </div>

      <Separator className="bg-border/40" />

      {/* 地区 */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          举办地区
        </h3>
        <Select value={location} onValueChange={onLocationChange}>
          <SelectTrigger className="bg-card/50 border-border/50">
            <SelectValue placeholder="全部地区" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部地区</SelectItem>
            {locations.map((loc) => (
              <SelectItem key={loc} value={loc}>
                {loc}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator className="bg-border/40" />

      {/* 排序 */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          排序方式
        </h3>
        <Select value={sortBy} onValueChange={onSortByChange}>
          <SelectTrigger className="bg-card/50 border-border/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date_desc">开始时间 (最新)</SelectItem>
            <SelectItem value="date_asc">开始时间 (最早)</SelectItem>
            <SelectItem value="exhibitor_desc">参展企业数 (多→少)</SelectItem>
            <SelectItem value="name_asc">展会名称 (A→Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator className="bg-border/40" />

      {/* 收藏筛选 */}
      <div className="space-y-3">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <Checkbox
            checked={onlyFavorites}
            onCheckedChange={(v) => onOnlyFavoritesChange(v === true)}
          />
          <span className="text-sm text-foreground font-medium">只看收藏</span>
          {favoriteCount > 0 && (
            <Badge variant="outline" className="ml-auto text-xs bg-primary/10 text-primary border-primary/20">
              {favoriteCount}
            </Badge>
          )}
        </label>
      </div>
    </aside>
  );
}
