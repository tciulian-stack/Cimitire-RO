import React, { useState, useMemo } from 'react';
import { DeceasedRecord, CemeteryInfo } from '../types/cemetery';
import {
  BarChart3,
  Database,
  Church,
  Flame,
  Users,
  Briefcase,
  Search,
  BookOpen,
  Music,
  Palette,
  GraduationCap,
  Stethoscope,
  Wrench,
  Compass,
  Sparkles,
  UserCheck,
  User
} from 'lucide-react';

interface DatabaseStatsProps {
  records: DeceasedRecord[];
  cemeteries: CemeteryInfo[];
}

export function detectGender(r: DeceasedRecord): 'Masculin' | 'Feminin' | 'Nespecificat' {
  if (r.gender === 'Masculin' || r.gender === 'Feminin') {
    return r.gender;
  }
  // Check if maiden name exists and is not N/A or empty
  if (r.maidenName && r.maidenName !== 'N/A' && r.maidenName.trim() !== '') {
    return 'Feminin';
  }
  const firstName = (r.firstName || '').trim();
  if (!firstName || firstName === 'N/A') return 'Nespecificat';

  // Tokenize first names
  const names = firstName.split(/[\s-]+/).map(n => n.trim().toLowerCase()).filter(Boolean);
  if (names.length === 0) return 'Nespecificat';

  const femaleNamesList = new Set([
    'carmen', 'catrinel', 'beatrice', 'alice', 'iris', 'doina', 'anemona', 'mărioara', 'marioara', 'voichița', 'voichita'
  ]);

  const maleNameExceptions = new Set([
    'horia', 'horea', 'toma', 'luca', 'mircea', 'minea', 'mitică', 'mitica', 'costea', 'bunea', 'badea'
  ]);

  for (const name of names) {
    if (femaleNamesList.has(name)) return 'Feminin';
    if (maleNameExceptions.has(name)) return 'Masculin';
    // Most female Romanian first names end in 'a'
    if (name.endsWith('a')) return 'Feminin';
  }

  return 'Masculin';
}

interface DomainCategory {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  bgLight: string;
  borderLight: string;
  barColor: string;
  keywords: string[];
}

const DOMAIN_CATEGORIES: DomainCategory[] = [
  {
    id: 'literature',
    name: 'Litere, Literatură & Jurnalism',
    icon: BookOpen,
    color: 'text-amber-800',
    bgLight: 'bg-amber-50',
    borderLight: 'border-amber-200',
    barColor: 'bg-amber-600',
    keywords: ['poet', 'scriitor', 'gazetar', 'ziarist', 'nuvelist', 'poveștitor', 'povestitor', 'dramaturg', 'publicist', 'pamfletar', 'traducător', 'traducator', 'jurnalist', 'cronicar']
  },
  {
    id: 'music_arts',
    name: 'Muzică, Teatru & Artele Spectacolului',
    icon: Music,
    color: 'text-purple-800',
    bgLight: 'bg-purple-50',
    borderLight: 'border-purple-200',
    barColor: 'bg-purple-600',
    keywords: ['compozitor', 'violonist', 'dirijor', 'interpret', 'interpretă', 'interpreta', 'cântăreț', 'cântăreață', 'cantaret', 'cantareata', 'actor', 'actriță', 'actrita', 'regizor', 'muzician', 'soprană', 'tenor']
  },
  {
    id: 'visual_arts',
    name: 'Arte Vizuale, Sculptură & Arhitectură',
    icon: Palette,
    color: 'text-pink-800',
    bgLight: 'bg-pink-50',
    borderLight: 'border-pink-200',
    barColor: 'bg-pink-600',
    keywords: ['sculptor', 'pictor', 'arhitect', 'artist', 'grafician', 'ceramicist', 'scenograf', 'restaurator']
  },
  {
    id: 'education_science',
    name: 'Educație, Știință & Cercetare',
    icon: GraduationCap,
    color: 'text-blue-800',
    bgLight: 'bg-blue-50',
    borderLight: 'border-blue-200',
    barColor: 'bg-blue-600',
    keywords: ['profesor', 'profesoară', 'profesoara', 'învățător', 'invatator', 'matematician', 'academician', 'filosof', 'istoric', 'cercetător', 'cercetator', 'astronom', 'fizician', 'chimist', 'pedagog']
  },
  {
    id: 'medicine',
    name: 'Medicină & Sănătate',
    icon: Stethoscope,
    color: 'text-emerald-800',
    bgLight: 'bg-emerald-50',
    borderLight: 'border-emerald-200',
    barColor: 'bg-emerald-600',
    keywords: ['medic', 'doctor', 'farmacist', 'chirurg', 'stomatolog', 'asistent']
  },
  {
    id: 'engineering',
    name: 'Inginerie, Tehnologie & Aviație',
    icon: Wrench,
    color: 'text-cyan-800',
    bgLight: 'bg-cyan-50',
    borderLight: 'border-cyan-200',
    barColor: 'bg-cyan-600',
    keywords: ['inginer', 'aviator', 'inventator', 'constructor', 'tehnician', 'inovator', 'mecanic']
  },
  {
    id: 'military_law',
    name: 'Armată, Drept, Politică & Navigație',
    icon: Compass,
    color: 'text-indigo-800',
    bgLight: 'bg-indigo-50',
    borderLight: 'border-indigo-200',
    barColor: 'bg-indigo-600',
    keywords: ['căpitan', 'capitan', 'marinar', 'militar', 'general', 'colonel', 'maior', 'soldat', 'erou', 'avocat', 'jurist', 'politician', 'ministru', 'om de stat', 'filantrop', 'om de afaceri']
  },
  {
    id: 'clergy',
    name: 'Cler & Teologie',
    icon: Church,
    color: 'text-amber-900',
    bgLight: 'bg-amber-100/60',
    borderLight: 'border-amber-300',
    barColor: 'bg-amber-800',
    keywords: ['preot', 'diacon', 'episcop', 'mitropolit', 'patriarh', 'teolog', 'călugăr', 'calugar', 'monah']
  }
];

export const DatabaseStats: React.FC<DatabaseStatsProps> = ({ records, cemeteries }) => {
  const [professionSearch, setProfessionSearch] = useState('');

  const totalRecords = records.length;
  const totalCandles = records.reduce((acc, r) => acc + (r.candlesLit || 0), 0);

  // --- 1. GENDER STATS ---
  const genderStats = useMemo(() => {
    let maleCount = 0;
    let femaleCount = 0;
    let unspecifiedCount = 0;

    const maleRecords: DeceasedRecord[] = [];
    const femaleRecords: DeceasedRecord[] = [];

    records.forEach((r) => {
      const g = detectGender(r);
      if (g === 'Masculin') {
        maleCount++;
        maleRecords.push(r);
      } else if (g === 'Feminin') {
        femaleCount++;
        femaleRecords.push(r);
      } else {
        unspecifiedCount++;
      }
    });

    const malePercent = totalRecords > 0 ? Math.round((maleCount / totalRecords) * 100) : 0;
    const femalePercent = totalRecords > 0 ? Math.round((femaleCount / totalRecords) * 100) : 0;
    const unspecifiedPercent = totalRecords > 0 ? 100 - malePercent - femalePercent : 0;

    return {
      maleCount,
      femaleCount,
      unspecifiedCount,
      malePercent,
      femalePercent,
      unspecifiedPercent,
      maleRecords,
      femaleRecords
    };
  }, [records, totalRecords]);

  // --- 2. PROFESSION & OCCUPATION CENTRALIZATION ---
  const professionStats = useMemo(() => {
    const withProfession = records.filter(
      (r) => r.profession && r.profession !== 'N/A' && r.profession.trim() !== ''
    );

    const countWithProf = withProfession.length;
    const coveragePercent = totalRecords > 0 ? Math.round((countWithProf / totalRecords) * 100) : 0;

    // Domain breakdown
    const domainCounts: Record<string, { count: number; items: DeceasedRecord[] }> = {};
    DOMAIN_CATEGORIES.forEach((d) => {
      domainCounts[d.id] = { count: 0, items: [] };
    });
    let otherDomainCount = 0;
    const otherDomainItems: DeceasedRecord[] = [];

    // Individual exact/normalized profession counts
    const professionMap: Record<string, number> = {};

    withProfession.forEach((r) => {
      const profStr = r.profession.trim();
      const profLower = profStr.toLowerCase();

      // Individual count mapping
      professionMap[profStr] = (professionMap[profStr] || 0) + 1;

      // Categorize into domains
      let matched = false;
      for (const category of DOMAIN_CATEGORIES) {
        if (category.keywords.some((kw) => profLower.includes(kw))) {
          domainCounts[category.id].count++;
          domainCounts[category.id].items.push(r);
          matched = true;
          break;
        }
      }

      if (!matched) {
        otherDomainCount++;
        otherDomainItems.push(r);
      }
    });

    // Top professions sorted
    const topProfessionsList = Object.entries(professionMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({
        name,
        count,
        percent: countWithProf > 0 ? Math.round((count / countWithProf) * 100) : 0
      }));

    return {
      withProfession,
      countWithProf,
      coveragePercent,
      domainCounts,
      otherDomainCount,
      otherDomainItems,
      topProfessionsList,
      totalUniqueProfessions: Object.keys(professionMap).length
    };
  }, [records, totalRecords]);

  // Filtered list of records based on profession search
  const filteredProfessionRecords = useMemo(() => {
    if (!professionSearch.trim()) return [];
    const q = professionSearch.toLowerCase().trim();
    return records.filter(
      (r) =>
        (r.profession && r.profession.toLowerCase().includes(q)) ||
        r.firstName.toLowerCase().includes(q) ||
        r.lastName.toLowerCase().includes(q)
    );
  }, [records, professionSearch]);

  // Distribution by county
  const countyCounts: Record<string, number> = {};
  records.forEach((r) => {
    const c = r.county && r.county !== 'N/A' ? r.county : 'Nespecificat';
    countyCounts[c] = (countyCounts[c] || 0) + 1;
  });

  // Distribution by cemetery
  const cemeteryCounts: Record<string, number> = {};
  records.forEach((r) => {
    const cem = r.cemeteryName && r.cemeteryName !== 'N/A' ? r.cemeteryName : 'Nespecificat';
    cemeteryCounts[cem] = (cemeteryCounts[cem] || 0) + 1;
  });

  return (
    <div className="space-y-8">
      
      {/* SECTION 1: TOP SUMMARY STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Records */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-700">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold block">
              Total Persoane
            </span>
            <span className="text-2xl font-bold font-mono text-slate-900">
              {totalRecords}
            </span>
          </div>
        </div>

        {/* Gender Ratio Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-700">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold block">
              Dispunere Genuri
            </span>
            <div className="text-sm font-bold font-mono text-slate-900 flex items-center space-x-2">
              <span className="text-indigo-700">♂ {genderStats.malePercent}%</span>
              <span className="text-slate-300">|</span>
              <span className="text-rose-600">♀ {genderStats.femalePercent}%</span>
            </div>
          </div>
        </div>

        {/* Total Cemeteries */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-700">
            <Church className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold block">
              Cimitire Înregistrate
            </span>
            <span className="text-2xl font-bold font-mono text-slate-900">
              {Object.keys(cemeteryCounts).length}
            </span>
          </div>
        </div>

        {/* Total Professions Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-700">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold block">
              Profesii Consemnate
            </span>
            <span className="text-2xl font-bold font-mono text-slate-900">
              {professionStats.countWithProf}
            </span>
          </div>
        </div>

      </div>

      {/* SECTION 2: GENDER DISTRIBUTION (DISPUNEREA PE GENURI) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
          <div>
            <h3 className="text-base font-bold font-serif text-slate-900 flex items-center space-x-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span>1. Statistica & Dispunerea pe Genuri (Masculin / Feminin)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Analiza distribuției pe genuri a persoanelor înregistrate în baza de date
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200 font-semibold">
              Bărbați: {genderStats.maleCount} ({genderStats.malePercent}%)
            </span>
            <span className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded-lg border border-rose-200 font-semibold">
              Femei: {genderStats.femaleCount} ({genderStats.femalePercent}%)
            </span>
          </div>
        </div>

        {/* Visual Comparison Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-slate-700">
            <span className="flex items-center space-x-1.5 text-indigo-800">
              <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block" />
              <span>Masculin ({genderStats.maleCount} persoane)</span>
            </span>
            <span className="flex items-center space-x-1.5 text-rose-700">
              <span>Feminin ({genderStats.femaleCount} persoane)</span>
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
            </span>
          </div>

          <div className="w-full bg-slate-100 h-5 rounded-xl overflow-hidden flex border border-slate-200 shadow-inner p-0.5">
            <div
              className="bg-gradient-to-r from-indigo-700 to-indigo-500 h-full rounded-l-lg transition-all duration-500 flex items-center justify-center text-[10px] text-white font-bold font-mono"
              style={{ width: `${genderStats.malePercent}%` }}
              title={`Masculin: ${genderStats.malePercent}%`}
            >
              {genderStats.malePercent > 10 && `${genderStats.malePercent}%`}
            </div>
            <div
              className="bg-gradient-to-r from-rose-500 to-pink-600 h-full rounded-r-lg transition-all duration-500 flex items-center justify-center text-[10px] text-white font-bold font-mono"
              style={{ width: `${genderStats.femalePercent}%` }}
              title={`Feminin: ${genderStats.femalePercent}%`}
            >
              {genderStats.femalePercent > 10 && `${genderStats.femalePercent}%`}
            </div>
          </div>
        </div>

        {/* Detail Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          
          {/* Male Card */}
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex items-start space-x-3">
            <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-sm shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider block">
                Persoane de Gen Masculin
              </span>
              <div className="text-2xl font-bold font-mono text-indigo-950">
                {genderStats.maleCount} <span className="text-xs text-indigo-700 font-normal">persoane</span>
              </div>
              <p className="text-xs text-indigo-800/80 leading-relaxed">
                Reprezintă <strong className="font-semibold text-indigo-950">{genderStats.malePercent}%</strong> din totalul înregistrărilor din registrele funerare.
              </p>
            </div>
          </div>

          {/* Female Card */}
          <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-4 flex items-start space-x-3">
            <div className="p-3 bg-rose-600 text-white rounded-xl shadow-sm shrink-0">
              <UserCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-rose-900 uppercase tracking-wider block">
                Persoane de Gen Feminin
              </span>
              <div className="text-2xl font-bold font-mono text-rose-950">
                {genderStats.femaleCount} <span className="text-xs text-rose-700 font-normal">persoane</span>
              </div>
              <p className="text-xs text-rose-800/80 leading-relaxed">
                Reprezintă <strong className="font-semibold text-rose-950">{genderStats.femalePercent}%</strong> din totalul înregistrărilor validate.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 3: PROFESSION & OCCUPATION CENTRALIZATION */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-3">
          <div>
            <h3 className="text-base font-bold font-serif text-slate-900 flex items-center space-x-2">
              <Briefcase className="w-5 h-5 text-amber-600" />
              <span>2. Centralizator Profesii, Titluri & Ocupații</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Gruparea și distribuția persoanelor pe domenii de activitate, profesii și titluri onorifice
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono">
            <div className="px-3 py-1.5 bg-amber-50 text-amber-900 rounded-lg border border-amber-200 flex items-center space-x-1.5">
              <Briefcase className="w-3.5 h-3.5 text-amber-600" />
              <span>
                <strong className="font-bold">{professionStats.countWithProf}</strong> profesii specificate ({professionStats.coveragePercent}%)
              </span>
            </div>
            <div className="px-3 py-1.5 bg-slate-100 text-slate-800 rounded-lg border border-slate-200 font-semibold">
              {professionStats.totalUniqueProfessions} profesii distincte
            </div>
          </div>
        </div>

        {/* Domain Categories Chart */}
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-amber-600" />
              <span>Grafic Distribuție pe Domenii de Activitate</span>
            </h4>
            <span className="text-[11px] font-mono text-slate-500 font-semibold">
              {professionStats.countWithProf} persoane încadrate
            </span>
          </div>

          {/* Stacked Composition Bar */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-slate-500 flex justify-between">
              <span>Ponderea relativă a domeniilor în totalul profesiilor</span>
              <span>100%</span>
            </div>
            <div className="w-full bg-slate-200 h-3.5 rounded-xl overflow-hidden flex shadow-inner p-0.5 space-x-0.5">
              {DOMAIN_CATEGORIES.map((cat) => {
                const data = professionStats.domainCounts[cat.id];
                const count = data ? data.count : 0;
                const totalProf = professionStats.countWithProf || 1;
                const relPercent = Math.round((count / totalProf) * 100);
                if (relPercent <= 0) return null;
                return (
                  <div
                    key={cat.id}
                    className={`${cat.barColor} h-full transition-all`}
                    style={{ width: `${relPercent}%` }}
                    title={`${cat.name}: ${count} pers. (${relPercent}%)`}
                  />
                );
              })}
            </div>
          </div>

          {/* Horizontal Bar Chart Rows */}
          <div className="space-y-3 pt-2">
            {DOMAIN_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const data = professionStats.domainCounts[cat.id];
              const count = data ? data.count : 0;
              const percent = totalRecords > 0 ? Math.round((count / totalRecords) * 100) : 0;
              const maxCount = Math.max(...DOMAIN_CATEGORIES.map(c => professionStats.domainCounts[c.id]?.count || 0), 1);
              const relativeWidth = Math.max(Math.round((count / maxCount) * 100), count > 0 ? 4 : 0);

              return (
                <div key={cat.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-800">
                    <span className="flex items-center space-x-2 font-semibold truncate max-w-[280px] sm:max-w-md">
                      <span className={`p-1 rounded bg-white border border-slate-200 ${cat.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      <span className="truncate">{cat.name}</span>
                    </span>
                    <span className="font-mono text-slate-700 font-bold shrink-0 ml-2">
                      {count} pers. <span className="text-slate-400 font-normal">({percent}%)</span>
                    </span>
                  </div>

                  <div className="w-full bg-slate-200/80 h-2.5 rounded-full overflow-hidden flex">
                    <div
                      className={`${cat.barColor} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${relativeWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Individual Professions & Search Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          
          {/* Top 8 Individual Professions List */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono border-b border-slate-200 pb-2 flex items-center justify-between">
              <span>Cele mai frecvente profesii din registru</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            </h4>

            <div className="space-y-2.5">
              {professionStats.topProfessionsList.slice(0, 8).map((prof) => (
                <div key={prof.name} className="space-y-1 text-xs">
                  <div className="flex justify-between font-medium text-slate-800">
                    <span className="truncate max-w-[240px] font-semibold">{prof.name}</span>
                    <span className="font-mono text-amber-800 font-bold">
                      {prof.count} pers. ({prof.percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-600 h-full rounded-full"
                      style={{ width: `${Math.max(prof.percent * 3, 5)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Profession Search Tool */}
          <div className="bg-slate-900 text-slate-100 rounded-xl p-4 space-y-3 border border-slate-800">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono flex items-center space-x-1.5">
                <Search className="w-3.5 h-3.5" />
                <span>Căutare & Centralizare Profesie</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Introduceți un cuvânt cheie (ex: "Medic", "Profesor", "Inginer", "Poet") pentru a identifica persoanele:
              </p>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={professionSearch}
                onChange={(e) => setProfessionSearch(e.target.value)}
                placeholder="Caută profesie (ex: Profesor, Medic, Poet)..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {professionSearch.trim() !== '' ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs">
                <div className="text-[11px] text-amber-300 font-mono font-semibold">
                  Rezultate găsite: {filteredProfessionRecords.length} persoane
                </div>

                {filteredProfessionRecords.length === 0 ? (
                  <p className="text-slate-500 italic text-[11px]">Nicio persoană găsită cu această profesie.</p>
                ) : (
                  <div className="space-y-1.5">
                    {filteredProfessionRecords.map((r) => (
                      <div
                        key={r.id}
                        className="p-2 bg-slate-800/90 rounded border border-slate-700/80 flex justify-between items-center text-xs"
                      >
                        <div>
                          <span className="font-bold text-white">
                            {r.lastName} {r.firstName}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {r.cemeteryName} ({r.county})
                          </span>
                        </div>
                        <span className="px-2 py-0.5 bg-amber-900/60 text-amber-200 text-[10px] rounded border border-amber-700/50 font-mono">
                          {r.profession}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                Afișează instant persoanele care au profesia sau ocupația căutată.
              </div>
            )}
          </div>

        </div>
      </div>

      {/* SECTION 3: DISTRIBUTION BY COUNTY & CEMETERY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Distribution by County */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm font-serif border-b border-slate-100 pb-2">
            3. Distribuție pe Județe
          </h3>
          <div className="space-y-2">
            {Object.entries(countyCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([county, count]) => {
                const percentage = Math.round((count / totalRecords) * 100);
                return (
                  <div key={county} className="space-y-1 text-xs">
                    <div className="flex justify-between font-medium text-slate-700">
                      <span>Județul {county}</span>
                      <span className="font-mono text-slate-500">{count} persoane ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-600 h-full rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Distribution by Cemetery */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm font-serif border-b border-slate-100 pb-2">
            4. Distribuție pe Cimitire
          </h3>
          <div className="space-y-2">
            {Object.entries(cemeteryCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([cemetery, count]) => {
                const percentage = Math.round((count / totalRecords) * 100);
                return (
                  <div key={cemetery} className="space-y-1 text-xs">
                    <div className="flex justify-between font-medium text-slate-700">
                      <span className="truncate max-w-[200px]">{cemetery}</span>
                      <span className="font-mono text-slate-500">{count} înregistrări ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-slate-800 h-full rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

      </div>

    </div>
  );
};
