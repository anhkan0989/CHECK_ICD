import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { db, ICDRecord } from '../db/database';

export function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ added: number; updated: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState('v2024');
  const [importType, setImportType] = useState<'icd' | 'tt25'>('icd');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
    }
  };

  const processFile = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      let data: any[] = [];

      if (fileExt === 'csv') {
        const text = await file.text();
        const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
        data = parsed.data;
      } else if (fileExt === 'xlsx' || fileExt === 'xls') {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        data = XLSX.utils.sheet_to_json(worksheet);
      } else {
        throw new Error("Định dạng file không hỗ trợ. Vui lòng dùng CSV hoặc Excel.");
      }

      if (importType === 'tt25') {
        const mappedData = data.map((row: any) => {
          const codes = row['mabenh_icd10'] || row['Mã bệnh ICD10'] || row['Mã'];
          const name = row['tenbenh_icd10'] || row['Tên bệnh ICD10'] || row['Tên bệnh'];
          
          return {
            codes: codes ? String(codes).trim() : '',
            name: name ? String(name).trim() : '',
          };
        }).filter(item => item.codes && item.name);

        if (mappedData.length === 0) {
          throw new Error("Không tìm thấy dữ liệu hợp lệ. Yêu cầu cột 'mabenh_icd10' và 'tenbenh_icd10'.");
        }

        const res = await db.importTT25Data(mappedData, version, 'User', file.name);
        setResult(res);
      } else {
        // Map data to ICDRecord format
        const mappedData: Partial<ICDRecord>[] = data.map((row: any) => {
          // Try to find columns intelligently
          const code = row['Mã ICD'] || row['MaICD'] || row['Code'] || row['Mã bệnh'] || row['Mã'];
          const nameVN = row['Tên bệnh'] || row['TenBenh'] || row['NameVN'] || row['Tên tiếng Việt'] || row['Tên'];
          const nameEN = row['Tên tiếng Anh'] || row['NameEN'] || row['Tên TA'];
          const chapter = row['Chương'] || row['Chapter'] || row['Nhóm bệnh'] || row['Nhóm'];
          const note = row['Ghi chú'] || row['Note'] || row['Mô tả'];
          
          const chronic = row['Mãn tính'];
          const diseaseOf = row['Bệnh của'];
          const common = row['Thường gặp'];
          const yearDisease = row['Bệnh năm'];
          const noBH = row['Không BH'];
          const outOfList = row['Ngoài DS'];
          const specialty = row['Chuyên khoa'];
          const description = row['Mô tả'];
          
          // Hiệu lực column might be "Không", "Có" or something else
          const hieuLucRaw = row['Hiệu lực'];
          const isActive = hieuLucRaw ? (String(hieuLucRaw).trim().toLowerCase() !== 'không') : true;

          return {
            code: code ? String(code).trim() : '',
            nameVN: nameVN ? String(nameVN).trim() : '',
            nameEN: nameEN ? String(nameEN).trim() : '',
            chapter: chapter ? String(chapter).trim() : '',
            chronic: chronic ? String(chronic).trim() : '',
            diseaseOf: diseaseOf ? String(diseaseOf).trim() : '',
            common: common ? String(common).trim() : '',
            yearDisease: yearDisease ? String(yearDisease).trim() : '',
            noBH: noBH ? String(noBH).trim() : '',
            outOfList: outOfList ? String(outOfList).trim() : '',
            specialty: specialty ? String(specialty).trim() : '',
            description: description ? String(description).trim() : '',
            note: note ? String(note).trim() : '',
            isActive: isActive,
            bhytCovered: true, // Default true unless specified
          };
        }).filter(item => item.code && item.nameVN); // Filter out invalid rows

        if (mappedData.length === 0) {
          throw new Error("Không tìm thấy dữ liệu hợp lệ. Vui lòng kiểm tra lại cấu trúc cột (Mã ICD, Tên bệnh).");
        }

        const res = await db.importData(mappedData, version, 'User', file.name);
        setResult(res);
      }
      
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi trong quá trình xử lý file.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-900">Cập nhật danh mục ICD</h2>
        <p className="text-slate-500 mt-1">Import file Excel (.xlsx) hoặc CSV từ Bộ Y Tế để cập nhật database.</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Loại dữ liệu</label>
            <select
              value={importType}
              onChange={(e) => setImportType(e.target.value as 'icd' | 'tt25')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none bg-white"
            >
              <option value="icd">Danh mục ICD chung</option>
              <option value="tt25">Bệnh dài ngày (Thông tư 25)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phiên bản ICD</label>
            <input 
              type="text" 
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none"
              placeholder="VD: v2024"
            />
          </div>
        </div>

        {/* Upload Area */}
        <div 
          className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".csv, .xlsx, .xls" 
            className="hidden" 
          />
          
          {file ? (
            <div className="flex flex-col items-center">
              <FileSpreadsheet className="w-12 h-12 text-indigo-500 mb-3" />
              <p className="font-medium text-slate-900">{file.name}</p>
              <p className="text-sm text-slate-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              <button 
                className="mt-4 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
              >
                Chọn file khác
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-indigo-500" />
              </div>
              <p className="font-medium text-slate-900">Nhấn để chọn file hoặc kéo thả vào đây</p>
              <p className="text-sm text-slate-500 mt-1">Hỗ trợ .xlsx, .xls, .csv</p>
              
              <div className="mt-6 text-left bg-slate-50 p-4 rounded-lg border border-slate-200 w-full max-w-md">
                <p className="text-xs font-semibold text-slate-700 uppercase mb-2">Cấu trúc cột yêu cầu (có thể linh hoạt):</p>
                {importType === 'tt25' ? (
                  <ul className="text-sm text-slate-600 list-disc list-inside space-y-1 mt-2">
                    <li><span className="font-medium">mabenh_icd10</span> (bắt buộc) - VD: A06.1;A06.2</li>
                    <li><span className="font-medium">tenbenh_icd10</span> (bắt buộc) - VD: Bệnh do amip</li>
                  </ul>
                ) : (
                  <ul className="text-sm text-slate-600 list-disc list-inside space-y-1 max-h-32 overflow-y-auto mt-2">
                    <li><span className="font-medium">Mã</span> (bắt buộc)</li>
                    <li><span className="font-medium">Tên bệnh</span> (bắt buộc)</li>
                    <li>Nhóm bệnh, Mãn tính, Bệnh của, Thường gặp, Bệnh năm</li>
                    <li>Không BH, Ngoài DS, Chuyên khoa, Mô tả</li>
                    <li><span className="font-medium">Hiệu lực</span> (Có/Không)</li>
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end">
          <button
            onClick={processFile}
            disabled={!file || isProcessing}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg font-medium transition-colors"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Tiến hành Import
              </>
            )}
          </button>
        </div>

        {/* Results / Errors */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3 text-rose-800">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Lỗi Import</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3 text-emerald-800">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Import thành công!</p>
              <ul className="text-sm mt-1 list-disc list-inside">
                <li>Thêm mới: <strong>{result.added}</strong> mã</li>
                <li>Cập nhật: <strong>{result.updated}</strong> mã</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
