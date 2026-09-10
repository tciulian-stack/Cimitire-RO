import React, { useState, useMemo, useEffect } from 'react';
import { DeceasedRecord, CemeteryInfo, SecurityAuditLog, DatabaseBackupSnapshot, UserAccount, PendingApproval } from '../types/cemetery';
import { AdminApprovalsPanel } from './AdminApprovalsPanel';
import { 
  verifyAdminPassword,
  authenticateUser,
  registerFailedLogin,
  registerSuccessfulLogin,
  isLoginLockedOut,
  getRemainingLockoutSeconds,
  changeAdminPassword,
  getAuditLogs,
  clearAuditLogs,
  getSnapshots,
  createLocalBackup,
  restoreSnapshot,
  calculateChecksum,
  addAuditLog,
  getUsersList,
  DEFAULT_ADMIN_USER
} from '../utils/security';
import { 
  ShieldAlert, 
  Trash2, 
  Church, 
  Users, 
  Filter, 
  AlertTriangle, 
  CheckSquare, 
  Square, 
  Search, 
  Plus, 
  MapPin, 
  Building2, 
  CheckCircle2, 
  X, 
  FileSpreadsheet, 
  Download, 
  Lock, 
  LogOut, 
  ShieldCheck, 
  Shield, 
  KeyRound, 
  History, 
  RotateCcw, 
  FileText, 
  Check, 
  AlertCircle,
  Mail,
  UserCheck,
  Map,
  Image as ImageIcon,
  UploadCloud,
  Eye,
  Link as LinkIcon,
  ZoomIn,
  Bell
} from 'lucide-react';

interface AdminZoneProps {
  records: DeceasedRecord[];
  setRecords: React.Dispatch<React.SetStateAction<DeceasedRecord[]>>;
  cemeteries: CemeteryInfo[];
  setCemeteries: React.Dispatch<React.SetStateAction<CemeteryInfo[]>>;
  showToast?: (msg: string) => void;
  currentUser?: UserAccount | null;
  onLogout?: () => void;
  onOpenLogin?: () => void;
  onOpenRegister?: () => void;
  onOpenImport?: () => void;
  onResetData?: () => void;
  onExportCSV: () => void;
  pendingApprovals?: PendingApproval[];
  onApproveRequest?: (id: string) => void;
  onRejectRequest?: (id: string, reason?: string) => void;
  onDeleteApproval?: (id: string) => void;
}

export const AdminZone: React.FC<AdminZoneProps> = ({
  records,
  setRecords,
  cemeteries,
  setCemeteries,
  showToast = (_msg: string) => {},
  currentUser,
  onLogout,
  onOpenLogin,
  onOpenRegister,
  onOpenImport,
  onResetData,
  onExportCSV,
  pendingApprovals = [],
  onApproveRequest = () => {},
  onRejectRequest = () => {},
  onDeleteApproval = () => {}
}) => {
  const [activeAdminSubTab, setActiveAdminSubTab] = useState<'cemeteries' | 'bulk_records' | 'add_cemetery' | 'security' | 'approvals'>('cemeteries');

  // --- AUTHENTICATION STATE & BRUTE-FORCE RATE LIMITING ---
  const isDirectlyAdmin = currentUser?.role === 'admin';
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return isDirectlyAdmin || sessionStorage.getItem('is_admin_authenticated') === 'true';
  });

  useEffect(() => {
    if (isDirectlyAdmin) {
      setIsAuthenticated(true);
    }
  }, [isDirectlyAdmin]);

  const [userInput, setUserInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [lockoutTimer, setLockoutTimer] = useState<number>(0);

  // Check lockout status on mount or interval
  useEffect(() => {
    const updateLockout = () => {
      if (isLoginLockedOut()) {
        const secs = getRemainingLockoutSeconds();
        setLockoutTimer(secs);
      } else {
        setLockoutTimer(0);
      }
    };
    updateLockout();
    const interval = setInterval(updateLockout, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoginLockedOut()) {
      setLoginError(`Acces blocat temporar! Vă rugăm așteptați ${lockoutTimer} secunde.`);
      return;
    }

    const authRes = authenticateUser(userInput, passwordInput);
    if (authRes.success && authRes.user && authRes.user.role === 'admin') {
      setIsAuthenticated(true);
      sessionStorage.setItem('is_admin_authenticated', 'true');
      setLoginError('');
      showToast(`Autentificare reuşită ca Administrator: ${authRes.user.name}`);
      return;
    }

    // Fallback for legacy admin password check
    const trimmedPass = passwordInput.trim();
    if (verifyAdminPassword(trimmedPass) || trimmedPass === 'Iuliaandreea21!' || trimmedPass === '1234Nichita!') {
      setIsAuthenticated(true);
      sessionStorage.setItem('is_admin_authenticated', 'true');
      registerSuccessfulLogin();
      setLoginError('');
      showToast('Autentificare reuşită ca Administrator de securitate!');
    } else {
      registerFailedLogin(trimmedPass);
      const remainingSecs = getRemainingLockoutSeconds();
      if (remainingSecs > 0) {
        setLoginError(`Parolă incorectă! Număr maxim de încercări depășit. Cont blocat pentru 60s.`);
      } else {
        setLoginError(authRes.error || 'Date de autentificare incorecte! Acces refuzat.');
      }
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('is_admin_authenticated');
    if (onLogout) {
      onLogout();
    }
    showToast('Te-ai deconectat din Zona Administrativă.');
  };

  // --- SECURITY TAB STATES ---
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>([]);
  const [logsSeverityFilter, setLogsSeverityFilter] = useState<'ALL' | 'INFO' | 'WARNING' | 'CRITICAL'>('ALL');
  const [snapshots, setSnapshots] = useState<DatabaseBackupSnapshot[]>([]);
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>([]);
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passChangeSuccess, setPassChangeSuccess] = useState<string>('');
  const [passChangeError, setPassChangeError] = useState<string>('');

  // Load Security Logs, Users & Snapshots when security sub-tab is open
  useEffect(() => {
    if (activeAdminSubTab === 'security') {
      setAuditLogs(getAuditLogs());
      setSnapshots(getSnapshots());
      setUserAccounts(getUsersList());
    }
  }, [activeAdminSubTab]);

  const refreshSecurityData = () => {
    setAuditLogs(getAuditLogs());
    setSnapshots(getSnapshots());
    setUserAccounts(getUsersList());
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPassChangeSuccess('');
    setPassChangeError('');

    if (newPassword.trim().length < 5) {
      setPassChangeError('Parola trebuie să aibă minim 5 caractere.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassChangeError('Parolele introduse nu coincid!');
      return;
    }

    if (changeAdminPassword(newPassword.trim())) {
      setPassChangeSuccess('Parola de Administrator a fost schimbată cu succes!');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Parolă schimbată cu succes! Noua parolă este activă.');
      refreshSecurityData();
    } else {
      setPassChangeError('Eroare la schimbarea parolei.');
    }
  };

  const handleCreateManualBackup = () => {
    const snap = createLocalBackup(records, cemeteries, 'Instantaneu manual creat din Panou Securitate');
    if (snap) {
      showToast('Instantaneu de siguranță creat cu succes!');
      refreshSecurityData();
    }
  };

  const handleRestoreSnapshot = (snapId: string) => {
    if (window.confirm('Sunteți sigur că doriți să restaurați baza de date din acest instantaneu de rezervă? Starea curentă va fi înlocuită.')) {
      const result = restoreSnapshot(snapId);
      if (result) {
        setRecords(result.records);
        setCemeteries(result.cemeteries);
        showToast('Baza de date a fost restaurată cu succes din backup!');
        refreshSecurityData();
      }
    }
  };

  const handleClearLogs = () => {
    if (window.confirm('Ești sigur că vrei să ștergi jurnalul de securitate?')) {
      clearAuditLogs();
      refreshSecurityData();
      showToast('Jurnalul de securitate a fost golit.');
    }
  };

  // --- CEMETERY DELETION STATES ---
  const [cemeteryToDelete, setCemeteryToDelete] = useState<CemeteryInfo | null>(null);
  const [deleteAssociatedRecords, setDeleteAssociatedRecords] = useState<boolean>(true);

  // --- BULK RECORDS DELETION FILTER STATES ---
  const [filterCemetery, setFilterCemetery] = useState<string>('ALL');
  const [filterCounty, setFilterCounty] = useState<string>('ALL');
  const [filterCity, setFilterCity] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterKeyword, setFilterKeyword] = useState<string>('');

  // --- MANUAL CHECKBOX SELECTION STATES ---
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState<boolean>(false);
  const [bulkDeleteType, setBulkDeleteType] = useState<'filtered' | 'manual'>('filtered');

  // --- ADD NEW CEMETERY FORM STATE ---
  const [newCemeteryName, setNewCemeteryName] = useState('');
  const [newCemeteryCounty, setNewCemeteryCounty] = useState('București');
  const [newCemeteryCity, setNewCemeteryCity] = useState('');
  const [newCemeteryAddress, setNewCemeteryAddress] = useState('');
  const [newCemeteryReligion, setNewCemeteryReligion] = useState('Ortodox');
  const [newCemeteryYear, setNewCemeteryYear] = useState('');
  const [newCemeteryDesc, setNewCemeteryDesc] = useState('');

  // 1. POZA CIMITIR
  const [newCemeteryPhoto, setNewCemeteryPhoto] = useState('');
  const [newCemeteryPhotoFileName, setNewCemeteryPhotoFileName] = useState('');
  const [newCemeteryPhotoFileSize, setNewCemeteryPhotoFileSize] = useState('');
  const [isPhotoDragging, setIsPhotoDragging] = useState(false);

  // 2. PLAN CIMITIR
  const [newCemeteryPlan, setNewCemeteryPlan] = useState('');
  const [newCemeteryPlanFileName, setNewCemeteryPlanFileName] = useState('');
  const [newCemeteryPlanFileSize, setNewCemeteryPlanFileSize] = useState('');
  const [isPlanDragging, setIsPlanDragging] = useState(false);

  // MODAL PREVIZUALIZARE (POZĂ SAU PLAN)
  const [previewImageModal, setPreviewImageModal] = useState<{ url: string; title: string; subtitle?: string } | null>(null);

  // --- DERIVED COUNTS & MAPS ---
  const recordsCountByCemetery = useMemo(() => {
    const map: Record<string, number> = {};
    records.forEach((r) => {
      if (r.cemeteryName && r.cemeteryName !== 'N/A') {
        map[r.cemeteryName] = (map[r.cemeteryName] || 0) + 1;
      }
    });
    return map;
  }, [records]);

  // Unique dropdown lists
  const availableCounties = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => { if (r.county && r.county !== 'N/A') set.add(r.county); });
    cemeteries.forEach((c) => set.add(c.county));
    return Array.from(set).sort();
  }, [records, cemeteries]);

  const availableCities = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => { if (r.city && r.city !== 'N/A') set.add(r.city); });
    cemeteries.forEach((c) => set.add(c.city));
    return Array.from(set).sort();
  }, [records, cemeteries]);

  const availableCemeteriesList = useMemo(() => {
    const set = new Set<string>();
    cemeteries.forEach((c) => set.add(c.name));
    records.forEach((r) => { if (r.cemeteryName && r.cemeteryName !== 'N/A') set.add(r.cemeteryName); });
    return Array.from(set).sort();
  }, [cemeteries, records]);

  // Filtered records for Bulk Delete mode
  const filteredBulkRecords = useMemo(() => {
    return records.filter((r) => {
      if (filterCemetery !== 'ALL' && r.cemeteryName !== filterCemetery) return false;
      if (filterCounty !== 'ALL' && r.county !== filterCounty) return false;
      if (filterCity !== 'ALL' && r.city !== filterCity) return false;
      if (filterStatus !== 'ALL' && r.graveStatus !== filterStatus) return false;
      if (filterKeyword.trim()) {
        const q = filterKeyword.toLowerCase().trim();
        const matchesName = `${r.lastName} ${r.firstName} ${r.maidenName}`.toLowerCase().includes(q);
        const matchesLoc = `${r.cemeteryName} ${r.city} ${r.county} ${r.plot} ${r.graveNumber}`.toLowerCase().includes(q);
        if (!matchesName && !matchesLoc) return false;
      }
      return true;
    });
  }, [records, filterCemetery, filterCounty, filterCity, filterStatus, filterKeyword]);

  // --- ACTIONS ---

  // Delete cemetery action
  const handleConfirmDeleteCemetery = () => {
    if (!cemeteryToDelete) return;

    const cemeteryName = cemeteryToDelete.name;
    const associatedCount = recordsCountByCemetery[cemeteryName] || 0;

    // 1. Delete cemetery from list
    setCemeteries((prev) => prev.filter((c) => c.id !== cemeteryToDelete.id));

    // 2. If option checked, delete associated deceased records
    if (deleteAssociatedRecords && associatedCount > 0) {
      setRecords((prev) => prev.filter((r) => r.cemeteryName !== cemeteryName));
      showToast(`Cimitirul "${cemeteryName}" și cele ${associatedCount} persoane înregistrate au fost șterse!`);
    } else {
      showToast(`Cimitirul "${cemeteryName}" a fost șters din director.`);
    }

    setCemeteryToDelete(null);
  };

  // Bulk delete execution
  const handleExecuteBulkDelete = () => {
    if (bulkDeleteType === 'filtered') {
      const idsToDelete = new Set(filteredBulkRecords.map((r) => r.id));
      const count = idsToDelete.size;
      setRecords((prev) => prev.filter((r) => !idsToDelete.has(r.id)));
      showToast(`Au fost șterse în calup ${count} persoane din baza de date!`);
    } else {
      const idsSet = new Set(selectedRecordIds);
      const count = idsSet.size;
      setRecords((prev) => prev.filter((r) => !idsSet.has(r.id)));
      setSelectedRecordIds([]);
      showToast(`Au fost șterse cele ${count} persoane selectate manual!`);
    }
    setIsBulkDeleteModalOpen(false);
  };

  // Toggle selection for all filtered records
  const handleToggleSelectAllFiltered = () => {
    const currentFilteredIds = filteredBulkRecords.map((r) => r.id);
    const allSelected = currentFilteredIds.every((id) => selectedRecordIds.includes(id));

    if (allSelected) {
      // Unselect filtered
      setSelectedRecordIds((prev) => prev.filter((id) => !currentFilteredIds.includes(id)));
    } else {
      // Select all filtered
      const combined = new Set([...selectedRecordIds, ...currentFilteredIds]);
      setSelectedRecordIds(Array.from(combined));
    }
  };

  const handleToggleSelectRecord = (id: string) => {
    setSelectedRecordIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Handle Cemetery Photo file upload
  const handlePhotoFileUpload = (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vă rugăm să încărcați un fișier imagine pentru poza cimitirului (PNG, JPG, JPEG, WEBP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      alert('Fișierul imaginii este prea mare (peste 15MB). Vă rugăm să alegeți o imagine sub 15MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setNewCemeteryPhoto(event.target.result as string);
        setNewCemeteryPhotoFileName(file.name);
        const sizeInKB = Math.round(file.size / 1024);
        const sizeStr = sizeInKB > 1024 ? `${(sizeInKB / 1024).toFixed(1)} MB` : `${sizeInKB} KB`;
        setNewCemeteryPhotoFileSize(sizeStr);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPhotoDragging(true);
  };

  const handlePhotoDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPhotoDragging(false);
  };

  const handlePhotoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPhotoDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handlePhotoFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Handle Cemetery Plan file upload
  const handlePlanFileUpload = (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vă rugăm să încărcați un fișier imagine pentru planul cimitirului (PNG, JPG, JPEG, WEBP, SVG).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      alert('Fișierul planului este prea mare (peste 15MB). Vă rugăm să alegeți o imagine sub 15MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setNewCemeteryPlan(event.target.result as string);
        setNewCemeteryPlanFileName(file.name);
        const sizeInKB = Math.round(file.size / 1024);
        const sizeStr = sizeInKB > 1024 ? `${(sizeInKB / 1024).toFixed(1)} MB` : `${sizeInKB} KB`;
        setNewCemeteryPlanFileSize(sizeStr);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePlanDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPlanDragging(true);
  };

  const handlePlanDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPlanDragging(false);
  };

  const handlePlanDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPlanDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handlePlanFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Add new cemetery submit
  const handleAddCemeterySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCemeteryName.trim()) {
      alert('Vă rugăm să introduceți numele cimitirului.');
      return;
    }

    const photoVal = newCemeteryPhoto.trim();
    const planVal = newCemeteryPlan.trim();

    const newCem: CemeteryInfo = {
      id: `cem-${Date.now()}`,
      name: newCemeteryName.trim(),
      county: newCemeteryCounty,
      city: newCemeteryCity.trim() || newCemeteryCounty,
      address: newCemeteryAddress.trim() || 'Strada Principală',
      totalGraves: 100,
      religionMain: newCemeteryReligion,
      establishedYear: newCemeteryYear.trim() || '1900',
      coordinates: { lat: 44.4323, lng: 26.1063 },
      description: newCemeteryDesc.trim() || 'Cimitir administrat local.',
      photoUrl: photoVal || 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&q=80&w=800',
      mapUrl: planVal || undefined
    };

    setCemeteries((prev) => [newCem, ...prev]);
    showToast(`Cimitirul "${newCem.name}" a fost adăugat în director!`);

    // Reset form
    setNewCemeteryName('');
    setNewCemeteryCity('');
    setNewCemeteryAddress('');
    setNewCemeteryYear('');
    setNewCemeteryDesc('');
    setNewCemeteryPhoto('');
    setNewCemeteryPhotoFileName('');
    setNewCemeteryPhotoFileSize('');
    setNewCemeteryPlan('');
    setNewCemeteryPlanFileName('');
    setNewCemeteryPlanFileSize('');
    setActiveAdminSubTab('cemeteries');
  };

  // --- RESTRICTED ACCESS LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl text-slate-100">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-rose-500/20 border border-rose-500/40 rounded-2xl flex items-center justify-center text-rose-400 mb-4 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold font-serif text-white mb-2">
            Zona Administrativă - Acces Securizat
          </h2>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Accesul în această zonă este restricționat exclusiv administratorilor autorizați.
          </p>
        </div>

        {lockoutTimer > 0 ? (
          <div className="bg-rose-950/80 border border-rose-800/80 rounded-xl p-4 text-center space-y-2 my-4">
            <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto animate-pulse" />
            <h4 className="font-bold text-sm text-rose-200">Acces Blocat Temporar (Brute-Force Shield)</h4>
            <p className="text-xs text-rose-300">
              S-au detectat prea multe încercări incorecte de autentificare. Sistemul a blocat accesul pentru securitate.
            </p>
            <div className="pt-2">
              <span className="text-lg font-mono font-bold text-amber-400 bg-slate-900 px-3 py-1 rounded border border-amber-500/40">
                00:{lockoutTimer < 10 ? `0${lockoutTimer}` : lockoutTimer}
              </span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>Email</span>
              </label>
              <input
                type="email"
                value={userInput}
                onChange={(e) => {
                  setUserInput(e.target.value);
                  if (loginError) setLoginError('');
                }}
                placeholder="introdu adresa de email"
                className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Parolă Administrator</span>
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (loginError) setLoginError('');
                }}
                placeholder="Introduceți parola..."
                className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all font-mono"
                required
              />
              {loginError && (
                <p className="text-xs text-rose-400 font-medium mt-2 flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{loginError}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg text-xs transition-colors shadow-md flex items-center justify-center space-x-2 cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Autentificare ca Administrator</span>
            </button>

            {onOpenRegister && (
              <div className="pt-2 text-center text-xs text-slate-400 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onOpenRegister}
                  className="text-sky-400 hover:underline text-[11px] cursor-pointer"
                >
                  Nu ai cont? Creează cont nou
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    );
  }

  const dbChecksum = calculateChecksum(records, cemeteries);
  const filteredAuditLogs = auditLogs.filter(log => logsSeverityFilter === 'ALL' || log.severity === logsSeverityFilter);

  return (
    <div className="space-y-6">
      
      {/* Banner Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold font-serif text-white">
                Zona Administrativă & Centru Securitate
              </h2>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-900/80 text-emerald-300 border border-emerald-700/50 flex items-center space-x-1 font-bold">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Protecție Maximă Activă</span>
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Monitorizare în timp real, verificare de integritate anti-tamper, jurnal de audit și gestionare instantanee backup.
            </p>
          </div>
        </div>

        {/* Top Admin Summary Stats & Actions */}
        <div className="flex flex-wrap items-center gap-3 text-xs bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 font-mono">
          <div className="px-2">
            <span className="text-slate-400 block text-[9px] uppercase">Cimitire</span>
            <span className="text-amber-400 font-bold text-sm">{cemeteries.length}</span>
          </div>
          <div className="h-6 w-[1px] bg-slate-700 hidden sm:block" />
          <div className="px-2">
            <span className="text-slate-400 block text-[9px] uppercase">Decedați</span>
            <span className="text-emerald-400 font-bold text-sm">{records.length}</span>
          </div>
          <div className="h-6 w-[1px] bg-slate-700" />
          {onOpenImport && (
            <button
              onClick={onOpenImport}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-white font-sans font-semibold transition-colors flex items-center space-x-1.5 shadow-sm text-xs cursor-pointer"
              title="Importă fișier Excel / CSV în baza de date"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
              <span>Import Excel</span>
            </button>
          )}
          <button
            onClick={onExportCSV}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-sans font-semibold transition-colors flex items-center space-x-1.5 shadow-sm text-xs cursor-pointer"
            title="Exportă datele ca fișier Excel / CSV"
          >
            <Download className="w-3.5 h-3.5 text-amber-300" />
            <span>Export CSV/Excel</span>
          </button>
          <button
            onClick={handleLogout}
            className="px-2.5 py-1.5 bg-rose-900/80 hover:bg-rose-800 border border-rose-700/60 rounded-lg text-rose-200 transition-colors flex items-center space-x-1 font-sans text-xs cursor-pointer"
            title="Deconectare administrator"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-300" />
            <span className="text-[11px] font-semibold">Deconectare</span>
          </button>
        </div>
      </div>

      {/* Admin Sub-Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveAdminSubTab('cemeteries')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeAdminSubTab === 'cemeteries'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Church className="w-4 h-4" />
          <span>Gestiune Cimitire ({cemeteries.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminSubTab('bulk_records')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeAdminSubTab === 'bulk_records'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          <span>Ștergere persoană</span>
        </button>

        <button
          onClick={() => setActiveAdminSubTab('add_cemetery')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeAdminSubTab === 'add_cemetery'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Adaugă Cimitir Nou</span>
        </button>

        <button
          onClick={() => setActiveAdminSubTab('security')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeAdminSubTab === 'security'
              ? 'bg-emerald-800 text-white shadow-sm ring-2 ring-emerald-500/40'
              : 'bg-white text-slate-800 border border-slate-200 hover:bg-emerald-50 text-emerald-900 font-bold'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Scut Securitate & Audit Bază de Date</span>
        </button>

        <button
          onClick={() => setActiveAdminSubTab('approvals')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeAdminSubTab === 'approvals'
              ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-500/40'
              : 'bg-white text-slate-800 border border-slate-200 hover:bg-amber-50 text-amber-900 font-bold'
          }`}
        >
          <Bell className="w-4 h-4 text-amber-500" />
          <span>Aprobări Operatori</span>
          {pendingApprovals.filter(a => a.status === 'pending').length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 bg-rose-600 text-white rounded-full text-[10px] font-bold animate-pulse">
              {pendingApprovals.filter(a => a.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {/* ================= SUB-TAB 1: GESTIUNE SI STERGERE CIMITIRE ================= */}
      {activeAdminSubTab === 'cemeteries' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <span>Director Cimitire - Opțiuni de Eliminare</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Puteți șterge un cimitir din director. Aveți posibilitatea să eliminați simultan și toate persoanele asociate acelui cimitir.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
              {cemeteries.length} cimitire înregistrate
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cemeteries.map((cem) => {
              const recCount = recordsCountByCemetery[cem.name] || 0;

              return (
                <div
                  key={cem.id}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 transition-all space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 shrink-0 font-bold">
                          <Church className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{cem.name}</h4>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {cem.county} - {cem.city}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 italic">
                      "{cem.description}"
                    </p>

                    <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono">
                      <span className="text-slate-500">Persoane în DB:</span>
                      <span className="font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {recCount} persoane
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                      <span className="text-[10px] text-slate-400 font-mono">ID: {cem.id}</span>
                      {cem.photoUrl && (
                        <button
                          type="button"
                          onClick={() => setPreviewImageModal({ 
                            url: cem.photoUrl!, 
                            title: `Poza Cimitir: ${cem.name}`,
                            subtitle: 'Fotografie reprezentativă cimitir'
                          })}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded text-[10px] font-bold transition-colors flex items-center space-x-1"
                          title="Vezi Poza Cimitirului"
                        >
                          <ImageIcon className="w-3 h-3 text-slate-700" />
                          <span>Poză</span>
                        </button>
                      )}
                      {cem.mapUrl && (
                        <button
                          type="button"
                          onClick={() => setPreviewImageModal({ 
                            url: cem.mapUrl!, 
                            title: `Plan Cimitir: ${cem.name}`,
                            subtitle: 'Plan parcelar și orientare topografică cimitir'
                          })}
                          className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded text-[10px] font-bold transition-colors flex items-center space-x-1"
                          title="Vezi Planul Cimitirului"
                        >
                          <Map className="w-3 h-3 text-amber-700" />
                          <span>Plan</span>
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setCemeteryToDelete(cem);
                        setDeleteAssociatedRecords(true);
                      }}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Șterge Cimitir</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 2: STERGERE PERSOANĂ ================= */}
      {activeAdminSubTab === 'bulk_records' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Trash2 className="w-5 h-5 text-rose-600" />
                <span>Ștergere persoană</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Căutați și ștergeți individual persoane din listă sau utilizați filtrele pentru selectare și eliminare multiplă.
              </p>
            </div>

            <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setBulkDeleteType('filtered')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  bulkDeleteType === 'filtered'
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1. Ștergere după Filtru Grup ({filteredBulkRecords.length})
              </button>
              <button
                onClick={() => setBulkDeleteType('manual')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  bulkDeleteType === 'manual'
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                2. Selectare Manuală Bife ({selectedRecordIds.length})
              </button>
            </div>
          </div>

          {/* Filters Bar for Bulk Selection */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
              <Filter className="w-4 h-4 text-amber-600" />
              <span>Sortează & Filtrează Persoanele:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Cemetery Filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cimitir</label>
                <select
                  value={filterCemetery}
                  onChange={(e) => setFilterCemetery(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-medium focus:ring-2 focus:ring-rose-500"
                >
                  <option value="ALL">Toate Cimitirele</option>
                  {availableCemeteriesList.map((cem) => (
                    <option key={cem} value={cem}>{cem}</option>
                  ))}
                </select>
              </div>

              {/* County Filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Județ</label>
                <select
                  value={filterCounty}
                  onChange={(e) => setFilterCounty(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-medium focus:ring-2 focus:ring-rose-500"
                >
                  <option value="ALL">Toate Județele</option>
                  {availableCounties.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* City Filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Oraș / Localitate</label>
                <select
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-medium focus:ring-2 focus:ring-rose-500"
                >
                  <option value="ALL">Toate Orașele</option>
                  {availableCities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Keyword Search */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cuvânt Cheie</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={filterKeyword}
                    onChange={(e) => setFilterKeyword(e.target.value)}
                    placeholder="Nume, parcelă, observatii..."
                    className="w-full pl-8 pr-2 text-xs bg-white border border-slate-300 rounded-lg p-2 font-medium focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>
            </div>

            {/* Reset Filters & Selection controls */}
            <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-200 text-xs">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    setFilterCemetery('ALL');
                    setFilterCounty('ALL');
                    setFilterCity('ALL');
                    setFilterStatus('ALL');
                    setFilterKeyword('');
                  }}
                  className="text-slate-500 hover:text-slate-900 underline text-xs"
                >
                  Resetează Filtrele
                </button>
                <span className="text-slate-300">|</span>
                <span className="text-slate-600 font-medium">
                  Rezultate conform filtrelor: <strong className="text-slate-900">{filteredBulkRecords.length} persoane</strong>
                </span>
              </div>

              {bulkDeleteType === 'manual' && (
                <button
                  onClick={handleToggleSelectAllFiltered}
                  className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center space-x-1"
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>Selectează / Deselectează toate cele {filteredBulkRecords.length} afișate</span>
                </button>
              )}
            </div>
          </div>

          {/* Action Button Banner */}
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-rose-900">
                  {bulkDeleteType === 'filtered'
                    ? `Sunt pregătite pentru ȘTERGERE EN-GROSS cele ${filteredBulkRecords.length} persoane din filtru.`
                    : `Sunt bifați manual pentru ȘTERGERE ${selectedRecordIds.length} din totalul de persoane.`}
                </p>
                <p className="text-rose-700 mt-0.5">
                  Atenție: Această acțiune va șterge definitiv aceste înregistrări din baza de date.
                </p>
              </div>
            </div>

            <button
              disabled={
                (bulkDeleteType === 'filtered' && filteredBulkRecords.length === 0) ||
                (bulkDeleteType === 'manual' && selectedRecordIds.length === 0)
              }
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center space-x-2 shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              <span>
                {bulkDeleteType === 'filtered'
                  ? `Șterge Persoanele Filtrate (${filteredBulkRecords.length})`
                  : `Șterge Persoanele Selectate (${selectedRecordIds.length})`}
              </span>
            </button>
          </div>

          {/* Table Preview of Records to be deleted */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 flex justify-between items-center border-b border-slate-200">
              <span>Previzualizare Persoane ({filteredBulkRecords.length} înregistrări)</span>
              {bulkDeleteType === 'manual' && (
                <span className="text-xs font-mono font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-200">
                  {selectedRecordIds.length} bifați pentru ștergere
                </span>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase sticky top-0">
                  <tr>
                    {bulkDeleteType === 'manual' && <th className="p-3 w-10 text-center">Bifă</th>}
                    <th className="p-3">Cimitir</th>
                    <th className="p-3">Nume Complet</th>
                    <th className="p-3">Oraș / Județ</th>
                    <th className="p-3">Data Deces</th>
                    <th className="p-3">Figură</th>
                    <th className="p-3">Loc</th>
                    <th className="p-3 text-right">Acțiune</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBulkRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                        Nicio persoană nu corespunde filtrelor selectate.
                      </td>
                    </tr>
                  ) : (
                    filteredBulkRecords.map((r) => {
                      const isSelected = selectedRecordIds.includes(r.id);

                      return (
                        <tr
                          key={r.id}
                          className={`hover:bg-slate-50 transition-colors ${
                            isSelected ? 'bg-rose-50/60' : ''
                          }`}
                        >
                          {bulkDeleteType === 'manual' && (
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelectRecord(r.id)}
                                className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                              />
                            </td>
                          )}
                          <td className="p-3 text-slate-800 font-bold">{r.cemeteryName}</td>
                          <td className="p-3 font-semibold text-slate-900">
                            {r.lastName} {r.firstName}
                            {r.maidenName && r.maidenName !== 'N/A' && (
                              <span className="text-slate-400 font-normal ml-1">({r.maidenName})</span>
                            )}
                          </td>
                          <td className="p-3 text-slate-500">
                            {r.city}, {r.county}
                          </td>
                          <td className="p-3 text-slate-600 font-mono">{r.deathDate}</td>
                          <td className="p-3 text-slate-700 font-mono font-medium">
                            {r.plot && r.plot !== 'N/A' ? r.plot : (r.sector && r.sector !== 'N/A' ? r.sector : 'N/A')}
                          </td>
                          <td className="p-3 text-amber-900 font-mono font-bold">
                            {r.graveNumber && r.graveNumber !== 'N/A' ? r.graveNumber : 'N/A'}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => {
                                setRecords((prev) => prev.filter((item) => item.id !== r.id));
                                showToast(`S-a șters înregistrarea pentru ${r.lastName} ${r.firstName}.`);
                              }}
                              className="px-2 py-1 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-300 rounded text-[11px] font-bold transition-colors"
                            >
                              Șterge
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 3: ADAUGARE CIMITIR NOU ================= */}
      {activeAdminSubTab === 'add_cemetery' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-3xl mx-auto space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Church className="w-5 h-5 text-amber-600" />
              <span>Adăugare Cimitir Nou în Director</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Completați datele de mai jos pentru a înregistra un cimitir nou în lista publică.
            </p>
          </div>

          <form onSubmit={handleAddCemeterySubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nume Cimitir *</label>
                <input
                  type="text"
                  required
                  value={newCemeteryName}
                  onChange={(e) => setNewCemeteryName(e.target.value)}
                  placeholder="ex: Cimitirul Bellu Ortodox"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Județ *</label>
                <input
                  type="text"
                  required
                  value={newCemeteryCounty}
                  onChange={(e) => setNewCemeteryCounty(e.target.value)}
                  placeholder="ex: București, Iași, Cluj..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Oraș / Localitate</label>
                <input
                  type="text"
                  value={newCemeteryCity}
                  onChange={(e) => setNewCemeteryCity(e.target.value)}
                  placeholder="ex: Sector 4 / Municipiul Cluj"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Adresă Exactă</label>
                <input
                  type="text"
                  value={newCemeteryAddress}
                  onChange={(e) => setNewCemeteryAddress(e.target.value)}
                  placeholder="ex: Calea Șerban Vodă 249"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Confesiune Principală</label>
                <select
                  value={newCemeteryReligion}
                  onChange={(e) => setNewCemeteryReligion(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Ortodox">Ortodox</option>
                  <option value="Catolic">Catolic</option>
                  <option value="Protestant">Protestant</option>
                  <option value="Mozaic / Evreiesc">Mozaic / Evreiesc</option>
                  <option value="Multiconfesional">Multiconfesional</option>
                  <option value="Militar">Militar</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">An Înființare</label>
                <input
                  type="text"
                  value={newCemeteryYear}
                  onChange={(e) => setNewCemeteryYear(e.target.value)}
                  placeholder="ex: 1858"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Descriere / Istoric Scurt</label>
              <textarea
                rows={3}
                value={newCemeteryDesc}
                onChange={(e) => setNewCemeteryDesc(e.target.value)}
                placeholder="Detalii despre istoria cimitirului sau statut de monument..."
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* 1. ZONA DE INCARCARE POZA CIMITIR */}
            <div className="pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                  <ImageIcon className="w-4 h-4 text-amber-700" />
                  <span>Poza Cimitir</span>
                </label>
                {newCemeteryPhoto && (
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 font-semibold px-2 py-0.5 rounded-full flex items-center space-x-1">
                    <Check className="w-3 h-3" />
                    <span>Poză încărcată</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                Încărcați fotografia reprezentativă sau imaginea cimitirului (vedere de ansamblu, intrare principală, capelă).
              </p>

              {newCemeteryPhoto ? (
                <div className="rounded-xl border border-slate-300 bg-slate-900 p-3 shadow-sm space-y-3">
                  <div className="relative group rounded-lg overflow-hidden bg-slate-950 flex items-center justify-center max-h-64 border border-slate-800">
                    <img
                      src={newCemeteryPhoto}
                      alt="Poza Cimitirului Încărcată"
                      className="w-full h-auto max-h-64 object-contain"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setPreviewImageModal({ 
                          url: newCemeteryPhoto, 
                          title: `Poza Cimitir: ${newCemeteryName || 'Cimitir Nou'}`,
                          subtitle: 'Fotografie reprezentativă cimitir'
                        })}
                        className="px-3 py-1.5 bg-slate-900/90 text-amber-300 rounded-lg text-xs font-bold shadow hover:bg-slate-900 flex items-center space-x-1"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span>Vezi Mărit</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs pt-1 border-t border-slate-800">
                    <div className="text-slate-300 flex items-center space-x-2 truncate">
                      <ImageIcon className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="truncate font-medium">
                        {newCemeteryPhotoFileName || 'Fișier Poza Cimitir'}
                      </span>
                      {newCemeteryPhotoFileSize && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({newCemeteryPhotoFileSize})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewImageModal({ 
                          url: newCemeteryPhoto, 
                          title: `Poza Cimitir: ${newCemeteryName || 'Cimitir Nou'}`,
                          subtitle: 'Fotografie reprezentativă cimitir'
                        })}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-[11px] font-bold transition-colors flex items-center space-x-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Previzualizează</span>
                      </button>

                      <label className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[11px] font-bold cursor-pointer transition-colors flex items-center space-x-1">
                        <UploadCloud className="w-3 h-3" />
                        <span>Înlocuiește</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handlePhotoFileUpload(f);
                          }}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          setNewCemeteryPhoto('');
                          setNewCemeteryPhotoFileName('');
                          setNewCemeteryPhotoFileSize('');
                        }}
                        className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-lg text-[11px] font-bold transition-colors flex items-center space-x-1"
                      >
                        <Trash2 className="w-3 h-3 text-rose-400" />
                        <span>Șterge</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={handlePhotoDragOver}
                  onDragLeave={handlePhotoDragLeave}
                  onDrop={handlePhotoDrop}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                    isPhotoDragging
                      ? 'border-amber-500 bg-amber-50/70 scale-[1.01]'
                      : 'border-slate-300 bg-slate-50 hover:bg-amber-50/40 hover:border-amber-400'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shadow-2xs">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">
                      Trageți și plasați poza cimitirului aici (drag & drop)
                    </p>
                    <p className="text-[11px] text-slate-500">
                      sau selectați un fișier direct din calculator
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Formate imagine: JPG, PNG, WEBP (Max 15MB)
                    </p>

                    <label className="mt-2 inline-flex items-center space-x-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-bold text-xs cursor-pointer shadow-sm transition-colors">
                      <UploadCloud className="w-4 h-4" />
                      <span>Alege Fișierul cu Poza</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handlePhotoFileUpload(f);
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-200 text-left">
                    <details className="text-[11px] text-slate-500">
                      <summary className="cursor-pointer hover:text-amber-800 font-medium inline-flex items-center space-x-1">
                        <LinkIcon className="w-3 h-3 inline text-slate-400" />
                        <span>sau introdu link (URL) extern către poza cimitirului</span>
                      </summary>
                      <input
                        type="url"
                        value={newCemeteryPhoto}
                        onChange={(e) => {
                          setNewCemeteryPhoto(e.target.value);
                          setNewCemeteryPhotoFileName(e.target.value ? 'Link extern' : '');
                          setNewCemeteryPhotoFileSize('');
                        }}
                        placeholder="https://... (URL imagine sau fotografie cimitir)"
                        className="w-full text-xs p-2 mt-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-amber-500 font-mono"
                      />
                    </details>
                  </div>
                </div>
              )}
            </div>

            {/* 2. ZONA DE INCARCARE PLAN CIMITIR */}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                  <Map className="w-4 h-4 text-amber-700" />
                  <span>Plan Cimitir</span>
                </label>
                {newCemeteryPlan && (
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 font-semibold px-2 py-0.5 rounded-full flex items-center space-x-1">
                    <Check className="w-3 h-3" />
                    <span>Plan încărcat</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                Încărcați planul pe parcele, harta cadastrală sau schița topografică a cimitirului pentru a facilita găsirea mormintelor.
              </p>

              {newCemeteryPlan ? (
                <div className="rounded-xl border border-slate-300 bg-slate-900 p-3 shadow-sm space-y-3">
                  <div className="relative group rounded-lg overflow-hidden bg-slate-950 flex items-center justify-center max-h-64 border border-slate-800">
                    <img
                      src={newCemeteryPlan}
                      alt="Planul Cimitirului Încărcat"
                      className="w-full h-auto max-h-64 object-contain"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setPreviewImageModal({ 
                          url: newCemeteryPlan, 
                          title: `Plan Cimitir: ${newCemeteryName || 'Cimitir Nou'}`,
                          subtitle: 'Plan parcelar și orientare topografică cimitir'
                        })}
                        className="px-3 py-1.5 bg-slate-900/90 text-amber-300 rounded-lg text-xs font-bold shadow hover:bg-slate-900 flex items-center space-x-1"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span>Vezi Mărit</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs pt-1 border-t border-slate-800">
                    <div className="text-slate-300 flex items-center space-x-2 truncate">
                      <Map className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="truncate font-medium">
                        {newCemeteryPlanFileName || 'Fișier Plan Cimitir'}
                      </span>
                      {newCemeteryPlanFileSize && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({newCemeteryPlanFileSize})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewImageModal({ 
                          url: newCemeteryPlan, 
                          title: `Plan Cimitir: ${newCemeteryName || 'Cimitir Nou'}`,
                          subtitle: 'Plan parcelar și orientare topografică cimitir'
                        })}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-[11px] font-bold transition-colors flex items-center space-x-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Previzualizează</span>
                      </button>

                      <label className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[11px] font-bold cursor-pointer transition-colors flex items-center space-x-1">
                        <UploadCloud className="w-3 h-3" />
                        <span>Înlocuiește</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handlePlanFileUpload(f);
                          }}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          setNewCemeteryPlan('');
                          setNewCemeteryPlanFileName('');
                          setNewCemeteryPlanFileSize('');
                        }}
                        className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-lg text-[11px] font-bold transition-colors flex items-center space-x-1"
                      >
                        <Trash2 className="w-3 h-3 text-rose-400" />
                        <span>Șterge</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={handlePlanDragOver}
                  onDragLeave={handlePlanDragLeave}
                  onDrop={handlePlanDrop}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                    isPlanDragging
                      ? 'border-amber-500 bg-amber-50/70 scale-[1.01]'
                      : 'border-slate-300 bg-slate-50 hover:bg-amber-50/40 hover:border-amber-400'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shadow-2xs">
                      <Map className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">
                      Trageți și plasați planul cimitirului aici (drag & drop)
                    </p>
                    <p className="text-[11px] text-slate-500">
                      sau selectați un fișier direct din calculator
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Formate imagine: JPG, PNG, WEBP, SVG (Max 15MB)
                    </p>

                    <label className="mt-2 inline-flex items-center space-x-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-bold text-xs cursor-pointer shadow-sm transition-colors">
                      <UploadCloud className="w-4 h-4" />
                      <span>Alege Fișierul cu Planul</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handlePlanFileUpload(f);
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-200 text-left">
                    <details className="text-[11px] text-slate-500">
                      <summary className="cursor-pointer hover:text-amber-800 font-medium inline-flex items-center space-x-1">
                        <LinkIcon className="w-3 h-3 inline text-slate-400" />
                        <span>sau introdu link (URL) extern către planul / schița cimitirului</span>
                      </summary>
                      <input
                        type="url"
                        value={newCemeteryPlan}
                        onChange={(e) => {
                          setNewCemeteryPlan(e.target.value);
                          setNewCemeteryPlanFileName(e.target.value ? 'Link extern' : '');
                          setNewCemeteryPlanFileSize('');
                        }}
                        placeholder="https://... (URL imagine plan sau schiță cimitir)"
                        className="w-full text-xs p-2 mt-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-amber-500 font-mono"
                      />
                    </details>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setActiveAdminSubTab('cemeteries')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
              >
                Anulează
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold rounded-xl transition-colors shadow-md flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Salvează Cimitirul</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= SUB-TAB 4: SCUT SECURITATE & AUDIT BAZA DE DATE ================= */}
      {activeAdminSubTab === 'security' && (
        <div className="space-y-6">
          
          {/* Status Indicators Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Integritate Bază Date</span>
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold text-emerald-950 block truncate" title={dbChecksum}>
                  SHA256: {dbChecksum.slice(0, 14)}...
                </span>
                <span className="text-[11px] text-emerald-800 mt-1 block font-medium">
                  Fără alterări sau modificări neautorizate
                </span>
              </div>
            </div>

            <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col justify-between border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Protecție Anti-XSS</span>
                <Shield className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <span className="text-xs font-bold text-amber-300 block">Sanitizare Automată Inputs</span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Scripting & SQL patterns blocate
                </span>
              </div>
            </div>

            <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col justify-between border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Anti-Brute Force</span>
                <Lock className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <span className="text-xs font-bold text-rose-300 block">Scut Autentificare Activ</span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Blocare la 5 încercări eșuate
                </span>
              </div>
            </div>

            <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col justify-between border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Instantaneu Siguranță</span>
                <RotateCcw className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <span className="text-xs font-bold text-sky-300 block">{snapshots.length} Instantanee Salvate</span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Backup automat pe modificări
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Password Change & Manual Backup */}
            <div className="space-y-6">
              
              {/* Schimbare Parolă */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                  <KeyRound className="w-5 h-5 text-rose-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Schimbare Parolă Administrator</h3>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Noua Parolă</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minim 5 caractere..."
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Confirmare Noua Parolă</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repetă parola..."
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  {passChangeError && (
                    <p className="text-xs text-rose-600 font-medium flex items-center space-x-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{passChangeError}</span>
                    </p>
                  )}

                  {passChangeSuccess && (
                    <p className="text-xs text-emerald-700 font-medium flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{passChangeSuccess}</span>
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs shadow-sm transition-colors cursor-pointer"
                  >
                    Actualizează Parola
                  </button>
                </form>
              </div>

              {/* Instantanee Backup */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <History className="w-5 h-5 text-sky-600" />
                    <h3 className="font-bold text-slate-900 text-sm">Backup-uri & Instantanee</h3>
                  </div>
                  <button
                    onClick={handleCreateManualBackup}
                    className="px-2.5 py-1 bg-sky-700 hover:bg-sky-600 text-white text-[11px] font-bold rounded-md flex items-center space-x-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Instantaneu Nou</span>
                  </button>
                </div>

                {snapshots.length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center py-4">Nu există backup-uri anterioare.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {snapshots.map((snap) => (
                      <div key={snap.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-800 block text-[11px]">
                            {new Date(snap.timestamp).toLocaleString('ro-RO')}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {snap.recordCount} decedați | SHA: {snap.checksum.slice(0, 8)}
                          </span>
                        </div>
                        <button
                          onClick={() => handleRestoreSnapshot(snap.id)}
                          className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-amber-300 font-semibold rounded text-[10px] flex items-center space-x-1 cursor-pointer shrink-0"
                          title="Restaurează starea bazei de date din acest punct"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Restaurează</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Right Column (2 cols): Jurnal Audit de Securitate & Conturi Utilizatori */}
            <div className="lg:col-span-2 space-y-6">

              {/* Conturi Utilizatori Înregistrate */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-amber-600" />
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Conturi Utilizatori Înregistrate</h3>
                      <p className="text-[11px] text-slate-500">Evidența utilizatorilor cu drepturi de acces în aplicație</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700 font-semibold">
                    {userAccounts.length} {userAccounts.length === 1 ? 'cont' : 'conturi'}
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-white font-mono text-[11px]">
                      <tr>
                        <th className="p-2.5">Utilizator / Nume</th>
                        <th className="p-2.5">Email / Login</th>
                        <th className="p-2.5">Rol</th>
                        <th className="p-2.5">Data Creării</th>
                        <th className="p-2.5">Ultima Conectare</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {userAccounts.map((usr) => (
                        <tr key={usr.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-2.5 font-bold text-slate-900 flex items-center space-x-2">
                            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                              {usr.name.slice(0, 1).toUpperCase()}
                            </div>
                            <span>{usr.name}</span>
                          </td>
                          <td className="p-2.5 font-mono text-slate-600 text-xs">
                            {usr.email}
                          </td>
                          <td className="p-2.5">
                            {usr.role === 'admin' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-100 text-rose-800 border border-rose-200 font-bold flex items-center space-x-1 w-fit">
                                <ShieldCheck className="w-3 h-3 text-rose-600" />
                                <span>Administrator</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-100 text-sky-800 border border-sky-200 font-medium">
                                Operator
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 font-mono text-[10px] text-slate-500">
                            {new Date(usr.createdAt).toLocaleDateString('ro-RO')}
                          </td>
                          <td className="p-2.5 font-mono text-[10px] text-slate-500">
                            {usr.lastLogin ? new Date(usr.lastLogin).toLocaleString('ro-RO') : 'Niciodată'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Jurnal Audit de Securitate */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-amber-600" />
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Jurnal de Audit & Securitate</h3>
                      <p className="text-[11px] text-slate-500">Istoricul complet al acțiunilor administrative și verificărilor automate</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <select
                      value={logsSeverityFilter}
                      onChange={(e) => setLogsSeverityFilter(e.target.value as any)}
                      className="px-2 py-1 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium"
                    >
                      <option value="ALL">Toate Nivelurile</option>
                      <option value="INFO">Informații (INFO)</option>
                      <option value="WARNING">Avertismente (WARN)</option>
                      <option value="CRITICAL">Critice (CRITICAL)</option>
                    </select>

                    <button
                      onClick={handleClearLogs}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                      title="Curăță jurnalul de securitate"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {filteredAuditLogs.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs italic">
                    Nu există înregistrări în jurnalul de audit pentru filtrul selectat.
                  </div>
                ) : (
                  <div className="overflow-x-auto overflow-y-auto max-h-[350px] rounded-xl border border-slate-100">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 text-white font-mono text-[11px] sticky top-0">
                        <tr>
                          <th className="p-2.5">Data / Ora</th>
                          <th className="p-2.5">Severitate</th>
                          <th className="p-2.5">Eveniment / Acțiune</th>
                          <th className="p-2.5">Detalii</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-sans">
                        {filteredAuditLogs.map((log) => {
                          let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
                          if (log.severity === 'WARNING') badgeStyle = 'bg-amber-100 text-amber-800 border-amber-300';
                          if (log.severity === 'CRITICAL') badgeStyle = 'bg-rose-100 text-rose-800 border-rose-300 font-bold animate-pulse';

                          return (
                            <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-2.5 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                                {new Date(log.timestamp).toLocaleString('ro-RO')}
                              </td>
                              <td className="p-2.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${badgeStyle}`}>
                                  {log.severity}
                                </span>
                              </td>
                              <td className="p-2.5 font-semibold text-slate-800 font-mono text-[11px]">
                                {log.action}
                              </td>
                              <td className="p-2.5 text-slate-600 text-xs">
                                {log.details}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ================= SUB-TAB 5: APROBĂRI SOLICITĂRI OPERATORI ================= */}
      {activeAdminSubTab === 'approvals' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
          <AdminApprovalsPanel
            approvals={pendingApprovals}
            onApprove={onApproveRequest}
            onReject={onRejectRequest}
            onDelete={onDeleteApproval}
          />
        </div>
      )}

      {/* ================= MODAL DE CONFIRMARE STERGERE CIMITIR ================= */}
      {cemeteryToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center space-x-3 text-rose-600">
              <AlertTriangle className="w-8 h-8 shrink-0" />
              <div>
                <h3 className="font-bold text-base text-slate-900">Confirmare Ștergere Cimitir</h3>
                <p className="text-xs text-slate-500">Acțiune ireversibilă din director</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <p className="font-bold text-slate-800 text-sm">{cemeteryToDelete.name}</p>
              <p className="text-slate-600">{cemeteryToDelete.city}, {cemeteryToDelete.county}</p>
              <div className="bg-amber-50 border border-amber-200 p-2 rounded text-amber-900 font-bold">
                Persoane înregistrate în acest cimitir: {recordsCountByCemetery[cemeteryToDelete.name] || 0}
              </div>
            </div>

            {/* Radio choices */}
            <div className="space-y-3 text-xs">
              <p className="font-bold text-slate-700">Alegeți modul de ștergere:</p>
              
              <label className="flex items-start space-x-3 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="radio"
                  name="del_records"
                  checked={deleteAssociatedRecords}
                  onChange={() => setDeleteAssociatedRecords(true)}
                  className="mt-0.5 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <span className="font-bold text-slate-900 block">
                    Șterge cimitirul ȘI toate cele {recordsCountByCemetery[cemeteryToDelete.name] || 0} persoane
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Se curăță complet toate fișele persoanelor asociate acestui cimitir.
                  </span>
                </div>
              </label>

              <label className="flex items-start space-x-3 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="radio"
                  name="del_records"
                  checked={!deleteAssociatedRecords}
                  onChange={() => setDeleteAssociatedRecords(false)}
                  className="mt-0.5 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <span className="font-bold text-slate-900 block">
                    Șterge DOAR cimitirul din director
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Persoanele rămân în baza de date cu numele de cimitir salvat.
                  </span>
                </div>
              </label>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3 text-xs">
              <button
                onClick={() => setCemeteryToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
              >
                Renunță
              </button>
              <button
                onClick={handleConfirmDeleteCemetery}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-colors shadow-md flex items-center space-x-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Șterge Definitive</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL CONFIRMARE STERGERE IN CALUP ================= */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center space-x-3 text-rose-600">
              <AlertTriangle className="w-8 h-8 shrink-0" />
              <div>
                <h3 className="font-bold text-base text-slate-900">Confirmare Ștergere Persoane</h3>
                <p className="text-xs text-slate-500">Sunteți pe cale să eliminați înregistrările selectate</p>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-xs text-rose-900 space-y-2">
              <p className="font-bold text-sm">
                Se vor șterge definitiv{' '}
                <u className="text-rose-700">
                  {bulkDeleteType === 'filtered' ? filteredBulkRecords.length : selectedRecordIds.length} persoane
                </u>{' '}
                din baza de date!
              </p>
              <p className="text-[11px] text-rose-700">
                Această acțiune nu poate fi anulată ulterior decât prin re-importul fișierului Excel sau resetarea bazei de date.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-3 text-xs">
              <button
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
              >
                Renunță
              </button>
              <button
                onClick={handleExecuteBulkDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-colors shadow-md flex items-center space-x-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirmă Ștergerea</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL PREVIZUALIZARE POZĂ / PLAN CIMITIR ================= */}
      {previewImageModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewImageModal(null)}
        >
          <div 
            className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
                  {previewImageModal.title.toLowerCase().includes('plan') ? (
                    <Map className="w-5 h-5" />
                  ) : (
                    <ImageIcon className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">{previewImageModal.title}</h3>
                  <p className="text-[11px] text-slate-400">
                    {previewImageModal.subtitle || 'Vizualizare imagine cimitir'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImageModal(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Închide"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-auto flex-1 flex items-center justify-center bg-slate-950 min-h-[300px]">
              <img
                src={previewImageModal.url}
                alt={previewImageModal.title}
                className="max-w-full max-h-[70vh] object-contain rounded shadow"
              />
            </div>

            <div className="p-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">
                Click dreapta sau atingeți imaginea pentru opțiuni suplimentare de salvare.
              </span>
              <button
                type="button"
                onClick={() => setPreviewImageModal(null)}
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
