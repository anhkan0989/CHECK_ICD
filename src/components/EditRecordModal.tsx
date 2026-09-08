import { useState } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { ICDRecord, db } from '../db/database';

interface EditRecordModalProps {
  record: ICDRecord;
  onSave: () => void;
  onCancel: () => void;
}

export function EditRecordModal({ record, onSave, onCancel }: EditRecordModalProps) {
  const [form, setForm] = useState({
    nameVN: record.nameVN,
    nameEN: record.nameEN || '',
    chapter: record.chapter || '',
    specialty: record.specialty || '',
    isActive: record.isActive,
    bhytCovered: record.bhytCovered ?? true,
    note: record.note || '',
    chronic: record.chronic || '',
    description: record.description || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field: keyof typeof form, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSave = async () => {
    if (!form.nameVN.trim()) {
      setError('Tên bệnh tiếng Việt không được để trống.');
      return;
    }
    setIsSaving(true);
    try {
      await db.updateRecord(record.id!, form);
      onSave();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi lưu bản ghi.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[150] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 flex-shrink-0">
          <div>
            <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-700 font-mono font-bold rounded text-sm mr-3">
              {record.code}
            </span>
            <span className="font-bold text-slate-900 text-lg">Chỉnh sửa bản ghi ICD</span>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Tên VN */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Tên bệnh tiếng Việt <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={form.nameVN}
              onChange={e => handleChange('nameVN', e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
            />
          </div>

          {/* Tên EN */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tên bệnh tiếng Anh</label>
            <input
              type="text"
              value={form.nameEN}
              onChange={e => handleChange('nameEN', e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
            />
          </div>

          {/* 2 cols */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nhóm bệnh (Chapter)</label>
              <input
                type="text"
                value={form.chapter}
                onChange={e => handleChange('chapter', e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Chuyên khoa</label>
              <input
                type="text"
                value={form.specialty}
                onChange={e => handleChange('specialty', e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
              />
            </div>
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mô tả</label>
            <textarea
              value={form.description}
              onChange={e => handleChange('description', e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none"
            />
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ghi chú BYT</label>
            <textarea
              value={form.note}
              onChange={e => handleChange('note', e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none"
            />
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
              <div className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${form.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
              <input type="checkbox" className="hidden" checked={form.isActive} onChange={e => handleChange('isActive', e.target.checked)} />
              <div>
                <p className="text-sm font-semibold text-slate-700">Còn hiệu lực</p>
                <p className="text-xs text-slate-500">{form.isActive ? 'Đang áp dụng' : 'Đã vô hiệu hóa'}</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
              <div className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${form.bhytCovered ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.bhytCovered ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
              <input type="checkbox" className="hidden" checked={form.bhytCovered} onChange={e => handleChange('bhytCovered', e.target.checked)} />
              <div>
                <p className="text-sm font-semibold text-slate-700">Thanh toán BHYT</p>
                <p className="text-xs text-slate-500">{form.bhytCovered ? 'Được thanh toán' : 'Không thanh toán'}</p>
              </div>
            </label>
          </div>

          {error && (
            <p className="text-rose-600 text-sm font-medium bg-rose-50 border border-rose-200 px-4 py-3 rounded-xl">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-slate-200 flex-shrink-0">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl font-medium transition-colors"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
}
