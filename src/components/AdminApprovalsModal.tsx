import React from 'react';
import { PendingApproval } from '../types/cemetery';
import { AdminApprovalsPanel } from './AdminApprovalsPanel';
import { X, Bell, ShieldCheck } from 'lucide-react';

interface AdminApprovalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  approvals: PendingApproval[];
  onApprove: (id: string) => void;
  onReject: (id: string, reason?: string) => void;
  onDelete?: (id: string) => void;
  onNavigateToAdminZone?: () => void;
}

export const AdminApprovalsModal: React.FC<AdminApprovalsModalProps> = ({
  isOpen,
  onClose,
  approvals,
  onApprove,
  onReject,
  onDelete,
  onNavigateToAdminZone
}) => {
  if (!isOpen) return null;

  const pendingCount = approvals.filter(a => a.status === 'pending').length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-300 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 relative">
              <Bell className="w-5 h-5" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white rounded-full text-[10px] font-black flex items-center justify-center shadow-md animate-bounce">
                  {pendingCount}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base font-serif text-white">
                  Notificări & Aprobări Adăugiri Operatori
                </h3>
                <span className="px-2 py-0.5 bg-rose-950 text-rose-300 border border-rose-800 rounded-md text-[10px] font-mono font-bold uppercase">
                  Admin
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {pendingCount === 0 
                  ? 'Nu există adăugiri în așteptare de la operatori' 
                  : `${pendingCount} adăugiri necesită verificarea și decizia ta`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onNavigateToAdminZone && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToAdminZone();
                }}
                className="hidden sm:inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Deschide în Zona Admin</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Închide fereastra"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          <AdminApprovalsPanel
            approvals={approvals}
            onApprove={onApprove}
            onReject={onReject}
            onDelete={onDelete}
            isModal={true}
            onClose={onClose}
          />
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs text-slate-500">
          <span>Deciziile luate sunt înregistrate în registrul de securitate și audit.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold transition-colors cursor-pointer"
          >
            Închide
          </button>
        </div>

      </div>
    </div>
  );
};
