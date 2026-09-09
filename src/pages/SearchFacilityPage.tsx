import { useState, useEffect } from 'react';
import { Search, Info, MapPin, Building2, Shield, Hash } from 'lucide-react';
import { db, FacilityRecord } from '../db/database';
import { cn } from '../components/Layout';
import { Pagination } from '../components/Pagination';

export function SearchFacilityPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FacilityRecord[]>([]);
  const [selectedICD, setSelectedICD] = useState<FacilityRecord | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const PAGE_SIZE = 100;

  useEffect(() => {
    setPage(1);
  }, [query]);

  useEffect(() => {
    const search = async () => {
      setIsSearching(true);
      try {
        const res = await db.searchFacilitiesPaged(query, page, PAGE_SIZE);
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
  }, [query, page]);

  return (
    <div className="h-full flex flex-col md:flex-row gap-6">
      <div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Nhập mã Cơ sở (VD: 01361) hoặc tên cơ sở khám chữa bệnh..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-slate-900 bg-white"
              autoFocus
            />
          </div>
          <p className="text-xs text-slate-500 mt-2 px-1">
            Tra cứu Danh mục Cơ sở Khám chữa bệnh (CSKCB)
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {isSearching ? (
            <div className="p-8 text-center text-slate-500">Đang tìm kiếm...</div>
          ) : results.length > 0 ? (
            <ul className="space-y-1">
              {results.map((facility) => (
                <li key={facility.id}>
                  <button
                    onClick={() => setSelectedICD(facility)}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-lg transition-colors flex items-start gap-3",
                      selectedICD?.id === facility.id
                        ? "bg-indigo-50 border border-indigo-100"
                        : "hover:bg-slate-50 border border-transparent"
                    )}
                  >
                    <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-sky-100 text-sky-800 font-mono text-sm font-bold min-w-[60px]">
                      {facility.code}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-900 font-medium truncate">{facility.name}</p>
                      <p className="text-slate-500 text-xs truncate">{facility.address}</p>
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
              <Building2 className="w-12 h-12 mb-4 opacity-20" />
              <p>Nhập khóa để bắt đầu tra cứu</p>
            </div>
          )}
        </div>
        <Pagination page={page} totalPages={totalPages} total={totalRecords} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      <div className="w-full md:w-96 flex-shrink-0 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 font-medium text-slate-700 flex items-center gap-2">
          <Info className="w-5 h-5 text-indigo-500" />
          Chi tiết CSKCB
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {selectedICD ? (
            <div className="space-y-6">
              <div>
                <div className="inline-block px-3 py-1 bg-sky-100 text-sky-800 font-mono text-xl font-bold rounded-lg mb-2">
                  {selectedICD.code}
                </div>
                <h2 className="text-xl font-bold text-slate-900 leading-tight">
                  {selectedICD.name}
                </h2>
                {selectedICD.address && (
                  <div className="flex items-start gap-1 mt-2 text-slate-500 text-sm">
                    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" /> 
                    <span>{selectedICD.address}</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Building2 className="w-4 h-4 text-slate-400 mt-1" />
                    <div>
                      <p className="text-xs font-semibold text-slate-500 tracking-wider mb-1">Tuyến CMKT</p>
                      <p className="text-slate-800">{selectedICD.route || '--'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Shield className="w-4 h-4 text-slate-400 mt-1" />
                    <div>
                      <p className="text-xs font-semibold text-slate-500 tracking-wider mb-1">Cấp CMKT</p>
                      <p className="text-slate-800">{selectedICD.grade || '--'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Shield className="w-4 h-4 text-slate-400 mt-1" />
                    <div>
                      <p className="text-xs font-semibold text-slate-500 tracking-wider mb-1">Hạng Bệnh Viện</p>
                      <p className="text-slate-800">{selectedICD.level || '--'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Hash className="w-4 h-4 text-slate-400 mt-1" />
                    <div>
                      <p className="text-xs font-semibold text-slate-500 tracking-wider mb-1">Điểm</p>
                      <p className="text-slate-800">{selectedICD.score || '--'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100">
                <p className="text-xs text-slate-400">
                  Phiên bản: {selectedICD.version}
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center">
              <Building2 className="w-12 h-12 mb-4 opacity-20" />
              <p>Chọn một cơ sở từ danh sách<br/>để xem chi tiết</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
