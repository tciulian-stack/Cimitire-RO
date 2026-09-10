import React from 'react';
import { DeceasedRecord, UserSession } from '../types/cemetery';
import { Flame, Eye, MapPin, Calendar, Award, Edit3, Trash2, Lock } from 'lucide-react';

interface DeceasedGridProps {
  records: DeceasedRecord[];
  currentUser?: UserSession | null;
  onSelectRecord: (record: DeceasedRecord) => void;
  onEditRecord: (record: DeceasedRecord) => void;
  onDeleteRecord: (recordId: string) => void;
  onLightCandle: (recordId: string) => void;
  onRequireAuth?: () => void;
}

export const DeceasedGrid: React.FC<DeceasedGridProps> = ({
  records,
  currentUser,
  onSelectRecord,
  onEditRecord,
  onDeleteRecord,
  onLightCandle,
  onRequireAuth
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const isOperator = currentUser?.role === 'editor';
  if (records.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 shadow-sm">
        <p className="text-base font-medium">Nu s-a găsit nicio persoană în baza de date.</p>
        <p className="text-xs text-slate-400 mt-1">Verifică termenii de căutare sau resetează filtrele.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {records.map((record) => {
        const isHistorical = record.graveStatus === 'Monument Protejat';

        return (
          <div
            key={record.id}
            className={`bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group ${
              isHistorical ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
            }`}
          >
            {/* Cemetery Name & Location Header */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1 mb-3">
              <div className="flex items-start justify-between gap-1">
                <div className="flex items-start space-x-1.5 min-w-0">
                  <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 block truncate text-xs">
                      {record.cemeteryName !== 'N/A' ? record.cemeteryName : 'Cimitir Nespecificat'}
                    </span>
                    <span className="text-[11px] text-slate-600 block truncate">
                      {record.city !== 'N/A' ? record.city : ''}{record.city !== 'N/A' && record.county !== 'N/A' ? ', ' : ''}{record.county !== 'N/A' ? record.county : ''}
                    </span>
                  </div>
                </div>

                {isHistorical && (
                  <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                    <Award className="w-2.5 h-2.5 mr-0.5" />
                    Monument
                  </span>
                )}
              </div>

              {/* Figură & Loc Badges */}
              <div className="pt-1 border-t border-slate-200/80 flex flex-wrap gap-1 font-mono text-[10px]">
                <span className="bg-white text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                  <strong>Fig:</strong> {record.plot !== 'N/A' ? record.plot : (record.sector !== 'N/A' ? record.sector : 'N/A')}
                </span>
                <span className="bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded border border-amber-300">
                  <strong>Loc:</strong> {record.graveNumber !== 'N/A' ? record.graveNumber : 'N/A'}
                </span>
              </div>
            </div>

            {/* Name & Details Section */}
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <button
                    onClick={() => onSelectRecord(record)}
                    className="text-base font-bold text-slate-900 hover:text-amber-800 text-left line-clamp-1 font-serif cursor-pointer"
                  >
                    {record.lastName} {record.firstName !== 'N/A' ? record.firstName : ''}
                  </button>
                  {record.maidenName && record.maidenName !== 'N/A' && (
                    <span className="text-xs text-slate-500 italic block">
                      (n. {record.maidenName})
                    </span>
                  )}
                </div>
              </div>

              {/* Profession / Note tag */}
              {record.profession && record.profession !== 'N/A' && (
                <div className="mb-3 text-xs font-medium text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-100 line-clamp-1">
                  {record.profession}
                </div>
              )}

              {/* Grid details */}
              <div className="space-y-3 text-xs text-slate-600 mb-4">
                {/* Lifespan */}
                <div className="flex items-center space-x-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono text-slate-700">
                    {record.birthDate !== 'N/A' ? record.birthDate : 'N/A'} -{' '}
                    {record.deathDate !== 'N/A' ? record.deathDate : 'N/A'}
                    {record.ageAtDeath !== 'N/A' ? ` (${record.ageAtDeath} ani)` : ''}
                  </span>
                </div>

                {/* Epitaf Section */}
                {record.notes && record.notes !== 'N/A' && (
                  <div className="bg-amber-50/60 border border-amber-200/80 rounded-lg p-2.5">
                    <span className="text-[10px] uppercase font-bold text-amber-900 block tracking-wide mb-0.5">
                      Epitaf / Versuri
                    </span>
                    <p className="text-xs text-slate-800 italic font-serif line-clamp-2">
                      "{record.notes}"
                    </p>
                  </div>
                )}

                {/* Informații despre persoană Section */}
                {(record.biography || record.profession) && (
                  <div className="bg-slate-50/80 border border-slate-200 rounded-lg p-2.5">
                    <span className="text-[10px] uppercase font-bold text-slate-700 block tracking-wide mb-0.5">
                      Informații despre persoană
                    </span>
                    <p className="text-xs text-slate-700 line-clamp-2">
                      {record.biography && record.biography !== 'N/A'
                        ? record.biography
                        : record.profession}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              {/* Candle button */}
              <button
                onClick={() => onLightCandle(record.id)}
                className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 transition-colors font-semibold text-xs border border-amber-300"
                title="Aprinde o lumânare virtuală"
              >
                <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500 animate-pulse" />
                <span>{record.candlesLit} lumânări</span>
              </button>

              <div className="flex items-center space-x-1">
                {/* Vizualizare Fișă */}
                <button
                  onClick={() => onSelectRecord(record)}
                  className="p-1.5 text-slate-600 hover:text-amber-800 hover:bg-amber-100 rounded-md transition-colors cursor-pointer"
                  title="Vezi Fișă Detaliată"
                >
                  <Eye className="w-4 h-4" />
                </button>

                {/* Modificare / Editare */}
                {isAdmin && (
                  <button
                    onClick={() => onEditRecord(record)}
                    className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                    title="Editează înregistrarea (Administrator)"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}

                {isOperator && (
                  <button
                    onClick={() => onEditRecord(record)}
                    className="p-1.5 text-amber-700 hover:text-amber-900 hover:bg-amber-100 rounded-md transition-colors cursor-pointer"
                    title="Propune modificări (Necesită aprobare Administrator)"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}

                {!isAdmin && !isOperator && (
                  <button
                    onClick={() => {
                      if (onRequireAuth) {
                        onRequireAuth();
                      } else {
                        onEditRecord(record);
                      }
                    }}
                    className="p-1.5 text-slate-300 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                    title="Autentificare necesară (Doar administratorii și operatorii pot modifica date)"
                  >
                    <Lock className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Ștergere: DOAR pentru Administrator! Operatorii NU pot șterge! */}
                {isAdmin && (
                  <button
                    onClick={() => onDeleteRecord(record.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                    title="Șterge definitiv înregistrarea (Doar Administrator)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

          </div>
        );
      })}
    </div>
  );
};
