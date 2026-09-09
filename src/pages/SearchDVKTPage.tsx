import React, { useState, useEffect } from 'react';
import { db, DVKTTongHopRecord } from '../db/database';
import { Search, Loader2 } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { Pagination } from '../components/Pagination';

export function SearchDVKTPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<DVKTTongHopRecord[]>([]);
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
        const res = await db.searchDVKTPaged(debouncedSearchTerm, page, PAGE_SIZE);
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
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden sticky top-4 z-10">
        <div className="p-4 sm:p-6 pb-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Tra cứu Danh mục DVKT Tổng hợp</h2>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Nhập mã DVKT, tên dịch vụ phê duyệt/giá, đơn giá hoặc phân loại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-slate-700"
            />
            {isLoading && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500 animate-spin" />
            )}
          </div>
          <div className="mt-4 flex gap-4 text-sm text-slate-500">
            <span>Tìm kiếm tức thì theo <strong>Mã</strong>, <strong>Tên File QĐ</strong>, <strong>Tên tính giá</strong> hoặc <strong>Đơn giá</strong></span>
          </div>
        </div>

        <div className="p-0 sm:p-6 sm:pt-4 overflow-x-auto">
          {results.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-3 font-medium text-slate-600">Mã DVKT</th>
                  <th className="p-3 font-medium text-slate-600">Tên DVKT (Phê duyệt / Giá)</th>
                  <th className="p-3 font-medium text-slate-600">Loại PTTT</th>
                  <th className="p-3 font-medium text-slate-600 text-right">Đơn giá</th>
                  <th className="p-3 font-medium text-slate-600">Hạng dịch vụ</th>
                  <th className="p-3 font-medium text-slate-600 text-center">Hiệu lực</th>
                  <th className="p-3 font-medium text-slate-600">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((r, idx) => (
                  <tr key={r.id || idx} className="hover:bg-indigo-50/50 transition-colors">
                    <td className="p-3 align-top">
                      <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md text-sm cursor-pointer hover:bg-indigo-100 transition-colors" onClick={() => {
                        navigator.clipboard.writeText(r.maTuongDuong);
                      }}>
                        {r.maTuongDuong}
                      </span>
                    </td>
                    <td className="p-3 align-top min-w-[250px]">
                      <div className="font-medium text-slate-800">{r.tenDVKTPheDuyet}</div>
                      {r.tenDVKTGia && r.tenDVKTGia !== r.tenDVKTPheDuyet && (
                        <div className="text-sm text-slate-500 mt-1">Giá: {r.tenDVKTGia}</div>
                      )}
                    </td>
                    <td className="p-3 align-top text-slate-600">{r.phanLoaiPTTT}</td>
                    <td className="p-3 align-top text-right font-medium text-emerald-600">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(r.donGia)}
                    </td>
                    <td className="p-3 align-top text-slate-600">{r.hangDichVu}</td>
                    <td className="p-3 align-top text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md ${
                          r.hieuLuc?.toLowerCase() === 'có' || r.hieuLuc === '1'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}>
                        {r.hieuLuc?.toLowerCase() === 'có' || r.hieuLuc === '1' ? 'Còn hiệu lực' : 'Hết hiệu lực'}
                      </span>
                    </td>
                    <td className="p-3 align-top text-sm text-slate-500 max-w-xs">{r.ghiChu}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center text-slate-500">
              Không tìm thấy dịch vụ nào. Nếu chưa có dữ liệu, vui lòng vào Quản lý Danh mục để Import.
            </div>
          )}
        </div>
        <Pagination page={page} totalPages={totalPages} total={totalRecords} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>
    </div>
  );
}
