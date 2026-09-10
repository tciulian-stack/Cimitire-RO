import React from 'react';
import { Search, Filter, Table as TableIcon, RefreshCw, AlertCircle } from 'lucide-react';

interface SearchAndFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCounty: string;
  setSelectedCounty: (county: string) => void;
  selectedCemetery: string;
  setSelectedCemetery: (cemetery: string) => void;
  selectedReligion: string;
  setSelectedReligion: (religion: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  onlyHistorical: boolean;
  setOnlyHistorical: (val: boolean) => void;
  viewMode: 'table' | 'grid';
  setViewMode: (mode: 'table' | 'grid') => void;
  counties: string[];
  cemeteries: string[];
  religions: string[];
  statuses: string[];
  totalResults: number;
  onResetFilters: () => void;
}

export const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCounty,
  setSelectedCounty,
  selectedCemetery,
  setSelectedCemetery,
  selectedReligion,
  setSelectedReligion,
  selectedStatus,
  setSelectedStatus,
  onlyHistorical,
  setOnlyHistorical,
  viewMode,
  setViewMode,
  counties,
  cemeteries,
  religions,
  statuses,
  totalResults,
  onResetFilters
}) => {
  const hasActiveFilters =
    searchQuery ||
    selectedCounty !== 'ALL' ||
    selectedCemetery !== 'ALL' ||
    selectedReligion !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    onlyHistorical;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3 mb-6">
      
      {/* Top row: search & view switcher */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Căutare după Nume"
            className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Display Mode Switcher */}
        <div className="flex items-center space-x-1 p-1 bg-slate-100 border border-slate-200 rounded-lg shrink-0 self-start md:self-auto">
          <button
            onClick={() => setViewMode('table')}
            className={`inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Afișare Tabel"
          >
            <TableIcon className="w-3.5 h-3.5 text-amber-700" />
            <span className="hidden sm:inline">Tabel</span>
          </button>

          <button
            onClick={() => setViewMode('grid')}
            className={`inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Afișare Carduri"
          >
            <Filter className="w-3.5 h-3.5 text-amber-700" />
            <span className="hidden sm:inline">Carduri</span>
          </button>
        </div>
      </div>

      {/* Filter Selectors Row: County & Cemetery */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* County Select */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Județ</label>
          <select
            value={selectedCounty}
            onChange={(e) => setSelectedCounty(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-md p-1.5 text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
          >
            <option value="ALL">Toate Județele ({counties.length})</option>
            {counties.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Cemetery Select */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Cimitir</label>
          <select
            value={selectedCemetery}
            onChange={(e) => setSelectedCemetery(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-md p-1.5 text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
          >
            <option value="ALL">Toate Cimitirele ({cemeteries.length})</option>
            {cemeteries.map((cem) => (
              <option key={cem} value={cem}>
                {cem}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bottom Bar with active filters count & reset */}
      <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-600">
        <div className="flex items-center space-x-3">
          <span className="font-semibold text-slate-800">
            Rezultate găsite: <span className="text-amber-700 font-bold">{totalResults}</span> persoane
          </span>
        </div>

        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="inline-flex items-center space-x-1 text-xs text-amber-800 hover:text-amber-900 font-medium bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md hover:bg-amber-100 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Resetează filtrele</span>
          </button>
        )}
      </div>

    </div>
  );
};
