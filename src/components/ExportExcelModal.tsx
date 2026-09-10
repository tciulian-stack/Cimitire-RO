import React, { useState, useMemo } from 'react';
import { 
  X, 
  Download, 
  FileSpreadsheet, 
  Building2, 
  Layers, 
  Check, 
  FileText, 
  Database,
  Search,
  Filter,
  AlertCircle
} from 'lucide-react';
import { DeceasedRecord, CemeteryInfo } from '../types/cemetery';
import { exportRecordsToExcel, exportRecordsToCSV } from '../utils/excelParser';

interface ExportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: DeceasedRecord[];
  cemeteries: CemeteryInfo[];
  existingCemeteries: string[];
  onSuccessExport?: (count: number, cemeteryName: string, format: string) => void;
}

export const ExportExcelModal: React.FC<ExportExcelModalProps> = ({
  isOpen,
  onClose,
  records,
  cemeteries,
  existingCemeteries,
  onSuccessExport
}) => {
  const [selectedCemeteryMode, setSelectedCemeteryMode] = useState<'all' | 'specific'>('all');
  const [selectedCemeteryName, setSelectedCemeteryName] = useState<string>('');
  const [cemeterySearch, setCemeterySearch] = useState('');
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [isExporting, setIsExporting] = useState(false);

  // Compute counts per cemetery
  const cemeteryCounts = useMemo(() => {
    const map = new Map<string, number>();
    records.forEach((r) => {
      const name = r.cemeteryName?.trim();
      if (name) {
        map.set(name, (map.get(name) || 0) + 1);
      }
    });
    return map;
  }, [records]);

  // Combined list of cemetery items with location and records count
  const cemeteryItems = useMemo(() => {
    const list: { name: string; county: string; city: string; count: number }[] = [];
    const seen = new Set<string>();

    // First from registered cemeteries
    cemeteries.forEach((c) => {
      if (!seen.has(c.name)) {
        seen.add(c.name);
        list.push({
          name: c.name,
          county: c.county || 'N/A',
          city: c.city || 'N/A',
          count: cemeteryCounts.get(c.name) || 0
        });
      }
    });

    // Then any other cemetery names from records
    existingCemeteries.forEach((name) => {
      if (name && !seen.has(name)) {
        seen.add(name);
        const sampleRecord = records.find((r) => r.cemeteryName === name);
        list.push({
          name,
          county: sampleRecord?.county || 'N/A',
          city: sampleRecord?.city || 'N/A',
          count: cemeteryCounts.get(name) || 0
        });
      }
    });

    return list.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ro'));
  }, [cemeteries, existingCemeteries, cemeteryCounts, records]);

  // If specific is chosen but no cemetery is selected yet, pick the first one with records or first in list
  const activeCemetery = useMemo(() => {
    if (selectedCemeteryName) return selectedCemeteryName;
    if (cemeteryItems.length > 0) return cemeteryItems[0].name;
    return '';
  }, [selectedCemeteryName, cemeteryItems]);

  // Filtered cemetery list by search term
  const filteredCemeteries = useMemo(() => {
    if (!cemeterySearch.trim()) return cemeteryItems;
    const q = cemeterySearch.toLowerCase().trim();
    return cemeteryItems.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.county.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q)
    );
  }, [cemeteryItems, cemeterySearch]);

  // Compute records to export based on choice
  const recordsToExport = useMemo(() => {
    if (selectedCemeteryMode === 'all') {
      return records;
    }
    return records.filter((r) => r.cemeteryName === activeCemetery);
  }, [selectedCemeteryMode, records, activeCemetery]);

  // Generate proposed filename
  const proposedFileName = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const ext = exportFormat;
    if (selectedCemeteryMode === 'all') {
      return `Registru_Complet_Cimitire_${today}.${ext}`;
    }
    const cleanName = (activeCemetery || 'Cimitir')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_');
    return `Registru_${cleanName}_${today}.${ext}`;
  }, [selectedCemeteryMode, activeCemetery, exportFormat]);

  if (!isOpen) return null;

  const handleExport = () => {
    if (recordsToExport.length === 0) return;
    setIsExporting(true);

    try {
      if (exportFormat === 'xlsx') {
        exportRecordsToExcel(recordsToExport, proposedFileName);
      } else {
        exportRecordsToCSV(recordsToExport, proposedFileName);
      }

      const targetLabel = selectedCemeteryMode === 'all' ? 'toate cimitirele' : activeCemetery;
      if (onSuccessExport) {
        onSuccessExport(recordsToExport.length, targetLabel, exportFormat.toUpperCase());
      }
      onClose();
    } catch (err) {
      console.error('Eroare la exportul Excel:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-teal-700/50 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-teal-700/60 rounded-xl border border-teal-500/40 text-teal-200 shadow-inner">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 id="export-modal-title" className="text-base sm:text-lg font-bold tracking-tight">
                Export Bază de Date Excel
              </h2>
              <p className="text-xs text-teal-200/80">
                Extragere date registru în funcție de cimitir
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Închide fereastra"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          
          {/* Step 1: Select Scope (All vs Specific Cemetery) */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              1. Alegeți Domeniul de Export
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: All Cemeteries */}
              <button
                type="button"
                onClick={() => setSelectedCemeteryMode('all')}
                className={`flex items-start space-x-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedCemeteryMode === 'all'
                    ? 'bg-teal-50/80 border-teal-600 ring-2 ring-teal-600/20 shadow-sm'
                    : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/80'
                }`}
              >
                <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${
                  selectedCemeteryMode === 'all' ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  <Database className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-sm font-bold text-slate-900">Toate Cimitirele</span>
                    {selectedCemeteryMode === 'all' && (
                      <Check className="w-3.5 h-3.5 text-teal-600" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Baza de date completă ({records.length} persoane înregistrate)
                  </p>
                </div>
              </button>

              {/* Option B: Specific Cemetery */}
              <button
                type="button"
                onClick={() => setSelectedCemeteryMode('specific')}
                className={`flex items-start space-x-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedCemeteryMode === 'specific'
                    ? 'bg-teal-50/80 border-teal-600 ring-2 ring-teal-600/20 shadow-sm'
                    : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/80'
                }`}
              >
                <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${
                  selectedCemeteryMode === 'specific' ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-sm font-bold text-slate-900">Un Cimitir Specific</span>
                    {selectedCemeteryMode === 'specific' && (
                      <Check className="w-3.5 h-3.5 text-teal-600" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Selectați un cimitir pentru a extrage doar registrul aferent
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* If Specific Cemetery Mode: Cemetery Selector */}
          {selectedCemeteryMode === 'specific' && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <Building2 className="w-4 h-4 text-teal-700" />
                  <span>Selectați Cimitirul Dorit:</span>
                </label>

                {/* Quick Search */}
                <div className="relative w-full sm:w-56">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={cemeterySearch}
                    onChange={(e) => setCemeterySearch(e.target.value)}
                    placeholder="Caută cimitir..."
                    className="w-full pl-8 pr-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-600"
                  />
                </div>
              </div>

              {/* Cemetery Selection List */}
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
                {filteredCemeteries.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3 text-center">
                    Nu s-a găsit niciun cimitir care să corespundă căutării.
                  </p>
                ) : (
                  filteredCemeteries.map((c) => {
                    const isSelected = activeCemetery === c.name;
                    return (
                      <div
                        key={c.name}
                        onClick={() => setSelectedCemeteryName(c.name)}
                        className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-teal-100/70 border border-teal-400/60 font-semibold'
                            : 'hover:bg-slate-200/60 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${
                            isSelected ? 'bg-teal-700' : 'bg-slate-300'
                          }`} />
                          <div className="min-w-0">
                            <span className="text-xs text-slate-900 truncate block">
                              {c.name}
                            </span>
                            <span className="text-[11px] text-slate-500 block truncate">
                              {c.city}, jud. {c.county}
                            </span>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono shrink-0 ${
                          c.count > 0
                            ? isSelected
                              ? 'bg-teal-700 text-white font-bold'
                              : 'bg-slate-200 text-slate-700'
                            : 'bg-rose-50 text-rose-600'
                        }`}>
                          {c.count} {c.count === 1 ? 'persoană' : 'persoane'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Step 2: Choose File Format */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              2. Formatul Fișierului
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setExportFormat('xlsx')}
                className={`flex items-center space-x-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  exportFormat === 'xlsx'
                    ? 'bg-teal-50 border-teal-600 ring-1 ring-teal-600 text-teal-900 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-medium'
                }`}
              >
                <FileSpreadsheet className={`w-5 h-5 ${exportFormat === 'xlsx' ? 'text-teal-700' : 'text-slate-400'}`} />
                <div>
                  <span className="text-xs block">Excel (.xlsx)</span>
                  <span className="text-[10px] text-slate-500 block font-normal">Format standard recomandat</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setExportFormat('csv')}
                className={`flex items-center space-x-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  exportFormat === 'csv'
                    ? 'bg-teal-50 border-teal-600 ring-1 ring-teal-600 text-teal-900 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-medium'
                }`}
              >
                <FileText className={`w-5 h-5 ${exportFormat === 'csv' ? 'text-teal-700' : 'text-slate-400'}`} />
                <div>
                  <span className="text-xs block">CSV (.csv)</span>
                  <span className="text-[10px] text-slate-500 block font-normal">Text delimitat prin virgulă</span>
                </div>
              </button>
            </div>
          </div>

          {/* Step 3: Export Summary Card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Sursă selectată:</span>
              <span className="font-bold text-slate-800 text-right max-w-[280px] truncate">
                {selectedCemeteryMode === 'all' ? 'Toate cimitirele (Bază completă)' : activeCemetery || 'Niciun cimitir'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Număr înregistrări de exportat:</span>
              <span className="font-bold font-mono text-teal-800">
                {recordsToExport.length} persoane
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Nume fișier generat:</span>
              <span className="font-mono text-[11px] text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 max-w-[280px] truncate">
                {proposedFileName}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 flex items-start space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
              <span>
                Fișierul exportat conține 18 coloane (Nume, Prenume, Date naștere/deces, Vârstă, Cimitir, Sector, Parcelă, Mormânt, Concesionar, Religie etc.).
              </span>
            </div>

            {recordsToExport.length === 0 && (
              <div className="flex items-center space-x-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Nu există persoane înregistrate pentru cimitirul selectat. Fișierul ar fi gol.</span>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-end space-x-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Anulează
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={recordsToExport.length === 0 || isExporting}
            className={`inline-flex items-center space-x-2 px-5 py-2 text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer ${
              recordsToExport.length === 0 || isExporting
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                : 'bg-teal-700 hover:bg-teal-600 text-white active:scale-95'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>
              {isExporting 
                ? 'Se generează...' 
                : `Descarcă ${exportFormat.toUpperCase()} (${recordsToExport.length} persoane)`}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
