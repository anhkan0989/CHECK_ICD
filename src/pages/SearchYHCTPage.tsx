import { useState, useEffect } from 'react';
import { Search, Info, ShieldPlus, FileText, Stethoscope } from 'lucide-react';
import { db, YHCTRecord } from '../db/database';
import { cn } from '../components/Layout';
import { Pagination } from '../components/Pagination';

export function SearchYHCTPage() {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive' | 'a2'>('all');
  const [results, setResults] = useState<any[]>([]);
  const [selectedICD, setSelectedICD] = useState<any | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const PAGE_SIZE = 100;

  useEffect(() => {
    setPage(1);
  }, [query, activeFilter]);

  useEffect(() => {
    const search = async () => {
      setIsSearching(true);
      try {
        const res = await db.searchYHCTPaged(query, activeFilter, page, PAGE_SIZE);
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
  }, [query, activeFilter, page]);

  return (
    <div className="h-full flex flex-col md:flex-row gap-6">
      <div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Nhập mã U53 hoặc tên bệnh YHCT..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-slate-900 bg-white"
              autoFocus
            />
          </div>
          <div className="mt-3 flex items-center gap-4 text-sm px-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={activeFilter === 'all'} onChange={() => setActiveFilter('all')} className="text-indigo-600 focus:ring-indigo-500" />
              <span className="text-slate-700">Tất cả</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={activeFilter === 'active'} onChange={() => setActiveFilter('active')} className="text-emerald-600 focus:ring-emerald-500" />
              <span className="text-slate-700 hover:text-emerald-700 font-medium tracking-tight">Còn hiệu lực</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={activeFilter === 'inactive'} onChange={() => setActiveFilter('inactive')} className="text-rose-600 focus:ring-rose-500" />
              <span className="text-slate-700 hover:text-rose-700 font-medium tracking-tight">Hết hiệu lực</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={activeFilter === 'a2'} onChange={() => setActiveFilter('a2')} className="text-amber-600 focus:ring-amber-500" />
              <span className="text-slate-700 hover:text-amber-700 font-medium tracking-tight">Phụ lục A2</span>
            </label>
          </div>
          <p className="text-xs text-slate-500 mt-2 px-1">
            Tra cứu danh mục ICD Y Học Cổ Truyền
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {isSearching ? (
            <div className="p-8 text-center text-slate-500">Đang tìm kiếm...</div>
          ) : results.length > 0 ? (
            <ul className="space-y-1">
              {results.map((icd) => (
                <li key={icd.id}>
                  <button
                    onClick={() => setSelectedICD(icd)}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-lg transition-colors flex items-start gap-3",
                      selectedICD?.id === icd.id
                        ? "bg-indigo-50 border border-indigo-100"
                        : "hover:bg-slate-50 border border-transparent"
                    )}
                  >
                    <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-teal-100 text-teal-800 font-mono text-sm font-bold min-w-[60px]">
                      {icd.code}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-900 font-medium truncate">{icd.nameYHCT || icd.nameVN}</p>
                      {icd.icd10Code && <p className="text-slate-500 text-xs truncate">Mã Tây y: {icd.icd10Code} - {icd.icd10Name}</p>}
                      {icd.nameEN && <p className="text-slate-500 text-xs truncate">{icd.nameEN}</p>}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {icd.isActive ? (
                          <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-700 bg-emerald-100 rounded">Còn hiệu lực</span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide text-rose-700 bg-rose-100 rounded">Hết hiệu lực</span>
                        )}
                        {icd.tagA2 && (
                          <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-700 bg-amber-100 rounded">Phụ lục A2</span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : query.trim() ? (
            <div className="p-8 text-center text-slate-500">
              Không tìm thấy kết quả phù hợp cho "{query}"
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center h-full">
              <Stethoscope className="w-12 h-12 mb-4 opacity-20" />
              <p>Nhập từ khóa để bắt đầu tra cứu</p>
            </div>
          )}
        </div>
        <Pagination page={page} totalPages={totalPages} total={totalRecords} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      <div className="w-full md:w-96 flex-shrink-0 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 font-medium text-slate-700 flex items-center gap-2">
          <Info className="w-5 h-5 text-indigo-500" />
          Chi tiết Bệnh YHCT
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {selectedICD ? (
            <div className="space-y-6">
              <div>
                <div className="inline-block px-3 py-1 bg-teal-100 text-teal-800 font-mono text-xl font-bold rounded-lg mb-2">
                  {selectedICD.code}
                </div>
                <h2 className="text-xl font-bold text-slate-900 leading-tight">
                  {selectedICD.nameYHCT || selectedICD.nameVN}
                </h2>
                {selectedICD.name && (
                  <p className="text-slate-500 text-sm mt-1 italic">Tên đầy đủ: {selectedICD.name}</p>
                )}
                {selectedICD.nameEN && (
                  <p className="text-slate-500 text-sm mt-1 italic">{selectedICD.nameEN}</p>
                )}
              </div>

              <div className="space-y-4">
                {selectedICD.icd10Code && (
                  <div className="flex items-start gap-3">
                    <ShieldPlus className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Mã ICD 10 Nền Tảng</p>
                      <p className="text-indigo-700 font-medium">{selectedICD.icd10Code}</p>
                      <p className="text-slate-800">{selectedICD.icd10Name}</p>
                    </div>
                  </div>
                )}

                {selectedICD.modernName && (
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Tên Hiện Đại</p>
                      <p className="text-slate-800">{selectedICD.modernName}</p>
                    </div>
                  </div>
                )}
                
                {selectedICD.tagA2 && (
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-amber-500 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-1">Phụ lục A2</p>
                      <p className="text-amber-900 text-sm">Các mã bệnh không sử dụng là bệnh chính (QĐ 4469/BYT)</p>
                    </div>
                  </div>
                )}
                
                {selectedICD.chapter && (
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Nhóm bệnh (Chapter)</p>
                      <p className="text-slate-800">{selectedICD.chapter || 'Không có thông tin'}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100">
                <p className="text-xs text-slate-400">
                  Phiên bản: {selectedICD.version} <br/>
                  Trạng thái: {selectedICD.isActive ? 'Đang áp dụng' : 'Đã vô hiệu hóa'}
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center">
              <FileText className="w-12 h-12 mb-4 opacity-20" />
              <p>Chọn một mã từ danh sách<br/>để xem chi tiết</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
