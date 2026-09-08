import React, { useState, useRef } from 'react';
import { Download, Upload, Database, AlertCircle, CheckCircle2, Save } from 'lucide-react';
import { db, ICDRecord } from '../db/database';

export function BackupPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setMessage(null);
    try {
      const allRecords = await db.icds.toArray();
      const dataStr = JSON.stringify(allRecords, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toISOString().split('T')[0];
      a.download = `icd-engine-backup-${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMessage({ type: 'success', text: `Đã xuất thành công ${allRecords.length} bản ghi.` });
    } catch (error: any) {
      setMessage({ type: 'error', text: `Lỗi xuất dữ liệu: ${error.message}` });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setMessage(null);

    try {
      const text = await file.text();
      const records: ICDRecord[] = JSON.parse(text);

      if (!Array.isArray(records)) {
        throw new Error("File backup không đúng định dạng.");
      }

      // Basic validation
      if (records.length > 0 && !('code' in records[0] && 'nameVN' in records[0])) {
        throw new Error("Dữ liệu trong file không khớp với cấu trúc ICD.");
      }

      // Clear existing and import new
      await db.transaction('rw', db.icds, async () => {
        await db.icds.clear();
        await db.icds.bulkAdd(records);
      });

      setMessage({ type: 'success', text: `Đã phục hồi thành công ${records.length} bản ghi.` });
    } catch (error: any) {
      setMessage({ type: 'error', text: `Lỗi phục hồi dữ liệu: ${error.message}` });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex items-center gap-3">
        <div className="p-2 bg-indigo-50 rounded-lg">
          <Database className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Sao lưu & Phục hồi (Portable)</h2>
          <p className="text-slate-500 text-sm mt-0.5">Chuyển dữ liệu giữa các máy tính khác nhau mà không cần mạng</p>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {message && (
          <div className={`p-4 rounded-lg flex items-start gap-3 ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 mt-0.5" /> : <AlertCircle className="w-5 h-5 mt-0.5" />}
            <p className="font-medium">{message.text}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Export Section */}
          <div className="border border-slate-200 rounded-xl p-6 flex flex-col items-center text-center hover:border-indigo-200 transition-colors bg-slate-50/50">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <Download className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Xuất dữ liệu (Backup)</h3>
            <p className="text-sm text-slate-500 mb-6 flex-1">
              Tải toàn bộ cơ sở dữ liệu ICD hiện tại xuống máy tính dưới dạng file JSON. Bạn có thể copy file này sang máy khác.
            </p>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg font-medium transition-colors"
            >
              <Save className="w-5 h-5" />
              {isExporting ? 'Đang xuất...' : 'Tải file Backup'}
            </button>
          </div>

          {/* Import Section */}
          <div className="border border-slate-200 rounded-xl p-6 flex flex-col items-center text-center hover:border-indigo-200 transition-colors bg-slate-50/50">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Phục hồi dữ liệu (Restore)</h3>
            <p className="text-sm text-slate-500 mb-6 flex-1">
              Nhập file JSON đã backup từ máy tính khác vào phần mềm này. <br/>
              <span className="text-rose-500 font-medium">Lưu ý: Dữ liệu hiện tại sẽ bị ghi đè.</span>
            </p>
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleImport}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-lg font-medium transition-colors"
            >
              <Database className="w-5 h-5" />
              {isImporting ? 'Đang phục hồi...' : 'Chọn file Backup'}
            </button>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-sm text-blue-800">
          <h4 className="font-bold mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Hướng dẫn sử dụng độc lập (Portable)
          </h4>
          <ol className="list-decimal list-inside space-y-1.5 ml-1">
            <li><strong>Lấy mã nguồn:</strong> Bạn có thể tải mã nguồn phần mềm này về máy tính (Export to ZIP).</li>
            <li><strong>Chạy offline:</strong> Sau khi build (<code>npm run build</code>), bạn sẽ có thư mục <code>dist</code>. Bạn có thể copy thư mục này đi bất cứ đâu và chạy bằng một Web Server tĩnh (như Live Server, Nginx, hoặc đóng gói thành file .exe bằng Electron).</li>
            <li><strong>Đồng bộ dữ liệu:</strong> Vì dữ liệu lưu trong trình duyệt (IndexedDB), khi đổi máy tính, bạn chỉ cần dùng chức năng <strong>Xuất dữ liệu</strong> ở máy cũ và <strong>Phục hồi dữ liệu</strong> ở máy mới.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
