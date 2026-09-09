import React, { useState, useEffect, useCallback } from 'react';
import { Search, FileText, AlertCircle } from 'lucide-react';
import { db, ICDTT01Record } from '../db/database';
import { Pagination } from '../components/Pagination';

export function SearchTT01Page() {
  const [activeTab, setActiveTab] = useState<'PL1' | 'PL2'>('PL1');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [results, setResults] = useState<ICDTT01Record[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const PAGE_SIZE = 100;

  const doSearch = useCallback(async (q: string, t: 'PL1' | 'PL2', p: number) => {
    setIsSearching(true);
    try {
      const res = await db.searchICDTT01Paged(q, t, p, PAGE_SIZE);
      setResults(res.records);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setPage(res.page);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    const timer = setTimeout(() => doSearch(query, activeTab, 1), 300);
    return () => clearTimeout(timer);
  }, [query, activeTab, doSearch]);

  const handleTabChange = (tab: 'PL1' | 'PL2') => {
    setActiveTab(tab);
    setQuery(''); // Reset query when switching tabs
    setExpandedId(null);
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl w-fit border border-slate-200">
        <button
          onClick={() => handleTabChange('PL1')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'PL1' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          Phụ lục 1 (Cấp chuyên sâu)
        </button>
        <button
          onClick={() => handleTabChange('PL2')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'PL2' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          Phụ lục 2 (Cấp cơ bản)
        </button>
      </div>

      {/* Search + Results */}
      <div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder={`Tìm bệnh theo tên hoặc mã ICD trong ${activeTab === 'PL1' ? 'PL1' : 'PL2'}...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white"
              autoFocus
            />
          </div>
          <p className="text-xs text-slate-500 mt-2 px-1">
            Bệnh tự đến khám theo Thông tư 01 BYT - {activeTab === 'PL1' ? 'Cấp chuyên sâu' : 'Cấp cơ bản'}.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {isSearching ? (
            <div className="p-8 text-center text-slate-500">Đang tìm kiếm...</div>
          ) : results.length > 0 ? (
            <div className="space-y-2">
              {results.map((rec) => {
                const isExpanded = expandedId === rec.id;
                const codes = rec.code.split(';').map(c => c.trim()).filter(Boolean);

                return (
                  <div key={rec.id} className="border border-slate-200 rounded-xl overflow-hidden hover:border-indigo-200 transition-colors">
                    <div className="flex items-start gap-3 p-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900">{rec.nameVN}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{codes.length} mã ICD</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : rec.id!)}
                          className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                        >
                          {isExpanded ? 'Thu gọn' : 'Xem mã'}
                        </button>
                      </div>
                    </div>

                    {/* Chips preview */}
                    {!isExpanded && (
                      <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                        {codes.slice(0, 8).map((c, idx) => (
                          <span key={idx}
                            className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-700 font-mono text-xs rounded-md">
                            {c}
                          </span>
                        ))}
                        {codes.length > 8 && (
                          <span className="text-xs text-slate-400 self-center">+{codes.length - 8} nữa...</span>
                        )}
                      </div>
                    )}

                    {/* Expanded: full list */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/50">
                        <div className="p-3 space-y-1.5 max-h-80 overflow-y-auto">
                          {codes.map((c, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-slate-100">
                              <span className="font-mono text-sm font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded flex-shrink-0">
                                {c}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center">
              <FileText className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-medium">
                {query ? `Không tìm thấy kết quả cho "${query}"` : 'Chưa có dữ liệu cho Phụ lục này'}
              </p>
              <p className="text-sm mt-1">Vui lòng import dữ liệu từ màn hình Quản lý Danh mục</p>
            </div>
          )}
        </div>

        <Pagination page={page} totalPages={totalPages} total={total} pageSize={PAGE_SIZE}
          onPageChange={(p) => doSearch(query, activeTab, p)} />
      </div>
    </div>
  );
}
