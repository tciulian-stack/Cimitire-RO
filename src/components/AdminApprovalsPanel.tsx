import React, { useState } from 'react';
import { PendingApproval, DeceasedRecord } from '../types/cemetery';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileSpreadsheet, 
  User, 
  Calendar, 
  MapPin, 
  Church, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  Trash2, 
  Eye, 
  ShieldCheck,
  Check,
  X,
  FileText
} from 'lucide-react';

interface AdminApprovalsPanelProps {
  approvals: PendingApproval[];
  onApprove: (id: string) => void;
  onReject: (id: string, reason?: string) => void;
  onDelete?: (id: string) => void;
  currentUserRole?: string;
  isModal?: boolean;
  onClose?: () => void;
}

export const AdminApprovalsPanel: React.FC<AdminApprovalsPanelProps> = ({
  approvals,
  onApprove,
  onReject,
  onDelete,
  isModal = false,
  onClose
}) => {
  const [filterStatus, setFilterStatus] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const pendingCount = approvals.filter(a => a.status === 'pending').length;
  const approvedCount = approvals.filter(a => a.status === 'approved').length;
  const rejectedCount = approvals.filter(a => a.status === 'rejected').length;

  const filteredApprovals = approvals.filter(a => {
    if (filterStatus === 'all') return true;
    return a.status === filterStatus;
  });

  const handleStartReject = (id: string) => {
    setRejectingId(id);
    setRejectionReason('Date incomplete sau neconforme');
  };

  const handleConfirmReject = (id: string) => {
    onReject(id, rejectionReason);
    setRejectingId(null);
    setRejectionReason('');
  };

  const handleCancelReject = () => {
    setRejectingId(null);
    setRejectionReason('');
  };

  return (
    <div className={`space-y-5 ${isModal ? 'p-1' : ''}`}>
      {/* Header Info & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Aprobări și Notificări Operatori de Date
              </h3>
              <p className="text-xs text-slate-500">
                Verifică și aprobă înregistrările individuale sau fișierele Excel încărcate de operatori
              </p>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto bg-slate-100 p-1 rounded-xl text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
              filterStatus === 'pending'
                ? 'bg-amber-600 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>În Așteptare</span>
            {pendingCount > 0 && (
              <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                filterStatus === 'pending' ? 'bg-amber-800 text-amber-100' : 'bg-amber-200 text-amber-900'
              }`}>
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('approved')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
              filterStatus === 'approved'
                ? 'bg-emerald-700 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Aprobate ({approvedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('rejected')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
              filterStatus === 'rejected'
                ? 'bg-rose-700 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Respinse ({rejectedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-slate-800 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <span>Toate ({approvals.length})</span>
          </button>
        </div>
      </div>

      {/* Summary Alert when there are pending approvals */}
      {pendingCount > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-3.5 rounded-r-xl text-xs text-amber-900 flex items-start space-x-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-amber-950">
              {pendingCount === 1 
                ? 'Există 1 solicitare de la operatori în așteptarea deciziei tale.' 
                : `Există ${pendingCount} solicitări de la operatori în așteptarea deciziei tale.`}
            </p>
            <p className="mt-0.5 text-amber-800">
              Înregistrările nu apar în registrul public oficial până când nu apeși butonul <strong>Acceptă și Adaugă în Bază</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Approvals List */}
      {filteredApprovals.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-10 text-center text-slate-500">
          <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="font-bold text-slate-700 text-sm">
            {filterStatus === 'pending' 
              ? 'Nu există nicio solicitare în așteptare.' 
              : 'Nu există nicio înregistrare în această categorie.'}
          </p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {filterStatus === 'pending' 
              ? 'Toate datele adăugate de operatori au fost deja procesate sau nu au fost trimise adăugiri noi.' 
              : 'Schimbă filtrul de mai sus pentru a vedea alte solicitări.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApprovals.map((item) => {
            const isExpanded = expandedId === item.id;
            const isRejecting = rejectingId === item.id;
            const isSingle = item.type === 'single_record';

            return (
              <div
                key={item.id}
                id={`approval-card-${item.id}`}
                className={`border rounded-2xl overflow-hidden transition-all bg-white ${
                  item.status === 'pending'
                    ? 'border-amber-300 shadow-sm ring-1 ring-amber-400/20'
                    : item.status === 'approved'
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-slate-200 bg-slate-50/50'
                }`}
              >
                {/* Header row */}
                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/70 border-b border-slate-100">
                  <div className="flex items-start space-x-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                      isSingle 
                        ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {isSingle ? <User className="w-5 h-5" /> : <FileSpreadsheet className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                          isSingle
                            ? item.isEdit
                              ? 'bg-blue-100 text-blue-900 border-blue-300'
                              : 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        }`}>
                          {isSingle ? (item.isEdit ? 'Modificare Persoană' : 'Adăugare Persoană') : 'Import Excel'}
                        </span>

                        {isSingle && item.isEdit && (
                          <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-full">
                            Actualizare înregistrare existentă
                          </span>
                        )}

                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border flex items-center space-x-1 ${
                          item.status === 'pending'
                            ? 'bg-amber-100 text-amber-950 border-amber-300 animate-pulse'
                            : item.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : 'bg-rose-100 text-rose-900 border-rose-300'
                        }`}>
                          {item.status === 'pending' && <Clock className="w-3 h-3" />}
                          {item.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                          {item.status === 'rejected' && <XCircle className="w-3 h-3" />}
                          <span>
                            {item.status === 'pending' 
                              ? 'În așteptare aprobare' 
                              : item.status === 'approved' 
                              ? 'Aprobat de Admin' 
                              : 'Respins de Admin'}
                          </span>
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm mt-1">
                        {isSingle && item.record 
                          ? `${item.record.lastName} ${item.record.firstName} (${item.record.birthDate || 'N/A'} - ${item.record.deathDate || 'N/A'})`
                          : `Lot ${item.totalRecordsCount || item.records?.length || 0} persoane din ${item.fileName || 'fișier Excel'}`}
                      </h4>

                      <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1 flex-wrap gap-y-1">
                        <span>
                          Operator: <strong className="text-slate-700">{item.submittedByUserName}</strong> ({item.submittedByUserEmail})
                        </span>
                        <span>•</span>
                        <span>
                          Trimis: {new Date(item.submittedAt).toLocaleString('ro-RO')}
                        </span>
                        {item.reviewedAt && (
                          <>
                            <span>•</span>
                            <span>
                              Decis: {new Date(item.reviewedAt).toLocaleString('ro-RO')} ({item.reviewedBy})
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Top quick actions */}
                  <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="px-3 py-1.5 text-xs text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg flex items-center space-x-1 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>{isExpanded ? 'Ascunde detalii' : 'Vezi detalii'}</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {item.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() => onApprove(item.id)}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-lg flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
                          title="Acceptă și include în baza de date"
                        >
                          <Check className="w-4 h-4" />
                          <span>Acceptă</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStartReject(item.id)}
                          className="px-3 py-1.5 text-xs font-bold text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer"
                          title="Respinge solicitarea"
                        >
                          <X className="w-4 h-4" />
                          <span>Respinge</span>
                        </button>
                      </>
                    )}

                    {onDelete && item.status !== 'pending' && (
                      <button
                        type="button"
                        onClick={() => onDelete(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Șterge din istoric"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline Rejection Reason Form */}
                {isRejecting && (
                  <div className="p-4 bg-rose-50 border-b border-rose-200 animate-in fade-in duration-150">
                    <div className="max-w-xl">
                      <label className="block text-xs font-bold text-rose-900 mb-1">
                        Motivul respingerii (va fi vizibil operatorului):
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Ex: Date incomplete, nume greșit sau înregistrare duplicat..."
                          className="flex-1 text-xs px-3 py-2 bg-white border border-rose-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleConfirmReject(item.id)}
                          className="px-3 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          Confirmă Respingerea
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelReject}
                          className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs transition-colors cursor-pointer"
                        >
                          Anulează
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rejection Note if already rejected */}
                {item.status === 'rejected' && item.rejectionReason && (
                  <div className="px-4 py-2.5 bg-rose-50/80 border-b border-rose-100 text-xs text-rose-800 flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span><strong>Motiv respingere:</strong> {item.rejectionReason}</span>
                  </div>
                )}

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="p-4 bg-white space-y-4">
                    {/* If single record */}
                    {isSingle && item.record && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Nume complet</span>
                            <span className="font-bold text-slate-900">{item.record.lastName} {item.record.firstName}</span>
                          </div>
                          {item.record.maidenName && item.record.maidenName !== 'N/A' && (
                            <div>
                              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Nume anterior/fată</span>
                              <span className="text-slate-800">{item.record.maidenName}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Ani viață</span>
                            <span className="text-slate-800">{item.record.birthDate || 'N/A'} — {item.record.deathDate || 'N/A'} (Vârstă: {item.record.ageAtDeath || 'N/A'})</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Cimitir</span>
                            <span className="font-semibold text-amber-900">{item.record.cemeteryName || 'Nespecificat'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Locație</span>
                            <span className="text-slate-800">{item.record.city || 'N/A'}, {item.record.county || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Sector / Parcelă / Mormânt</span>
                            <span className="text-slate-800">Sec: {item.record.sector || 'N/A'} | Parc: {item.record.plot || 'N/A'} | Nr: {item.record.graveNumber || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Religie & Profesie</span>
                            <span className="text-slate-800">{item.record.religion || 'N/A'} • {item.record.profession || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Stare Mormânt</span>
                            <span className="text-slate-800 font-medium">{item.record.graveStatus || 'Îngrijit'}</span>
                          </div>
                        </div>

                        {item.record.notes && item.record.notes !== 'N/A' && (
                          <div className="bg-amber-50/60 border border-amber-200/70 p-3 rounded-xl text-xs text-amber-950">
                            <span className="font-bold block text-[10px] uppercase text-amber-800 mb-0.5">Epitaf / Inscripție</span>
                            <p className="italic font-serif">"{item.record.notes}"</p>
                          </div>
                        )}

                        {item.record.biography && item.record.biography !== 'N/A' && (
                          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs text-slate-800">
                            <span className="font-bold block text-[10px] uppercase text-slate-500 mb-0.5">Biografie / Informații</span>
                            <p>{item.record.biography}</p>
                          </div>
                        )}

                        {item.record.photoUrl && (
                          <div className="flex items-center space-x-3 pt-2">
                            <img 
                              src={item.record.photoUrl} 
                              alt="Poză mormânt" 
                              className="w-20 h-20 object-cover rounded-lg border border-slate-200 shadow-xs"
                              referrerPolicy="no-referrer"
                            />
                            <span className="text-xs text-slate-500">Fotografie monument / piatră funerară atașată</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* If excel batch */}
                    {!isSingle && item.records && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          <span>
                            <strong>Total înregistrări în fișier:</strong> {item.records.length} persoane
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Fișier sursă: {item.fileName || 'import_excel.xlsx'}
                          </span>
                        </div>

                        <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-72">
                          <table className="w-full text-left text-xs text-slate-700">
                            <thead className="bg-slate-100 text-slate-800 font-bold sticky top-0 border-b border-slate-200 text-[11px]">
                              <tr>
                                <th className="p-2.5">#</th>
                                <th className="p-2.5">Nume & Prenume</th>
                                <th className="p-2.5">Ani</th>
                                <th className="p-2.5">Cimitir</th>
                                <th className="p-2.5">Județ / Oraș</th>
                                <th className="p-2.5">Parcelă / Mormânt</th>
                                <th className="p-2.5">Stare</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {item.records.map((r, idx) => (
                                <tr key={r.id || idx} className="hover:bg-slate-50 transition-colors">
                                  <td className="p-2.5 font-mono text-slate-400 text-[11px]">{idx + 1}</td>
                                  <td className="p-2.5 font-bold text-slate-900">{r.lastName} {r.firstName}</td>
                                  <td className="p-2.5 whitespace-nowrap">{r.birthDate || '-'} — {r.deathDate || '-'}</td>
                                  <td className="p-2.5 text-amber-900 font-medium">{r.cemeteryName}</td>
                                  <td className="p-2.5">{r.county} {r.city ? `(${r.city})` : ''}</td>
                                  <td className="p-2.5">{r.plot || '-'} / {r.graveNumber || '-'}</td>
                                  <td className="p-2.5">{r.graveStatus || 'Îngrijit'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Bottom Action bar in expanded view for pending status */}
                    {item.status === 'pending' && (
                      <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => handleStartReject(item.id)}
                          className="px-4 py-2 text-xs font-bold text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-300 hover:border-rose-600 rounded-xl transition-colors cursor-pointer flex items-center space-x-1.5"
                        >
                          <X className="w-4 h-4" />
                          <span>Respinge Solicitarea</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onApprove(item.id)}
                          className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-xl shadow-md transition-colors cursor-pointer flex items-center space-x-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Acceptă și Adaugă în Baza Oficială</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
