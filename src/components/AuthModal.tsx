import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Mail, 
  User, 
  Shield, 
  ShieldCheck, 
  KeyRound, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  ArrowRight,
  UserPlus,
  LogIn
} from 'lucide-react';
import { 
  authenticateUser, 
  registerNewUser, 
  isLoginLockedOut, 
  getRemainingLockoutSeconds,
  DEFAULT_ADMIN_USER
} from '../utils/security';
import { UserAccount } from '../types/cemetery';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register';
  onClose: () => void;
  onSuccess?: (user: UserAccount) => void;
  onLoginSuccess?: (user: UserAccount) => void;
  showToast?: (msg: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onSuccess,
  onLoginSuccess,
  showToast
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  
  // Login Form States
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState('');

  // Register Form States
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regError, setRegError] = useState('');

  // Lockout Timer state
  const [lockoutTimer, setLockoutTimer] = useState<number>(0);

  useEffect(() => {
    setMode(initialMode);
    setLoginError('');
    setRegError('');
  }, [initialMode, isOpen]);

  useEffect(() => {
    const checkLock = () => {
      if (isLoginLockedOut()) {
        setLockoutTimer(getRemainingLockoutSeconds());
      } else {
        setLockoutTimer(0);
      }
    };
    checkLock();
    const interval = setInterval(checkLock, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (lockoutTimer > 0) {
      setLoginError(`Acces blocat temporar! Vă rugăm așteptați ${lockoutTimer} secunde.`);
      return;
    }

    const res = authenticateUser(loginIdentifier, loginPassword);
    if (res.success && res.user) {
      if (typeof showToast === 'function') {
        showToast(`Bine ai revenit, ${res.user.name}!`);
      }
      const callback = onLoginSuccess || onSuccess;
      if (typeof callback === 'function') {
        callback(res.user);
      }
      onClose();
    } else {
      setLoginError(res.error || 'Eroare la autentificare.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (regPassword !== regConfirmPassword) {
      setRegError('Parolele introduse nu coincid!');
      return;
    }

    if (regPassword.length < 5) {
      setRegError('Parola trebuie să aibă cel puțin 5 caractere.');
      return;
    }

    const res = registerNewUser('', regEmail, regPassword, 'editor');
    if (res.success && res.user) {
      if (typeof showToast === 'function') {
        showToast(`Cont creat cu succes! Bine ai venit, ${res.user.name}.`);
      }
      const callback = onLoginSuccess || onSuccess;
      if (typeof callback === 'function') {
        callback(res.user);
      }
      onClose();
    } else {
      setRegError(res.error || 'Eroare la crearea contului.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-white">
        
        {/* Header with gradient & tabs */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              {mode === 'login' ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold font-serif text-base text-white">
                {mode === 'login' ? 'Autentificare Cont' : 'Înregistrare Cont Nou'}
              </h3>
              <p className="text-xs text-slate-400">
                {mode === 'login' 
                  ? 'Acces securizat în baza de date și panoul administrativ' 
                  : 'Creează un cont pentru acces la sistemul de cimitire'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="grid grid-cols-2 p-2 bg-slate-950/60 border-b border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setLoginError('');
            }}
            className={`py-2 rounded-lg flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Login / Conectare</span>
          </button>
          
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setRegError('');
            }}
            className={`py-2 rounded-lg flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Înregistrare</span>
          </button>
        </div>

        {/* ================= LOGIN FORM ================= */}
        {mode === 'login' && (
          <div className="p-6 space-y-4">
            {lockoutTimer > 0 ? (
              <div className="bg-rose-950/80 border border-rose-800 rounded-xl p-4 text-center space-y-2">
                <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto animate-pulse" />
                <h4 className="font-bold text-sm text-rose-200">Acces Blocat Temporar (Protecție Brute-Force)</h4>
                <p className="text-xs text-rose-300">
                  Prea multe încercări eșuate de conectare. Sistemul a blocat temporar autentificarea.
                </p>
                <div className="pt-2">
                  <span className="text-lg font-mono font-bold text-amber-400 bg-slate-900 px-3 py-1 rounded border border-amber-500/40">
                    00:{lockoutTimer < 10 ? `0${lockoutTimer}` : lockoutTimer}
                  </span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                
                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Email</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="introdu adresa de email"
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Parolă
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Introduceți parola..."
                      className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Options */}
                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center space-x-2 text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-amber-600 focus:ring-amber-500"
                    />
                    <span>Ține-mă minte</span>
                  </label>
                </div>

                {/* Error Banner */}
                {loginError && (
                  <div className="p-3 bg-rose-950/80 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Conectare în Cont</span>
                </button>

                {/* Quick demo credentials helper */}
                <div className="pt-2 border-t border-slate-800 space-y-1.5">
                  <p className="text-[11px] text-slate-400 text-center font-medium">Conturi rapide pentru testare:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginIdentifier('tc_iulian@yahoo.com');
                        setLoginPassword('1234Nichita!');
                      }}
                      className="px-2.5 py-1.5 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold text-left transition-colors cursor-pointer"
                    >
                      <span className="text-rose-400 font-bold block">Administrator</span>
                      <span className="text-[10px] text-slate-400 truncate block">tc_iulian@yahoo.com</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setLoginIdentifier('operator@cimitire.ro');
                        setLoginPassword('Operator123!');
                      }}
                      className="px-2.5 py-1.5 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold text-left transition-colors cursor-pointer"
                    >
                      <span className="text-amber-400 font-bold block">Operator Date</span>
                      <span className="text-[10px] text-slate-400 truncate block">operator@cimitire.ro</span>
                    </button>
                  </div>
                </div>

              </form>
            )}
          </div>
        )}

        {/* ================= REGISTER FORM ================= */}
        {mode === 'register' && (
          <div className="p-6 space-y-4">
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              
              {/* Adresă de Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Adresă de Email</span>
                  <span className="text-[11px] text-amber-400 font-medium">Rol: Operator Date</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="introdu adresa de email"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Parolă
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Minim 5 caractere"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Confirmă Parola
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Repetă parola"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Error Banner */}
              {regError && (
                <div className="p-3 bg-rose-950/80 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{regError}</span>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer mt-1"
              >
                <UserPlus className="w-4 h-4" />
                <span>Creează Contul</span>
              </button>

            </form>
          </div>
        )}

      </div>
    </div>
  );
};
