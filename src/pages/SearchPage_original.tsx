import { useState, useEffect } from 'react';
import { Search, Info, CheckCircle2, XCircle, FileText, Activity } from 'lucide-react';
import { db, ICDRecord } from '../db/database';
import { cn } from '../components/Layout';

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive' | 'a2'>('all');
  const [results, setResults] = useState<ICDRecord[]>([]);
  const [selectedICD, setSelectedICD] = useState<ICDRecord | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const search = async () => {
      setIsSearching(true);
      try {
        const res = await db.search(query, activeFilter);
        setResults(res);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(search, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, activeFilter]);

  return (
    <div className="h-full flex flex-col md:flex-row gap-6">
      {/* Left Panel: Search & Results */}
      <div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Nhß║¡p m├ú ICD (VD: J18.9) hoß║╖c t├¬n bß╗çnh (VD: vi├¬m phß╗òi)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-slate-900 bg-white"
              autoFocus
            />
          </div>
          <div className="mt-3 flex items-center gap-4 text-sm px-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={activeFilter === 'all'} onChange={() => setActiveFilter('all')} className="text-indigo-600 focus:ring-indigo-500" />
              <span className="text-slate-700">Tß║Ñt cß║ú</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={activeFilter === 'active'} onChange={() => setActiveFilter('active')} className="text-emerald-600 focus:ring-emerald-500" />
              <span className="text-slate-700 hover:text-emerald-700 font-medium tracking-tight">C├▓n hiß╗çu lß╗▒c</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={activeFilter === 'inactive'} onChange={() => setActiveFilter('inactive')} className="text-rose-600 focus:ring-rose-500" />
              <span className="text-slate-700 hover:text-rose-700 font-medium tracking-tight">Hß║┐t hiß╗çu lß╗▒c</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={activeFilter === 'a2'} onChange={() => setActiveFilter('a2')} className="text-amber-600 focus:ring-amber-500" />
              <span className="text-slate-700 hover:text-amber-700 font-medium tracking-tight">Phß╗Ñ lß╗Ñc A2</span>
            </label>
          </div>
          <p className="text-xs text-slate-500 mt-2 px-1">
            Hß╗ù trß╗ú t├¼m kiß║┐m kh├┤ng dß║Ñu, t├¼m gß║ºn ─æ├║ng.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {isSearching ? (
            <div className="p-8 text-center text-slate-500">─Éang t├¼m kiß║┐m...</div>
          ) : results.length > 0 ? (
            <ul className="space-y-1">
              {results.map((icd) => (
                <li key={icd.id}>
                  <button
                    onClick={() => setSelectedICD(icd)}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-lg transition-colors flex items-start gap-3",
                      selectedICD?.id === icd.id
                        ? "bg-indigo-50 border border-indigo-100"
                        : "hover:bg-slate-50 border border-transparent"
                    )}
                  >
                    <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-indigo-100 text-indigo-700 font-mono text-sm font-bold min-w-[60px]">
                      {icd.code}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-900 font-medium truncate">{icd.nameVN}</p>
                      {icd.nameEN && <p className="text-slate-500 text-xs truncate">{icd.nameEN}</p>}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {icd.isActive ? (
                          <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-700 bg-emerald-100 rounded">C├▓n hiß╗çu lß╗▒c</span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide text-rose-700 bg-rose-100 rounded">Hß║┐t hiß╗çu lß╗▒c</span>
                        )}
                        {icd.bhytCovered ? (
                          <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide text-blue-700 bg-blue-100 rounded">BHYT</span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide text-slate-700 bg-slate-100 rounded">Kh├┤ng BHYT</span>
                        )}
                        {icd.tagA2 && (
                          <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-700 bg-amber-100 rounded">Phß╗Ñ lß╗Ñc A2</span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : query.trim() ? (
            <div className="p-8 text-center text-slate-500">
              Kh├┤ng t├¼m thß║Ñy kß║┐t quß║ú ph├╣ hß╗úp cho "{query}"
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center h-full">
              <Search className="w-12 h-12 mb-4 opacity-20" />
              <p>Nhß║¡p tß╗½ kh├│a ─æß╗â bß║»t ─æß║ºu tra cß╗⌐u</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Details */}
      <div className="w-full md:w-96 flex-shrink-0 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 font-medium text-slate-700 flex items-center gap-2">
          <Info className="w-5 h-5 text-indigo-500" />
          Chi tiß║┐t ICD
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {selectedICD ? (
            <div className="space-y-6">
              <div>
                <div className="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 font-mono text-xl font-bold rounded-lg mb-2">
                  {selectedICD.code}
                </div>
                <h2 className="text-xl font-bold text-slate-900 leading-tight">
                  {selectedICD.nameVN}
                </h2>
                {selectedICD.nameEN && (
                  <p className="text-slate-500 text-sm mt-1 italic">{selectedICD.nameEN}</p>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Nh├│m bß╗çnh (Chapter)</p>
                    <p className="text-slate-800">{selectedICD.chapter || 'Kh├┤ng c├│ th├┤ng tin'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Activity className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Thanh to├ín BHYT</p>
                    <div className="flex items-center gap-2">
                      {selectedICD.bhytCovered ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-1 rounded text-sm font-medium">
                          <CheckCircle2 className="w-4 h-4" /> ─É╞░ß╗úc thanh to├ín
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-1 rounded text-sm font-medium">
                          <XCircle className="w-4 h-4" /> Kh├┤ng thanh to├ín
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {selectedICD.tagA2 && (
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-amber-500 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-1">Phß╗Ñ lß╗Ñc A2</p>
                      <p className="text-amber-900 text-sm">C├íc m├ú bß╗çnh kh├┤ng sß╗¡ dß╗Ñng l├á bß╗çnh ch├¡nh (Q─É 4469/BYT)</p>
                    </div>
                  </div>
                )}

                {selectedICD.note && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                    <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-1">Ghi ch├║ BYT</p>
                    <p className="text-amber-900 text-sm">{selectedICD.note}</p>
                  </div>
                )}
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100">
                <p className="text-xs text-slate-400">
                  Phi├¬n bß║ún: {selectedICD.version} <br/>
                  Trß║íng th├íi: {selectedICD.isActive ? '─Éang ├íp dß╗Ñng' : '─É├ú v├┤ hiß╗çu h├│a'}
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center">
              <FileText className="w-12 h-12 mb-4 opacity-20" />
              <p>Chß╗ìn mß╗Öt m├ú ICD tß╗½ danh s├ích<br/>─æß╗â xem chi tiß║┐t</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
