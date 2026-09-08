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

export interface TT25Record {
  id?: number;
  codes: string; // e.g. A06.1;A06.2
  name: string; // e.g. Bệnh do amip
  searchString: string;
  resolvedNames?: string; // JSON: [{code:"A06.1", nameVN:"..."}]
}

export class ICDDatabase extends Dexie {
  icds!: Table<ICDRecord, number>;
  history!: Table<ImportHistory, number>;
  tt25!: Table<TT25Record, number>;

  constructor() {
    super('ICDDatabase');
    this.version(1).stores({
      icds: '++id, &code, nameVN, chapter, version, isActive, searchString',
      history: '++id, version, importDate'
    });
    this.version(2).stores({
      icds: '++id, &code, nameVN, chapter, version, isActive, searchString',
      history: '++id, version, importDate',
      tt25: '++id, codes, name, searchString'
    });
    this.version(3).stores({
      icds: '++id, &code, nameVN, chapter, version, isActive, searchString',
      history: '++id, version, importDate',
      tt25: '++id, codes, name, searchString, resolvedNames'
    });
  }

  // ─── ICD Search with Pagination ──────────────────────────────────────────

  async searchPaged(
    query: string,
    activeFilter: 'all' | 'active' | 'inactive' = 'all',
    page: number = 1,
    pageSize: number = 50
  ): Promise<{ records: ICDRecord[]; total: number; page: number; pageSize: number; totalPages: number }> {
    const normalizedQuery = query ? normalizeForSearch(query) : '';
    const terms = normalizedQuery.split(' ').filter(t => t.length > 0);
    const hasFilter = terms.length > 0 || activeFilter !== 'all';

    if (!hasFilter) {
      return { records: [], total: 0, page: 1, pageSize, totalPages: 0 };
    }

    const filtered = await this.icds
      .filter(record => {
        let matchActive = true;
        if (activeFilter === 'active') matchActive = record.isActive === true;
        if (activeFilter === 'inactive') matchActive = record.isActive === false;
        let matchTerms = true;
        if (terms.length > 0) {
          matchTerms = terms.every(term => record.searchString.includes(term));
        }
        return matchActive && matchTerms;
      })
      .toArray();

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * pageSize;
    const records = filtered.slice(start, start + pageSize);

    return { records, total, page: safePage, pageSize, totalPages };
  }

  // Legacy (used in auto-update flow)
  async search(query: string, activeFilter: 'all' | 'active' | 'inactive' = 'all', limit: number = 50): Promise<ICDRecord[]> {
    if (!query && activeFilter === 'all') return [];
    const normalizedQuery = query ? normalizeForSearch(query) : '';
    const terms = normalizedQuery.split(' ').filter(t => t.length > 0);
    return await this.icds
      .filter(record => {
        let matchActive = true;
        if (activeFilter === 'active') matchActive = record.isActive === true;
        if (activeFilter === 'inactive') matchActive = record.isActive === false;
        let matchTerms = true;
        if (terms.length > 0) {
          matchTerms = terms.every(term => record.searchString.includes(term));
        }
        return matchActive && matchTerms;
      })
      .limit(limit)
      .toArray();
  }

  // ─── ICD CRUD ─────────────────────────────────────────────────────────────

  async updateRecord(id: number, data: Partial<ICDRecord>): Promise<void> {
    const existing = await this.icds.get(id);
    if (!existing) throw new Error('Record not found');
    const merged = { ...existing, ...data };
    merged.searchString = normalizeForSearch(`${merged.code} ${merged.nameVN} ${merged.nameEN || ''}`);
    await this.icds.update(id, merged);
  }

  async deleteRecord(id: number): Promise<void> {
    await this.icds.delete(id);
  }

  // ─── TT25 Search with Pagination ──────────────────────────────────────────

  async searchTT25Paged(
    query: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<{ records: TT25Record[]; total: number; page: number; pageSize: number; totalPages: number }> {
    let filtered: TT25Record[];

    if (!query) {
      filtered = await this.tt25.toArray();
    } else {
      const normalizedQuery = normalizeForSearch(query);
      const terms = normalizedQuery.split(' ').filter(t => t.length > 0);
      filtered = await this.tt25
        .filter(record => terms.every(term => record.searchString.includes(term)))
        .toArray();
    }

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * pageSize;
    const records = filtered.slice(start, start + pageSize);

    return { records, total, page: safePage, pageSize, totalPages };
  }

  // Legacy
  async searchTT25(query: string, limit: number = 50): Promise<TT25Record[]> {
    if (!query) return await this.tt25.limit(limit).toArray();
    const normalizedQuery = normalizeForSearch(query);
    const terms = normalizedQuery.split(' ').filter(t => t.length > 0);
    return await this.tt25
      .filter(record => terms.every(term => record.searchString.includes(term)))
      .limit(limit)
      .toArray();
  }

  // ─── TT25 CRUD ────────────────────────────────────────────────────────────

  async deleteTT25Record(id: number): Promise<void> {
    await this.tt25.delete(id);
  }

  // ─── TT25 Import with ICD Cross-reference ─────────────────────────────────

  async importTT25Data(data: Partial<TT25Record>[], version: string, importer: string, fileName: string) {
    let added = 0;

    await this.transaction('rw', this.tt25, this.history, async () => {
      await this.tt25.clear();

      const records: TT25Record[] = [];

      for (const item of data) {
        const codesStr = item.codes || '';
        const name = item.name || '';

        // Split codes and resolve names from icds table
        const codeList = codesStr.split(';').map(c => c.trim()).filter(c => c.length > 0);
        const resolved: { code: string; nameVN: string }[] = [];

        for (const code of codeList) {
          const icdRecord = await this.icds.where('code').equals(code).first();
          resolved.push({ code, nameVN: icdRecord?.nameVN || '' });
        }

        records.push({
          codes: codesStr,
          name,
          searchString: normalizeForSearch(`${codesStr} ${name}`),
          resolvedNames: JSON.stringify(resolved),
        });
      }

      await this.tt25.bulkAdd(records);
      added = records.length;

      await this.history.add({
        version: version + ' (TT25)',
        importDate: new Date(),
        importer,
        recordsAdded: added,
        recordsUpdated: 0,
        fileName,
      });
    });

    return { added, updated: 0 };
  }

  // ─── ICD Import ────────────────────────────────────────────────────────────

  async importData(data: Partial<ICDRecord>[], version: string, importer: string, fileName: string) {
    let added = 0;
    let updated = 0;

    await this.transaction('rw', this.icds, this.history, async () => {
      for (const item of data) {
        if (!item.code || !item.nameVN) continue;

        const existing = await this.icds.where('code').equals(item.code).first();
        const searchString = normalizeForSearch(`${item.code} ${item.nameVN} ${item.nameEN || ''}`);

        const record: ICDRecord = {
          code: item.code,
          nameVN: item.nameVN,
          nameEN: item.nameEN || '',
          chapter: item.chapter || '',
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
          searchString: searchString,
          note: item.note || '',
          bhytCovered: item.bhytCovered !== undefined ? item.bhytCovered : true,
        };

        if (existing) {
          await this.icds.update(existing.id!, record);
          updated++;
        } else {
          await this.icds.add(record);
          added++;
        }
      }

      await this.history.add({
        version,
        importDate: new Date(),
        importer,
        recordsAdded: added,
        recordsUpdated: updated,
        fileName,
      });
    });

    return { added, updated };
  }
}

export const db = new ICDDatabase();

// Seed initial data if empty
db.on('populate', async () => {
  const initialData: Partial<ICDRecord>[] = [
    { code: 'A00', nameVN: 'Bệnh tả (Cholera)', chapter: 'Chương I', version: 'v2023', isActive: true, bhytCovered: true },
    { code: 'A00.0', nameVN: 'Bệnh tả do Vibrio cholerae 01, typ sinh học cholerae', chapter: 'Chương I', version: 'v2023', isActive: true, bhytCovered: true },
    { code: 'A00.1', nameVN: 'Bệnh tả do Vibrio cholerae 01, typ sinh học eltor', chapter: 'Chương I', version: 'v2023', isActive: true, bhytCovered: true },
    { code: 'A00.9', nameVN: 'Bệnh tả, không xác định', chapter: 'Chương I', version: 'v2023', isActive: true, bhytCovered: true },
    { code: 'A09', nameVN: 'Tiêu chảy và viêm dạ dày ruột do nhiễm khuẩn dự đoán', chapter: 'Chương I', version: 'v2023', isActive: true, bhytCovered: true },
    { code: 'I10', nameVN: 'Tăng huyết áp vô căn (nguyên phát)', chapter: 'Chương IX', version: 'v2023', isActive: true, bhytCovered: true },
    { code: 'J18', nameVN: 'Viêm phổi, tác nhân không xác định', chapter: 'Chương X', version: 'v2023', isActive: true, bhytCovered: true },
    { code: 'J18.0', nameVN: 'Viêm phế quản phổi, không xác định', chapter: 'Chương X', version: 'v2023', isActive: true, bhytCovered: true },
    { code: 'J18.9', nameVN: 'Viêm phổi, không xác định', chapter: 'Chương X', version: 'v2023', isActive: true, bhytCovered: true },
    { code: 'E11', nameVN: 'Bệnh đái tháo đường không phụ thuộc insuline', chapter: 'Chương IV', version: 'v2023', isActive: true, bhytCovered: true },
    { code: 'E11.9', nameVN: 'Bệnh đái tháo đường không phụ thuộc insuline không có biến chứng', chapter: 'Chương IV', version: 'v2023', isActive: true, bhytCovered: true },
  ];
  
  const mappedData = initialData.map(item => ({
      ...item,
      searchString: normalizeForSearch(`${item.code} ${item.nameVN} ${item.nameEN || ''}`)
  })) as ICDRecord[];

  await db.icds.bulkAdd(mappedData);
  await db.history.add({
      version: 'v2023',
      importDate: new Date(),
      importer: 'System',
      recordsAdded: initialData.length,
      recordsUpdated: 0,
      fileName: 'seed_data.json'
  });
});
