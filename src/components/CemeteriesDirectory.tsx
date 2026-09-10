import React from 'react';
import { CemeteryInfo } from '../types/cemetery';
import { Church, MapPin, Calendar, Users, ExternalLink, Search, Map, X, ZoomIn } from 'lucide-react';

interface CemeteriesDirectoryProps {
  cemeteries: CemeteryInfo[];
  recordsCountByCemetery: Record<string, number>;
  onSelectCemeteryFilter: (cemeteryName: string) => void;
}

export const CemeteriesDirectory: React.FC<CemeteriesDirectoryProps> = ({
  cemeteries,
  recordsCountByCemetery,
  onSelectCemeteryFilter
}) => {
  const [filterQuery, setFilterQuery] = React.useState('');
  const [viewingMapCemetery, setViewingMapCemetery] = React.useState<CemeteryInfo | null>(null);

  const filteredCemeteries = cemeteries.filter(
    (c) =>
      c.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      c.city.toLowerCase().includes(filterQuery.toLowerCase()) ||
      c.county.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Intro Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-serif text-amber-400">
            Director Cimitire Istorice & Municipale din România
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Explorează ansamblurile funerare, cimitirele protejate ca monumente istorice și registrele locurilor de veci din principalele orașe ale țării.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Caută cimitir sau oraș..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Grid of Cemeteries */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCemeteries.map((cem) => {
          const registeredCount = recordsCountByCemetery[cem.name] || 0;

          return (
            <div
              key={cem.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Cemetery Cover Photo */}
                <div className="h-36 relative bg-slate-800 overflow-hidden">
                  <img
                    src={cem.photoUrl}
                    alt={cem.name}
                    className="w-full h-full object-cover opacity-80 hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                  
                  {cem.mapUrl && (
                    <div className="absolute top-2.5 right-2.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingMapCemetery(cem);
                        }}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-600/95 hover:bg-amber-500 text-white font-bold flex items-center space-x-1 shadow transition-colors"
                        title="Vizualizează planul cimitirului"
                      >
                        <Map className="w-3 h-3" />
                        <span>Plan Cimitir</span>
                      </button>
                    </div>
                  )}

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-600/90 text-white font-semibold uppercase tracking-wider">
                      {cem.county} - {cem.city}
                    </span>
                    <h3 className="font-bold font-serif text-base text-white mt-1 line-clamp-1">
                      {cem.name}
                    </h3>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 space-y-3 text-xs text-slate-700">
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span className="text-slate-600">{cem.address}</span>
                  </div>

                  <p className="text-slate-600 line-clamp-2 italic">
                    "{cem.description}"
                  </p>

                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 font-mono text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase">An Înființare</span>
                      <span className="font-bold text-slate-800">{cem.establishedYear}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase">Confesiune</span>
                      <span className="font-bold text-slate-800">{cem.religionMain}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2">
                <div className="text-xs">
                  <span className="text-slate-500 block text-[10px]">Înregistrări Bază</span>
                  <span className="font-bold text-amber-900 font-mono text-sm">
                    {registeredCount} persoane
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {cem.mapUrl && (
                    <button
                      type="button"
                      onClick={() => setViewingMapCemetery(cem)}
                      className="px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold text-xs rounded-lg transition-colors flex items-center space-x-1"
                      title="Vizualizează planul cimitirului"
                    >
                      <Map className="w-3.5 h-3.5 text-amber-700" />
                      <span>Plan Cimitir</span>
                    </button>
                  )}

                  <button
                    onClick={() => onSelectCemeteryFilter(cem.name)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs rounded-lg transition-colors flex items-center space-x-1"
                  >
                    <span>Vezi Registrul</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Modal Vizualizare Plan Cimitir */}
      {viewingMapCemetery && viewingMapCemetery.mapUrl && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setViewingMapCemetery(null)}
        >
          <div 
            className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
                  <Map className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">
                    Plan Cimitir: {viewingMapCemetery.name}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {viewingMapCemetery.city}, {viewingMapCemetery.county} • {viewingMapCemetery.address}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingMapCemetery(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Închide"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-auto flex-1 flex items-center justify-center bg-slate-950 min-h-[300px]">
              <img
                src={viewingMapCemetery.mapUrl}
                alt={`Planul cimitirului ${viewingMapCemetery.name}`}
                className="max-w-full max-h-[70vh] object-contain rounded shadow"
              />
            </div>

            <div className="p-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">
                Planul de parcele al cimitirului pentru localizarea mormintelor.
              </span>
              <button
                type="button"
                onClick={() => setViewingMapCemetery(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold transition-colors"
              >
                Închide
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
