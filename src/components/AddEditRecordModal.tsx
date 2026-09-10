import React, { useState, useEffect } from 'react';
import { DeceasedRecord, UserAccount } from '../types/cemetery';
import { sanitizeFieldValue } from '../utils/excelParser';
import { X, Save, Church, User, Upload, Trash2, Link as LinkIcon, Send, ShieldCheck, AlertCircle } from 'lucide-react';

interface AddEditRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: DeceasedRecord) => void;
  initialRecord: DeceasedRecord | null;
  existingCemeteries: string[];
  existingCounties: string[];
  currentUser?: UserAccount | null;
}

export const AddEditRecordModal: React.FC<AddEditRecordModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialRecord,
  existingCemeteries,
  existingCounties,
  currentUser
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    maidenName: '',
    gender: 'Nespecificat',
    birthDate: '',
    deathDate: '',
    ageAtDeath: '',
    cemeteryName: '',
    county: '',
    city: '',
    sector: '',
    plot: '',
    graveNumber: '',
    religion: 'N/A',
    profession: '',
    notes: '',
    biography: '',
    concessionHolder: '',
    graveStatus: 'îngrijit',
    photoUrl: '',
    deceasedPhotoUrl: ''
  });

  useEffect(() => {
    if (initialRecord) {
      const full = [initialRecord.lastName, initialRecord.firstName]
        .filter(v => v && v !== 'N/A')
        .join(' ');

      setFormData({
        fullName: full,
        maidenName: initialRecord.maidenName !== 'N/A' ? initialRecord.maidenName : '',
        gender: initialRecord.gender && initialRecord.gender !== 'N/A' ? initialRecord.gender : 'Nespecificat',
        birthDate: initialRecord.birthDate !== 'N/A' ? initialRecord.birthDate : '',
        deathDate: initialRecord.deathDate !== 'N/A' ? initialRecord.deathDate : '',
        ageAtDeath: initialRecord.ageAtDeath !== 'N/A' ? initialRecord.ageAtDeath : '',
        cemeteryName: initialRecord.cemeteryName !== 'N/A' ? initialRecord.cemeteryName : '',
        county: initialRecord.county !== 'N/A' ? initialRecord.county : '',
        city: initialRecord.city !== 'N/A' ? initialRecord.city : '',
        sector: initialRecord.sector !== 'N/A' ? initialRecord.sector : '',
        plot: initialRecord.plot !== 'N/A' ? initialRecord.plot : '',
        graveNumber: initialRecord.graveNumber !== 'N/A' ? initialRecord.graveNumber : '',
        religion: initialRecord.religion !== 'N/A' ? initialRecord.religion : 'N/A',
        profession: initialRecord.profession !== 'N/A' ? initialRecord.profession : '',
        notes: initialRecord.notes !== 'N/A' ? initialRecord.notes : '',
        biography: initialRecord.biography && initialRecord.biography !== 'N/A' ? initialRecord.biography : '',
        concessionHolder: initialRecord.concessionHolder !== 'N/A' ? initialRecord.concessionHolder : '',
        graveStatus: initialRecord.graveStatus && initialRecord.graveStatus !== 'N/A' ? initialRecord.graveStatus : 'îngrijit',
        photoUrl: initialRecord.photoUrl && initialRecord.photoUrl !== 'N/A' ? initialRecord.photoUrl : '',
        deceasedPhotoUrl: initialRecord.deceasedPhotoUrl && initialRecord.deceasedPhotoUrl !== 'N/A' ? initialRecord.deceasedPhotoUrl : ''
      });
    } else {
      setFormData({
        fullName: '',
        maidenName: '',
        gender: 'Nespecificat',
        birthDate: '',
        deathDate: '',
        ageAtDeath: '',
        cemeteryName: existingCemeteries[0] || '',
        county: existingCounties[0] || '',
        city: '',
        sector: '',
        plot: '',
        graveNumber: '',
        religion: 'N/A',
        profession: '',
        notes: '',
        biography: '',
        concessionHolder: '',
        graveStatus: 'îngrijit',
        photoUrl: '',
        deceasedPhotoUrl: ''
      });
    }
  }, [initialRecord, existingCemeteries, existingCounties, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'deceasedPhotoUrl' | 'photoUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('Fișierul selectat este prea mare. Te rugăm să alegi o imagine sub 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFormData(prev => ({
          ...prev,
          [fieldName]: event.target!.result as string
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const now = new Date().toISOString();

    const sanitizedFullName = sanitizeFieldValue(formData.fullName);
    let lastName = 'Nespecificat';
    let firstName = 'N/A';

    if (sanitizedFullName !== 'N/A' && sanitizedFullName.trim() !== '') {
      const parts = sanitizedFullName.trim().split(/\s+/);
      lastName = parts[0];
      firstName = parts.slice(1).join(' ') || 'N/A';
    }

    const newRecord: DeceasedRecord = {
      id: initialRecord ? initialRecord.id : `rec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      lastName,
      firstName,
      maidenName: sanitizeFieldValue(formData.maidenName),
      birthDate: sanitizeFieldValue(formData.birthDate),
      deathDate: sanitizeFieldValue(formData.deathDate),
      ageAtDeath: sanitizeFieldValue(formData.ageAtDeath),
      cemeteryName: sanitizeFieldValue(formData.cemeteryName),
      county: sanitizeFieldValue(formData.county),
      city: sanitizeFieldValue(formData.city),
      sector: sanitizeFieldValue(formData.sector),
      plot: sanitizeFieldValue(formData.plot),
      graveNumber: sanitizeFieldValue(formData.graveNumber),
      religion: sanitizeFieldValue(formData.religion),
      profession: sanitizeFieldValue(formData.profession),
      gender: sanitizeFieldValue(formData.gender),
      notes: sanitizeFieldValue(formData.notes),
      biography: sanitizeFieldValue(formData.biography),
      concessionHolder: sanitizeFieldValue(formData.concessionHolder),
      graveStatus: sanitizeFieldValue(formData.graveStatus),
      photoUrl: sanitizeFieldValue(formData.photoUrl),
      deceasedPhotoUrl: sanitizeFieldValue(formData.deceasedPhotoUrl),
      candlesLit: initialRecord?.candlesLit || 0,
      tributeMessages: initialRecord?.tributeMessages || [],
      createdAt: initialRecord?.createdAt || now,
      updatedAt: now
    };

    onSave(newRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <User className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold font-serif">
                {initialRecord ? 'Editează Înregistrare Decedat' : 'Adaugă Înregistrare Nouă'}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Câmpurile lăsate goale vor fi setate automat la "N/A"
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 min-w-[38px] min-h-[38px] flex items-center justify-center cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          
          {/* Operator Mode Notification Banner */}
          {currentUser?.role === 'editor' && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 text-xs text-amber-900 flex items-start space-x-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-950">
                  Mod Operator Date: Verificare & Aprobare Necesară
                </p>
                <p className="text-amber-800 text-[11px] mt-0.5">
                  Datele introduse vor fi transmise administratorului de sistem. După ce acesta le va verifica și accepta, persoana va fi adăugată automat în registrul public oficial.
                </p>
              </div>
            </div>
          )}

          {/* Section 1: Date Cimitir */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider border-b border-slate-200 pb-1">
              1. Date Cimitir
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nume Cimitir *
                </label>
                <input
                  type="text"
                  required
                  value={formData.cemeteryName}
                  onChange={(e) => setFormData({ ...formData, cemeteryName: e.target.value })}
                  placeholder="ex: Cimitirul Bellu"
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Localitate / Oraș
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="ex: Cluj-Napoca, București"
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Județ
                </label>
                <input
                  type="text"
                  value={formData.county}
                  onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                  placeholder="ex: Cluj, București, Iași"
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Date Decedat */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider border-b border-slate-200 pb-1">
              2. Date Decedat
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nume *
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="ex: Popescu Ion Vasile"
                className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nume naștere
                </label>
                <input
                  type="text"
                  value={formData.maidenName}
                  onChange={(e) => setFormData({ ...formData, maidenName: e.target.value })}
                  placeholder="ex: Ionescu"
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dată naștere
                </label>
                <input
                  type="text"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  placeholder="ex: 15.01.1940 sau 1940"
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dată deces
                </label>
                <input
                  type="text"
                  value={formData.deathDate}
                  onChange={(e) => setFormData({ ...formData, deathDate: e.target.value })}
                  placeholder="ex: 20.08.2015 sau 2015"
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none font-sans"
                />
              </div>
            </div>

            {/* Figură, Loc & Stare Mormânt */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Figură
                </label>
                <input
                  type="text"
                  value={formData.plot}
                  onChange={(e) => setFormData({ ...formData, plot: e.target.value })}
                  placeholder="ex: Fig. 2 / Parcela 9"
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Loc
                </label>
                <input
                  type="text"
                  value={formData.graveNumber}
                  onChange={(e) => setFormData({ ...formData, graveNumber: e.target.value })}
                  placeholder="ex: Loc 45 / M-12"
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Stare Mormânt
                </label>
                <select
                  value={formData.graveStatus}
                  onChange={(e) => setFormData({ ...formData, graveStatus: e.target.value })}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none font-sans cursor-pointer"
                >
                  <option value="îngrijit">îngrijit</option>
                  <option value="în conservare">în conservare</option>
                  <option value="dispărut">dispărut</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gen
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none font-sans cursor-pointer"
                >
                  <option value="Nespecificat">Nespecificat / Necunoscut</option>
                  <option value="Masculin">Masculin</option>
                  <option value="Feminin">Feminin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vârstă
                </label>
                <input
                  type="text"
                  value={formData.ageAtDeath}
                  onChange={(e) => setFormData({ ...formData, ageAtDeath: e.target.value })}
                  placeholder="ex: 75"
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Profesie
                </label>
                <input
                  type="text"
                  value={formData.profession}
                  onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                  placeholder="ex: Învățător, Medic, Scriitor, Inginer"
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Epitaf și Informații Despre Persoană */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider border-b border-slate-200 pb-1">
              3. Epitaf & Informații despre Persoană
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Epitaf / Versuri Piatră Funerară
              </label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="ex: Versuri, citate sau epitafe gravate pe piatra funerară..."
                className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Informații despre persoană / Detalii Biografice
              </label>
              <textarea
                rows={2}
                value={formData.biography}
                onChange={(e) => setFormData({ ...formData, biography: e.target.value })}
                placeholder="ex: Scurtă descriere a vieții, realizărilor sau contextului personal..."
                className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none font-sans"
              />
            </div>
          </div>

          {/* Section 4: Fotografii */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider border-b border-slate-200 pb-1 flex items-center justify-between">
              <span>4. Fotografii (Decedat & Mormânt)</span>
              <span className="text-[10px] font-normal text-slate-500 lowercase">
                încarcă imagini din calculator (JPG, PNG)
              </span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Box 1: Poză Decedat */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between">
                <label className="block text-xs font-bold text-slate-800 mb-2 flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 text-amber-700" />
                  <span>Poză Decedat (Portret)</span>
                </label>

                {formData.deceasedPhotoUrl && formData.deceasedPhotoUrl !== 'N/A' && formData.deceasedPhotoUrl.trim() !== '' ? (
                  <div className="relative group rounded-lg overflow-hidden border border-slate-300 bg-slate-200 h-36 flex items-center justify-center mb-2">
                    <img 
                      src={formData.deceasedPhotoUrl} 
                      alt="Previzualizare Decedat" 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, deceasedPhotoUrl: '' })}
                      className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow cursor-pointer transition-transform hover:scale-110"
                      title="Șterge imaginea"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 bg-white flex flex-col items-center justify-center text-center hover:bg-amber-50/50 hover:border-amber-400 transition-colors mb-2">
                    <Upload className="w-6 h-6 text-amber-600 mb-1" />
                    <p className="text-xs font-semibold text-slate-700">Alege poză din calculator</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Format: JPG, PNG, WEBP (Max 8MB)</p>
                    <label className="mt-2.5 px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-2xs">
                      Încarcă din Calculator
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleFileUpload(e, 'deceasedPhotoUrl')}
                        className="hidden" 
                      />
                    </label>
                  </div>
                )}

                <div className="mt-1 pt-2 border-t border-slate-200/80">
                  <details className="text-[11px] text-slate-500">
                    <summary className="cursor-pointer hover:text-amber-800 font-medium flex items-center space-x-1">
                      <LinkIcon className="w-3 h-3 inline" />
                      <span>sau introdu link (URL) extern</span>
                    </summary>
                    <input
                      type="url"
                      value={formData.deceasedPhotoUrl}
                      onChange={(e) => setFormData({ ...formData, deceasedPhotoUrl: e.target.value })}
                      placeholder="https://... (URL imagine)"
                      className="w-full text-[11px] p-1.5 mt-1 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-amber-500 focus:outline-none font-mono"
                    />
                  </details>
                </div>
              </div>

              {/* Box 2: Poză Mormânt */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between">
                <label className="block text-xs font-bold text-slate-800 mb-2 flex items-center space-x-1.5">
                  <Church className="w-3.5 h-3.5 text-amber-700" />
                  <span>Poză Mormânt / Monument</span>
                </label>

                {formData.photoUrl && formData.photoUrl !== 'N/A' && formData.photoUrl.trim() !== '' ? (
                  <div className="relative group rounded-lg overflow-hidden border border-slate-300 bg-slate-200 h-36 flex items-center justify-center mb-2">
                    <img 
                      src={formData.photoUrl} 
                      alt="Previzualizare Mormânt" 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, photoUrl: '' })}
                      className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow cursor-pointer transition-transform hover:scale-110"
                      title="Șterge imaginea"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 bg-white flex flex-col items-center justify-center text-center hover:bg-amber-50/50 hover:border-amber-400 transition-colors mb-2">
                    <Upload className="w-6 h-6 text-amber-600 mb-1" />
                    <p className="text-xs font-semibold text-slate-700">Alege poză din calculator</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Format: JPG, PNG, WEBP (Max 8MB)</p>
                    <label className="mt-2.5 px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-2xs">
                      Încarcă din Calculator
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleFileUpload(e, 'photoUrl')}
                        className="hidden" 
                      />
                    </label>
                  </div>
                )}

                <div className="mt-1 pt-2 border-t border-slate-200/80">
                  <details className="text-[11px] text-slate-500">
                    <summary className="cursor-pointer hover:text-amber-800 font-medium flex items-center space-x-1">
                      <LinkIcon className="w-3 h-3 inline" />
                      <span>sau introdu link (URL) extern</span>
                    </summary>
                    <input
                      type="url"
                      value={formData.photoUrl}
                      onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                      placeholder="https://... (URL imagine)"
                      className="w-full text-[11px] p-1.5 mt-1 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-amber-500 focus:outline-none font-mono"
                    />
                  </details>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 mt-2 border-t border-slate-200 flex items-center justify-end space-x-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs text-slate-600 hover:text-slate-900 rounded-lg font-medium min-h-[42px] cursor-pointer"
            >
              Anulează
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 font-bold text-xs rounded-lg shadow-md flex items-center space-x-1.5 min-h-[42px] cursor-pointer transition-colors text-white ${
                currentUser?.role === 'editor'
                  ? 'bg-amber-600 hover:bg-amber-500 ring-2 ring-amber-400/30'
                  : 'bg-emerald-700 hover:bg-emerald-600'
              }`}
            >
              {currentUser?.role === 'editor' ? (
                <>
                  <Send className="w-4 h-4" />
                  <span>Trimite spre Aprobare Administrator</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{initialRecord ? 'Salvează Modificările' : 'Adaugă Înregistrarea'}</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
