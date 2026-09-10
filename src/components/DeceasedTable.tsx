import React, { useState } from 'react';
import { DeceasedRecord } from '../types/cemetery';
import { Flame, Eye, Edit3, Trash2, MapPin, Award, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface DeceasedTableProps {
  records: DeceasedRecord[];
  onSelectRecord: (record: DeceasedRecord) => void;
  onEditRecord: (record: DeceasedRecord) => void;
  onDeleteRecord: (recordId: string) => void;
  onLightCandle: (recordId: string) => void;
}

type SortField = 'lastName' | 'cemeteryName' | 'birthDate' | 'deathDate' | 'gender' | 'county' | 'candlesLit' | 'plot' | 'graveNumber' | 'ageAtDeath';

export const DeceasedTable: React.FC<DeceasedTableProps> = ({
  records,
  onSelectRecord,
  onEditRecord,
  onDeleteRecord,
  onLightCandle
}) => {
  const [sortField, setSortField] = useState<SortField>('lastName');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedRecords = [...records].sort((a, b) => {
    let valA = a[sortField] || '';
    let valB = b[sortField] || '';

    if (sortField === 'candlesLit') {
      const numA = a.candlesLit || 0;
      const numB = b.candlesLit || 0;
      return sortAsc ? numA - numB : numB - numA;
    }

    if (sortField === 'ageAtDeath') {
      const numA = parseInt(String(valA), 10) || 0;
      const numB = parseInt(String(valB), 10) || 0;
      return sortAsc ? numA - numB : numB - numA;
    }

    const comparison = String(valA).localeCompare(String(valB), 'ro', { sensitivity: 'base' });
    return sortAsc ? comparison : -comparison;
  });

  const totalPages = Math.ceil(sortedRecords.length / itemsPerPage) || 1;
  const paginatedRecords = sortedRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Render cell helper that highlights "N/A"
  const renderCellText = (value: string, isImportant: boolean = false) => {
    if (!value || value === 'N/A' || value.trim() === '') {
      return (
        <span className="inline-block px-1.5 py-0.5 text-[11px] font-mono text-slate-400 bg-slate-100 rounded border border-slate-200">
          N/A
        </span>
      );
    }
    return <span className={isImportant ? 'font-semibold text-slate-900' : 'text-slate-700'}>{value}</span>;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      
      {/* Table scroll container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm text-slate-700">
          <thead className="bg-slate-900 text-slate-200 uppercase text-[11px] font-semibold tracking-wider">
            <tr>
              <th className="py-3 px-4 cursor-pointer hover:text-amber-400" onClick={() => handleSort('cemeteryName')}>
                <div className="flex items-center space-x-1">
                  <span>Denumire Cimitir</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-amber-400" onClick={() => handleSort('lastName')}>
                <div className="flex items-center space-x-1">
                  <span>Nume & Prenume</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-3 cursor-pointer hover:text-amber-400 whitespace-nowrap" onClick={() => handleSort('birthDate')}>
                <div className="flex items-center space-x-1">
                  <span>Dată naștere</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-3 cursor-pointer hover:text-amber-400 whitespace-nowrap" onClick={() => handleSort('deathDate')}>
                <div className="flex items-center space-x-1">
                  <span>Dată deces</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-3 cursor-pointer hover:text-amber-400 whitespace-nowrap" onClick={() => handleSort('gender')}>
                <div className="flex items-center space-x-1">
                  <span>Gen</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-amber-400" onClick={() => handleSort('plot')}>
                <div className="flex items-center space-x-1">
                  <span>Figură</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-amber-400" onClick={() => handleSort('graveNumber')}>
                <div className="flex items-center space-x-1">
                  <span>Loc</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 text-center cursor-pointer hover:text-amber-400" onClick={() => handleSort('candlesLit')}>
                <div className="flex items-center justify-center space-x-1">
                  <span>Lumânări</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-amber-400" onClick={() => handleSort('ageAtDeath')}>
                <div className="flex items-center space-x-1">
                  <span>Vârstă</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 text-right">
                <span>Acțiuni</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 bg-white">
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-12 text-slate-500">
                  <p className="text-base font-medium">Nu s-a găsit nicio înregistrare.</p>
                  <p className="text-xs text-slate-400 mt-1">Încearcă să resetezi filtrele sau să adaugi date noi.</p>
                </td>
              </tr>
            ) : (
              paginatedRecords.map((record) => (
                <tr
                  key={record.id}
                  className="hover:bg-amber-50/50 transition-colors group"
                >
                  {/* 1. Cemetery */}
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800">
                        {renderCellText(record.cemeteryName)}
                      </span>
                      {(record.city !== 'N/A' || record.county !== 'N/A') && (
                        <div className="flex items-center space-x-1 text-[11px] text-slate-500 mt-0.5">
                          <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>
                            {record.city !== 'N/A' ? record.city : ''}{record.city !== 'N/A' && record.county !== 'N/A' ? ', ' : ''}{record.county !== 'N/A' ? record.county : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* 2. Name & Maiden Name */}
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onSelectRecord(record)}
                          className="font-bold text-slate-900 hover:text-amber-700 text-left cursor-pointer transition-colors"
                        >
                          {record.lastName} {record.firstName !== 'N/A' ? record.firstName : ''}
                        </button>

                        {record.graveStatus === 'Monument Protejat' && (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] bg-amber-100 text-amber-800 border border-amber-300 font-medium" title="Monument Istoric / Protejat">
                            <Award className="w-2.5 h-2.5 mr-0.5" />
                            Istoric
                          </span>
                        )}
                      </div>

                      {record.maidenName && record.maidenName !== 'N/A' && (
                        <span className="text-[11px] text-slate-500 italic">
                          (n. {record.maidenName})
                        </span>
                      )}

                      {record.profession && record.profession !== 'N/A' && (
                        <span className="text-[11px] text-amber-800 font-medium line-clamp-1 mt-0.5">
                          {record.profession}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Dată naștere */}
                  <td className="py-3 px-3 whitespace-nowrap font-mono text-xs text-slate-700">
                    {renderCellText(record.birthDate)}
                  </td>

                  {/* Dată deces */}
                  <td className="py-3 px-3 whitespace-nowrap font-mono text-xs text-slate-700">
                    {renderCellText(record.deathDate)}
                  </td>

                  {/* Gen */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    {(() => {
                      const g = (record.gender || '').trim();
                      if (!g || g === 'N/A' || g === 'Nespecificat') {
                        return renderCellText('N/A');
                      }
                      const isMale = /^(masculin|m|bărbat|barbat|male)/i.test(g);
                      const isFemale = /^(feminin|f|femeie|female)/i.test(g);
                      if (isMale) {
                        return (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                            <span className="mr-1 text-[11px] font-bold">♂</span>
                            <span>Masculin</span>
                          </span>
                        );
                      }
                      if (isFemale) {
                        return (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                            <span className="mr-1 text-[11px] font-bold">♀</span>
                            <span>Feminin</span>
                          </span>
                        );
                      }
                      return (
                        <span className="inline-block px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 border border-slate-200">
                          {g}
                        </span>
                      );
                    })()}
                  </td>

                  {/* Figură */}
                  <td className="py-3 px-4">
                    <span className="inline-block bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200 font-mono text-xs font-semibold">
                      {renderCellText(record.plot !== 'N/A' ? record.plot : record.sector)}
                    </span>
                  </td>

                  {/* Loc */}
                  <td className="py-3 px-4">
                    <span className="inline-block bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300 font-mono font-bold text-xs">
                      {renderCellText(record.graveNumber)}
                    </span>
                  </td>

                  {/* Candles Lit */}
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => onLightCandle(record.id)}
                      className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 transition-all font-semibold text-xs border border-amber-300 shadow-2xs group-hover:scale-105"
                      title="Aprinde o lumânare virtuală"
                    >
                      <Flame className="w-3.5 h-3.5 text-amber-600 animate-pulse fill-amber-500" />
                      <span>{record.candlesLit}</span>
                    </button>
                  </td>

                  {/* Age */}
                  <td className="py-3 px-4">
                    <span className="text-xs font-semibold text-slate-800 font-mono">
                      {(() => {
                        if (record.ageAtDeath && record.ageAtDeath !== 'N/A' && record.ageAtDeath.trim() !== '') {
                          return record.ageAtDeath.toString().includes('ani') ? record.ageAtDeath : `${record.ageAtDeath} ani`;
                        }
                        const bMatch = record.birthDate?.match(/\b(18|19|20)\d{2}\b/);
                        const dMatch = record.deathDate?.match(/\b(18|19|20)\d{2}\b/);
                        if (bMatch && dMatch) {
                          const calculatedAge = parseInt(dMatch[0], 10) - parseInt(bMatch[0], 10);
                          if (calculatedAge >= 0 && calculatedAge <= 120) {
                            return `${calculatedAge} ani`;
                          }
                        }
                        return 'N/A';
                      })()}
                    </span>
                  </td>

                  {/* Action buttons */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <button
                        onClick={() => onSelectRecord(record)}
                        className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-100 rounded-md transition-colors"
                        title="Vezi Fișă Detaliată"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onEditRecord(record)}
                        className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Editează înregistrarea"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onDeleteRecord(record.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Șterge înregistrarea"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex items-center justify-between text-xs text-slate-600">
          <div>
            Afișare <span className="font-semibold text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> -{' '}
            <span className="font-semibold text-slate-800">
              {Math.min(currentPage * itemsPerPage, sortedRecords.length)}
            </span>{' '}
            din <span className="font-semibold text-slate-800">{sortedRecords.length}</span> persoane
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded border border-slate-300 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono px-2 font-medium">
              Pagina {currentPage} din {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded border border-slate-300 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
