import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, Download } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { db, ICDRecord } from '../db/database';

export function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ added: number; updated: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState('v2026');
  const [importType, setImportType] = useState('icd');
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
        
        // Find header row automatically
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null, blankrows: true }) as any[][];
        let headerRowIndex = 0;
        let found = false;
        for (let i = 0; i < Math.min(50, rawData.length); i++) {
          const row = rawData[i];
          if (!row || !Array.isArray(row)) continue;
          
          const hasCode = row.some(cell => {
            if (cell == null) return false;
            const text = String(cell).trim().toLowerCase().normalize('NFC').replace(/\s+/g, '');
            return text === 'mã' || text === 'mãicd' || text === 'mãbệnh' || text === 'code' || text === 'ma' || text === 'macls' || text === 'icd' || text === 'icd1' || text === 'mãdvkt' || text === 'mãdvktcls' || text === 'ma_tuong_duong' || text === 'tênthuốc';
          });
          const hasName = row.some(cell => {
            if (cell == null) return false;
            const text = String(cell).trim().toLowerCase().normalize('NFC').replace(/\s+/g, '');
            return text.includes('tênbệnh') || text.includes('têntiếngviệt') || text.includes('tenbenh') || text === 'namevn' || text === 'tên' || text === 'tencls' || text === 'icd2' || text === 'mãcls' || text.includes('têndvkt') || text === 'ten_dvkt_pheduyet' || text === 'ten_dvkt_gia' || text === 'tênhoạtchất' || text === 'tênthuốc';
          });
          if (hasCode && hasName) {
            headerRowIndex = i;
            found = true;
            break;
          }
        }
        
        data = XLSX.utils.sheet_to_json(worksheet, { range: found ? headerRowIndex : 0 });
      } else {
        throw new Error("Định dạng file không hỗ trợ. Vui lòng dùng CSV hoặc Excel.");
      }

      // Map data to ICDRecord format
      let mappedData: any[] = [];
      
      if (importType === 'icd' || importType === 'a2') {
        const isA2Mode = importType === 'a2';
        mappedData = data.map((originalRow: any) => {
          const row: any = {};
          for (const key in originalRow) {
            if (Object.prototype.hasOwnProperty.call(originalRow, key)) {
              const cleanKey = key.trim().toLowerCase().normalize('NFC').replace(/\s+/g, '');
              row[cleanKey] = originalRow[key];
            }
          }
          let rawCode = row['mãicd'] || row['maicd'] || row['code'] || row['mãbệnh'] || row['mã'] || row['ma'];
          let code = rawCode ? String(rawCode).trim() : '';
          
          if (code && isA2Mode) {
             code = code.replace(/\./g, '').toLowerCase();
          }

          const nameVN = row['tênbệnh'] || row['tenbenh'] || row['namevn'] || row['têntiếngviệt'] || row['tên'] || row['tênbệnh(vn)'] || row['*'];
          const nameEN = row['têntiếnganh'] || row['nameen'] || row['tênta'] || row['tênbệnhtiếnganh'];
          const chapter = row['chương'] || row['chapter'] || row['nhómbệnh'] || row['nhóm'];
          const note = row['ghichú'] || row['note'] || row['môtả'];
          const hieuLucRaw = row['hiệulực'];
          const isActive = hieuLucRaw ? (String(hieuLucRaw).trim().toLowerCase() !== 'không' && String(hieuLucRaw).trim() !== '0') : true;

          return {
            code,
            nameVN: nameVN ? String(nameVN).trim() : '',
            nameEN: nameEN ? String(nameEN).trim() : '',
            chapter: chapter ? String(chapter).trim() : '',
            note: note ? String(note).trim() : '',
            isActive,
            bhytCovered: true,
            tagA2: isA2Mode,
          };
        }).filter((item: any) => item.code && item.nameVN);
      } else if (importType === 'icd_tt06') {
        mappedData = data.map((originalRow: any) => {
          const row: any = {};
          for (const key in originalRow) {
            if (Object.prototype.hasOwnProperty.call(originalRow, key)) {
              const cleanKey = key.trim().toLowerCase().normalize('NFC').replace(/\s+/g, '');
              row[cleanKey] = originalRow[key];
            }
          }
          let rawCode = row['mãbệnh'] || row['mãicd'] || row['code'] || row['mã'] || row['ma'];
          let code = rawCode ? String(rawCode).trim() : '';

          const nameVN = row['tênbệnh'] || row['tenbenh'] || row['tên'] || row['têntiếngviệt'] || '';
          const nameEN = row['diseasenamewho2019(english)'] || row['têntiếnganh'] || row['nameen'] || '';
          
          const notMainDisease = row['mãkhôngđượcdùnglàbệnhchính'] || '';
          const notRecommendedMain = row['mãkhôngkhuyếnkhíchdùnglàbệnhchính'] || '';
          const requireSpecificCode = row['mãkhôngđượcsửdụngvìcómã4hoặc5kýtựcụthểhơn'] || '';
          const deathCauseOnly = row['chỉsửdụngmãhóanguyênnhântửvong'] || '';
          const femaleOnly = row['cácmãbệnhchỉcóhoặcchủyếucóởnữgiới'] || '';
          const maleOnly = row['cácmãbệnhchỉcóhoặcchủyếucóởnamgiới'] || '';

          return {
            code,
            nameVN: nameVN ? String(nameVN).trim() : '',
            nameEN: nameEN ? String(nameEN).trim() : '',
            notMainDisease: String(notMainDisease).trim(),
            notRecommendedMain: String(notRecommendedMain).trim(),
            requireSpecificCode: String(requireSpecificCode).trim(),
            deathCauseOnly: String(deathCauseOnly).trim(),
            femaleOnly: String(femaleOnly).trim(),
            maleOnly: String(maleOnly).trim(),
            isActive: true
          };
        }).filter((item: any) => item.code && item.nameVN);
      } else if (importType === 'yhct') {
        mappedData = data.map((originalRow: any) => {
          const row: any = {};
          for (const key in originalRow) {
            if (Object.prototype.hasOwnProperty.call(originalRow, key)) {
              const cleanKey = key.trim().toLowerCase().normalize('NFC').replace(/\s+/g, '');
              row[cleanKey] = originalRow[key];
            }
          }
          let rawCode = row['mã'] || row['ma'];
          const hieuLucRaw = row['hiệulực'];
          const isActive = hieuLucRaw ? (String(hieuLucRaw).trim().toLowerCase() !== 'không' && String(hieuLucRaw).trim() !== '0') : true;
          
          return {
            code: rawCode ? String(rawCode).trim() : '',
            nameYHCT: row['tênbệnhyhct'] ? String(row['tênbệnhyhct']).trim() : '',
            icd10Code: row['mãicd10'] ? String(row['mãicd10']).trim() : '',
            icd10Name: row['tênicd10'] ? String(row['tênicd10']).trim() : '',
            modernName: row['tênhiệnđại'] ? String(row['tênhiệnđại']).trim() : '',
            name: row['tên'] ? String(row['tên']).trim() : '',
            isActive
          };
        }).filter((item: any) => item.code && item.nameYHCT);
      } else if (importType === 'facility') {
        mappedData = data.map((originalRow: any) => {
          const row: any = {};
          for (const key in originalRow) {
            if (Object.prototype.hasOwnProperty.call(originalRow, key)) {
              const cleanKey = key.trim().toLowerCase().normalize('NFC').replace(/\s+/g, '');
              row[cleanKey] = originalRow[key];
            }
          }
          let rawCode = row['mã'] || row['ma'];
          return {
            code: rawCode ? String(rawCode).trim() : '',
            name: row['tên'] ? String(row['tên']).trim() : '',
            route: row['tuyếncmkt'] ? String(row['tuyếncmkt']).trim() : '',
            level: row['hạngbệnhviện'] ? String(row['hạngbệnhviện']).trim() : '',
            grade: row['cấpcmkt'] ? String(row['cấpcmkt']).trim() : '',
            score: row['điểm'] ? String(row['điểm']).trim() : '',
            address: row['địachỉ'] ? String(row['địachỉ']).trim() : '',
          };
        }).filter((item: any) => item.code && item.name);
      } else if (importType === 'cls') {
        mappedData = data.map((originalRow: any) => {
          const row: any = {};
          for (const key in originalRow) {
            if (Object.prototype.hasOwnProperty.call(originalRow, key)) {
              const cleanKey = key.trim().toLowerCase().normalize('NFC').replace(/\s+/g, '');
              row[cleanKey] = originalRow[key];
            }
          }
          let code = row['mãdvktcls'] || row['mãdvkt'] || row['mã'] || row['macls'] || row['code'] || '';
          const nameCLS = row['têndvktcls'] || row['têndvkt'] || row['tên'] || row['tencls'] || row['têndịchvụ'] || '';
          const type = row['loại'] || row['nhóm'] || row['type'] || '';
          const hieuLucRaw = row['hiệulực'] || row['isactive'];
          const isActive = hieuLucRaw ? (String(hieuLucRaw).trim().toLowerCase() !== 'không' && String(hieuLucRaw).trim() !== '0') : true;

          return { code: String(code).trim(), nameCLS: String(nameCLS).trim(), type: String(type).trim(), isActive };
        }).filter((item: any) => item.code && item.nameCLS);
      } else if (importType === 'icd_cls_map') {
        data.forEach((originalRow: any) => {
          const row: any = {};
          for (const key in originalRow) {
            if (Object.prototype.hasOwnProperty.call(originalRow, key)) {
              const cleanKey = key.trim().toLowerCase().normalize('NFC').replace(/\s+/g, '');
              row[cleanKey] = originalRow[key];
            }
          }
          // Support old flattened format
          let rawIcd = row['mãicd'] || row['icd'] || '';
          let rawClsFlattened = row['mãcls'] || row['cls'] || '';
          
          if (rawIcd && rawClsFlattened) {
             let relationType = row['loạiquanhệ'] || row['loạiquytắc'] || row['relation'] || 'DeXuat';
             let rt = 'DeXuat';
             const relLower = String(relationType).toLowerCase().replace(/\s+/g, '');
             if (relLower.includes('chống') || relLower.includes('contra') || relLower.includes('chongchidinh') || relLower.includes('chong')) {
               rt = 'ChongChiDinh';
             }
             let priority = row['mứcđộ'] || row['ưutiên'] || row['priority'] || '';
             let p = 'TB';
             if (String(priority).toLowerCase().includes('cao')) p = 'Cao';
             else if (String(priority).toLowerCase().includes('thấp')) p = 'Thap';

             const icds = String(rawIcd).split(';').map(s => s.trim()).filter(Boolean);
             const clss = String(rawClsFlattened).split(';').map(s => s.trim()).filter(Boolean);
             for (const i1 of icds) {
                 for (const c1 of clss) {
                     mappedData.push({ icdCode: i1, clsCode: c1, relationType: rt, priority: p });
                 }
             }
             return;
          }
          
          // Support new grouped template format (Mau_ChiDinh_ICD_CLS.xlsx)
          const rawCls = row['mãcls'] || row['mãdvkt'] || row['cls'] || row['mã'] || '';
          if (!rawCls) return;

          const rawChongChiDinh = row['icd_dchong_chi_dinh'] || row['icddchongchidinh'] || row['chốngchỉđịnh'] || row['chongchidinh'] || '';
          const rawDeXuat = row['icd_de_xuat'] || row['icddexuat'] || row['đềxuất'] || row['dexuat'] || '';
          const note = row['ghichútriệuchứng'] || row['ghichú'] || row['note'] || '';

          const clss = String(rawCls).split(';').map(s => s.trim().toUpperCase()).filter(Boolean);
          const icdsChongChiDinh = String(rawChongChiDinh).split(';').map(s => s.trim().toUpperCase()).filter(Boolean);
          const icdsDeXuat = String(rawDeXuat).split(';').map(s => s.trim().toUpperCase()).filter(Boolean);

          for (const cCode of clss) {
              for (const iCode of icdsChongChiDinh) {
                  mappedData.push({ icdCode: iCode, clsCode: cCode, relationType: 'ChongChiDinh', priority: 'TB', note: String(note).trim() });
              }
              for (const iCode of icdsDeXuat) {
                  mappedData.push({ icdCode: iCode, clsCode: cCode, relationType: 'DeXuat', priority: 'TB', note: String(note).trim() });
              }
          }
        });
      } else if (importType === 'icd_conflict') {
        data.forEach((originalRow: any) => {
          const row: any = {};
          for (const key in originalRow) {
            if (Object.prototype.hasOwnProperty.call(originalRow, key)) {
              const cleanKey = key.trim().toLowerCase().normalize('NFC').replace(/\s+/g, '');
              row[cleanKey] = originalRow[key];
            }
          }
          let rawIcd1 = row['icd1'] || row['mãicd1'] || '';
          let rawIcd2 = row['icd2'] || row['mãicd2'] || '';
          if (!rawIcd1 || !rawIcd2) return;

          let type = row['loại'] || row['type'] || 'Conflict';
          let ct = 'Conflict';
          if (String(type).toLowerCase().includes('caution') || String(type).toLowerCase().includes('cảnh')) {
             ct = 'Caution';
          }
          let note = row['ghichú'] || row['note'] || '';
          
          const icds1 = String(rawIcd1).split(';').map(s => s.trim()).filter(Boolean);
          const icds2 = String(rawIcd2).split(';').map(s => s.trim()).filter(Boolean);
          for (const i1 of icds1) {
              for (const i2 of icds2) {
                  if (i1 !== i2) {
                      mappedData.push({ icd1Code: i1, icd2Code: i2, conflictType: ct, note: String(note).trim() });
                  }
              }
          }
        });
      } else if (importType === 'dvkt_tong_hop') {
        mappedData = data.map((originalRow: any) => {
          const row: any = {};
          for (const key in originalRow) {
            if (Object.prototype.hasOwnProperty.call(originalRow, key)) {
              const cleanKey = key.trim().toLowerCase().normalize('NFC').replace(/\s+/g, '');
              row[cleanKey] = originalRow[key];
            }
          }
          let code = row['ma_tuong_duong'] || row['mãdvkt'] || row['mã'] || row['code'] || '';
          const name1 = row['ten_dvkt_pheduyet'] || row['têndvktphêduyệt'] || '';
          const name2 = row['ten_dvkt_gia'] || row['têndvktgiá'] || row['têndvkt'] || '';
          const type = row['phan_loai_pttt'] || row['loạittpt'] || '';
          const price = row['don_gia'] || row['đơngiá'] || 0;
          const note = row['ghi_chu'] || row['ghichú'] || '';
          const hang = row['hangdichvu'] || row['hạngdịchvụ'] || '';
          const hieuLucRaw = row['hieuluc'] || row['hiệulực'];
          const hieuLuc = hieuLucRaw ? String(hieuLucRaw) : 'Có';
          const date = row['ngay_capnhat'] || row['ngàycậpnhật'] || '';

          return { 
             maTuongDuong: String(code).trim(), 
             tenDVKTPheDuyet: String(name1).trim(), 
             tenDVKTGia: String(name2).trim(), 
             phanLoaiPTTT: String(type).trim(), 
             donGia: Number(price) || 0,
             ghiChu: String(note).trim(),
             hangDichVu: String(hang).trim(),
             hieuLuc: hieuLuc,
             ngayCapNhat: String(date).trim()
          };
        }).filter((item: any) => item.maTuongDuong);
      } else if (importType === 'thuoc_quoc_gia') {
        mappedData = data.map((originalRow: any) => {
          const row: any = {};
          for (const key in originalRow) {
            if (Object.prototype.hasOwnProperty.call(originalRow, key)) {
              const cleanKey = key.trim().toLowerCase().normalize('NFC').replace(/\s+/g, '');
              row[cleanKey] = originalRow[key];
            }
          }
          const tenNhom = row['tênnhóm'] || row['tennhom'] || '';
          const tenHoatChat = row['tênhoạtchất'] || row['tenhoatchat'] || '';
          const tenThuoc = row['tênthuốc'] || row['tenthuoc'] || '';
          const donViTinh = row['đơnvịtính'] || row['donvitinh'] || '';
          const hamLuong = row['hàmlượng'] || row['hamluong'] || '';
          const maICD = row['mãicd'] || row['maicd'] || '';
          const chiDinh = row['chỉđịnh'] || row['chidinh'] || '';
          const chongChiDinh = row['ccđ'] || row['ccd'] || row['chốngchỉđịnh'] || '';
          const ghiChu1 = row['ghichú1'] || row['ghichu1'] || '';
          const lieuDung = row['liềudùng'] || row['lieudung'] || '';
          const ghiChu2 = row['ghichú2'] || row['ghichu2'] || '';

          return { 
             tenNhom: String(tenNhom).trim(), 
             tenHoatChat: String(tenHoatChat).trim(), 
             tenThuoc: String(tenThuoc).trim(), 
             donViTinh: String(donViTinh).trim(), 
             hamLuong: String(hamLuong).trim(),
             maICD: String(maICD).trim(),
             chiDinh: String(chiDinh).trim(),
             chongChiDinh: String(chongChiDinh).trim(),
             ghiChu1: String(ghiChu1).trim(),
             lieuDung: String(lieuDung).trim(),
             ghiChu2: String(ghiChu2).trim()
          };
        }).filter((item: any) => item.tenThuoc);
      } else if (importType === 'tt25') {
        mappedData = [];
        for (const originalRow of data) {
          const row: any = {};
          for (const key in originalRow) {
            if (Object.prototype.hasOwnProperty.call(originalRow, key)) {
              const cleanKey = key.trim().toLowerCase().normalize('NFC').replace(/\s+/g, '');
              row[cleanKey] = originalRow[key];
            }
          }
          const rawCodes = row['mãbệnhicd10'] || row['mabenhicd10'] || row['mãbệnh_icd10'] || row['mabenh_icd10'] || row['mãicd10'] || row['maicd10'] || row['mãicd'] || row['mã'] || row['code'] || '';
          const codesStr = String(rawCodes).trim();
          if (!codesStr) continue;

          const codeList = codesStr.split(';').map(c => c.trim()).filter(Boolean);
          if (codeList.length === 0) continue;

          let groupName = `Nhóm bệnh ${codeList[0]}`;
          const firstCode = codeList[0];
          try {
             const icd = await db.icdTT06.where('code').equalsIgnoreCase(firstCode).first() 
                         || await db.icds.where('code').equalsIgnoreCase(firstCode).first();
             if (icd && icd.nameVN) {
                groupName = icd.nameVN;
             }
          } catch (e) {
             console.warn("Lỗi tra cứu tên TT06 cho mã", firstCode, e);
          }

          const resolved: { code: string; nameVN: string }[] = [];
          for (const code of codeList) {
             try {
                const icd = await db.icdTT06.where('code').equalsIgnoreCase(code).first() 
                            || await db.icds.where('code').equalsIgnoreCase(code).first();
                resolved.push({ code, nameVN: icd?.nameVN || '' });
             } catch(e) {
                resolved.push({ code, nameVN: '' });
             }
          }

          mappedData.push({
             name: groupName,
             codes: codesStr,
             resolvedNames: JSON.stringify(resolved)
          });
        }
      }

      if (mappedData.length === 0) {
        throw new Error("Không tìm thấy dữ liệu hợp lệ. Vui lòng kiểm tra lại cấu trúc cột theo chuẩn.");
      }

      let res;
      if (importType === 'yhct') {
        res = await db.importYHCT(mappedData, version, 'User', file.name);
      } else if (importType === 'icd_tt06') {
        res = await db.importICDTT06(mappedData, version, 'User', file.name);
      } else if (importType === 'facility') {
        res = await db.importFacilities(mappedData, version, 'User', file.name);
      } else if (importType === 'cls') {
        res = await db.importCLS(mappedData, version, 'User', file.name);
      } else if (importType === 'icd_cls_map') {
        res = await db.importICDCLSMap(mappedData, version, 'User', file.name);
      } else if (importType === 'icd_conflict') {
        res = await db.importICDConflict(mappedData, version, 'User', file.name);
      } else if (importType === 'dvkt_tong_hop') {
        res = await db.importDVKT(mappedData, version, 'User', file.name);
      } else if (importType === 'thuoc_quoc_gia') {
        res = await db.importThuocQuocGia(mappedData, version, 'User', file.name);
      } else if (importType === 'tt25') {
        await db.clearTT25Records();
        await db.addTT25Records(mappedData);
        res = { added: mappedData.length, updated: 0 };
      } else {
        res = await db.importData(mappedData, version, 'User', file.name);
      }
      
      setResult(res);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi trong quá trình xử lý file.");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    let wb = XLSX.utils.book_new();
    let wsData: any[][] = [];
    let filename = "";

    if (importType === 'icd_cls_map') {
        wsData = [
            ["Mã ICD", "Mã CLS", "Tên CLS", "Loại quy tắc"],
            ["J18.0 ; J18.9", "XN01", "Xét nghiệm máu", "ChongChiDinh"],
            ["K20", "SA01 ; SA02", "Siêu âm nội soi", "DeXuat"]
        ];
        filename = "Mau_ChiDinh_ICD_CLS.xlsx";
    } else if (importType === 'icd_conflict') {
        wsData = [
            ["Mã ICD 1", "Mã ICD 2", "Loại xung đột", "Ghi chú"],
            ["J18.0 ; K20", "B01.0", "Conflict", "Chống chỉ định chung"],
            ["A01.0", "B02.0 ; B02.1", "Caution", "Thận trọng khi thực hiện"]
        ];
        filename = "Mau_XungDot_ICD.xlsx";
    } else if (importType === 'dvkt_tong_hop') {
        wsData = [
            ["MA_TUONG_DUONG", "TEN_DVKT_PHEDUYET", "TEN_DVKT_GIA", "PHAN_LOAI_PTTT", "DON_GIA", "GHI_CHU", "HANGDICHVU", "HIEULUC", "NGAY_CAPNHAT"],
            ["03.3242.0408", "Phẫu thuật cắt phổi biệt lập ngoài thùy phổi", "Phẫu thuật cắt phổi biệt lập ngoài thùy phổi", "P1", 9583300, "Chưa bao gồm máy cắt...", "", "Có", ""]
        ];
        filename = "Mau_Danh_Muc_DVKT_Tong_Hop.xlsx";
    } else if (importType === 'thuoc_quoc_gia') {
        wsData = [
            ["tên nhóm", "TÊN HOẠT CHẤT", "TÊN THUỐC", "ĐƠN VỊ TÍNH", "HÀM LƯỢNG", "MÃ ICD", "CHỈ ĐỊNH", "CCĐ", "ghi chú 1", "LIỀU DÙNG", "GHI CHÚ 2"],
            ["", "Metformin", "Metformin XR 500", "Viên", "500mg", "E11.9", "Giảm nguy cơ", "Suy thận", "", "1 viên/ngày", ""]
        ];
        filename = "Mau_Danh_Muc_Thuoc.xlsx";
    } else if (importType === 'tt25') {
        wsData = [
            ["STT", "mabenh_icd10"],
            ["1", "A06.1;A06.2;A06.3;A06.4"],
            ["2", "A15;A16;A17;A18;A19"]
        ];
        filename = "Mau_Danh_Muc_TT25.xlsx";
    } else {
        wsData = [
            ["Mã", "Tên bệnh", "Hiệu lực"],
            ["A00", "Bệnh tả", "Có"],
            ["A01", "Bệnh thương hàn", "Có"]
        ];
        filename = "Mau_Import_Danh_Muc.xlsx";
    }
    
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    if (importType === 'icd_cls_map') ws['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 20 }];
    else if (importType === 'icd_conflict') ws['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, filename);
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Phiên bản ICD</label>
            <input 
              type="text" 
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none"
              placeholder="VD: v2024"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="block text-sm font-medium text-slate-700">Loại dữ liệu</label>
            <select
              value={importType}
              onChange={(e) => setImportType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none"
            >
              <option value="icd">Danh mục ICD Tiêu chuẩn</option>
              <option value="a2">Phụ lục A2 (QĐ 4469/BYT)</option>
              <option value="icd_tt06">Danh mục ICD TT06/2026/BYT</option>
              <option value="tt25">Danh sách bệnh dài ngày (TT25)</option>
              <option value="yhct">Danh mục ICD Y Học Cổ Truyền</option>
              <option value="facility">Danh sách CSKCB</option>
              <option value="dvkt_tong_hop">Danh mục DVKT Tổng hợp (Giá, Phân loại...)</option>
              <option value="thuoc_quoc_gia">Danh mục Thuốc (Hoạt chất, CĐ, CCĐ...)</option>
              <option value="cls">Danh mục Cận Lâm Sàng (CLS)</option>
              <option value="icd_cls_map">Mapping: Đề xuất / Chống chỉ định CLS</option>
              <option value="icd_conflict">Xung đột ICD (Conflict / Caution)</option>
            </select>
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
                {importType === 'icd_cls_map' ? (
                  <ul className="text-sm text-slate-600 list-disc list-inside space-y-1 max-h-32 overflow-y-auto mt-2">
                    <li><span className="font-medium">Mã ICD</span> (VD: J18.0)</li>
                    <li><span className="font-medium">Mã CLS</span> (VD: XN01)</li>
                    <li><span className="font-medium">Loại quy tắc</span>: Nhập <code className="bg-white px-1 border border-slate-200">DeXuat</code> hoặc <code className="bg-white px-1 border border-slate-200">ChongChiDinh</code></li>
                    <li><span className="font-medium">Tên CLS</span> (tùy chọn)</li>
                    <li><span className="font-medium">Mức độ ưu tiên</span> (tùy chọn)</li>
                  </ul>
                ) : importType === 'icd_conflict' ? (
                  <ul className="text-sm text-slate-600 list-disc list-inside space-y-1 max-h-32 overflow-y-auto mt-2">
                    <li><span className="font-medium">Mã ICD 1</span> (bắt buộc)</li>
                    <li><span className="font-medium">Mã ICD 2</span> (bắt buộc)</li>
                    <li><span className="font-medium">Loại xung đột</span>: <code className="bg-white px-1 border border-slate-200">Conflict</code> hoặc <code className="bg-white px-1 border border-slate-200">Caution</code></li>
                    <li><span className="font-medium">Ghi chú</span> (tùy chọn)</li>
                  </ul>
                ) : (
                  <ul className="text-sm text-slate-600 list-disc list-inside space-y-1 max-h-32 overflow-y-auto mt-2">
                    <li><span className="font-medium">Mã</span> (bắt buộc)</li>
                    <li><span className="font-medium">Tên bệnh / Dịch vụ</span> (bắt buộc)</li>
                    <li>Nhóm bệnh, Mãn tính, ...</li>
                    <li><span className="font-medium">Hiệu lực</span> (Có/Không)</li>
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
          >
            <Download className="w-5 h-5" /> Tải Mẫu Gợi Ý
          </button>

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
