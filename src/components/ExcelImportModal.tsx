import React, { useState } from 'react';
import { DeceasedRecord, ExcelColumnMapping, UserAccount } from '../types/cemetery';
import {
  parseExcelOrCSVFile,
  guessColumnMapping,
  convertRowsToRecords,
  downloadSampleTemplate
} from '../utils/excelParser';
import { FileSpreadsheet, Upload, Download, CheckCircle, AlertCircle, ArrowRight, X, RefreshCw, Send, ShieldCheck } from 'lucide-react';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportRecords: (newRecords: DeceasedRecord[], replaceExisting: boolean, fileName?: string) => void;
  existingCemeteries: string[];
  existingCounties: string[];
  currentUser?: UserAccount | null;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImportRecords,
  existingCemeteries,
  existingCounties,
  currentUser
}) => {
  const [step, setStep] = useState<'upload' | 'map' | 'preview'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<Record<string, any>[]>([]);
  const [mapping, setMapping] = useState<ExcelColumnMapping>({
    lastName: '',
    firstName: '',
    maidenName: '',
    birthDate: '',
    deathDate: '',
    ageAtDeath: '',
    cemeteryName: '',
    county: '',
    city: '',
    sector: '',
    plot: '',
    graveNumber: '',
    religion: '',
    profession: '',
    notes: '',
    concessionHolder: '',
    graveStatus: ''
  });

  const [defaultCounty, setDefaultCounty] = useState('N/A');
  const [defaultCity, setDefaultCity] = useState('N/A');
  const [defaultCemetery, setDefaultCemetery] = useState('N/A');

  const [replaceExisting, setReplaceExisting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [previewRecords, setPreviewRecords] = useState<DeceasedRecord[]>([]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = (selectedFile: File) => {
    setFile(selectedFile);
    setErrorMessage('');

    parseExcelOrCSVFile(
      selectedFile,
      (headers, rows) => {
        setParsedHeaders(headers);
        setParsedRows(rows);
        const autoMap = guessColumnMapping(headers);
        setMapping(autoMap);
        setStep('map');
      },
      (error) => {
        setErrorMessage(error);
      }
    );
  };

  const handleProceedToPreview = () => {
    const converted = convertRowsToRecords(
      parsedRows,
      mapping,
      defaultCounty,
      defaultCity,
      defaultCemetery
    );
    setPreviewRecords(converted);
    setStep('preview');
  };

  const handleConfirmImport = () => {
    onImportRecords(previewRecords, replaceExisting, file?.name || 'import_excel.xlsx');
    onClose();
  };

  const handleResetModal = () => {
    setStep('upload');
    setFile(null);
    setParsedHeaders([]);
    setParsedRows([]);
    setPreviewRecords([]);
    setErrorMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold font-serif">
                Import Bază de Date Excel / CSV
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Încarcă fișierul tău cu cimitire și persoane înhumate
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 min-w-[38px] min-h-[38px] flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Steps indicator */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between text-xs font-semibold text-slate-600 overflow-x-auto scrollbar-none shrink-0 gap-2">
          <div className={`flex items-center space-x-1 shrink-0 ${step === 'upload' ? 'text-emerald-700 font-bold' : ''}`}>
            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px]">1</span>
            <span>Încărcare Fișier</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <div className={`flex items-center space-x-1 shrink-0 ${step === 'map' ? 'text-emerald-700 font-bold' : ''}`}>
            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px]">2</span>
            <span>Potrivire Coloane</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <div className={`flex items-center space-x-1 shrink-0 ${step === 'preview' ? 'text-emerald-700 font-bold' : ''}`}>
            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px]">3</span>
            <span>Previzualizare & Salvare</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">

          {/* STEP 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              
              {/* Operator Notice Banner */}
              {currentUser?.role === 'editor' && (
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 text-xs text-amber-900 flex items-start space-x-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-950">
                      Mod Operator Date: Aprobare Administrator Necesară
                    </p>
                    <p className="text-amber-800 text-[11px] mt-0.5">
                      Datele din fișierul Excel încărcat vor fi transmise administratorului de sistem pentru validare și aprobare. Persoanele nu vor fi afișate în registrul public până la aprobarea oficială.
                    </p>
                  </div>
                </div>
              )}

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-8 text-center bg-slate-50/50 hover:bg-emerald-50/30 transition-colors cursor-pointer group"
              >
                <input
                  type="file"
                  id="excelFileInput"
                  accept=".xlsx,.xls,.csv,.tsv,.ods,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="excelFileInput" className="cursor-pointer block space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Apasă aici sau trage fișierul Excel (.xlsx / .xls) sau CSV din calculator
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Acceptă fișiere Excel (.XLSX, .XLS), CSV, TSV sau ODS. Recunoaște automat coloanele.
                    </p>
                  </div>
                </label>
              </div>

              {errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Template Download Box */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-amber-900">
                  <p className="font-bold mb-0.5">Nu ai un fișier pregătit?</p>
                  <p className="text-amber-800">
                    Descarcă un model de fișier Excel (.xlsx) pre-formatat cu toate coloanele necesare.
                  </p>
                </div>

                <button
                  onClick={downloadSampleTemplate}
                  className="shrink-0 px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descarcă Model Excel (.xlsx)</span>
                </button>
              </div>

            </div>
          )}

          {/* STEP 2: Map Columns */}
          {step === 'map' && (
            <div className="space-y-4">
              
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-900 flex items-center justify-between">
                <div>
                  <strong>Fișier detectat:</strong> {file?.name} ({parsedRows.length} rânduri citite, {parsedHeaders.length} coloane).
                </div>
                <button
                  onClick={handleResetModal}
                  className="text-xs text-slate-600 hover:text-slate-900 flex items-center space-x-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Schimbă fișierul</span>
                </button>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900">
                <strong>Notă importantă:</strong> Asociază coloanele din fișierul tău Excel cu câmpurile bazei de date. <strong>Unde nu există date în fișier sau nu selectezi o coloană, sistemul va adăuga automat 'N/A'.</strong>
              </div>

              {/* Mapping fields grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
                
                {[
                  { key: 'lastName', label: 'Nume de Familie *' },
                  { key: 'firstName', label: 'Prenume' },
                  { key: 'maidenName', label: 'Nume anterior / de Fată' },
                  { key: 'birthDate', label: 'Data Nașterii' },
                  { key: 'deathDate', label: 'Data Decesului' },
                  { key: 'ageAtDeath', label: 'Vârsta la Deces' },
                  { key: 'cemeteryName', label: 'Nume Cimitir' },
                  { key: 'county', label: 'Județ' },
                  { key: 'city', label: 'Localitate / Oraș' },
                  { key: 'sector', label: 'Sector / Alee' },
                  { key: 'plot', label: 'Parcelă' },
                  { key: 'graveNumber', label: 'Număr Mormânt' },
                  { key: 'religion', label: 'Religie' },
                  { key: 'profession', label: 'Profesie / Titlu' },
                  { key: 'gender', label: 'Gen / Sex' },
                  { key: 'notes', label: 'Observații / Epitaff' },
                  { key: 'concessionHolder', label: 'Deținător Loc' },
                  { key: 'graveStatus', label: 'Stare Mormânt' }
                ].map((col) => (
                  <div key={col.key} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {col.label}
                    </label>
                    <select
                      value={mapping[col.key as keyof ExcelColumnMapping]}
                      onChange={(e) =>
                        setMapping({
                          ...mapping,
                          [col.key]: e.target.value
                        })
                      }
                      className="w-full text-xs bg-white border border-slate-300 rounded p-1 text-slate-800 focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="">-- [Setează 'N/A' automat] --</option>
                      {parsedHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}

              </div>

              {/* Default fallbacks if missing */}
              <div className="bg-slate-100 p-3 rounded-lg text-xs space-y-2 border border-slate-200">
                <span className="font-bold text-slate-700 block">
                  Valori implicite generale (dacă lipsesc în coloane):
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500">Județ implicit</label>
                    <input
                      type="text"
                      value={defaultCounty}
                      onChange={(e) => setDefaultCounty(e.target.value)}
                      className="w-full p-1 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500">Oraș implicit</label>
                    <input
                      type="text"
                      value={defaultCity}
                      onChange={(e) => setDefaultCity(e.target.value)}
                      className="w-full p-1 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500">Cimitir implicit</label>
                    <input
                      type="text"
                      value={defaultCemetery}
                      onChange={(e) => setDefaultCemetery(e.target.value)}
                      className="w-full p-1 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* STEP 3: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">
                  Previzualizare {previewRecords.length} înregistrări pregătite de import:
                </span>
                <span className="text-slate-500">
                  Verifică modul în care au fost completate câmpurile (cu N/A pentru date lipsă)
                </span>
              </div>

              {/* Preview Table */}
              <div className="max-h-64 overflow-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800 text-slate-200 sticky top-0 font-mono">
                    <tr>
                      <th className="p-2">#</th>
                      <th className="p-2">Nume</th>
                      <th className="p-2">Prenume</th>
                      <th className="p-2">Data Deces</th>
                      <th className="p-2">Cimitir</th>
                      <th className="p-2">Sector/Parc/Mormant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {previewRecords.slice(0, 20).map((r, idx) => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="p-2 font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-2 font-bold">{r.lastName}</td>
                        <td className="p-2">{r.firstName}</td>
                        <td className="p-2 font-mono">{r.deathDate}</td>
                        <td className="p-2">{r.cemeteryName}</td>
                        <td className="p-2 font-mono text-[11px]">
                          {r.sector} / {r.plot} / {r.graveNumber}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Replace or Append option */}
              {currentUser?.role === 'editor' ? (
                <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-300 space-y-1.5 text-xs">
                  <div className="flex items-center space-x-2 text-amber-950 font-bold">
                    <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Transmisie spre aprobare administrator</span>
                  </div>
                  <p className="text-amber-800 text-[11px]">
                    Înregistrările vor fi verificate de un administrator. Nu se permite înlocuirea bazei de date de către operatori.
                  </p>
                </div>
              ) : (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2 text-xs">
                  <label className="flex items-center space-x-2 cursor-pointer font-medium text-slate-800">
                    <input
                      type="radio"
                      name="importMode"
                      checked={!replaceExisting}
                      onChange={() => setReplaceExisting(false)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Adaugă la înregistrările existente în baza de date</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer font-medium text-slate-800">
                    <input
                      type="radio"
                      name="importMode"
                      checked={replaceExisting}
                      onChange={() => setReplaceExisting(true)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-red-700 font-semibold">
                      Înlocuiește complet baza de date actuală
                    </span>
                  </label>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex items-center justify-between">
          {step !== 'upload' ? (
            <button
              onClick={() => setStep(step === 'preview' ? 'map' : 'upload')}
              className="px-3 py-1.5 text-xs text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-medium"
            >
              Înapoi
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
            >
              Anulează
            </button>

            {step === 'map' && (
              <button
                onClick={handleProceedToPreview}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center space-x-1"
              >
                <span>Spre Previzualizare</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 'preview' && (
              <button
                onClick={handleConfirmImport}
                className={`px-5 py-2 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-md transition-colors ${
                  currentUser?.role === 'editor'
                    ? 'bg-amber-600 hover:bg-amber-500 ring-2 ring-amber-400/30'
                    : 'bg-emerald-700 hover:bg-emerald-600'
                }`}
              >
                {currentUser?.role === 'editor' ? (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Trimite spre Aprobare Administrator ({previewRecords.length} persoane)</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Confirmă & Salvează Înregistrările ({previewRecords.length})</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
