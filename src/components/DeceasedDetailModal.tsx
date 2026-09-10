import React, { useState } from 'react';
import { DeceasedRecord, UserSession } from '../types/cemetery';
import { Flame, X, Printer, MapPin, Calendar, Award, User, Church, MessageSquare, Send, Share2, Copy, Check, ZoomIn, Camera, Edit3, Trash2, Lock, ShieldCheck } from 'lucide-react';

interface DeceasedDetailModalProps {
  record: DeceasedRecord | null;
  currentUser?: UserSession | null;
  onClose: () => void;
  onLightCandle: (recordId: string) => void;
  onAddTributeMessage: (recordId: string, author: string, message: string) => void;
  onEdit: (record: DeceasedRecord) => void;
  onDelete?: (recordId: string) => void;
  onRequireAuth?: () => void;
}

export const DeceasedDetailModal: React.FC<DeceasedDetailModalProps> = ({
  record,
  currentUser,
  onClose,
  onLightCandle,
  onAddTributeMessage,
  onEdit,
  onDelete,
  onRequireAuth
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const isOperator = currentUser?.role === 'editor';
  const [authorName, setAuthorName] = useState('');
  const [tributeText, setTributeText] = useState('');
  const [showTributeForm, setShowTributeForm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  if (!record) return null;

  const handleSubmitTribute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tributeText.trim()) return;
    onAddTributeMessage(record.id, authorName.trim() || 'Vizitator Anonim', tributeText.trim());
    setTributeText('');
    setAuthorName('');
    setShowTributeForm(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const getRecordSummaryText = () => {
    return `FIȘĂ ÎNREGISTRARE REGISTRU CIMITIRE
Decedat: ${record.lastName} ${record.firstName !== 'N/A' ? record.firstName : ''}
Cimitir: ${record.cemeteryName !== 'N/A' ? record.cemeteryName : 'Nespecificat'} (${record.city !== 'N/A' ? record.city : ''}, ${record.county !== 'N/A' ? record.county : ''})
Figură: ${record.plot !== 'N/A' ? record.plot : (record.sector !== 'N/A' ? record.sector : 'N/A')} | Loc: ${record.graveNumber !== 'N/A' ? record.graveNumber : 'N/A'}
Perioadă: ${record.birthDate !== 'N/A' ? record.birthDate : 'N/A'} - ${record.deathDate !== 'N/A' ? record.deathDate : 'N/A'}${record.ageAtDeath !== 'N/A' ? ` (${record.ageAtDeath} ani)` : ''}
${record.notes && record.notes !== 'N/A' ? `Epitaf: "${record.notes}"\n` : ''}`;
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(getRecordSummaryText());
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(getRecordSummaryText() + `\nVezi fișa completă pe: ${window.location.href}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Fișă Registru Cimitir: ${record.lastName} ${record.firstName}`);
    const body = encodeURIComponent(getRecordSummaryText() + `\nVezi pe site: ${window.location.href}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const renderFieldValue = (val: string, highlightMissing: boolean = true) => {
    if (!val || val === 'N/A' || val.trim() === '') {
      return highlightMissing ? (
        <span className="inline-block px-2 py-0.5 text-xs font-mono text-slate-400 bg-slate-100 rounded border border-slate-200">
          N/A
        </span>
      ) : (
        <span className="text-slate-400 font-mono text-xs">N/A</span>
      );
    }
    return <span className="font-semibold text-slate-900">{val}</span>;
  };

  const hasDeceasedPhoto = record.deceasedPhotoUrl && record.deceasedPhotoUrl !== 'N/A' && record.deceasedPhotoUrl.trim() !== '';
  const hasGravePhoto = record.photoUrl && record.photoUrl !== 'N/A' && record.photoUrl.trim() !== '';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden my-auto print:border-none print:shadow-none print:max-w-none relative">
        
        {/* Header Bar */}
        <div className="bg-slate-900 text-white p-4 sm:p-6 flex items-start justify-between relative print:bg-white print:text-black print:p-0 border-b border-slate-800 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded font-mono border border-amber-500/30 uppercase flex items-center space-x-1">
                <Church className="w-3 h-3 text-amber-400" />
                <span>{record.cemeteryName !== 'N/A' ? record.cemeteryName : 'Cimitir'}</span>
              </span>
              {record.graveStatus === 'Monument Protejat' && (
                <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-900 rounded font-medium border border-amber-300 inline-flex items-center">
                  <Award className="w-3 h-3 mr-1" /> Monument Istoric
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-white tracking-wide print:text-slate-900">
              {record.lastName} {record.firstName !== 'N/A' ? record.firstName : ''}
            </h2>

            {record.maidenName && record.maidenName !== 'N/A' && (
              <p className="text-sm text-slate-300 italic">
                Nume anterior / de fată: {record.maidenName}
              </p>
            )}
          </div>

          {/* Close, Share & Print actions */}
          <div className="flex items-center space-x-2 print:hidden">
            <button
              onClick={() => setShowShareModal(true)}
              className="p-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition-colors flex items-center space-x-1.5 text-xs font-semibold cursor-pointer"
              title="Distribuie sau Printează Cardul"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Distribuie</span>
            </button>

            <button
              onClick={handlePrint}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
              title="Printează Fișa"
            >
              <Printer className="w-5 h-5" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">

          {/* SECTION: Fotografii (Poză Decedat & Poză Mormânt) */}
          <div className="bg-slate-900/5 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center space-x-2">
                <Camera className="w-4 h-4 text-amber-700" />
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">
                  Galerie Fotografii (Decedat & Mormânt)
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                Apasă pe imagini pentru marire
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card Poză Decedat */}
              <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-xs">
                <span className="text-xs font-bold text-slate-800 mb-2 flex items-center space-x-1">
                  <User className="w-3.5 h-3.5 text-amber-700" />
                  <span>Poză Decedat (Portret)</span>
                </span>

                {hasDeceasedPhoto ? (
                  <div 
                    onClick={() => setPreviewImage({ url: record.deceasedPhotoUrl!, title: `Portret: ${record.lastName} ${record.firstName}` })}
                    className="relative group cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-slate-100 w-full h-44 flex items-center justify-center"
                  >
                    <img 
                      src={record.deceasedPhotoUrl} 
                      alt={`Poză ${record.lastName} ${record.firstName}`} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium space-x-1">
                      <ZoomIn className="w-4 h-4" />
                      <span>Mărește Imaginea</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-44 rounded-lg border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center p-4 text-slate-400">
                    <User className="w-10 h-10 mb-2 text-slate-300" />
                    <span className="text-xs font-medium text-slate-500">Nicio poză cu decedatul</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Poți adăuga o poză din secțiunea Editează</span>
                  </div>
                )}
              </div>

              {/* Card Poză Mormânt */}
              <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-xs">
                <span className="text-xs font-bold text-slate-800 mb-2 flex items-center space-x-1">
                  <Church className="w-3.5 h-3.5 text-amber-700" />
                  <span>Poză Mormânt / Monument</span>
                </span>

                {hasGravePhoto ? (
                  <div 
                    onClick={() => setPreviewImage({ url: record.photoUrl, title: `Monument Mormânt: Loc ${record.graveNumber} (${record.cemeteryName})` })}
                    className="relative group cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-slate-100 w-full h-44 flex items-center justify-center"
                  >
                    <img 
                      src={record.photoUrl} 
                      alt={`Mormânt ${record.lastName}`} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium space-x-1">
                      <ZoomIn className="w-4 h-4" />
                      <span>Mărește Imaginea</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-44 rounded-lg border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center p-4 text-slate-400">
                    <Church className="w-10 h-10 mb-2 text-slate-300" />
                    <span className="text-xs font-medium text-slate-500">Nicio poză cu mormântul</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Poți adăuga o poză din secțiunea Editează</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Main Grid: Location & Person */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Box 1: Loc de Veci & Cimitir */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
                <Church className="w-4 h-4 text-amber-700" />
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">
                  Amplasament & Cimitir
                </h3>
              </div>

              <div className="text-xs space-y-2">
                <div>
                  <span className="text-slate-500 block">Nume Cimitir:</span>
                  <div className="font-bold text-slate-900 text-sm">
                    {renderFieldValue(record.cemeteryName)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500 block">Localitate:</span>
                    {renderFieldValue(record.city)}
                  </div>
                  <div>
                    <span className="text-slate-500 block">Județ:</span>
                    {renderFieldValue(record.county)}
                  </div>
                </div>

                {/* Specific Location Badges: Figură și Loc */}
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 grid grid-cols-2 gap-2 text-center font-mono">
                  <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Figură</span>
                    {renderFieldValue(record.plot)}
                  </div>
                  <div className="bg-amber-50 p-1.5 rounded border border-amber-200 text-amber-900 font-bold">
                    <span className="text-[10px] text-amber-800 block uppercase font-sans font-bold">Loc</span>
                    {renderFieldValue(record.graveNumber)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-slate-500 block">Deținător Loc:</span>
                    {renderFieldValue(record.concessionHolder)}
                  </div>
                  <div>
                    <span className="text-slate-500 block">Stare Mormânt:</span>
                    {renderFieldValue(record.graveStatus)}
                  </div>
                </div>
              </div>
            </div>

            {/* Box 2: Înformații Personale */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
                <User className="w-4 h-4 text-amber-700" />
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">
                  Date Identificare Decedat
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-y-2 text-xs">
                <div>
                  <span className="text-slate-500 block">Nume de Familie:</span>
                  {renderFieldValue(record.lastName)}
                </div>
                <div>
                  <span className="text-slate-500 block">Prenume:</span>
                  {renderFieldValue(record.firstName)}
                </div>
                <div>
                  <span className="text-slate-500 block">Data Nașterii:</span>
                  {renderFieldValue(record.birthDate)}
                </div>
                <div>
                  <span className="text-slate-500 block">Data Decesului:</span>
                  {renderFieldValue(record.deathDate)}
                </div>
                <div>
                  <span className="text-slate-500 block">Gen / Sex:</span>
                  {renderFieldValue(record.gender)}
                </div>
                <div>
                  <span className="text-slate-500 block">Vârsta la Deces:</span>
                  {renderFieldValue(record.ageAtDeath ? `${record.ageAtDeath} ani` : 'N/A')}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 text-xs">
                <span className="text-slate-500 block">Profesie / Ocupație:</span>
                {renderFieldValue(record.profession)}
              </div>
            </div>

          </div>

          {/* Section 1: Zona Epitaf */}
          <div className="bg-amber-50/70 border border-amber-200/90 rounded-xl p-4">
            <h4 className="text-xs font-bold uppercase text-amber-900 tracking-wider mb-1 flex items-center space-x-1.5">
              <span>Epitaf / Versuri de pe Piatra Funerară</span>
            </h4>
            <p className="text-sm text-slate-800 italic font-serif leading-relaxed">
              {record.notes && record.notes !== 'N/A' ? (
                `"${record.notes}"`
              ) : (
                <span className="text-slate-400 not-italic font-sans text-xs">
                  Niciun epitaf înregistrat (N/A)
                </span>
              )}
            </p>
          </div>

          {/* Section 2: Informații despre persoană */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h4 className="text-xs font-bold uppercase text-slate-800 tracking-wider mb-1">
              Informații Despre Persoană / Detalii Biografice
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed">
              {record.biography && record.biography !== 'N/A' ? (
                record.biography
              ) : record.profession && record.profession !== 'N/A' ? (
                `Profesie / Titlu: ${record.profession}`
              ) : (
                <span className="text-slate-400 text-xs">
                  Nu sunt înregistrate informații suplimentare despre această persoană (N/A).
                </span>
              )}
            </p>
          </div>

          {/* Homage & Candle Lighting Area */}
          <div className="bg-slate-900 text-white rounded-xl p-5 shadow-inner print:hidden space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Flame className="w-6 h-6 animate-pulse fill-amber-400" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-white">
                    Omagiu Virtual: {record.candlesLit} Lumânări Aprinse
                  </h4>
                  <p className="text-xs text-slate-400">
                    Păstrează amintirea vie prin aprinderea unei lumânări virtuale
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onLightCandle(record.id)}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
                >
                  <Flame className="w-4 h-4 fill-white" />
                  <span>Aprinde o Lumânare</span>
                </button>

                <button
                  onClick={() => setShowTributeForm(!showTributeForm)}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 inline mr-1" />
                  Scrie un Mesaj
                </button>
              </div>
            </div>

            {/* Tribute message form */}
            {showTributeForm && (
              <form onSubmit={handleSubmitTribute} className="bg-slate-800 p-4 rounded-lg border border-slate-700 space-y-3">
                <h5 className="text-xs font-bold text-amber-300">Lasă un mesaj de condoleanțe / neuitare</h5>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Numele tău (opțional)"
                  className="w-full text-xs p-2 rounded bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                />
                <textarea
                  value={tributeText}
                  onChange={(e) => setTributeText(e.target.value)}
                  placeholder="Scrie un gând de neuitare sau o rugăciune..."
                  rows={2}
                  required
                  className="w-full text-xs p-2 rounded bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                />
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowTributeForm(false)}
                    className="px-3 py-1 text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    Anulează
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-medium flex items-center space-x-1 cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>Trimite Mesajul</span>
                  </button>
                </div>
              </form>
            )}

            {/* List of tributes */}
            {record.tributeMessages && record.tributeMessages.length > 0 && (
              <div className="space-y-2 pt-1 max-h-48 overflow-y-auto pr-1">
                <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Mesaje înregistrate ({record.tributeMessages.length})
                </h5>
                {record.tributeMessages.map((t) => (
                  <div key={t.id} className="bg-slate-800/80 p-3 rounded border border-slate-700/60 text-xs">
                    <div className="flex justify-between items-center text-slate-400 text-[11px] mb-1">
                      <span className="font-semibold text-amber-300">{t.author}</span>
                      <span>{t.date}</span>
                    </div>
                    <p className="text-slate-200 italic font-serif">"{t.message}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer actions */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 print:hidden">
          <div className="flex flex-wrap items-center gap-2">
            {/* 1. Edit / Modify action:
                - Admin: Editează Înregistrarea
                - Operator: Propune Modificări (Aprobare Admin)
                - Unauthenticated: Autentificare pentru Editare
            */}
            {isAdmin && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(record);
                }}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs flex items-center space-x-1.5 cursor-pointer"
                title="Editează înregistrarea (Administrator)"
              >
                <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                <span>Editează Înregistrarea</span>
              </button>
            )}

            {isOperator && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(record);
                }}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors shadow-2xs flex items-center space-x-1.5 cursor-pointer"
                title="Propune modificări pentru această persoană (trimis spre aprobare administrator)"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                <span>Propune Modificări (Aprobare Admin)</span>
              </button>
            )}

            {!isAdmin && !isOperator && (
              <button
                onClick={() => {
                  if (onRequireAuth) {
                    onRequireAuth();
                  } else {
                    onClose();
                    onEdit(record);
                  }
                }}
                className="px-3.5 py-2 text-xs font-medium rounded-lg bg-slate-200/80 text-slate-600 border border-slate-300 hover:bg-slate-200 transition-colors flex items-center space-x-1.5 cursor-pointer"
                title="Autentificare necesară pentru modificări"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Autentificare pentru Editare</span>
              </button>
            )}

            {/* 2. Delete action: STRICTLY for Administrator!
                Operators cannot delete records!
            */}
            {isAdmin && onDelete && (
              <button
                onClick={() => {
                  onClose();
                  onDelete(record.id);
                }}
                className="px-3 py-2 text-xs font-semibold rounded-lg bg-white text-red-600 border border-red-200 hover:bg-red-50 transition-colors shadow-2xs flex items-center space-x-1.5 cursor-pointer"
                title="Șterge definitiv înregistrarea (Doar Administrator)"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                <span>Șterge Înregistrarea</span>
              </button>
            )}

            <button
              onClick={() => setShowShareModal(true)}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white shadow-2xs transition-colors flex items-center space-x-1.5 cursor-pointer"
              title="Opțiuni distribuire terțe persoane sau print"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Distribuie Card</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer"
          >
            Închide
          </button>
        </div>

      </div>

      {/* LIGHTBOX PREVIEW MODAL */}
      {previewImage && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full flex flex-col items-center">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white bg-slate-800/80 rounded-full cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={previewImage.url} 
              alt={previewImage.title}
              className="max-h-[80vh] w-auto max-w-full rounded-lg object-contain border border-slate-700 shadow-2xl"
            />
            <p className="mt-3 text-sm text-slate-300 font-medium font-serif bg-slate-900/80 px-4 py-1.5 rounded-full border border-slate-800">
              {previewImage.title}
            </p>
          </div>
        </div>
      )}

      {/* SHARE MODAL / DIALOG */}
      {showShareModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Share2 className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base font-serif">Distribuie Fișa Decedat</h3>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-600">
                Alege modul în care dorești să trimiți informațiile despre <strong>{record.lastName} {record.firstName}</strong> către terțe persoane:
              </p>

              <div className="space-y-2">
                {/* Option 1: WhatsApp */}
                <button
                  onClick={handleWhatsAppShare}
                  className="w-full p-3 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-900 flex items-center justify-between text-xs font-semibold transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
                      <Send className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-slate-900">Distribuie pe WhatsApp</div>
                      <div className="text-[11px] text-emerald-800 font-normal">Trimite rezumatul fișei direct pe chat</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono bg-emerald-200 px-2 py-0.5 rounded text-emerald-900">WhatsApp</span>
                </button>

                {/* Option 2: Copy Summary Text */}
                <button
                  onClick={handleCopyText}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 flex items-center justify-between text-xs font-semibold transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="p-1.5 bg-amber-600 text-white rounded-lg">
                      {copiedText ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-slate-900">Copiază Date Fișă (Text Formatat)</div>
                      <div className="text-[11px] text-slate-500 font-normal">Ideal pentru e-mail, documente sau SMS</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono bg-slate-200 px-2 py-0.5 rounded text-slate-700">
                    {copiedText ? 'Copiat ✓' : 'Copiază'}
                  </span>
                </button>

                {/* Option 3: Copy Page Link */}
                <button
                  onClick={handleCopyLink}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 flex items-center justify-between text-xs font-semibold transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="p-1.5 bg-slate-800 text-white rounded-lg">
                      {copiedLink ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-slate-900">Copiază Linkul Aplicației</div>
                      <div className="text-[11px] text-slate-500 font-normal">Copiază adresa URL curentă</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono bg-slate-200 px-2 py-0.5 rounded text-slate-700">
                    {copiedLink ? 'Copiat ✓' : 'Link'}
                  </span>
                </button>

                {/* Option 4: Email */}
                <button
                  onClick={handleEmailShare}
                  className="w-full p-3 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-900 flex items-center justify-between text-xs font-semibold transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="p-1.5 bg-blue-600 text-white rounded-lg">
                      <Send className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-slate-900">Trimite prin Email</div>
                      <div className="text-[11px] text-blue-800 font-normal">Deschide clientul de email prestabilit</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono bg-blue-200 px-2 py-0.5 rounded text-blue-900">Email</span>
                </button>

                {/* Option 5: Print PDF */}
                <button
                  onClick={() => {
                    setShowShareModal(false);
                    handlePrint();
                  }}
                  className="w-full p-3 rounded-xl border border-slate-300 bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-between text-xs font-semibold transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="p-1.5 bg-amber-500 text-slate-900 rounded-lg">
                      <Printer className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-white">Zona de Print / Salvează ca PDF</div>
                      <div className="text-[11px] text-slate-300 font-normal">Generează un document de tipărit</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono bg-slate-800 px-2 py-0.5 rounded text-amber-300">Print</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-50 p-3 border-t border-slate-200 text-right">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-1.5 text-xs bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium rounded-lg cursor-pointer"
              >
                Închide Finisat
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
