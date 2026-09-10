export interface TributeMessage {
  id: string;
  author: string;
  message: string;
  date: string;
}

export interface DeceasedRecord {
  id: string;
  lastName: string;           // Nume de familie
  firstName: string;          // Prenume
  maidenName: string;         // Nume anterior / de fată (N/A daca nu exista)
  birthDate: string;          // Data nașterii (sau anul, N/A daca nu se stie)
  deathDate: string;          // Data decesului (sau anul, N/A daca nu se stie)
  ageAtDeath: string;         // Vârsta la deces (N/A)
  cemeteryName: string;       // Nume Cimitir
  county: string;             // Județ
  city: string;               // Localitate / Oraș
  sector: string;             // Sector / Alee (N/A)
  plot: string;               // Parcelă (N/A)
  graveNumber: string;        // Număr Mormânt / Criptă (N/A)
  religion: string;           // Religie / Confesiune (N/A)
  profession: string;         // Profesie / Titlu / Ocupatie (N/A)
  gender?: string;            // Gen (Masculin / Feminin / Nespecificat)
  notes: string;              // Epitaff / Versuri piatră funerară (N/A)
  biography?: string;         // Informații despre persoană / Biografie scurtă
  concessionHolder: string;   // Deținător loc / Concesionar (N/A)
  graveStatus: string;        // Stare Mormânt (ex: Îngrijit, Monument Protejat, Istoric, N/A)
  photoUrl: string;           // Poză mormânt sau monument (N/A)
  deceasedPhotoUrl?: string; // Poză portret decedat (N/A)
  candlesLit: number;         // Număr lumânări aprinse
  tributeMessages: TributeMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface CemeteryInfo {
  id: string;
  name: string;
  county: string;
  city: string;
  address: string;
  totalGraves: number;
  religionMain: string;
  establishedYear: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  description: string;
  photoUrl?: string;
  mapUrl?: string;
}

export interface ExcelColumnMapping {
  fullName?: string;
  lastName?: string;
  firstName?: string;
  maidenName: string;
  birthDate: string;
  deathDate: string;
  ageAtDeath: string;
  cemeteryName: string;
  county: string;
  city: string;
  sector: string;
  plot: string;
  graveNumber: string;
  religion: string;
  profession: string;
  gender?: string;
  notes: string;
  concessionHolder: string;
  graveStatus: string;
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: 'admin' | 'editor' | 'viewer';
  createdAt: string;
  lastLogin?: string;
}

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  action: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT' | 'USER_REGISTER' | 'RECORD_CREATE' | 'RECORD_EDIT' | 'RECORD_DELETE' | 'DATABASE_WIPE' | 'DATABASE_IMPORT' | 'DATABASE_RESTORE' | 'PASSWORD_CHANGE' | 'SECURITY_CHECK' | 'APPROVAL_ACCEPTED' | 'APPROVAL_REJECTED' | 'OPERATOR_SUBMISSION' | 'DATA_EXPORT';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  details: string;
  ipOrSession: string;
}

export interface DatabaseBackupSnapshot {
  id: string;
  timestamp: string;
  recordCount: number;
  cemeteryCount: number;
  checksum: string;
  dataJson: string;
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type ApprovalSubmissionType = 'single_record' | 'excel_batch';

export interface PendingApproval {
  id: string;
  type: ApprovalSubmissionType;
  submittedByUserId: string;
  submittedByUserName: string;
  submittedByUserEmail: string;
  submittedAt: string;
  status: ApprovalStatus;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  
  // Înregistrare individuală (din Adaugă Persoană)
  record?: DeceasedRecord;

  // Set înregistrări (din Import Excel)
  records?: DeceasedRecord[];
  fileName?: string;
  totalRecordsCount?: number;
}

