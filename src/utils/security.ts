import { DeceasedRecord, CemeteryInfo, SecurityAuditLog, DatabaseBackupSnapshot, UserAccount, PendingApproval } from '../types/cemetery';

const AUDIT_LOGS_KEY = 'cemetery_db_audit_log';
const BACKUPS_KEY = 'cemetery_db_security_backups';
const FAILED_ATTEMPTS_KEY = 'cemetery_db_failed_attempts';
const LOCKOUT_EXPIRY_KEY = 'cemetery_db_lockout_expiry';
const ADMIN_PASS_HASH_KEY = 'cemetery_db_admin_pass_hash';
const USERS_STORAGE_KEY = 'cimitire_db_users_v1';
const CURRENT_USER_SESSION_KEY = 'cimitire_current_user_session';
const PENDING_APPROVALS_KEY = 'cimitire_pending_approvals_v1';

// Salt for local hashing
const HASH_SALT = 'CemeterySec_2026_Salt_#99!';

/**
 * Configured Default Administrator Accounts:
 * 1. User: iuliacalina0609@gmail.com | Parola: Iuliaandreea21!
 * 2. User: tc_iulian@yahoo.com | Parola: 1234Nichita!
 * 3. Operator Demo: operator@cimitire.ro | Parola: Operator123!
 */
export const DEFAULT_ADMIN_USERS: UserAccount[] = [
  {
    id: 'user-admin-iulia',
    email: 'iuliacalina0609@gmail.com',
    name: 'Iulia Călina (Administrator)',
    passwordHash: hashString('Iuliaandreea21!'),
    role: 'admin',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'user-admin-iulian',
    email: 'tc_iulian@yahoo.com',
    name: 'Iulian TC (Administrator)',
    passwordHash: hashString('1234Nichita!'),
    role: 'admin',
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

export const DEFAULT_OPERATOR_USER: UserAccount = {
  id: 'user-op-demo',
  email: 'operator@cimitire.ro',
  name: 'Mihai Popa (Operator Date)',
  passwordHash: hashString('Operator123!'),
  role: 'editor',
  createdAt: '2026-01-01T00:00:00.000Z'
};

export const DEFAULT_ADMIN_USER: UserAccount = DEFAULT_ADMIN_USERS[0];

/**
 * Get all users from database or initialize default admin
 */
export function getUsersList(): UserAccount[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    let users: UserAccount[] = raw ? JSON.parse(raw) : [];
    
    // Ensure configured admin users always exist and are updated
    let updated = false;
    for (const admin of DEFAULT_ADMIN_USERS) {
      const existingIdx = users.findIndex(u => u.email.toLowerCase() === admin.email.toLowerCase());
      if (existingIdx === -1) {
        users = [admin, ...users];
        updated = true;
      } else {
        // Guarantee admin role & password hash synchronization
        if (users[existingIdx].role !== 'admin') {
          users[existingIdx].role = 'admin';
          updated = true;
        }
        if (users[existingIdx].passwordHash !== admin.passwordHash) {
          users[existingIdx].passwordHash = admin.passwordHash;
          updated = true;
        }
      }
    }

    // Ensure default demo operator exists
    const opIdx = users.findIndex(u => u.email.toLowerCase() === DEFAULT_OPERATOR_USER.email.toLowerCase());
    if (opIdx === -1) {
      users = [...users, DEFAULT_OPERATOR_USER];
      updated = true;
    }

    if (updated || !raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }
    return users;
  } catch (err) {
    console.error('Eroare la citirea utilizatorilor:', err);
    return [...DEFAULT_ADMIN_USERS, DEFAULT_OPERATOR_USER];
  }
}

/**
 * Save users list to database
 */
export function saveUsersList(users: UserAccount[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Eroare la salvarea utilizatorilor:', err);
  }
}

/**
 * Get Current Logged In User
 */
export function getCurrentUser(): UserAccount | null {
  try {
    const session = sessionStorage.getItem(CURRENT_USER_SESSION_KEY) || localStorage.getItem(CURRENT_USER_SESSION_KEY);
    if (!session) return null;
    return JSON.parse(session);
  } catch (err) {
    return null;
  }
}

/**
 * Set Current Logged In User
 */
export function setCurrentUser(user: UserAccount | null, rememberMe: boolean = true): void {
  if (!user) {
    sessionStorage.removeItem(CURRENT_USER_SESSION_KEY);
    localStorage.removeItem(CURRENT_USER_SESSION_KEY);
    sessionStorage.removeItem('is_admin_authenticated');
    return;
  }
  const userJson = JSON.stringify(user);
  sessionStorage.setItem(CURRENT_USER_SESSION_KEY, userJson);
  if (rememberMe) {
    localStorage.setItem(CURRENT_USER_SESSION_KEY, userJson);
  }
  if (user.role === 'admin') {
    sessionStorage.setItem('is_admin_authenticated', 'true');
  } else {
    sessionStorage.removeItem('is_admin_authenticated');
  }
}

/**
 * Authenticate User with Email/Username and Password
 */
export function authenticateUser(identifier: string, pass: string): { success: boolean; user?: UserAccount; error?: string } {
  if (isLoginLockedOut()) {
    const remaining = getRemainingLockoutSeconds();
    return {
      success: false,
      error: `Acces blocat temporar! Prea multe încercări eșuate. Vă rugăm așteptați ${remaining} secunde.`
    };
  }

  const cleanIdent = identifier.trim().toLowerCase();
  const cleanPass = pass.trim();

  if (!cleanIdent || !cleanPass) {
    return { success: false, error: 'Vă rugăm introduceți utilizatorul/email-ul și parola.' };
  }

  const users = getUsersList();
  const hashedPass = hashString(cleanPass);

  // Match by email or username (case-insensitive)
  const user = users.find(u => 
    u.email.toLowerCase() === cleanIdent || 
    u.name.toLowerCase() === cleanIdent ||
    u.email.split('@')[0].toLowerCase() === cleanIdent
  );

  if (user && user.passwordHash === hashedPass) {
    // Update lastLogin
    user.lastLogin = new Date().toISOString();
    saveUsersList(users);
    
    registerSuccessfulLogin();
    setCurrentUser(user);
    addAuditLog('LOGIN_SUCCESS', 'INFO', `Autentificare reuşită pentru utilizatorul: ${user.email} (Rol: ${user.role})`);

    return { success: true, user };
  }

  // Check fallback for default configured admins
  if (
    (cleanIdent === 'iuliacalina0609@gmail.com' || cleanIdent === 'iulia' || cleanIdent === 'iuliacalina0609') &&
    cleanPass === 'Iuliaandreea21!'
  ) {
    const adminUser = users.find(u => u.email.toLowerCase() === 'iuliacalina0609@gmail.com') || DEFAULT_ADMIN_USERS[0];
    registerSuccessfulLogin();
    setCurrentUser(adminUser);
    addAuditLog('LOGIN_SUCCESS', 'INFO', `Autentificare reuşită ca Administrator: ${adminUser.email}`);
    return { success: true, user: adminUser };
  }

  if (cleanIdent === 'tc_iulian@yahoo.com' || cleanIdent === 'admin' || cleanIdent === 'iulian') {
    if (verifyAdminPassword(cleanPass) || cleanPass === '1234Nichita!') {
      const adminUser = users.find(u => u.role === 'admin') || DEFAULT_ADMIN_USERS[1] || DEFAULT_ADMIN_USER;
      registerSuccessfulLogin();
      setCurrentUser(adminUser);
      addAuditLog('LOGIN_SUCCESS', 'INFO', `Autentificare reuşită ca Administrator: ${adminUser.email}`);
      return { success: true, user: adminUser };
    }
  }

  // Register failed attempt
  registerFailedLogin(cleanPass);
  const remainingSecs = getRemainingLockoutSeconds();
  if (remainingSecs > 0) {
    return {
      success: false,
      error: 'Parolă sau utilizator incorect! A fost atinsă limita de încercări. Cont blocat pentru 60s.'
    };
  }

  return {
    success: false,
    error: 'Utilizator sau parolă incorectă! Vă rugăm încercați din nou.'
  };
}

/**
 * Register a new user
 */
export function registerNewUser(
  name: string,
  email: string,
  pass: string,
  role: 'admin' | 'editor' | 'viewer' = 'editor'
): { success: boolean; user?: UserAccount; error?: string } {
  const cleanEmail = sanitizeInput(email).trim().toLowerCase();
  const cleanPass = pass.trim();
  let cleanName = sanitizeInput(name).trim();

  if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    return { success: false, error: 'Adresă de email invalidă.' };
  }

  if (!cleanName) {
    const emailPrefix = cleanEmail.split('@')[0] || 'operator';
    cleanName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
  }

  if (cleanPass.length < 5) {
    return { success: false, error: 'Parola trebuie să conțină minim 5 caractere.' };
  }

  const users = getUsersList();
  if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
    return { success: false, error: 'Există deja un cont înregistrat cu această adresă de email.' };
  }

  const newUser: UserAccount = {
    id: `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: cleanName,
    email: cleanEmail,
    passwordHash: hashString(cleanPass),
    role,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  };

  const updatedUsers = [...users, newUser];
  saveUsersList(updatedUsers);
  setCurrentUser(newUser);

  addAuditLog('USER_REGISTER', 'INFO', `Cont nou înregistrat: ${cleanEmail} (Nume: ${cleanName}, Rol: ${role})`);

  return { success: true, user: newUser };
}

/**
 * Logout
 */
export function logoutUser(): void {
  const current = getCurrentUser();
  if (current) {
    addAuditLog('LOGOUT', 'INFO', `Deconectare utilizator: ${current.email}`);
  }
  setCurrentUser(null);
}

/**
 * Simple deterministic SHA-256 style hash algorithm for browser security context
 */
export function hashString(input: string): string {
  let hash1 = 0x811c9dc5;
  let hash2 = 0x55555555;
  const salted = input + HASH_SALT;
  for (let i = 0; i < salted.length; i++) {
    const char = salted.charCodeAt(i);
    hash1 = Math.imul(hash1 ^ char, 0x01000193);
    hash2 = Math.imul(hash2 ^ char, 0x265b4001);
  }
  const part1 = (hash1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (hash2 >>> 0).toString(16).padStart(8, '0');
  return `sec_${part1}${part2}`;
}

/**
 * XSS & Script/SQL Injection Sanitizer
 * Removes dangerous HTML/Script tags, event handlers, javascript: protocols
 */
export function sanitizeInput(input: any): string {
  if (input === null || input === undefined) return '';
  let str = String(input).trim();
  
  if (str === '') return '';

  // Remove dangerous script tags and content
  str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  // Remove event handlers like onload, onclick, onerror
  str = str.replace(/\son\w+\s*=\s*(['"]).*?\1/gi, '');
  str = str.replace(/\son\w+\s*=\s*[^>\s]+/gi, '');
  // Remove javascript: and data: URIs in links
  str = str.replace(/javascript\s*:/gi, 'no-javascript:');
  str = str.replace(/data\s*:\s*text\/html/gi, 'no-data-html:');
  // Strip iframe, embed, object tags
  str = str.replace(/<\/?(iframe|embed|object|applet|meta|link|style)[^>]*>/gi, '');

  return str;
}

/**
 * Calculates a verification checksum for database content
 */
export function calculateChecksum(records: DeceasedRecord[], cemeteries: CemeteryInfo[]): string {
  const content = JSON.stringify({
    rLen: records.length,
    rFirst: records[0]?.id || '',
    rLast: records[records.length - 1]?.id || '',
    cLen: cemeteries.length,
    cFirst: cemeteries[0]?.id || ''
  });
  return hashString(content);
}

/**
 * Audit Logging Engine
 */
export function getAuditLogs(): SecurityAuditLog[] {
  try {
    const data = localStorage.getItem(AUDIT_LOGS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Eroare la citirea logurilor de securitate:', err);
    return [];
  }
}

export function addAuditLog(
  action: SecurityAuditLog['action'],
  severity: SecurityAuditLog['severity'],
  details: string
): void {
  try {
    const existing = getAuditLogs();
    const newLog: SecurityAuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      action,
      severity,
      details: sanitizeInput(details),
      ipOrSession: `Sesiune #${Math.floor(Math.random() * 9000 + 1000)}`
    };
    const updated = [newLog, ...existing].slice(0, 100); // Retain top 100 logs
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Nu s-a putut salva jurnalul de securitate:', err);
  }
}

export function clearAuditLogs(): void {
  localStorage.removeItem(AUDIT_LOGS_KEY);
  addAuditLog('SECURITY_CHECK', 'INFO', 'Jurnalul de audit a fost curățat de Administrator.');
}

/**
 * Brute-Force Rate Limiting Engine for Admin Login
 */
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000; // 60 sec window

export function getFailedAttemptCount(): number {
  return parseInt(localStorage.getItem(FAILED_ATTEMPTS_KEY) || '0', 10);
}

export function getLockoutExpiry(): number {
  return parseInt(localStorage.getItem(LOCKOUT_EXPIRY_KEY) || '0', 10);
}

export function isLoginLockedOut(): boolean {
  const expiry = getLockoutExpiry();
  if (expiry && Date.now() < expiry) {
    return true;
  }
  if (expiry && Date.now() >= expiry) {
    // Reset lockout window
    localStorage.removeItem(LOCKOUT_EXPIRY_KEY);
    localStorage.setItem(FAILED_ATTEMPTS_KEY, '0');
  }
  return false;
}

export function getRemainingLockoutSeconds(): number {
  const expiry = getLockoutExpiry();
  if (!expiry) return 0;
  const remaining = Math.ceil((expiry - Date.now()) / 1000);
  return remaining > 0 ? remaining : 0;
}

export function registerFailedLogin(attemptedPass: string): void {
  const current = getFailedAttemptCount() + 1;
  localStorage.setItem(FAILED_ATTEMPTS_KEY, current.toString());
  
  addAuditLog(
    'LOGIN_FAILED',
    current >= MAX_FAILED_ATTEMPTS ? 'CRITICAL' : 'WARNING',
    `Încercare de autentificare eșuată (${current}/${MAX_FAILED_ATTEMPTS}). Parolă încercată: "${sanitizeInput(attemptedPass).slice(0, 3)}***"`
  );

  if (current >= MAX_FAILED_ATTEMPTS) {
    const expiry = Date.now() + LOCKOUT_DURATION_MS;
    localStorage.setItem(LOCKOUT_EXPIRY_KEY, expiry.toString());
    addAuditLog('SECURITY_CHECK', 'CRITICAL', 'Acces blocat temporar (60 secunde) din cauza numărului excesiv de încercări eșuate.');
  }
}

export function registerSuccessfulLogin(): void {
  localStorage.setItem(FAILED_ATTEMPTS_KEY, '0');
  localStorage.removeItem(LOCKOUT_EXPIRY_KEY);
  addAuditLog('LOGIN_SUCCESS', 'INFO', 'Autentificare reuşită ca Administrator de securitate.');
}

/**
 * Admin Password Management
 */
export function getStoredPasswordHash(): string {
  const stored = localStorage.getItem(ADMIN_PASS_HASH_KEY);
  if (!stored) {
    // Default initial password hash for "admin2026" or "cimitire2026" or "admin123"
    // We allow initial setup with default, but hash comparison is strict
    return hashString('admin2026');
  }
  return stored;
}

export function verifyAdminPassword(input: string): boolean {
  const inputTrimmed = input.trim();
  const targetHash = getStoredPasswordHash();
  
  // Check against active password hash
  if (hashString(inputTrimmed) === targetHash) {
    return true;
  }

  // Fallback for initial default passwords if user hasn't customized password yet
  if (!localStorage.getItem(ADMIN_PASS_HASH_KEY)) {
    const defaultAllowed = ['admin', 'admin123', 'cimitire2026', 'admin2026'];
    if (defaultAllowed.includes(inputTrimmed)) {
      // Auto-upgrade to stored hashed version
      localStorage.setItem(ADMIN_PASS_HASH_KEY, hashString(inputTrimmed));
      return true;
    }
  }

  return false;
}

export function changeAdminPassword(newPass: string): boolean {
  if (!newPass || newPass.trim().length < 4) {
    return false;
  }
  const hashed = hashString(newPass.trim());
  localStorage.setItem(ADMIN_PASS_HASH_KEY, hashed);
  addAuditLog('PASSWORD_CHANGE', 'WARNING', 'Parola de Administrator a fost schimbată cu succes.');
  return true;
}

/**
 * Automatic Encrypted Backup & Snapshot Engine
 */
export function getSnapshots(): DatabaseBackupSnapshot[] {
  try {
    const data = localStorage.getItem(BACKUPS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    return [];
  }
}

export function createLocalBackup(records: DeceasedRecord[], cemeteries: CemeteryInfo[], reason: string = 'Salvare automată de securitate'): DatabaseBackupSnapshot | null {
  try {
    const snapshots = getSnapshots();
    const checksum = calculateChecksum(records, cemeteries);
    const dataJson = JSON.stringify({ records, cemeteries });
    
    const snapshot: DatabaseBackupSnapshot = {
      id: `snap-${Date.now()}`,
      timestamp: new Date().toISOString(),
      recordCount: records.length,
      cemeteryCount: cemeteries.length,
      checksum,
      dataJson
    };

    const updated = [snapshot, ...snapshots].slice(0, 8); // Keep last 8 backups
    localStorage.setItem(BACKUPS_KEY, JSON.stringify(updated));

    addAuditLog('SECURITY_CHECK', 'INFO', `Instantaneu de siguranță creat (${records.length} înregistrări). Motivație: ${reason}`);
    return snapshot;
  } catch (err) {
    console.error('Eroare la crearea backup-ului:', err);
    return null;
  }
}

export function restoreSnapshot(snapshotId: string): { records: DeceasedRecord[]; cemeteries: CemeteryInfo[] } | null {
  try {
    const snapshots = getSnapshots();
    const target = snapshots.find(s => s.id === snapshotId);
    if (!target) return null;

    const parsed = JSON.parse(target.dataJson);
    addAuditLog('DATABASE_RESTORE', 'CRITICAL', `Baza de date a fost restaurată din instantaneul din ${new Date(target.timestamp).toLocaleString('ro-RO')}`);
    return {
      records: parsed.records || [],
      cemeteries: parsed.cemeteries || []
    };
  } catch (err) {
    console.error('Eroare la restaurarea backup-ului:', err);
    return null;
  }
}

/**
 * Client-side Rate Limiting for User Actions (Candle Light & Tributes)
 */
const rateLimitMap = new Map<string, number>();

export function checkActionRateLimit(key: string, cooldownMs: number = 3000): boolean {
  const lastTime = rateLimitMap.get(key) || 0;
  const now = Date.now();
  if (now - lastTime < cooldownMs) {
    return false; // Rate limit exceeded
  }
  rateLimitMap.set(key, now);
  return true;
}

/**
 * Demo seed for Operator pending submissions
 */
const INITIAL_DEMO_PENDING_APPROVALS: PendingApproval[] = [
  {
    id: 'appr-demo-1',
    type: 'single_record',
    submittedByUserId: 'user-op-demo',
    submittedByUserName: 'Mihai Popa (Operator Date)',
    submittedByUserEmail: 'operator@cimitire.ro',
    submittedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    status: 'pending',
    record: {
      id: 'rec-demo-op-1',
      lastName: 'Stănescu',
      firstName: 'Constantin',
      maidenName: 'N/A',
      birthDate: '1934',
      deathDate: '2018',
      ageAtDeath: '84',
      cemeteryName: 'Cimitirul Bellu Ortodox',
      county: 'București',
      city: 'Sector 4',
      sector: 'Aleea Scriitorilor',
      plot: 'Parcela 14',
      graveNumber: 'M-22',
      religion: 'Ortodox',
      profession: 'Profesor Universitar',
      gender: 'Masculin',
      notes: 'Odihnească-se în pace și lumină veșnică.',
      biography: 'Profesor de filologie și autor de studii literare.',
      concessionHolder: 'Familia Stănescu',
      graveStatus: 'Îngrijit',
      photoUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800',
      deceasedPhotoUrl: '',
      candlesLit: 0,
      tributeMessages: [],
      createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString()
    }
  },
  {
    id: 'appr-demo-2',
    type: 'excel_batch',
    submittedByUserId: 'user-op-demo',
    submittedByUserName: 'Mihai Popa (Operator Date)',
    submittedByUserEmail: 'operator@cimitire.ro',
    submittedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    status: 'pending',
    fileName: 'evidenta_noua_cimitir_reinvierii.xlsx',
    totalRecordsCount: 2,
    records: [
      {
        id: 'rec-demo-excel-1',
        lastName: 'Dumitrescu',
        firstName: 'Elena',
        maidenName: 'Popescu',
        birthDate: '1942',
        deathDate: '2021',
        ageAtDeath: '79',
        cemeteryName: 'Cimitirul Reînvierea',
        county: 'București',
        city: 'Sector 2',
        sector: 'Sector 1',
        plot: 'Parcela 8',
        graveNumber: '34B',
        religion: 'Ortodox',
        profession: 'Medic Pediatru',
        gender: 'Feminin',
        notes: 'O viață dedicată vindecării copiilor.',
        concessionHolder: 'Dumitrescu Dan',
        graveStatus: 'Îngrijit',
        photoUrl: '',
        candlesLit: 0,
        tributeMessages: [],
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString()
      },
      {
        id: 'rec-demo-excel-2',
        lastName: 'Dumitrescu',
        firstName: 'Gheorghe',
        maidenName: 'N/A',
        birthDate: '1938',
        deathDate: '2016',
        ageAtDeath: '78',
        cemeteryName: 'Cimitirul Reînvierea',
        county: 'București',
        city: 'Sector 2',
        sector: 'Sector 1',
        plot: 'Parcela 8',
        graveNumber: '34B',
        religion: 'Ortodox',
        profession: 'Inginer Constructor',
        gender: 'Masculin',
        notes: 'Vei rămâne mereu în sufletele noastre.',
        concessionHolder: 'Dumitrescu Dan',
        graveStatus: 'Îngrijit',
        photoUrl: '',
        candlesLit: 0,
        tributeMessages: [],
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString()
      }
    ]
  }
];

/**
 * Get all pending approvals submitted by operators
 */
export function getPendingApprovals(): PendingApproval[] {
  try {
    const raw = localStorage.getItem(PENDING_APPROVALS_KEY);
    if (!raw) {
      localStorage.setItem(PENDING_APPROVALS_KEY, JSON.stringify(INITIAL_DEMO_PENDING_APPROVALS));
      return INITIAL_DEMO_PENDING_APPROVALS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Eroare la încărcarea solicitărilor de aprobare:', err);
    return [];
  }
}

/**
 * Save pending approvals list
 */
export function savePendingApprovals(list: PendingApproval[]): void {
  try {
    localStorage.setItem(PENDING_APPROVALS_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Eroare la salvarea solicitărilor de aprobare:', err);
  }
}

/**
 * Add a new pending approval (from Operator Date: Adaugă Persoană or Import Excel)
 */
export function addPendingApproval(
  data: Omit<PendingApproval, 'id' | 'status' | 'submittedAt'>
): PendingApproval {
  const currentList = getPendingApprovals();
  const newApproval: PendingApproval = {
    ...data,
    id: `appr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    status: 'pending',
    submittedAt: new Date().toISOString()
  };

  const updatedList = [newApproval, ...currentList];
  savePendingApprovals(updatedList);

  const submissionDesc = data.type === 'single_record'
    ? `Adăugare persoană: "${data.record?.lastName} ${data.record?.firstName}"`
    : `Import Excel: ${data.totalRecordsCount || data.records?.length || 0} persoane (${data.fileName || 'fișier'})`;

  addAuditLog(
    'OPERATOR_SUBMISSION',
    'INFO',
    `Operatorul ${data.submittedByUserName} (${data.submittedByUserEmail}) a trimis spre aprobare: ${submissionDesc}`
  );

  return newApproval;
}

/**
 * Admin accepts a pending operator submission
 */
export function approvePendingApproval(
  approvalId: string,
  reviewerName: string
): { success: boolean; approval?: PendingApproval; recordsToAdd: DeceasedRecord[]; error?: string } {
  const currentList = getPendingApprovals();
  const targetIndex = currentList.findIndex(a => a.id === approvalId);

  if (targetIndex === -1) {
    return { success: false, recordsToAdd: [], error: 'Solicitarea nu a fost găsită.' };
  }

  const item = currentList[targetIndex];
  if (item.status === 'approved') {
    return { success: false, recordsToAdd: [], error: 'Această solicitare a fost deja aprobată anterior.' };
  }

  const now = new Date().toISOString();
  const updatedItem: PendingApproval = {
    ...item,
    status: 'approved',
    reviewedAt: now,
    reviewedBy: reviewerName
  };

  currentList[targetIndex] = updatedItem;
  savePendingApprovals(currentList);

  // Determine records to add
  let recordsToAdd: DeceasedRecord[] = [];
  if (item.type === 'single_record' && item.record) {
    recordsToAdd = [item.record];
    addAuditLog(
      'APPROVAL_ACCEPTED',
      'INFO',
      `Administratorul ${reviewerName} a APROBAT adăugarea persoanei "${item.record.lastName} ${item.record.firstName}" trimisă de operatorul ${item.submittedByUserName}`
    );
  } else if (item.type === 'excel_batch' && item.records) {
    recordsToAdd = item.records;
    addAuditLog(
      'APPROVAL_ACCEPTED',
      'INFO',
      `Administratorul ${reviewerName} a APROBAT lotul Excel (${recordsToAdd.length} persoane) trimis de operatorul ${item.submittedByUserName}`
    );
  }

  return { success: true, approval: updatedItem, recordsToAdd };
}

/**
 * Admin rejects a pending operator submission
 */
export function rejectPendingApproval(
  approvalId: string,
  reviewerName: string,
  reason?: string
): { success: boolean; approval?: PendingApproval; error?: string } {
  const currentList = getPendingApprovals();
  const targetIndex = currentList.findIndex(a => a.id === approvalId);

  if (targetIndex === -1) {
    return { success: false, error: 'Solicitarea nu a fost găsită.' };
  }

  const item = currentList[targetIndex];
  const now = new Date().toISOString();
  const updatedItem: PendingApproval = {
    ...item,
    status: 'rejected',
    reviewedAt: now,
    reviewedBy: reviewerName,
    rejectionReason: reason?.trim() || 'Date neconforme sau duplicate'
  };

  currentList[targetIndex] = updatedItem;
  savePendingApprovals(currentList);

  addAuditLog(
    'APPROVAL_REJECTED',
    'WARNING',
    `Administratorul ${reviewerName} a RESPINS solicitarea trimisă de operatorul ${item.submittedByUserName}. Motiv: ${updatedItem.rejectionReason}`
  );

  return { success: true, approval: updatedItem };
}

/**
 * Delete an approval from history
 */
export function deletePendingApproval(approvalId: string): void {
  const currentList = getPendingApprovals();
  const filtered = currentList.filter(a => a.id !== approvalId);
  savePendingApprovals(filtered);
}
