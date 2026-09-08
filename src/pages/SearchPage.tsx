import { useState, useEffect, useCallback } from 'react';
import {
  Search, FileText, Trash2, ChevronLeft, ChevronRight, AlertCircle
} from 'lucide-react';
import { db, TT25Record } from '../db/database';
import { useAdmin } from '../context/AdminContext';
import { ConfirmDialog } from '../components/ConfirmDialog';

// ─── Pagination Component ─────────────────────────────────────────────────────

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (p: number) => void;
}

function Pagination({ page, totalPages, total, pageSize, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
      <p className="text-xs text-slate-500">
        {from}–{to} / <span className="font-semibold">{total}</span> kết quả
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="px-3 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Main SearchPage (TT06/TT25) ──────────────────────────────────────────────────────────

export function SearchPage() {
  const { isAdmin } = useAdmin();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [results, setResults] = useState<TT25Record[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState<TT25Record | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const PAGE_SIZE = 50;

  const doSearch = useCallback(async (q: string, p: number) => {
    setIsSearching(true);
    try {
      const res = await db.searchTT25Paged(q, p, PAGE_SIZE);
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
    const timer = setTimeout(() => doSearch(query, 1), 300);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  const handleDeleteConfirm = async () => {
    if (!deleteRecord?.id) return;
    await db.deleteTT25Record(deleteRecord.id);
    setDeleteRecord(null);
    doSearch(query, page);
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {deleteRecord && (
        <ConfirmDialog
          title="Xóa bản ghi TT25"
          message={`Xóa nhóm bệnh "${deleteRecord.name}"? Hành động này không thể hoàn tác.`}
          confirmLabel="Xóa"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteRecord(null)}
        />
      )}

      <div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Search bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên nhóm bệnh hoặc mã ICD (VD: A06, amip)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white"
              autoFocus
            />
          </div>
          <p className="text-xs text-slate-500 mt-2 px-1">
            Danh sách bệnh dài ngày (TT25). Nhấn vào mã ICD để xem tên bệnh đối chiếu từ CSDL.
          </p>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-3">
          {isSearching ? (
            <div className="p-8 text-center text-slate-500">Đang tìm kiếm...</div>
          ) : results.length > 0 ? (
            <div className="space-y-2">
              {results.map((rec) => {
                const resolved: { code: string; nameVN: string }[] = rec.resolvedNames
                  ? JSON.parse(rec.resolvedNames)
                  : rec.codes.split(';').map(c => ({ code: c.trim(), nameVN: '' }));

                const isExpanded = expandedId === rec.id;

                return (
                  <div key={rec.id} className="border border-slate-200 rounded-xl overflow-hidden hover:border-indigo-200 transition-colors">
                    {/* Header row */}
                    <div className="flex items-start gap-3 p-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900">{rec.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{rec.codes.split(';').length} mã ICD</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : rec.id!)}
                          className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                        >
                          {isExpanded ? 'Thu gọn' : 'Xem mã'}
                        </button>
                        {isAdmin ? (
                          <button
                            onClick={() => setDeleteRecord(rec)}
                            title="Xóa (Admin)"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            title="Chỉ Admin mới được xóa"
                            className="p-1.5 text-slate-200 cursor-not-allowed rounded-lg"
                            disabled
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Codes chips (collapsed preview) */}
                    {!isExpanded && (
                      <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                        {resolved.slice(0, 8).map(r => (
                          <span key={r.code}
                            className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-700 font-mono text-xs rounded-md"
                          >
                            {r.code}
                          </span>
                        ))}
                        {resolved.length > 8 && (
                          <span className="text-xs text-slate-400 self-center">+{resolved.length - 8} nữa...</span>
                        )}
                      </div>
                    )}

                    {/* Expanded: full list with resolved names */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/50">
                        <div className="p-3 space-y-1.5 max-h-80 overflow-y-auto">
                          {resolved.map((r, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-2.5 bg-white rounded-lg border border-slate-100">
                              <span className="font-mono text-sm font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded flex-shrink-0">
                                {r.code}
                              </span>
                              {r.nameVN ? (
                                <span className="text-sm text-slate-700">{r.nameVN}</span>
                              ) : (
                                <span className="text-sm text-slate-400 italic flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  Không tìm thấy trong DB ICD
                                </span>
                              )}
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
                {query ? `Không tìm thấy kết quả cho "${query}"` : 'Chưa có dữ liệu TT25'}
              </p>
              <p className="text-sm mt-1">Vào tab "Cập nhật ICD" để import file TT25</p>
            </div>
          )}
        </div>

        <Pagination page={page} totalPages={totalPages} total={total} pageSize={PAGE_SIZE} onPageChange={(p) => doSearch(query, p)} />
      </div>
    </div>
  );
}
