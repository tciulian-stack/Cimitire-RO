import React, { useState, useEffect, useMemo } from 'react';
import { DeceasedRecord, CemeteryInfo, UserAccount, PendingApproval } from './types/cemetery';
import { INITIAL_DECEASED_RECORDS, INITIAL_CEMETERIES } from './data/initialRecords';
import { exportRecordsToCSV } from './utils/excelParser';
import { 
  sanitizeInput, 
  addAuditLog, 
  createLocalBackup, 
  checkActionRateLimit, 
  calculateChecksum,
  getCurrentUser,
  setCurrentUser as saveCurrentUserSession,
  getPendingApprovals,
  addPendingApproval,
  approvePendingApproval,
  rejectPendingApproval,
  deletePendingApproval
} from './utils/security';
import { Navbar } from './components/Navbar';
import { SearchAndFilters } from './components/SearchAndFilters';
import { DeceasedTable } from './components/DeceasedTable';
import { DeceasedGrid } from './components/DeceasedGrid';
import { DeceasedDetailModal } from './components/DeceasedDetailModal';
import { ExcelImportModal } from './components/ExcelImportModal';
import { ExportExcelModal } from './components/ExportExcelModal';
import { AddEditRecordModal } from './components/AddEditRecordModal';
import { CemeteriesDirectory } from './components/CemeteriesDirectory';
import { DatabaseStats } from './components/DatabaseStats';
import { AboutUs } from './components/AboutUs';
import { AdminZone } from './components/AdminZone';
import { AuthModal } from './components/AuthModal';
import { AdminApprovalsModal } from './components/AdminApprovalsModal';
import { OperatorSubmissionsModal } from './components/OperatorSubmissionsModal';
import { CheckCircle, Info, Flame, Heart, Sparkles, ShieldCheck } from 'lucide-react';

const STORAGE_KEY = 'cimitire_romania_db_v2';
const CEMETERIES_STORAGE_KEY = 'cimitire_romania_cemeteries_v1';

export default function App() {
  // Authentication session state
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialMode, setAuthModalInitialMode] = useState<'login' | 'register'>('login');

  // Database state initialized from LocalStorage or Initial Seed Data
  const [records, setRecords] = useState<DeceasedRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load from local storage', e);
    }
    return INITIAL_DECEASED_RECORDS;
  });

  const [cemeteries, setCemeteries] = useState<CemeteryInfo[]>(() => {
    try {
      const saved = localStorage.getItem(CEMETERIES_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load cemeteries from local storage', e);
    }
    return INITIAL_CEMETERIES;
  });

  // Security Checksum calculation & automatic safety backup trigger
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      // Create automatic snapshot backup if database has content
      if (records.length > 0) {
        createLocalBackup(records, cemeteries, 'Actualizare automată bază de date');
      }
    } catch (e) {
      console.error('Failed to save to local storage', e);
    }
  }, [records]);

  useEffect(() => {
    try {
      localStorage.setItem(CEMETERIES_STORAGE_KEY, JSON.stringify(cemeteries));
    } catch (e) {
      console.error('Failed to save cemeteries to local storage', e);
    }
  }, [cemeteries]);

  // Initial Security Audit Check on Mount
  useEffect(() => {
    const checksum = calculateChecksum(records, cemeteries);
    addAuditLog('SECURITY_CHECK', 'INFO', `Baza de date încărcată. Integritate verificată: ${checksum.slice(0, 12)}... (${records.length} înregistrări)`);
  }, []);

  // Tab & View States
  const [activeTab, setActiveTab] = useState<'records' | 'cemeteries' | 'stats' | 'about' | 'admin'>('records');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCounty, setSelectedCounty] = useState('ALL');
  const [selectedCemetery, setSelectedCemetery] = useState('ALL');
  const [selectedReligion, setSelectedReligion] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [onlyHistorical, setOnlyHistorical] = useState(false);

  // Modal States
  const [selectedDetailRecord, setSelectedDetailRecord] = useState<DeceasedRecord | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportExcelModalOpen, setIsExportExcelModalOpen] = useState(false);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<DeceasedRecord | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>(() => getPendingApprovals());
  const [isAdminApprovalsModalOpen, setIsAdminApprovalsModalOpen] = useState(false);
  const [isOperatorSubmissionsModalOpen, setIsOperatorSubmissionsModalOpen] = useState(false);

  const refreshApprovals = () => {
    setPendingApprovals(getPendingApprovals());
  };

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Auth Handlers
  const handleOpenLogin = () => {
    setAuthModalInitialMode('login');
    setIsAuthModalOpen(true);
  };

  const handleOpenRegister = () => {
    setAuthModalInitialMode('register');
    setIsAuthModalOpen(true);
  };

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    showToast(`Bine ați venit, ${user.name || user.email}!`);
    if (user.role === 'admin') {
      setActiveTab('admin');
    }
  };

  const handleLogout = () => {
    saveCurrentUserSession(null);
    setCurrentUser(null);
    showToast('Te-ai deconectat din cont.');
    if (activeTab === 'admin' || activeTab === 'cemeteries') {
      setActiveTab('records');
    }
  };

  // Derived filter options
  const countiesList = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.county && r.county !== 'N/A') set.add(r.county);
    });
    cemeteries.forEach((c) => set.add(c.county));
    return Array.from(set).sort();
  }, [records, cemeteries]);

  const cemeteriesList = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.cemeteryName && r.cemeteryName !== 'N/A') set.add(r.cemeteryName);
    });
    cemeteries.forEach((c) => set.add(c.name));
    return Array.from(set).sort();
  }, [records, cemeteries]);

  const religionsList = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.religion && r.religion !== 'N/A') set.add(r.religion);
    });
    return Array.from(set).sort();
  }, [records]);

  const statusesList = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.graveStatus && r.graveStatus !== 'N/A') set.add(r.graveStatus);
    });
    return Array.from(set).sort();
  }, [records]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Global / text search query - strictly by Name, Cemetery, or County
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName =
          r.lastName.toLowerCase().includes(q) ||
          r.firstName.toLowerCase().includes(q) ||
          (r.maidenName && r.maidenName.toLowerCase().includes(q));
        const matchesCemetery = r.cemeteryName.toLowerCase().includes(q);
        const matchesCounty = r.county.toLowerCase().includes(q);

        if (!matchesName && !matchesCemetery && !matchesCounty) {
          return false;
        }
      }

      if (selectedCounty !== 'ALL' && r.county !== selectedCounty) return false;
      if (selectedCemetery !== 'ALL' && r.cemeteryName !== selectedCemetery) return false;
      if (selectedReligion !== 'ALL' && r.religion !== selectedReligion) return false;
      if (selectedStatus !== 'ALL' && r.graveStatus !== selectedStatus) return false;
      if (onlyHistorical && r.graveStatus !== 'Monument Protejat') return false;

      return true;
    });
  }, [
    records,
    searchQuery,
    selectedCounty,
    selectedCemetery,
    selectedReligion,
    selectedStatus,
    onlyHistorical
  ]);

  // Handlers
  const handleLightCandle = (recordId: string) => {
    // Rate limiter check
    if (!checkActionRateLimit(`candle-${recordId}`, 2000)) {
      showToast('Te rugăm să aștepți câteva secunde înainte de a aprinde o nouă lumânare.');
      return;
    }

    setRecords((prev) =>
      prev.map((r) => {
        if (r.id === recordId) {
          return {
            ...r,
            candlesLit: (r.candlesLit || 0) + 1
          };
        }
        return r;
      })
    );

    // Also update detail modal if active
    if (selectedDetailRecord && selectedDetailRecord.id === recordId) {
      setSelectedDetailRecord((prev) =>
        prev
          ? {
              ...prev,
              candlesLit: (prev.candlesLit || 0) + 1
            }
          : null
      );
    }

    showToast('Îi mulțumim! Ai aprins o lumânare virtuală în semn de omagiu. 🕯️');
  };

  const handleAddTributeMessage = (recordId: string, author: string, message: string) => {
    // Rate limiter check
    if (!checkActionRateLimit(`tribute-${recordId}`, 5000)) {
      showToast('Ai trimis un mesaj recent. Te rugăm să aștepți 5 secunde.');
      return;
    }

    const sanitizedAuthor = sanitizeInput(author);
    const sanitizedMsg = sanitizeInput(message);

    if (!sanitizedMsg || sanitizedMsg.length < 2) {
      showToast('Mesajul este prea scurt sau conține caractere nepermise.');
      return;
    }

    const newTribute = {
      id: `trib-${Date.now()}`,
      author: sanitizedAuthor || 'Anonim',
      message: sanitizedMsg,
      date: new Date().toISOString().split('T')[0]
    };

    setRecords((prev) =>
      prev.map((r) => {
        if (r.id === recordId) {
          return {
            ...r,
            tributeMessages: [newTribute, ...(r.tributeMessages || [])]
          };
        }
        return r;
      })
    );

    if (selectedDetailRecord && selectedDetailRecord.id === recordId) {
      setSelectedDetailRecord((prev) =>
        prev
          ? {
              ...prev,
              tributeMessages: [newTribute, ...(prev.tributeMessages || [])]
            }
          : null
      );
    }

    showToast('Mesajul de condoleanțe a fost verificat și adăugat cu succes.');
  };

  const handleDeleteRecord = (recordId: string) => {
    const record = records.find((r) => r.id === recordId);
    const confirmName = record ? `${record.lastName} ${record.firstName}` : 'această persoană';

    if (window.confirm(`Ești sigur că vrei să ștergi înregistrarea pentru "${confirmName}"?`)) {
      setRecords((prev) => prev.filter((r) => r.id !== recordId));
      if (selectedDetailRecord?.id === recordId) {
        setSelectedDetailRecord(null);
      }
      addAuditLog('RECORD_DELETE', 'WARNING', `Înregistrare ștearsă: "${confirmName}" (ID: ${recordId})`);
      showToast('Înregistrarea a fost ștearsă din baza de date.');
    }
  };

  const handleSaveRecord = (record: DeceasedRecord) => {
    // Sanitize record values before saving
    const sanitizedRecord: DeceasedRecord = {
      ...record,
      lastName: sanitizeInput(record.lastName),
      firstName: sanitizeInput(record.firstName),
      maidenName: sanitizeInput(record.maidenName),
      cemeteryName: sanitizeInput(record.cemeteryName),
      notes: sanitizeInput(record.notes),
      biography: sanitizeInput(record.biography),
      concessionHolder: sanitizeInput(record.concessionHolder)
    };

    // If current user is Operator Date (editor), route as Pending Approval for Administrator
    if (currentUser?.role === 'editor') {
      addPendingApproval({
        type: 'single_record',
        submittedByUserId: currentUser.id,
        submittedByUserName: currentUser.name || currentUser.email,
        submittedByUserEmail: currentUser.email,
        record: sanitizedRecord
      });
      refreshApprovals();
      showToast(`Înregistrarea pentru "${sanitizedRecord.lastName} ${sanitizedRecord.firstName}" a fost trimisă cu succes administratorului spre aprobare!`);
      return;
    }

    setRecords((prev) => {
      const exists = prev.some((r) => r.id === sanitizedRecord.id);
      if (exists) {
        addAuditLog('RECORD_EDIT', 'INFO', `Înregistrare modificată: "${sanitizedRecord.lastName} ${sanitizedRecord.firstName}"`);
        return prev.map((r) => (r.id === sanitizedRecord.id ? sanitizedRecord : r));
      }
      addAuditLog('RECORD_CREATE', 'INFO', `Înregistrare nouă creată: "${sanitizedRecord.lastName} ${sanitizedRecord.firstName}"`);
      return [sanitizedRecord, ...prev];
    });

    showToast(`Înregistrarea pentru "${sanitizedRecord.lastName} ${sanitizedRecord.firstName}" a fost salvată!`);
  };

  const handleImportRecords = (importedRecords: DeceasedRecord[], replaceExisting: boolean, fileName?: string) => {
    // Sanitize all imported records
    const sanitizedList = importedRecords.map(r => ({
      ...r,
      lastName: sanitizeInput(r.lastName),
      firstName: sanitizeInput(r.firstName),
      notes: sanitizeInput(r.notes),
      cemeteryName: sanitizeInput(r.cemeteryName)
    }));

    // If current user is Operator Date (editor), route as Pending Approval for Administrator
    if (currentUser?.role === 'editor') {
      addPendingApproval({
        type: 'excel_batch',
        submittedByUserId: currentUser.id,
        submittedByUserName: currentUser.name || currentUser.email,
        submittedByUserEmail: currentUser.email,
        records: sanitizedList,
        fileName: fileName || 'Import Excel',
        totalRecordsCount: sanitizedList.length
      });
      refreshApprovals();
      showToast(`Lotul Excel (${sanitizedList.length} persoane) a fost trimis cu succes administratorului spre aprobare!`);
      return;
    }

    if (replaceExisting) {
      setRecords(sanitizedList);
      addAuditLog('DATABASE_IMPORT', 'WARNING', `Baza de date a fost înlocuită complet prin import Excel (${sanitizedList.length} înregistrări).`);
      showToast(`Baza de date a fost înlocuită cu cele ${sanitizedList.length} persoane din fișierul Excel!`);
    } else {
      setRecords((prev) => [...sanitizedList, ...prev]);
      addAuditLog('DATABASE_IMPORT', 'INFO', `Adăugate ${sanitizedList.length} persoane noi prin import Excel.`);
      showToast(`Au fost adăugate ${sanitizedList.length} persoane noi din fișierul Excel!`);
    }
  };

  // Approval Handlers
  const handleApproveRequest = (id: string) => {
    const reviewer = currentUser?.name || currentUser?.email || 'Administrator';
    const result = approvePendingApproval(id, reviewer);
    if (result.success && result.recordsToAdd && result.recordsToAdd.length > 0) {
      setRecords((prev) => [...result.recordsToAdd, ...prev]);
      refreshApprovals();
      showToast(`Solicitarea a fost aprobată! S-au adăugat ${result.recordsToAdd.length} persoane în registru.`);
    } else if (result.success) {
      refreshApprovals();
      showToast('Solicitarea a fost marcată ca aprobată.');
    } else {
      showToast(result.error || 'Eroare la aprobarea solicitării.');
    }
  };

  const handleRejectRequest = (id: string, reason?: string) => {
    const reviewer = currentUser?.name || currentUser?.email || 'Administrator';
    const result = rejectPendingApproval(id, reviewer, reason);
    if (result.success) {
      refreshApprovals();
      showToast('Solicitarea a fost respinsă.');
    } else {
      showToast(result.error || 'Eroare la respingerea solicitării.');
    }
  };

  const handleDeleteApproval = (id: string) => {
    deletePendingApproval(id);
    refreshApprovals();
    showToast('Înregistrarea a fost eliminată din istoricul de aprobări.');
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCounty('ALL');
    setSelectedCemetery('ALL');
    setSelectedReligion('ALL');
    setSelectedStatus('ALL');
    setOnlyHistorical(false);
  };

  const handleResetData = () => {
    if (window.confirm('Ești sigur că vrei să resetezi baza de date la datele inițiale demonstrative? Modificările neexportate se vor pierde.')) {
      setRecords(INITIAL_DECEASED_RECORDS);
      setCemeteries(INITIAL_CEMETERIES);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(CEMETERIES_STORAGE_KEY);
      handleResetFilters();
      showToast('Baza de date și directorul cimitirelor au fost resetate la starea inițială.');
    }
  };

  const recordsCountByCemetery = useMemo(() => {
    const map: Record<string, number> = {};
    records.forEach((r) => {
      if (r.cemeteryName && r.cemeteryName !== 'N/A') {
        map[r.cemeteryName] = (map[r.cemeteryName] || 0) + 1;
      }
    });
    return map;
  }, [records]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans selection:bg-amber-200">
      
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-amber-500/50 flex items-center space-x-3 animate-bounce">
          <CheckCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalRecordsCount={records.length}
        cemeteriesCount={cemeteries.length}
        onOpenImport={() => setIsImportModalOpen(true)}
        onOpenExportExcel={() => setIsExportExcelModalOpen(true)}
        onOpenAddRecord={() => {
          setRecordToEdit(null);
          setIsAddEditModalOpen(true);
        }}
        currentUser={currentUser}
        onOpenLogin={handleOpenLogin}
        onOpenRegister={handleOpenRegister}
        onLogout={handleLogout}
        onResetData={handleResetData}
        globalSearchQuery={searchQuery}
        setGlobalSearchQuery={setSearchQuery}
        pendingApprovalsCount={pendingApprovals.filter(a => a.status === 'pending').length}
        onOpenApprovalsModal={() => setIsAdminApprovalsModalOpen(true)}
        operatorSubmissionsCount={currentUser ? pendingApprovals.filter(a => a.submittedByUserEmail?.toLowerCase() === currentUser.email?.toLowerCase() || a.submittedByUserId === currentUser.id).length : 0}
        onOpenOperatorSubmissionsModal={() => setIsOperatorSubmissionsModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* TAB 1: REGISTRU DECEDAȚI */}
        {activeTab === 'records' && (
          <div>
            
            {/* Search & Filters */}
            <SearchAndFilters
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCounty={selectedCounty}
              setSelectedCounty={setSelectedCounty}
              selectedCemetery={selectedCemetery}
              setSelectedCemetery={setSelectedCemetery}
              selectedReligion={selectedReligion}
              setSelectedReligion={setSelectedReligion}
              selectedStatus={selectedStatus}
              setSelectedStatus={setSelectedStatus}
              onlyHistorical={onlyHistorical}
              setOnlyHistorical={setOnlyHistorical}
              viewMode={viewMode}
              setViewMode={setViewMode}
              counties={countiesList}
              cemeteries={cemeteriesList}
              religions={religionsList}
              statuses={statusesList}
              totalResults={filteredRecords.length}
              onResetFilters={handleResetFilters}
            />

            {/* Content View: Table or Grid */}
            {viewMode === 'table' ? (
              <DeceasedTable
                records={filteredRecords}
                onSelectRecord={(r) => setSelectedDetailRecord(r)}
                onEditRecord={(r) => {
                  setRecordToEdit(r);
                  setIsAddEditModalOpen(true);
                }}
                onDeleteRecord={handleDeleteRecord}
                onLightCandle={handleLightCandle}
              />
            ) : (
              <DeceasedGrid
                records={filteredRecords}
                onSelectRecord={(r) => setSelectedDetailRecord(r)}
                onEditRecord={(r) => {
                  setRecordToEdit(r);
                  setIsAddEditModalOpen(true);
                }}
                onDeleteRecord={handleDeleteRecord}
                onLightCandle={handleLightCandle}
              />
            )}

          </div>
        )}

        {/* TAB 2: DIRECTOR CIMITIRE (Vizibil exclusiv pentru Administrator) */}
        {activeTab === 'cemeteries' && currentUser?.role === 'admin' && (
          <CemeteriesDirectory
            cemeteries={cemeteries}
            recordsCountByCemetery={recordsCountByCemetery}
            onSelectCemeteryFilter={(cemName) => {
              setSelectedCemetery(cemName);
              setActiveTab('records');
            }}
          />
        )}

        {/* TAB 3: STATISTICI & RAPOARTE */}
        {activeTab === 'stats' && (
          <DatabaseStats records={records} cemeteries={cemeteries} />
        )}

        {/* TAB 4: DESPRE NOI */}
        {activeTab === 'about' && (
          <AboutUs 
            onNavigateToRecords={() => setActiveTab('records')}
            onNavigateToStats={() => setActiveTab('stats')}
          />
        )}

        {/* TAB 5: ZONA ADMINISTRATIVĂ */}
        {activeTab === 'admin' && (
          <AdminZone
            records={records}
            setRecords={setRecords}
            cemeteries={cemeteries}
            setCemeteries={setCemeteries}
            showToast={showToast}
            currentUser={currentUser}
            onLogout={handleLogout}
            onOpenLogin={handleOpenLogin}
            onOpenRegister={handleOpenRegister}
            onOpenImport={() => setIsImportModalOpen(true)}
            onResetData={handleResetData}
            onExportCSV={() => setIsExportExcelModalOpen(true)}
            pendingApprovals={pendingApprovals}
            onApproveRequest={handleApproveRequest}
            onRejectRequest={handleRejectRequest}
            onDeleteApproval={handleDeleteApproval}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs py-6 mt-12 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-bold text-slate-200">
              Cimitire România - Bază de date cu cimitire, oameni și destine
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Evidență locuri de veci, patrimoniu istoric și păstrarea memoriei celor dragi.
            </p>
          </div>

          <div className="flex items-center space-x-4 text-slate-400">
            <button
              onClick={() => setActiveTab('about')}
              className="hover:text-amber-300 transition-colors flex items-center space-x-1"
            >
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span>Despre noi</span>
            </button>
            <span>•</span>
            {currentUser?.role === 'admin' ? (
              <>
                <button
                  onClick={() => setActiveTab('admin')}
                  className="hover:text-amber-300 transition-colors flex items-center space-x-1"
                >
                  <span>Zona Administrativă</span>
                </button>
                <span>•</span>
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="hover:text-emerald-300 transition-colors flex items-center space-x-1"
                >
                  <span>Import Excel</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleOpenLogin}
                className="hover:text-amber-300 transition-colors flex items-center space-x-1"
              >
                <span>Autentificare Admin</span>
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Detail Record Modal */}
      <DeceasedDetailModal
        record={selectedDetailRecord}
        onClose={() => setSelectedDetailRecord(null)}
        onLightCandle={handleLightCandle}
        onAddTributeMessage={handleAddTributeMessage}
        onEdit={(r) => {
          setRecordToEdit(r);
          setIsAddEditModalOpen(true);
        }}
      />

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportRecords={handleImportRecords}
        existingCemeteries={cemeteriesList}
        existingCounties={countiesList}
        currentUser={currentUser}
      />

      {/* Export Excel Modal (Admin Only) */}
      <ExportExcelModal
        isOpen={isExportExcelModalOpen}
        onClose={() => setIsExportExcelModalOpen(false)}
        records={records}
        cemeteries={cemeteries}
        existingCemeteries={cemeteriesList}
        onSuccessExport={(count, cemeteryName, format) => {
          showToast(`Fișierul ${format} a fost descărcat cu succes (${count} persoane - ${cemeteryName})!`);
          addAuditLog(
            'DATA_EXPORT',
            'INFO',
            `Export ${format} efectuat de ${currentUser?.name || currentUser?.email || 'Administrator'}: ${count} înregistrări (${cemeteryName}).`
          );
        }}
      />

      {/* Add / Edit Record Modal */}
      <AddEditRecordModal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        onSave={handleSaveRecord}
        initialRecord={recordToEdit}
        existingCemeteries={cemeteriesList}
        existingCounties={countiesList}
        currentUser={currentUser}
      />

      {/* User Authentication & Registration Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalInitialMode}
        onLoginSuccess={handleLoginSuccess}
        onSuccess={handleLoginSuccess}
        showToast={showToast}
      />

      {/* Admin Approvals Modal */}
      <AdminApprovalsModal
        isOpen={isAdminApprovalsModalOpen}
        onClose={() => setIsAdminApprovalsModalOpen(false)}
        approvals={pendingApprovals}
        onApprove={handleApproveRequest}
        onReject={handleRejectRequest}
        onDelete={handleDeleteApproval}
        onNavigateToAdminZone={() => {
          setIsAdminApprovalsModalOpen(false);
          setActiveTab('admin');
        }}
      />

      {/* Operator Submissions Modal */}
      {currentUser && (
        <OperatorSubmissionsModal
          isOpen={isOperatorSubmissionsModalOpen}
          onClose={() => setIsOperatorSubmissionsModalOpen(false)}
          approvals={pendingApprovals}
          currentUser={currentUser}
        />
      )}

    </div>
  );
}

