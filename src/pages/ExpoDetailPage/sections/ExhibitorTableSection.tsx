import { useMemo, useState } from 'react';
import { Building2, Search, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { loadLiveFeedCache } from '@/hooks/useLiveFeed';

interface ExhibitorTableSectionProps {
  expoId: string;
}

const PAGE_SIZE = 8;

export default function ExhibitorTableSection({ expoId }: ExhibitorTableSectionProps) {
  const [keyword, setKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { expo, exhibitors } = useMemo(() => {
    const cache = loadLiveFeedCache();
    if (!cache?.liveExpos) return { expo: null, exhibitors: [] };
    const found = cache.liveExpos.find((e) => e.id === expoId);
    if (!found) return { expo: null, exhibitors: [] };
    return {
      expo: found,
      exhibitors: found.exhibitors ?? [],
    };
  }, [expoId]);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return exhibitors;
    return exhibitors.filter((name) => name.toLowerCase().includes(kw));
  }, [exhibitors, keyword]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paged = filtered.slice((safeCurrentPage - 1) * PAGE_SIZE, safeCurrentPage * PAGE_SIZE);

  const handleSearch = (value: string) => {
    setKeyword(value);
    setCurrentPage(1);
  };

  const exhibitorCount = expo?.chineseExhibitorCount ?? 0;

  return (
    <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="size-5 text-primary" />
            中国参展企业
            {exhibitorCount > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                约 {exhibitorCount} 家参展
              </Badge>
            )}
            {exhibitors.length > 0 && (
              <Badge variant="outline" className="text-xs">
                已提取 {exhibitors.length} 家
              </Badge>
            )}
          </CardTitle>
          {exhibitors.length > 0 && (
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={keyword}
                onChange={(event) => handleSearch(event.target.value)}
                placeholder="搜索企业名称"
                className="bg-background/60 pl-9"
              />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {exhibitors.length > 0 ? (
          <>
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/30">
                    <TableHead className="whitespace-nowrap w-12">#</TableHead>
                    <TableHead className="whitespace-nowrap min-w-[200px]">企业名称</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((name, i) => (
                    <TableRow key={name} className="border-border/20 hover:bg-accent/30 transition-colors">
                      <TableCell className="text-muted-foreground tabular-nums text-xs">
                        {(safeCurrentPage - 1) * PAGE_SIZE + i + 1}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">{name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {filtered.length > PAGE_SIZE && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border/30">
                <span className="text-sm text-muted-foreground">
                  第 {(safeCurrentPage - 1) * PAGE_SIZE + 1}-{Math.min(safeCurrentPage * PAGE_SIZE, filtered.length)} 条，共 {filtered.length} 条
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safeCurrentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    上一页
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safeCurrentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    下一页
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            {/* Info banner */}
            <div className="flex items-start gap-3 p-4 mx-4 mt-2 mb-4 rounded-lg bg-accent/30 border border-border/30">
              <Info className="size-5 shrink-0 text-muted-foreground mt-0.5" />
              <div className="text-sm text-muted-foreground leading-relaxed">
                {expo?.name ? (
                  <span>
                    <strong className="text-foreground">{expo.name}</strong>
                    {exhibitorCount > 0
                      ? <> 共有约 <strong className="text-primary">{exhibitorCount}</strong> 家中国企业参展。AI 暂未从公开报道中提取到具体的参展企业名称，请点击页面顶部刷新按钮重新搜索。</>
                      : <> 的参展企业信息暂未收录，请点击页面顶部刷新按钮重新搜索最新情报。</>
                    }
                  </span>
                ) : (
                  <span>展会参展企业详细名单正在从公开报道中提取中。</span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Building2 className="size-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                暂未提取到具体参展企业名称
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                点击上方刷新按钮重新搜索最新情报
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
