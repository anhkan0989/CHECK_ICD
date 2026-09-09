import React, { useState, useEffect } from 'react';
import { db, ThuocQuocGiaRecord } from '../db/database';
import { Search, Loader2, Pill } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { Pagination } from '../components/Pagination';

export function SearchThuocPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<ThuocQuocGiaRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const PAGE_SIZE = 100;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    const doSearch = async () => {
      setIsLoading(true);
      try {
        const res = await db.searchThuocQuocGiaPaged(debouncedSearchTerm, page, PAGE_SIZE);
        setResults(res.records);
        setTotalPages(res.totalPages);
        setTotalRecords(res.total);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    doSearch();
  }, [debouncedSearchTerm, page]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden sticky top-4 z-10">
        <div className="p-4 sm:p-6 pb-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Pill className="text-indigo-600 w-6 h-6" /> Tra cứu Danh mục Thuốc Quốc gia
          </h2>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Nhập tên thuốc, hoạt chất, mã ICD liên kết, chỉ định hoặc chống chỉ định..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-slate-700 font-medium"
            />
            {isLoading && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500 animate-spin" />
            )}
          </div>
          <div className="mt-4 flex gap-4 text-sm text-slate-500">
            <span>Tìm kiếm tức thì theo <strong>Tên Thuốc</strong>, <strong>Hoạt chất</strong>, <strong>Mã ICD</strong> hoặc <strong>Chỉ định/CCĐ</strong></span>
          </div>
        </div>

        <div className="p-0 sm:p-6 sm:pt-4 overflow-x-auto">
          {results.length > 0 ? (
            <div className="flex flex-col gap-6">
              {results.map((r, idx) => (
                <div key={r.id || idx} className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow relative flex flex-col sm:flex-row overflow-hidden group">
                  <div className="h-1.5 sm:h-auto sm:w-1.5 bg-gradient-to-b from-indigo-500 to-indigo-400 flex-shrink-0"></div>
                  <div className="p-5 flex-1 flex flex-col md:flex-row gap-6">
                    {/* Thông tin chính */}
                    <div className="md:w-1/3 flex flex-col">
                         <div className="flex justify-between items-start mb-3">
                             <div>
                                <h3 className="font-bold text-xl text-slate-900 group-hover:text-indigo-700 transition-colors">{r.tenThuoc}</h3>
                                <p className="text-md font-medium text-emerald-600 mt-1">{r.tenHoatChat}</p>
                             </div>
                         </div>
                         <div className="mb-4">
                            <span className="bg-slate-100 text-slate-700 text-sm px-2.5 py-1.5 rounded-md font-medium whitespace-nowrap border border-slate-200 inline-block">
                                {r.hamLuong} {r.donViTinh ? `(${r.donViTinh})` : ''}
                            </span>
                         </div>
                         {r.maICD && (
                          <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 mt-auto">
                              <span className="font-semibold text-blue-800 block mb-1">Mã ICD Liên Kết:</span>
                              <span className="text-slate-700 font-medium whitespace-pre-wrap">{r.maICD}</span>
                          </div>
                         )}
                    </div>

                    {/* Chỉ định và Chống chỉ định */}
                    <div className="md:w-2/3 space-y-4 text-sm flex-1">

                        {r.chiDinh && (
                          <div>
                              <span className="font-semibold text-slate-800 block mb-1 flex items-center gap-1.5">
                                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Chỉ định
                              </span>
                              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap line-clamp-4 hover:line-clamp-none">{r.chiDinh}</p>
                          </div>
                        )}

                        {r.chongChiDinh && (
                          <div>
                              <span className="font-semibold text-rose-800 block mb-1 flex items-center gap-1.5">
                                 <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div> Chống Chỉ Định (CCĐ)
                              </span>
                              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap bg-rose-50/30 p-2 rounded border border-rose-100 border-l-2 border-l-rose-400">{r.chongChiDinh}</p>
                          </div>
                        )}
                        
                        {r.lieuDung && (
                          <div className="pt-2 border-t border-slate-100">
                              <span className="font-semibold text-slate-800 block mb-1">Liều dùng:</span>
                              <p className="text-slate-600">{r.lieuDung}</p>
                          </div>
                        )}

                        {(r.ghiChu1 || r.ghiChu2) && (
                          <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-100 mt-4">
                              <strong>Lưu ý:</strong> {r.ghiChu1} {r.ghiChu2 && `| ${r.ghiChu2}`}
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                 <Pill className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium text-lg">Không tìm thấy loại thuốc nào</p>
              <p className="text-slate-500 mt-1 max-w-sm">Hãy vào phần "Cập nhật QĐ/Data" và chọn [Danh mục Thuốc] để import dữ liệu từ Excel.</p>
            </div>
          )}
        </div>
        <Pagination page={page} totalPages={totalPages} total={totalRecords} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>
    </div>
  );
}
