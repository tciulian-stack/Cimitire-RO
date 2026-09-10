import React from 'react';
import { 
  HeartHandshake, 
  BookOpen, 
  History, 
  Flame, 
  ShieldCheck, 
  Users, 
  Compass, 
  Scroll, 
  Church,
  Search,
  Sparkles
} from 'lucide-react';

interface AboutUsProps {
  onNavigateToRecords?: () => void;
  onNavigateToStats?: () => void;
}

export const AboutUs: React.FC<AboutUsProps> = ({
  onNavigateToRecords,
  onNavigateToStats
}) => {
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Presentation */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-800 text-white p-6 sm:p-10 shadow-lg">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full text-amber-300 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Memorie, Istorie & Reculegere</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-serif font-bold text-white tracking-tight leading-tight">
            Cimitire, oameni și destine
          </h2>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Acest proiect s-a născut din respect profund pentru memoria celor care au fost înaintea noastră. 
            Dincolo de cifre, registre parohiale și coordonate de parcelă, fiecare mormânt adăpostește 
            o viață trăită, o familie, un nume și un destin ce merită să fie păstrat neatins de trecerea timpului.
          </p>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Mai mult, această platformă este o resursă inepuizabilă, care pune la dispoziția celor interesați 
            informații necesare pentru întocmirea arborelui genealogic, totul la un click distanță.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            {onNavigateToRecords && (
              <button
                onClick={onNavigateToRecords}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors shadow-sm cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Explorează Registrul</span>
              </button>
            )}
            {onNavigateToStats && (
              <button
                onClick={onNavigateToStats}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer"
              >
                <History className="w-4 h-4 text-amber-400" />
                <span>Statistici Demografice</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3 Core Mission Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Scroll className="w-5 h-5" />
            </div>
            <h3 className="text-base font-serif font-bold text-slate-900">
              Păstrarea Memoriei
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Fiecare persoană înregistrată are o pagină dedicată, unde se pot consemna detalii genealogice, 
              biografii, starea mormântului și amintirile familiei, împiedicând uitarea.
            </p>
          </div>
          <div className="text-xs font-semibold text-amber-800 pt-2 border-t border-slate-100 flex items-center space-x-1">
            <Church className="w-3.5 h-3.5" />
            <span>Patrimoniu & Genealogie</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <Flame className="w-5 h-5" />
            </div>
            <h3 className="text-base font-serif font-bold text-slate-900">
              Reculegere & Candele Virtuale
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Oferim posibilitatea celor aflați departe de casă sau peste hotare să aprindă o candelă 
              simbolică și să lase un mesaj de suflet în memoria celor dragi plecați dintre noi.
            </p>
          </div>
          <div className="text-xs font-semibold text-rose-800 pt-2 border-t border-slate-100 flex items-center space-x-1">
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Comuniune & Omagiu</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="text-base font-serif font-bold text-slate-900">
              Localizare & Transparență
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Unelte clare de căutare după județ, localitate, cimitir, figură și loc de veci, 
              venind în sprijinul familiilor, al administrațiilor și al cercetătorilor de istorie locală.
            </p>
          </div>
          <div className="text-xs font-semibold text-emerald-800 pt-2 border-t border-slate-100 flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Date Verificate & Deschise</span>
          </div>
        </div>
      </div>

      {/* Detailed Values Section */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="max-w-2xl">
          <h3 className="text-lg sm:text-xl font-serif font-bold text-slate-900">
            De ce digitalizăm cimitirele din România?
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Cimitirele sunt veritabile muzee în aer liber și arhive identitare ale comunităților noastre.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex space-x-3.5">
            <div className="w-8 h-8 rounded-lg bg-amber-200/70 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900">Protejarea Monumentelor Istorice</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Multe locuri de veci adăpostesc personalități de seamă, eroi, scriitori, meșteșugari sau oameni simpli 
                care au clădit comunitățile locale. Păstrarea stării mormintelor (îngrijit, în conservare, dispărut) 
                ajută la monitorizarea și protejarea acestui patrimoniu.
              </p>
            </div>
          </div>

          <div className="flex space-x-3.5">
            <div className="w-8 h-8 rounded-lg bg-amber-200/70 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
              <Users className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900">Conectarea Generațiilor</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pentru tinerii din diaspora sau cei care încearcă să-și reconstruiască arborele genealogic, 
                găsirea strămoșilor într-un registru digital intuitiv este adesea singura punte de legătură 
                cu rădăcinile lor din România.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quote banner */}
      <div className="text-center py-6 px-4 bg-amber-50/60 border border-amber-200/80 rounded-xl">
        <blockquote className="italic font-serif text-slate-800 text-sm sm:text-base max-w-2xl mx-auto">
          „Neamul este etern prin faptele celor dispăruți și prin respectul celor vii.”
        </blockquote>
        <p className="text-xs text-slate-500 mt-2 font-medium">
          Platforma Națională a Cimitirelor și Memoriei Funerare
        </p>
      </div>
    </div>
  );
};
