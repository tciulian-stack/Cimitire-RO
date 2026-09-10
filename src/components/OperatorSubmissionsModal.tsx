import React, { useState } from 'react';
import { PendingApproval, UserAccount } from '../types/cemetery';
import { X, Clock, CheckCircle2, XCircle, FileSpreadsheet, User, AlertCircle, Eye, ChevronDown, ChevronUp } from 'lucide-react';

interface OperatorSubmissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  approvals: PendingApproval[];
  currentUser: UserAccount;
}

export const OperatorSubmissionsModal: React.FC<OperatorSubmissionsModalProps> = ({
  isOpen,
  onClose,
  approvals,
  currentUser
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter submissions made by this operator
  const mySubmissions = approvals.filter(
    a => a.submittedByUserEmail.toLowerCase() === currentUser.email.toLowerCase() ||
         a.submittedByUserId === currentUser.id
  );

  const pendingCount = mySubmissions.filter(a => a.status === 'pending').length;
  const approvedCount = mySubmissions.filter(a => a.status === 'approved').length;
  const rejectedCount = mySubmissions.filter(a => a.status === 'rejected').length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-300 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base font-serif text-white">
                  Cererile Mele de Adăugare
                </h3>
                <span className="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-800 rounded-md text-[10px] font-mono font-bold uppercase">
                  Operator
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Stadiul verificării și aprobării datelor trimise de tine către administrator
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-200 p-3 text-center text-xs">
          <div className="border-r border-slate-200">
            <span className="text-slate-500 block text-[11px]">În Așteptare</span>
            <span className="font-bold text-amber-600 text-sm">{pendingCount}</span>
          </div>
          <div className="border-r border-slate-200">
            <span className="text-slate-500 block text-[11px]">Aprobate</span>
            <span className="font-bold text-emerald-600 text-sm">{approvedCount}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Respinse</span>
            <span className="font-bold text-rose-600 text-sm">{rejectedCount}</span>
          </div>
        </div>

        {/* Submissions List */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {mySubmissions.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-700 text-sm">Nu ai trimis încă nicio solicitare de adăugare.</p>
              <p className="text-xs text-slate-400 mt-1">
                Folosește butoanele "Adaugă Persoană" sau "Import Excel" din antet pentru a trimite date spre aprobare.
              </p>
            </div>
          ) : (
            mySubmissions.map((item) => {
              const isExpanded = expandedId === item.id;
              const isSingle = item.type === 'single_record';

              return (
                <div
                  key={item.id}
                  className={`border rounded-xl p-4 transition-all ${
                    item.status === 'pending'
                      ? 'border-amber-300 bg-amber-50/20'
                      : item.status === 'approved'
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : 'border-rose-200 bg-rose-50/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isSingle ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isSingle ? <User className="w-4 h-4" /> : <FileSpreadsheet className="w-4 h-4" />}
                      </div>

                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-slate-900">
                            {isSingle && item.record 
                              ? `${item.record.lastName} ${item.record.firstName}`
                              : `Import Excel (${item.totalRecordsCount || item.records?.length || 0} persoane)`}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 ${
                            item.status === 'pending'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : item.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : 'bg-rose-100 text-rose-900 border border-rose-300'
                          }`}>
                            {item.status === 'pending' && <Clock className="w-2.5 h-2.5" />}
                            {item.status === 'approved' && <CheckCircle2 className="w-2.5 h-2.5" />}
                            {item.status === 'rejected' && <XCircle className="w-2.5 h-2.5" />}
                            <span>
                              {item.status === 'pending' ? 'În Așteptare' : item.status === 'approved' ? 'Aprobat' : 'Respins'}
                            </span>
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Trimis la: {new Date(item.submittedAt).toLocaleString('ro-RO')}
                        </p>

                        {item.status === 'approved' && item.reviewedBy && (
                          <p className="text-[11px] text-emerald-700 font-medium mt-1">
                            ✓ Aprobat și inclus în baza oficială de către {item.reviewedBy}
                          </p>
                        )}

                        {item.status === 'rejected' && item.rejectionReason && (
                          <div className="mt-1 p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                            <strong>Motiv respingere:</strong> {item.rejectionReason}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="text-slate-400 hover:text-slate-700 p-1"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-200/80 text-xs text-slate-700 space-y-2">
                      {isSingle && item.record && (
                        <div>
                          <p><strong>Cimitir:</strong> {item.record.cemeteryName}</p>
                          <p><strong>Locație:</strong> {item.record.city}, {item.record.county}</p>
                          <p><strong>Perioadă:</strong> {item.record.birthDate} - {item.record.deathDate}</p>
                          {item.record.notes && <p className="italic">"{item.record.notes}"</p>}
                        </div>
                      )}
                      {!isSingle && item.records && (
                        <div>
                          <p><strong>Fișier:</strong> {item.fileName}</p>
                          <p><strong>Total înregistrări:</strong> {item.records.length} persoane</p>
                          <div className="mt-1 max-h-32 overflow-y-auto bg-slate-50 p-2 rounded border border-slate-200 font-mono text-[10px]">
                            {item.records.map((r, i) => (
                              <div key={i}>{i+1}. {r.lastName} {r.firstName} - {r.cemeteryName} ({r.birthDate || '-'}/{r.deathDate || '-'})</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            Închide
          </button>
        </div>

      </div>
    </div>
  );
};
