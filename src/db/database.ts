import Dexie, { Table } from 'dexie';
import { normalizeForSearch } from '../utils/stringUtils';

export interface ICDRecord {
  id?: number;
  code: string;
  nameVN: string;
  nameEN?: string;
  chapter?: string;
  chronic?: string;
  diseaseOf?: string;
  common?: string;
  yearDisease?: string;
  noBH?: string;
  outOfList?: string;
  specialty?: string;
  description?: string;
  version: string;
  isActive: boolean;
  searchString: string; // Normalized code + nameVN + nameEN
  note?: string;
  bhytCovered?: boolean;
  tagA2?: boolean;
}

export interface ICDTT06Record {
  id?: number;
  code: string;
  nameVN: string;
  nameEN?: string;
  notMainDisease?: string;
  notRecommendedMain?: string;
  requireSpecificCode?: string;
  deathCauseOnly?: string;
  femaleOnly?: string;
  maleOnly?: string;
  version: string;
  isActive: boolean;
  searchString: string;
}

export interface ICDTT06Filters {
  notMainDisease: boolean;
  notRecommendedMain: boolean;
  requireSpecificCode: boolean;
  deathCauseOnly: boolean;
  femaleOnly: boolean;
  maleOnly: boolean;
}

export interface ImportHistory {
  id?: number;
  version: string;
  importDate: Date;
  importer: string;
  recordsAdded: number;
  recordsUpdated: number;
  fileName: string;
}

export interface YHCTRecord {
  id?: number;
  code: string;
  nameYHCT: string;
  icd10Code: string;
  icd10Name: string;
  modernName: string;
  name: string;
  version: string;
  isActive: boolean;
  searchString: string;
}

export interface FacilityRecord {
  id?: number;
  code: string;
  name: string;
  route: string;
  level: string;
  grade: string;
  score: string;
  address: string;
  version: string;
  searchString: string;
}

export interface CLSRecord {
  id?: number;
  code: string;
  nameCLS: string;
  type: string;
  version: string;
  isActive: boolean;
  searchString: string;
}

export interface ICDCLSMapRecord {
  id?: number;
  icdCode: string;
  clsCode: string;
  relationType: 'DeXuat' | 'ChongChiDinh';
  priority: 'Cao' | 'TB' | 'Thap' | '';
  version: string;
  note?: string;
}

export interface ICDConflictRecord {
  id?: number;
  icd1Code: string;
  icd2Code: string;
  conflictType: 'Conflict' | 'Caution';
  note: string;
  version: string;
}

export interface DVKTTongHopRecord {
  id?: number;
  maTuongDuong: string;
  tenDVKTPheDuyet: string;
  tenDVKTGia: string;
  phanLoaiPTTT: string;
  donGia: number;
  ghiChu: string;
  hangDichVu: string;
  hieuLuc: string; // 'C├│' hoß║╖c 'Kh├┤ng'
  ngayCapNhat: string;
  searchString: string;
  version: string;
}

export interface ThuocQuocGiaRecord {
  id?: number;
  tenNhom: string;
  tenHoatChat: string;
  tenThuoc: string;
  donViTinh: string;
  hamLuong: string;
  maICD: string;
  chiDinh: string;
  chongChiDinh: string;
  ghiChu1: string;
  lieuDung: string;
  ghiChu2: string;
  searchString: string;
  version: string;
}


export interface TT25Record {
  id?: number;
  name: string;
  codes: string;
  resolvedNames?: string;
}
import { supabase } from './supabaseClient';

export class ICDDatabase extends Dexie {
  icds!: Table<ICDRecord, number>;
  icdTT06!: Table<ICDTT06Record, number>;
  yhcts!: Table<YHCTRecord, number>;
  facilities!: Table<FacilityRecord, number>;
  cls!: Table<CLSRecord, number>;
  icdClsMap!: Table<ICDCLSMapRecord, number>;
  icdConflict!: Table<ICDConflictRecord, number>;
  history!: Table<ImportHistory, number>;
  dvktTongHop!: Table<DVKTTongHopRecord, number>;
  thuocQuocGia!: Table<ThuocQuocGiaRecord, number>;
  tt25records!: Table<TT25Record, number>;

  constructor() {
    super('ICDDatabase');
    this.version(4).stores({
      icds: '++id, code, nameVN, chapter, version, isActive, searchString',
      yhcts: '++id, code, nameYHCT, icd10Code, searchString',
      facilities: '++id, code, name, address, searchString',
      cls: '++id, code, nameCLS, type, version, isActive, searchString',
      icdClsMap: '++id, [icdCode+clsCode], icdCode, clsCode, relationType',
      icdConflict: '++id, [icd1Code+icd2Code], icd1Code, icd2Code',
      history: '++id, version, importDate'
    });
    this.version(5).stores({
      dvktTongHop: '++id, maTuongDuong, tenDVKTPheDuyet, tenDVKTGia, phanLoaiPTTT, hieuLuc, searchString, version'
    });
    this.version(6).stores({
      thuocQuocGia: '++id, tenThuoc, tenHoatChat, searchString, version'
    });
    this.version(7).stores({
      icdTT06: '++id, code, searchString, version'
    });
  }

  async syncFromSupabase() {
    try {
      console.log('Tß║úi dß╗» liß╗çu tß╗½ Supabase...');
      const limitFetch = async (table: string) => {
        let allData: any[] = [];
        let from = 0;
        const step = 1000;
        while (true) {
          const { data, error } = await supabase.from(table).select('*').range(from, from + step - 1);
          if (error) throw error;
          if (!data || data.length === 0) break;
          allData = allData.concat(data);
          if (data.length < step) break;
          from += step;
        }
        return allData;
      };

      const promises = [
        limitFetch('icds').then(async (d) => { await this.icds.clear(); if(d.length) await this.icds.bulkAdd(d); }),
        limitFetch('cls').then(async (d) => { await this.cls.clear(); if(d.length) await this.cls.bulkAdd(d); }),
        limitFetch('icd_conflict').then(async (d) => { await this.icdConflict.clear(); if(d.length) await this.icdConflict.bulkAdd(d); }),
        limitFetch('icd_cls_map').then(async (d) => { await this.icdClsMap.clear(); if(d.length) await this.icdClsMap.bulkAdd(d); }),
        limitFetch('yhcts').then(async (d) => { await this.yhcts.clear(); if(d.length) await this.yhcts.bulkAdd(d); }),
        limitFetch('facilities').then(async (d) => { await this.facilities.clear(); if(d.length) await this.facilities.bulkAdd(d); }),
        limitFetch('dvkt_tong_hop').then(async (d) => { await this.dvktTongHop.clear(); if(d.length) await this.dvktTongHop.bulkAdd(d); }),
        limitFetch('thuoc_quoc_gia').then(async (d) => { await this.thuocQuocGia.clear(); if(d.length) await this.thuocQuocGia.bulkAdd(d); }),
        limitFetch('icd_tt06').then(async (d) => { await this.icdTT06.clear(); if(d.length) await this.icdTT06.bulkAdd(d); })
      ];
      
      await Promise.all(promises);
      console.log('Ho├án th├ánh lß║Ñy dß╗» liß╗çu Supabase v├áo Local!');
      return true;
    } catch (err) {
      console.error('Lß╗ùi lß║Ñy dß╗» liß╗çu Supabase:', err);
      return false;
    }
  }

  private async pushToSupabaseBatched(tableName: string, data: any[], version: string) {
      try {
          console.log(`Bß║»t ─æß║ºu ─æß║⌐y ${data.length} d├▓ng l├¬n Supabase bß║úng ${tableName}...`);
          let primaryKey = 'code';
          if (tableName === 'dvkt_tong_hop') primaryKey = 'maTuongDuong';
          if (tableName === 'thuoc_quoc_gia') primaryKey = 'tenThuoc';
          if (tableName === 'icd_cls_map') primaryKey = 'icdCode';
          if (tableName === 'icd_conflict') primaryKey = 'icd1Code';
          
          const allKeys = Array.from(new Set(data.map(r => r[primaryKey]).filter(Boolean)));
          const DELETE_CHUNK = 1000;
          for (let i = 0; i < allKeys.length; i += DELETE_CHUNK) {
             const keyChunk = allKeys.slice(i, i + DELETE_CHUNK);
             if (keyChunk.length > 0) {
                 await supabase.from(tableName).delete().in(primaryKey, keyChunk);
             }
          }
          
          const CHUNK = 500;
          for (let i = 0; i < data.length; i += CHUNK) {
              const chunk = data.slice(i, i + CHUNK).map(r => {
                  const copy = { ...r };
                  delete copy.id;
                  return copy;
              });
              
              const { error } = await supabase.from(tableName).insert(chunk);
              if (error) console.error(`[Supabase] Lß╗ùi insert bß║úng ${tableName}:`, error);
          }
          console.log(`─Éß║⌐y xong ${tableName}!`);
      } catch (e) {
          console.error('[Supabase] Lß╗ùi batch insert:', e);
      }
  }

  async searchDVKT(query: string, limit: number = 200): Promise<DVKTTongHopRecord[]> {
    const normalizedQuery = query ? normalizeForSearch(query) : '';
    const terms = normalizedQuery.split(' ').filter(t => t.length > 0);

    return await this.dvktTongHop
      .filter(record => {
        let matchTerms = true;
        if (terms.length > 0) {
            matchTerms = terms.every(term => record.searchString.includes(term));
        }
        return matchTerms;
      })
      .limit(limit)
      .toArray();
  }

  async search(query: string, activeFilter: 'all' | 'active' | 'inactive' | 'a2' = 'all', limit: number = 200): Promise<ICDRecord[]> {
    
    const normalizedQuery = query ? normalizeForSearch(query) : '';
    const terms = normalizedQuery.split(' ').filter(t => t.length > 0);

    return await this.icds
      .filter(record => {
        let matchActive = true;
        if (activeFilter === 'active') matchActive = record.isActive === true;
        if (activeFilter === 'inactive') matchActive = record.isActive === false;
        if (activeFilter === 'a2') matchActive = record.tagA2 === true;
        
        let matchTerms = true;
        if (terms.length > 0) {
            const d = normalizeForSearch(`${record.code} ${record.nameVN} ${record.nameEN || ''}`);
            matchTerms = terms.every(term => d.includes(term));
        }

        return matchActive && matchTerms;
      })
      .limit(limit)
      .toArray();
  }

  async importData(data: Partial<ICDRecord>[], version: string, importer: string, fileName: string) {
    let added = 0;
    let updated = 0;

    await this.transaction('rw', this.icds, this.history, async () => {
      const allExisting = await this.icds.toArray();
      const codeMap = new Map<string, ICDRecord[]>();
      
      for (const r of allExisting) {
         const key = r.code.replace(/\./g, '').toLowerCase();
         if (!codeMap.has(key)) codeMap.set(key, []);
         codeMap.get(key)!.push(r);
      }

      for (const item of data) {
        if (!item.code || !item.nameVN) continue;

        const normalizedKey = item.code.replace(/\./g, '').toLowerCase();
        const existingArr = codeMap.get(normalizedKey) || [];
        
        // Handle A2 imports
        if (item.tagA2) {
           if (existingArr.length > 0) {
              for (const ext of existingArr) {
                 await this.icds.update(ext.id!, { tagA2: true });
                 updated++;
              }
           } else {
              const searchString = normalizeForSearch(`${item.code} ${item.nameVN} ${item.nameEN || ''}`);
              const record: ICDRecord = {
                 code: item.code, nameVN: item.nameVN, nameEN: item.nameEN || '', chapter: item.chapter || '',
                 chronic: '', diseaseOf: '', common: '', yearDisease: '', noBH: '', outOfList: '',
                 specialty: '', description: '', version, isActive: true, searchString, note: item.note || '',
                 bhytCovered: true, tagA2: true
              };
              const newId = await this.icds.add(record);
              added++;
              codeMap.set(normalizedKey, [{ ...record, id: newId as number }]);
           }
           continue;
        }

        // Standard ICD imports - Need to keep multiple rows if they have different active statuses!
        let matched = existingArr.find(e => Boolean(e.isActive) === Boolean(item.isActive));
        
        let bestCode = item.code;
        if (matched && matched.code.includes('.') && !item.code.includes('.')) {
           bestCode = matched.code;
        }

        const searchString = normalizeForSearch(`${bestCode} ${item.nameVN} ${item.nameEN || ''}`);
        
        const record: ICDRecord = {
          code: bestCode,
          nameVN: item.nameVN,
          nameEN: item.nameEN || (matched ? matched.nameEN : '') || '',
          chapter: item.chapter || (matched ? matched.chapter : '') || '',
          chronic: item.chronic || '',
          diseaseOf: item.diseaseOf || '',
          common: item.common || '',
          yearDisease: item.yearDisease || '',
          noBH: item.noBH || '',
          outOfList: item.outOfList || '',
          specialty: item.specialty || '',
          description: item.description || '',
          version: version,
          isActive: item.isActive !== undefined ? item.isActive : true,
          searchString,
          note: item.note || '',
          bhytCovered: item.bhytCovered !== undefined ? item.bhytCovered : true,
          tagA2: matched ? matched.tagA2 : false,
        };

        if (matched && matched.id) {
          await this.icds.update(matched.id, record);
          updated++;
          // Update array with new contents
          Object.assign(matched, record);
        } else {
          const newId = await this.icds.add(record);
          added++;
          existingArr.push({ ...record, id: newId as number });
          if (!codeMap.has(normalizedKey)) codeMap.set(normalizedKey, existingArr);
        }
      }

      await this.history.add({
        version,
        importDate: new Date(),
        importer,
        recordsAdded: added,
        recordsUpdated: updated,
        fileName
      });
    });

    const allRecords = await this.icds.where('version').equals(version).toArray();
    this.pushToSupabaseBatched('icds', allRecords, version);

    return { added, updated };
  }

  async searchICDTT06(query: string, filters?: ICDTT06Filters, limit: number = 200): Promise<ICDTT06Record[]> {
    const normalizedQuery = query ? normalizeForSearch(query) : '';
    const terms = normalizedQuery.split(' ').filter(t => t.length > 0);

    return await this.icdTT06
      .filter(record => {
        if (filters) {
          const hasWarning = (val?: string) => {
            if (!val) return false;
            const s = val.trim().toLowerCase();
            return s.length > 0 && s !== 'kh├┤ng' && s !== '0' && s !== 'false';
          };
          if (filters.notMainDisease && !hasWarning(record.notMainDisease)) return false;
          if (filters.notRecommendedMain && !hasWarning(record.notRecommendedMain)) return false;
          if (filters.requireSpecificCode && !hasWarning(record.requireSpecificCode)) return false;
          if (filters.deathCauseOnly && !hasWarning(record.deathCauseOnly)) return false;
          if (filters.femaleOnly && !hasWarning(record.femaleOnly)) return false;
          if (filters.maleOnly && !hasWarning(record.maleOnly)) return false;
        }

        if (terms.length === 0) return true;
        const d = normalizeForSearch(`${record.code} ${record.nameVN} ${record.nameEN || ''}`);
        return terms.every(term => d.includes(term));
      })
      .limit(limit)
      .toArray();
  }

  async importICDTT06(data: Partial<ICDTT06Record>[], version: string, importer: string, fileName: string) {
    let added = 0;
    let updated = 0;

    await this.transaction('rw', this.icdTT06, this.history, async () => {
      for (const item of data) {
        if (!item.code || !item.nameVN) continue;

        const existing = await this.icdTT06.where('code').equals(item.code).first();
        const searchString = normalizeForSearch(`${item.code} ${item.nameVN} ${item.nameEN || ''}`);
        
        const record = { 
          ...item, 
          version, 
          searchString,
          isActive: item.isActive !== undefined ? item.isActive : true
        } as ICDTT06Record;

        if (existing && existing.id) {
          await this.icdTT06.update(existing.id, record);
          updated++;
        } else {
          await this.icdTT06.add(record);
          added++;
        }
      }

      await this.history.add({
        version,
        importDate: new Date(),
        importer,
        recordsAdded: added,
        recordsUpdated: updated,
        fileName
      });
    });

    const allRecords = await this.icdTT06.where('version').equals(version).toArray();
    this.pushToSupabaseBatched('icd_tt06', allRecords, version);
    
    return { added, updated };
  }

  async searchYHCT(query: string, activeFilter: 'all' | 'active' | 'inactive' | 'a2' = 'all', limit: number = 200): Promise<any[]> {
    const normalizedQuery = query ? normalizeForSearch(query) : '';
    const terms = normalizedQuery.split(' ').filter(t => t.length > 0);
    
    if (activeFilter === 'a2') {
       // if filtering by A2, we query from icds where tagA2 is true
       return await this.icds.filter(record => {
           if (!record.tagA2) return false;
           return terms.every(term => (record.searchString || normalizeForSearch(`${record.code} ${record.nameVN}`)).includes(term));
       }).limit(limit).toArray();
    }
    
    return await this.yhcts.filter(record => {
      let matchActive = true;
      if (activeFilter === 'active') matchActive = record.isActive === true;
      if (activeFilter === 'inactive') matchActive = record.isActive === false;
      
      let matchTerms = true;
      if (terms.length > 0) {
          matchTerms = terms.every(term => (record.searchString || '').includes(term));
      }
      return matchActive && matchTerms;
    }).limit(limit).toArray();
  }

  async searchFacilities(query: string, limit: number = 200): Promise<FacilityRecord[]> {
    const normalizedQuery = query ? normalizeForSearch(query) : '';
    const terms = normalizedQuery.split(' ').filter(t => t.length > 0);
    return await this.facilities.filter(record => {
      return terms.every(term => (record.searchString || '').includes(term));
    }).limit(limit).toArray();
  }

  async importYHCT(data: Partial<YHCTRecord>[], version: string, importer: string, fileName: string) {
    let added = 0;
    let updated = 0;
    await this.transaction('rw', this.yhcts, this.history, async () => {
      for (const item of data) {
        if (!item.code || !item.nameYHCT) continue;
        const existing = await this.yhcts.where('code').equals(item.code).first();
        const searchString = normalizeForSearch(`${item.code} ${item.nameYHCT} ${item.icd10Code || ''} ${item.icd10Name || ''} ${item.modernName || ''} ${item.name || ''}`);
        const record = { ...item, version, searchString } as YHCTRecord;
        if (existing && existing.id) {
          await this.yhcts.update(existing.id, record);
          updated++;
        } else {
          await this.yhcts.add(record);
          added++;
        }
      }
      await this.history.add({ version, importDate: new Date(), importer, recordsAdded: added, recordsUpdated: updated, fileName });
    });

    const allRecords = await this.yhcts.filter(r => r.version === version).toArray();
    this.pushToSupabaseBatched('yhcts', allRecords, version);

    return { added, updated };
  }

  async importFacilities(data: Partial<FacilityRecord>[], version: string, importer: string, fileName: string) {
    let added = 0;
    let updated = 0;
    await this.transaction('rw', this.facilities, this.history, async () => {
      for (const item of data) {
        if (!item.code || !item.name) continue;
        const existing = await this.facilities.where('code').equals(item.code).first();
        const searchString = normalizeForSearch(`${item.code} ${item.name} ${item.route || ''} ${item.address || ''}`);
        const record = { ...item, version, searchString } as FacilityRecord;
        if (existing && existing.id) {
          await this.facilities.update(existing.id, record);
          updated++;
        } else {
          await this.facilities.add(record);
          added++;
        }
      }
      await this.history.add({ version, importDate: new Date(), importer, recordsAdded: added, recordsUpdated: updated, fileName });
    });

    const allRecords = await this.facilities.filter(r => r.version === version).toArray();
    this.pushToSupabaseBatched('facilities', allRecords, version);

    return { added, updated };
  }

  async searchCLS(query: string, limit: number = 200): Promise<CLSRecord[]> {
    const normalizedQuery = query ? normalizeForSearch(query) : '';
    const terms = normalizedQuery.split(' ').filter(t => t.length > 0);
    return await this.cls.filter(record => {
      let matchTerms = true;
      if (terms.length > 0) {
          const d = normalizeForSearch(`${record.code} ${record.nameCLS}`);
          matchTerms = terms.every(term => d.includes(term));
      }
      return matchTerms && record.isActive;
    }).limit(limit).toArray();
  }

  async importCLS(data: Partial<CLSRecord>[], version: string, importer: string, fileName: string) {
    let added = 0;
    let updated = 0;
    await this.transaction('rw', this.cls, this.history, async () => {
      for (const item of data) {
        if (!item.code || !item.nameCLS) continue;
        const existing = await this.cls.where('code').equals(item.code).first();
        const searchString = normalizeForSearch(`${item.code} ${item.nameCLS} ${item.type || ''}`);
        const record = { ...item, version, searchString, isActive: item.isActive !== undefined ? item.isActive : true } as CLSRecord;
        if (existing && existing.id) {
          await this.cls.update(existing.id, record);
          updated++;
        } else {
          await this.cls.add(record);
          added++;
        }
      }
      await this.history.add({ version, importDate: new Date(), importer, recordsAdded: added, recordsUpdated: updated, fileName });
    });

    const allRecords = await this.cls.filter(r => r.version === version).toArray();
    this.pushToSupabaseBatched('cls', allRecords, version);

    return { added, updated };
  }

  async importDVKT(data: Partial<DVKTTongHopRecord>[], version: string, importer: string, fileName: string) {
    let added = 0;
    let updated = 0;
    await this.transaction('rw', this.dvktTongHop, this.history, async () => {
      for (const item of data) {
        if (!item.maTuongDuong) continue;
        const existing = await this.dvktTongHop.where('maTuongDuong').equals(item.maTuongDuong).first();
        const searchString = normalizeForSearch(`${item.maTuongDuong} ${item.tenDVKTPheDuyet || ''} ${item.tenDVKTGia || ''} ${item.donGia || ''}`);
        const record = { ...item, version, searchString } as DVKTTongHopRecord;
        if (existing && existing.id) {
          await this.dvktTongHop.update(existing.id, record);
          updated++;
        } else {
          await this.dvktTongHop.add(record);
          added++;
        }
      }
      await this.history.add({ version, importDate: new Date(), importer, recordsAdded: added, recordsUpdated: updated, fileName });
    });

    const allRecords = await this.dvktTongHop.filter(r => r.version === version).toArray();
    this.pushToSupabaseBatched('dvkt_tong_hop', allRecords, version);

    return { added, updated };
  }

  async importICDCLSMap(data: Partial<ICDCLSMapRecord>[], version: string, importer: string, fileName: string) {
    let added = 0;
    let updated = 0;
    await this.transaction('rw', this.icdClsMap, this.history, async () => {
      for (const item of data) {
        if (!item.icdCode || !item.clsCode) continue;
        const existing = await this.icdClsMap.where({ icdCode: item.icdCode, clsCode: item.clsCode }).first();
        const record = { ...item, version } as ICDCLSMapRecord;
        if (existing && existing.id) {
          await this.icdClsMap.update(existing.id, record);
          updated++;
        } else {
          await this.icdClsMap.add(record);
          added++;
        }
      }
      await this.history.add({ version, importDate: new Date(), importer, recordsAdded: added, recordsUpdated: updated, fileName });
    });

    const allRecords = await this.icdClsMap.filter(r => r.version === version).toArray();
    this.pushToSupabaseBatched('icd_cls_map', allRecords, version);

    return { added, updated };
  }

  async importICDConflict(data: Partial<ICDConflictRecord>[], version: string, importer: string, fileName: string) {
    let added = 0;
    let updated = 0;
    await this.transaction('rw', this.icdConflict, this.history, async () => {
      for (const item of data) {
        if (!item.icd1Code || !item.icd2Code) continue;
        // Check both directions
        const existing1 = await this.icdConflict.where({ icd1Code: item.icd1Code, icd2Code: item.icd2Code }).first();
        const existing2 = await this.icdConflict.where({ icd1Code: item.icd2Code, icd2Code: item.icd1Code }).first();
        const existing = existing1 || existing2;
        
        const record = { ...item, version } as ICDConflictRecord;
        if (existing && existing.id) {
          await this.icdConflict.update(existing.id, record);
          updated++;
        } else {
          await this.icdConflict.add(record);
          added++;
        }
      }
      await this.history.add({ version, importDate: new Date(), importer, recordsAdded: added, recordsUpdated: updated, fileName });
    });

    const allRecords = await this.icdConflict.filter(r => r.version === version).toArray();
    this.pushToSupabaseBatched('icd_conflict', allRecords, version);

    return { added, updated };
  }

  async searchThuocQuocGia(query: string, limit: number = 200): Promise<ThuocQuocGiaRecord[]> {
    const normalizedQuery = query ? normalizeForSearch(query) : '';
    const terms = normalizedQuery.split(' ').filter(t => t.length > 0);

    return await this.thuocQuocGia
      .filter(record => {
        let matchTerms = true;
        if (terms.length > 0) {
            matchTerms = terms.every(term => record.searchString.includes(term));
        }
        return matchTerms;
      })
      .limit(limit)
      .toArray();
  }

  async importThuocQuocGia(data: Partial<ThuocQuocGiaRecord>[], version: string, importer: string, fileName: string) {
    let added = 0;
    let updated = 0;
    await this.transaction('rw', this.thuocQuocGia, this.history, async () => {
      for (const item of data) {
        if (!item.tenThuoc) continue;
        const existing = await this.thuocQuocGia.where('tenThuoc').equals(item.tenThuoc).first();
        const searchString = normalizeForSearch(`${item.tenThuoc} ${item.tenHoatChat || ''} ${item.chiDinh || ''} ${item.chongChiDinh || ''} ${item.maICD || ''}`);
        const record = { ...item, version, searchString } as ThuocQuocGiaRecord;
        if (existing && existing.id) {
          await this.thuocQuocGia.update(existing.id, record);
          updated++;
        } else {
          await this.thuocQuocGia.add(record);
          added++;
        }
      }
      await this.history.add({ version, importDate: new Date(), importer, recordsAdded: added, recordsUpdated: updated, fileName });
    });

    const allRecords = await this.thuocQuocGia.filter(r => r.version === version).toArray();
    this.pushToSupabaseBatched('thuoc_quoc_gia', allRecords, version);

    return { added, updated };
  }

  async deleteHistoryAndData(historyId: number) {
    const historyRecord = await this.history.get(historyId);
    if (!historyRecord) return;
    const v = historyRecord.version;

    await this.transaction('rw', [this.history, this.icds, this.icdTT06, this.yhcts, this.facilities, this.cls, this.icdClsMap, this.icdConflict, this.dvktTongHop, this.thuocQuocGia], async () => {
      await this.icds.where('version').equals(v).delete();
      await this.icdTT06.where('version').equals(v).delete();
      await this.yhcts.filter(r => r.version === v).delete();
      await this.facilities.filter(r => r.version === v).delete();
      await this.cls.filter(r => r.version === v).delete();
      await this.icdClsMap.filter(r => r.version === v).delete();
      await this.icdConflict.filter(r => r.version === v).delete();
      await this.dvktTongHop.filter(r => r.version === v).delete();
      await this.thuocQuocGia.filter(r => r.version === v).delete();
      
      await this.history.delete(historyId);
    });

    try {
        console.log(`X├│a dß╗» liß╗çu version ${v} tr├¬n Supabase...`);
        await supabase.from('icds').delete().eq('version', v);
        await supabase.from('yhcts').delete().eq('version', v);
        await supabase.from('facilities').delete().eq('version', v);
        await supabase.from('cls').delete().eq('version', v);
        await supabase.from('icd_cls_map').delete().eq('version', v);
        await supabase.from('icd_conflict').delete().eq('version', v);
        await supabase.from('dvkt_tong_hop').delete().eq('version', v);
        await supabase.from('thuoc_quoc_gia').delete().eq('version', v);
    } catch (e) {
        console.error('Lß╗ùi khi x├│a tr├¬n Supabase:', e);
    }
  }
  async deleteAllData() {
    await this.transaction('rw', [this.history, this.icds, this.icdTT06, this.yhcts, this.facilities, this.cls, this.icdClsMap, this.icdConflict, this.dvktTongHop, this.thuocQuocGia], async () => {
      await this.icds.clear();
      await this.icdTT06.clear();
      await this.yhcts.clear();
      await this.facilities.clear();
      await this.cls.clear();
      await this.icdClsMap.clear();
      await this.icdConflict.clear();
      await this.dvktTongHop.clear();
      await this.thuocQuocGia.clear();
      await this.history.clear();
    });

    try {
        console.log(`X├│a TO├ÇN Bß╗ÿ dß╗» liß╗çu tr├¬n Supabase...`);
        await supabase.from('icds').delete().neq('code', 'xxxxxxxxxx');
        await supabase.from('yhcts').delete().neq('code', 'xxxxxxxxxx');
        await supabase.from('facilities').delete().neq('code', 'xxxxxxxxxx');
        await supabase.from('cls').delete().neq('code', 'xxxxxxxxxx');
        await supabase.from('icd_cls_map').delete().neq('icdCode', 'xxxxxxxxxx');
        await supabase.from('icd_conflict').delete().neq('icd1Code', 'xxxxxxxxxx');
        await supabase.from('dvkt_tong_hop').delete().neq('maTuongDuong', 'xxxxxxxxxx');
        await supabase.from('thuoc_quoc_gia').delete().neq('tenThuoc', 'xxxxxxxxxx');
    } catch (e) {
        console.error('Lß╗ùi khi x├│a tr├¬n Supabase:', e);
    }
  }
}

  async searchTT25Paged(query: string, page: number, pageSize: number) {
    const norm = query.trim().toLowerCase();
    let all: TT25Record[];
    if (!norm) {
      all = await this.tt25records.toArray();
    } else {
      all = await this.tt25records.filter(r =>
        r.name.toLowerCase().includes(norm) ||
        r.codes.toLowerCase().includes(norm) ||
        (r.resolvedNames ? r.resolvedNames.toLowerCase().includes(norm) : false)
      ).toArray();
    }
    const total = all.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const safeP = Math.min(Math.max(page, 1), totalPages);
    const records = all.slice((safeP - 1) * pageSize, safeP * pageSize);
    return { records, total, totalPages, page: safeP };
  }

  async addTT25Records(records: TT25Record[]) {
    await this.tt25records.bulkAdd(records);
  }

  async deleteTT25Record(id: number) {
    await this.tt25records.delete(id);
  }

  async clearTT25Records() {
    await this.tt25records.clear();
  }

export const db = new ICDDatabase();

// Removed sample data populate event to keep the database empty for fresh imports

