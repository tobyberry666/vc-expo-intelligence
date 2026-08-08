import { useMemo, memo } from 'react';
import { Search, Star, RotateCcw, X } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface InvestmentFilterAsideProps {
  institutions: string[];
  sectors: string[];
  selectedInstitutions: string[];
  selectedSectors: string[];
  keyword: string;
  onlyFavorites: boolean;
  favoriteCount: number;
  onInstitutionsChange: (val: string[]) => void;
  onSectorsChange: (val: string[]) => void;
  onKeywordChange: (val: string) => void;
  onOnlyFavoritesChange: (val: boolean) => void;
  onReset: () => void;
}

function FilterGroup({
  title,
  options,
  selected,
  onChange,
}: {
  title: string;
  options: string[];
  selected: string[];
  onChange: (val: string[]) => void;
}) {
  const allSelected = selected.length === options.length && options.length > 0;
  const someSelected = selected.length > 0 && !allSelected;

  const toggleAll = () => {
    onChange(allSelected ? [] : [...options]);
  };

  const toggle = (option: string) => {
    onChange(
      selected.includes(option)
        ? selected.filter((s) => s !== option)
        : [...selected, option]
    );
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
        <button
          type="button"
          onClick={toggleAll}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {allSelected ? '取消全选' : '全选'}
        </button>
      </div>
      <div className="space-y-1">
        {options.map((option) => (
          <label
            key={option}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent/50 transition-colors group"
          >
            <Checkbox
              checked={selected.includes(option)}
              onCheckedChange={() => toggle(option)}
              className="size-3.5"
            />
            <span
              className={`text-sm truncate flex-1 ${
                selected.includes(option)
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground group-hover:text-foreground'
              }`}
            >
              {option}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

const InvestmentFilterAside = memo(function InvestmentFilterAside({
  institutions,
  sectors,
  selectedInstitutions,
  selectedSectors,
  keyword,
  onlyFavorites,
  favoriteCount,
  onInstitutionsChange,
  onSectorsChange,
  onKeywordChange,
  onOnlyFavoritesChange,
  onReset,
}: InvestmentFilterAsideProps) {
  const hasActiveFilters =
    selectedInstitutions.length > 0 ||
    selectedSectors.length > 0 ||
    keyword !== '' ||
    onlyFavorites;

  const activeFilterCount = useMemo(() => {
    let count = selectedInstitutions.length + selectedSectors.length;
    if (keyword) count += 1;
    if (onlyFavorites) count += 1;
    return count;
  }, [selectedInstitutions, selectedSectors, keyword, onlyFavorites]);

  return (
    <Card className="sticky top-20 border-border/40 bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-3 space-y-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <span>筛选条件</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">
                {activeFilterCount}
              </Badge>
            )}
          </CardTitle>
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="size-3 mr-1" />
              重置
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-0">
        {/* 搜索框 */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            placeholder="搜索企业名称..."
            className="bg-background/60 pl-8 pr-8 h-9 text-sm"
          />
          {keyword && (
            <button
              type="button"
              onClick={() => onKeywordChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* 只看收藏 */}
        <label className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10 cursor-pointer hover:bg-primary/10 transition-colors">
          <Checkbox
            checked={onlyFavorites}
            onCheckedChange={(checked) => onOnlyFavoritesChange(!!checked)}
            className="size-3.5"
          />
          <Star
            className={`size-3.5 ${
              onlyFavorites ? 'text-primary fill-primary' : 'text-muted-foreground'
            }`}
          />
          <span className="text-sm font-medium flex-1">只看收藏</span>
          {favoriteCount > 0 && (
            <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 tabular-nums">
              {favoriteCount}
            </Badge>
          )}
        </label>

        <Separator className="bg-border/40" />

        {/* 投资机构筛选 */}
        <FilterGroup
          title="投资机构"
          options={institutions}
          selected={selectedInstitutions}
          onChange={onInstitutionsChange}
        />

        <Separator className="bg-border/40" />

        {/* 赛道筛选 */}
        <FilterGroup
          title="投资赛道"
          options={sectors}
          selected={selectedSectors}
          onChange={onSectorsChange}
        />
      </CardContent>
    </Card>
  );
});

export default InvestmentFilterAside;
