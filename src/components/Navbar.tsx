import React from 'react';
import cemeteryPinIcon from '../assets/cemetery-pin.svg';
import { 
  Database, 
  FileSpreadsheet, 
  Plus, 
  Church, 
  BarChart3, 
  Info,
  ShieldAlert, 
  LogIn, 
  LogOut, 
  ShieldCheck,
  Bell,
  Clock,
  Download
} from 'lucide-react';
import { UserAccount } from '../types/cemetery';

interface NavbarProps {
  activeTab: 'records' | 'cemeteries' | 'stats' | 'about' | 'admin';
  setActiveTab: (tab: 'records' | 'cemeteries' | 'stats' | 'about' | 'admin') => void;
  totalRecordsCount: number;
  cemeteriesCount: number;
  onOpenImport: () => void;
  onOpenExportExcel?: () => void;
  onOpenAddRecord: () => void;
  currentUser: UserAccount | null;
  onOpenLogin: () => void;
  onOpenRegister?: () => void;
  onLogout: () => void;
  onResetData?: () => void;
  globalSearchQuery?: string;
  setGlobalSearchQuery?: (query: string) => void;
  pendingApprovalsCount?: number;
  onOpenApprovalsModal?: () => void;
  operatorSubmissionsCount?: number;
  onOpenOperatorSubmissionsModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  totalRecordsCount,
  cemeteriesCount,
  onOpenImport,
  onOpenExportExcel,
  onOpenAddRecord,
  currentUser,
  onOpenLogin,
  onOpenRegister,
  onLogout,
  pendingApprovalsCount = 0,
  onOpenApprovalsModal,
  operatorSubmissionsCount = 0,
  onOpenOperatorSubmissionsModal
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const isOperator = currentUser?.role === 'editor';
  const canAddData = isAdmin || isOperator;

  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-slate-100 border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between py-3 gap-3 md:gap-0">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setActiveTab('records')}>
            <div className="w-10 h-10 rounded-xl bg-white border border-amber-400/70 flex items-center justify-center shadow-md p-1 group-hover:scale-105 group-hover:border-amber-300 transition-all overflow-hidden shrink-0">
              <img
                src={cemeteryPinIcon}
                alt="Cimitire România"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white font-serif group-hover:text-amber-300 transition-colors">
                Cimitire România
              </h1>
              <p className="text-xs text-slate-400">
                Bază de date cu cimitire, oameni și destine
              </p>
            </div>
          </div>

          {/* Top Actions: Import, Add Person, Notifications, User Profile */}
          <div className="flex items-center space-x-2 w-full md:w-auto justify-center sm:justify-end overflow-x-auto py-1 shrink-0">
            
            {/* Import Excel: Vizibil pentru Administrator și Operator */}
            {canAddData && (
              <button
                onClick={onOpenImport}
                className="inline-flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white transition-colors shadow-sm whitespace-nowrap cursor-pointer min-h-[38px]"
                title={isOperator ? "Încarcă fișier Excel (trimis spre aprobare administrator)" : "Încarcă fișier Excel / CSV"}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Import Excel</span>
              </button>
            )}

            {/* Export Excel: Vizibil DOAR pentru Administrator */}
            {isAdmin && onOpenExportExcel && (
              <button
                onClick={onOpenExportExcel}
                className="inline-flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-teal-700 hover:bg-teal-600 text-white transition-colors shadow-sm whitespace-nowrap cursor-pointer min-h-[38px]"
                title="Extrage baza de date în format Excel în funcție de cimitir"
              >
                <Download className="w-4 h-4" />
                <span>Export Excel</span>
              </button>
            )}

            {/* Adaugă Persoană: Vizibil pentru Administrator și Operator */}
            {canAddData && (
              <button
                onClick={onOpenAddRecord}
                className="inline-flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition-colors shadow-sm whitespace-nowrap cursor-pointer min-h-[38px]"
                title={isOperator ? "Adaugă persoană (trimisă spre aprobare administrator)" : "Adaugă persoană"}
              >
                <Plus className="w-4 h-4" />
                <span>Adaugă Persoană</span>
              </button>
            )}

            {/* Admin Approvals Notification Bell */}
            {isAdmin && onOpenApprovalsModal && (
              <button
                onClick={onOpenApprovalsModal}
                className={`relative inline-flex items-center justify-center p-2 rounded-xl transition-all cursor-pointer min-h-[38px] min-w-[38px] ${
                  pendingApprovalsCount > 0
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30'
                    : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-750 border border-slate-700'
                }`}
                title={`Notificări Aprobări Operatori: ${pendingApprovalsCount} în așteptare`}
              >
                <Bell className="w-4 h-4" />
                {pendingApprovalsCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-[18px] h-[18px] bg-rose-600 text-white rounded-full text-[10px] font-black flex items-center justify-center shadow-md animate-bounce">
                    {pendingApprovalsCount}
                  </span>
                )}
              </button>
            )}

            {/* Operator Submissions Button */}
            {isOperator && onOpenOperatorSubmissionsModal && (
              <button
                onClick={onOpenOperatorSubmissionsModal}
                className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-750 text-amber-300 border border-slate-700 transition-colors cursor-pointer min-h-[38px]"
                title="Vezi starea cererilor trimise de tine administratorului"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Cererile Mele</span>
                {operatorSubmissionsCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded-full text-[10px] font-bold border border-amber-500/40">
                    {operatorSubmissionsCount}
                  </span>
                )}
              </button>
            )}

            {/* User Authentication Actions */}
            {currentUser ? (
              <div className="flex items-center space-x-2 bg-slate-800/90 border border-slate-700/80 rounded-xl px-3 py-1 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-950 border border-rose-600/60 flex items-center justify-center text-rose-400 font-bold font-mono text-xs">
                    {currentUser.name ? currentUser.name.slice(0, 1).toUpperCase() : 'U'}
                  </div>
                  <div className="flex flex-col text-left hidden sm:flex">
                    <span className="font-bold text-white text-[11px] leading-tight truncate max-w-[130px]" title={currentUser.email}>
                      {currentUser.name || currentUser.email}
                    </span>
                    <span className="text-[10px] text-amber-400 font-mono flex items-center space-x-0.5">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      <span>{currentUser.role === 'admin' ? 'Administrator' : 'Operator Date'}</span>
                    </span>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 rounded-lg transition-colors cursor-pointer ml-1"
                  title="Deconectare din cont"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center border-l border-slate-700 pl-2">
                <button
                  onClick={onOpenLogin}
                  className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 transition-colors shadow-sm whitespace-nowrap cursor-pointer min-h-[38px]"
                  title="Conectare / Autentificare în cont"
                >
                  <LogIn className="w-4 h-4 text-amber-400" />
                  <span>Login</span>
                </button>
              </div>
            )}

          </div>

        </div>

        {/* Sub-navigation Tabs */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-2 pb-1.5 text-xs sm:text-sm">
          <div className="flex items-center space-x-1.5 sm:space-x-2 overflow-x-auto py-0.5 w-full scrollbar-none">
            <button
              onClick={() => setActiveTab('records')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer min-h-[38px] ${
                activeTab === 'records'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Registru Decedați</span>
              <span className="ml-1 px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded-full text-xs font-mono border border-slate-700">
                {totalRecordsCount}
              </span>
            </button>

            {/* Director Cimitire: Vizibil momentan EXCLUSIV dacă utilizatorul este logat ca Administrator */}
            {isAdmin && (
              <button
                onClick={() => setActiveTab('cemeteries')}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer min-h-[38px] ${
                  activeTab === 'cemeteries'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Church className="w-4 h-4" />
                <span>Director Cimitire</span>
                <span className="ml-1 px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded-full text-xs font-mono border border-slate-700">
                  {cemeteriesCount}
                </span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer min-h-[38px] ${
                activeTab === 'stats'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Statistici</span>
            </button>

            {/* Tab Despre noi */}
            <button
              onClick={() => setActiveTab('about')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer min-h-[38px] ${
                activeTab === 'about'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Info className="w-4 h-4" />
              <span>Despre noi</span>
            </button>

            {/* Zona Administrativă: Vizibilă DOAR dacă utilizatorul este logat ca Administrator */}
            {isAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer min-h-[38px] ${
                  activeTab === 'admin'
                    ? 'bg-rose-500/25 text-rose-200 border border-rose-500/60 font-bold shadow-sm'
                    : 'text-rose-400 hover:text-rose-200 hover:bg-slate-800 border border-rose-500/20'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
                <span>Zona Administrativă</span>
                <span className="ml-1 px-1.5 py-0.2 bg-rose-950 text-rose-300 rounded text-[10px] font-mono border border-rose-800">
                  Admin
                </span>
                {pendingApprovalsCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-amber-950 font-bold rounded-full text-[10px] animate-pulse">
                    {pendingApprovalsCount} noi
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};


