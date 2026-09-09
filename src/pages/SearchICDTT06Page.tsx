import { useState, useEffect } from 'react';
import { Search, Check, AlertTriangle } from 'lucide-react';
import { db, ICDTT06Record, ICDTT06Filters } from '../db/database';
import { cn } from '../components/Layout';
import { Pagination } from '../components/Pagination';

export function SearchICDTT06Page() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ICDTT06Record[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState<ICDTT06Filters>({
    notMainDisease: false,
    notRecommendedMain: false,
    requireSpecificCode: false,
    deathCauseOnly: false,
    femaleOnly: false,
    maleOnly: false
  });

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const PAGE_SIZE = 100;

  useEffect(() => {
    setPage(1);
  }, [query, filters]);

  useEffect(() => {
    const search = async () => {
      setIsSearching(true);
      try {
        const res = await db.searchICDTT06Paged(query, filters, page, PAGE_SIZE);
        setResults(res.records);
        setTotalPages(res.totalPages);
        setTotalRecords(res.total);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(search, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, filters, page]);

  const toggleFilter = (key: keyof ICDTT06Filters) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const hasWarning = (val?: string) => {
    if (!val) return false;
    const s = val.trim().toLowerCase();
    return s.length > 0 && s !== 'không' && s !== '0' && s !== 'false';
  };

  const renderWarningCell = (val?: string) => {
    if (!hasWarning(val)) return <span className="text-slate-300">-</span>;
    return <Check className="w-5 h-5 text-rose-500 mx-auto" />;
  };

  const renderGenderCell = (val?: string, isFemale?: boolean) => {
    if (!hasWarning(val)) return <span className="text-slate-300">-</span>;
    return <Check className={`w-5 h-5 mx-auto ${isFemale ? 'text-pink-500' : 'text-blue-500'}`} />;
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header and Search */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex-shrink-0">
        <div className="relative max-w-2xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Nhập mã ICD (VD: J18.9) hoặc tên bệnh (VD: viêm phổi)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-slate-900 bg-white"
            autoFocus
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setFilters({
              notMainDisease: false,
              notRecommendedMain: false,
              requireSpecificCode: false,
              deathCauseOnly: false,
              femaleOnly: false,
              maleOnly: false
            })}
            className={cn(
              "px-2.5 py-1 text-xs font-semibold rounded-full border transition-all",
              !Object.values(filters).some(Boolean)
                ? "bg-slate-800 text-white border-slate-800"
                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
            )}
          >
            Tất cả
          </button>
          <button
            onClick={() => toggleFilter('notMainDisease')}
            className={cn(
              "px-2.5 py-1 text-xs font-semibold rounded-full border transition-all",
              filters.notMainDisease
                ? "bg-rose-100 text-rose-700 border-rose-200"
                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
            )}
          >
            Mã không được dùng là bệnh chính
          </button>
          <button
            onClick={() => toggleFilter('notRecommendedMain')}
            className={cn(
              "px-2.5 py-1 text-xs font-semibold rounded-full border transition-all",
              filters.notRecommendedMain
                ? "bg-amber-100 text-amber-700 border-amber-200"
                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
            )}
          >
            Mã không khuyến khích dùng là bệnh chính
          </button>
          <button
            onClick={() => toggleFilter('requireSpecificCode')}
            className={cn(
              "px-2.5 py-1 text-xs font-semibold rounded-full border transition-all",
              filters.requireSpecificCode
                ? "bg-rose-100 text-rose-700 border-rose-200"
                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
            )}
          >
            Mã không được sử dụng vì có mã 4 hoặc 5 ký tự cụ thể hơn
          </button>
          <button
            onClick={() => toggleFilter('deathCauseOnly')}
            className={cn(
              "px-2.5 py-1 text-xs font-semibold rounded-full border transition-all",
              filters.deathCauseOnly
                ? "bg-slate-200 text-slate-700 border-slate-300"
                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
            )}
          >
            Chỉ sử dụng mã hóa nguyên nhân tử vong
          </button>
          <button
            onClick={() => toggleFilter('femaleOnly')}
            className={cn(
              "px-2.5 py-1 text-xs font-semibold rounded-full border transition-all",
              filters.femaleOnly
                ? "bg-pink-100 text-pink-700 border-pink-200"
                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
            )}
          >
            Các mã bệnh chỉ có hoặc chủ yếu có ở nữ giới
          </button>
          <button
            onClick={() => toggleFilter('maleOnly')}
            className={cn(
              "px-2.5 py-1 text-xs font-semibold rounded-full border transition-all",
              filters.maleOnly
                ? "bg-blue-100 text-blue-700 border-blue-200"
                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
            )}
          >
            Các mã bệnh chỉ có hoặc chủ yếu có ở nam giới
          </button>
        </div>
      </div>

      {/* Data Table Area */}
      <div className="flex-1 overflow-auto bg-white">
        {isSearching ? (
          <div className="flex items-center justify-center h-32 text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : results.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-100 shadow-sm z-10 text-[10.5px] leading-tight uppercase text-slate-600 font-semibold">
              <tr>
                <th className="p-2 border-b border-slate-200 bg-slate-100 whitespace-nowrap">Mã ICD</th>
                <th className="p-2 border-b border-slate-200 bg-slate-100 w-1/4">Tên bệnh</th>
                <th className="p-2 border-b border-slate-200 bg-slate-100 text-center text-rose-700">Mã không được dùng<br />là bệnh chính</th>
                <th className="p-2 border-b border-slate-200 bg-slate-100 text-center text-amber-700">Mã không khuyến khích<br />dùng là bệnh chính</th>
                <th className="p-2 border-b border-slate-200 bg-slate-100 text-center text-rose-700">Mã không được sử dụng vì<br />có mã 4-5 ký tự cụ thể hơn</th>
                <th className="p-2 border-b border-slate-200 bg-slate-100 text-center text-slate-700">Chỉ dùng mã hóa<br />nguyên nhân tử vong</th>
                <th className="p-2 border-b border-slate-200 bg-slate-100 text-center text-pink-700">Các mã bệnh chỉ có<br />hoặc chủ yếu ở nữ</th>
                <th className="p-2 border-b border-slate-200 bg-slate-100 text-center text-blue-700">Các mã bệnh chỉ có<br />hoặc chủ yếu ở nam</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-800">
              {results.map((icd) => (
                <tr key={icd.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-2 font-mono font-bold text-indigo-700 whitespace-nowrap">{icd.code}</td>
                  <td className="p-2">
                    <div className="font-medium whitespace-normal leading-snug">{icd.nameVN}</div>
                    {icd.nameEN && <div className="text-[11px] text-slate-500 mt-0.5 whitespace-normal leading-tight">{icd.nameEN}</div>}
                  </td>
                  <td className="p-2 text-center">{renderWarningCell(icd.notMainDisease)}</td>
                  <td className="p-2 text-center">{!hasWarning(icd.notRecommendedMain) ? <span className="text-slate-300">-</span> : <AlertTriangle className="w-4 h-4 text-amber-500 mx-auto" />}</td>
                  <td className="p-2 text-center">{renderWarningCell(icd.requireSpecificCode)}</td>
                  <td className="p-2 text-center">{!hasWarning(icd.deathCauseOnly) ? <span className="text-slate-300">-</span> : <Check className="w-4 h-4 text-slate-700 mx-auto" />}</td>
                  <td className="p-2 text-center">{renderGenderCell(icd.femaleOnly, true)}</td>
                  <td className="p-2 text-center">{renderGenderCell(icd.maleOnly, false)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center h-full">
            <Search className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-lg font-medium text-slate-500">Không tìm thấy kết quả phù hợp</p>
            <p className="text-sm mt-2">Vui lòng thử từ khóa khác hoặc bỏ bớt bộ lọc</p>
          </div>
        )}
      </div>
      <Pagination page={page} totalPages={totalPages} total={totalRecords} pageSize={PAGE_SIZE} onPageChange={setPage} />
    </div>
  );
}
