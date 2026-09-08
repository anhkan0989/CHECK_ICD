import { useState, useEffect } from 'react';
import { db, ImportHistory } from '../db/database';
import { History, FileSpreadsheet, Calendar, User } from 'lucide-react';

export function HistoryPage() {
  const [history, setHistory] = useState<ImportHistory[]>([]);

  useEffect(() => {
    const loadHistory = async () => {
      const records = await db.history.orderBy('importDate').reverse().toArray();
      setHistory(records);
    };
    loadHistory();
  }, []);

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex items-center gap-3">
        <div className="p-2 bg-indigo-50 rounded-lg">
          <History className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Lịch sử cập nhật</h2>
          <p className="text-slate-500 text-sm mt-0.5">Theo dõi các lần import dữ liệu ICD vào hệ thống</p>
        </div>
      </div>

      <div className="p-0">
        {history.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {history.map((record) => (
              <div key={record.id} className="p-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <FileSpreadsheet className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-900">{record.fileName}</span>
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded">
                        {record.version}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {record.importDate.toLocaleString('vi-VN')}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {record.importer}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm sm:text-right bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-lg">
                  <div>
                    <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Thêm mới</p>
                    <p className="font-mono font-medium text-emerald-600">+{record.recordsAdded}</p>
                  </div>
                  <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Cập nhật</p>
                    <p className="font-mono font-medium text-amber-600">~{record.recordsUpdated}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500">
            Chưa có lịch sử cập nhật nào.
          </div>
        )}
      </div>
    </div>
  );
}
