import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { DeceasedRecord, ExcelColumnMapping } from '../types/cemetery';

// Function to clean raw cell values; converts empty/null/undefined/blank/dash to "N/A"
export function sanitizeFieldValue(val: any): string {
  if (val === null || val === undefined) return 'N/A';
  const str = String(val).trim();
  if (
    str === '' ||
    str === '-' ||
    str === '?' ||
    str.toLowerCase() === 'null' ||
    str.toLowerCase() === 'undefined' ||
    str.toLowerCase() === 'none' ||
    str.toLowerCase() === 'n/a' ||
    str.toLowerCase() === 'nan'
  ) {
    return 'N/A';
  }
  return str;
}

// Auto-guess initial mapping based on header strings
export function guessColumnMapping(headers: string[]): ExcelColumnMapping {
  const mapping: ExcelColumnMapping = {
    fullName: '',
    lastName: '',
    firstName: '',
    maidenName: '',
    birthDate: '',
    deathDate: '',
    ageAtDeath: '',
    cemeteryName: '',
    county: '',
    city: '',
    sector: '',
    plot: '',
    graveNumber: '',
    religion: '',
    profession: '',
    gender: '',
    notes: '',
    concessionHolder: '',
    graveStatus: ''
  };

  const clean = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  headers.forEach((header) => {
    const h = clean(header);

    if (!mapping.fullName && (
      h.includes('nume & prenume') ||
      h.includes('nume si prenume') ||
      h.includes('nume si prenume') ||
      h.includes('nume/prenume') ||
      h.includes('nume complet') ||
      h.includes('nume decedat') ||
      h.includes('nume persoana') ||
      h.includes('persoana decedata') ||
      h.includes('nume de familie') ||
      h === 'nume' ||
      h === 'nume & prenume' ||
      h === 'nume si prenume' ||
      h.includes('persoana') ||
      h.includes('decedat') ||
      h.includes('surname') ||
      h.includes('full name') ||
      h.includes('fullname')
    )) {
      mapping.fullName = header;
      mapping.lastName = header;
    } else if (!mapping.firstName && (
      h.includes('prenume') || 
      h.includes('first name') || 
      h.includes('given name')
    )) {
      mapping.firstName = header;
    } else if (!mapping.maidenName && (
      h.includes('fata') || 
      h.includes('anterior') || 
      h.includes('maiden') || 
      (h.includes('nastere') && h.includes('nume'))
    )) {
      mapping.maidenName = header;
    } else if (!mapping.birthDate && (
      h.includes('nastere') || 
      h.includes('birth') || 
      h === 'dob' || 
      h.includes('data nast')
    )) {
      mapping.birthDate = header;
    } else if (!mapping.deathDate && (
      h.includes('deces') || 
      h.includes('death') || 
      h === 'dod' || 
      h.includes('data dec')
    )) {
      mapping.deathDate = header;
    } else if (!mapping.ageAtDeath && (
      h.includes('varsta') || 
      h.includes('varsta') || 
      h.includes('age')
    )) {
      mapping.ageAtDeath = header;
    } else if (!mapping.cemeteryName && (
      h.includes('cimitir') || 
      h.includes('cemetery')
    )) {
      mapping.cemeteryName = header;
    } else if (!mapping.county && (
      h.includes('judet') || 
      h.includes('county')
    )) {
      mapping.county = header;
    } else if (!mapping.city && (
      h.includes('localitate') || 
      h.includes('oras') || 
      h.includes('city') || 
      h.includes('town')
    )) {
      mapping.city = header;
    } else if (!mapping.sector && (
      h.includes('sector') || 
      h.includes('alee') || 
      h.includes('zona')
    )) {
      mapping.sector = header;
    } else if (!mapping.plot && (
      h.includes('parcela') || 
      h.includes('plot') || 
      h.includes('baza')
    )) {
      mapping.plot = header;
    } else if (!mapping.graveNumber && (
      h.includes('mormant') || 
      h.includes('cripta') || 
      h.includes('numar') || 
      h.includes('grave') || 
      h === 'loc' || 
      h.includes('numar loc')
    )) {
      mapping.graveNumber = header;
    } else if (!mapping.religion && (
      h.includes('religie') || 
      h.includes('confesiune') || 
      h.includes('religion')
    )) {
      mapping.religion = header;
    } else if (!mapping.profession && (
      h.includes('profesie') || 
      h.includes('ocupatie') || 
      h.includes('titlu') || 
      h.includes('profession') || 
      h.includes('functie')
    )) {
      mapping.profession = header;
    } else if (!mapping.gender && (
      h === 'gen' || 
      h === 'sex' || 
      h.includes('gender') || 
      h.includes('gen/sex')
    )) {
      mapping.gender = header;
    } else if (!mapping.notes && (
      h.includes('observatii') || 
      h.includes('epitaff') || 
      h.includes('epitaf') || 
      h.includes('biografie') || 
      h.includes('note') || 
      h.includes('notes')
    )) {
      mapping.notes = header;
    } else if (!mapping.concessionHolder && (
      h.includes('detinator') || 
      h.includes('concesionar') || 
      h.includes('holder') || 
      h.includes('proprietar') || 
      h.includes('titular')
    )) {
      mapping.concessionHolder = header;
    } else if (!mapping.graveStatus && (
      h.includes('stare') || 
      h.includes('status')
    )) {
      mapping.graveStatus = header;
    }
  });

  return mapping;
}

// Convert parsed raw rows using column mapping into formal DeceasedRecord items
export function convertRowsToRecords(
  rows: Record<string, any>[],
  mapping: ExcelColumnMapping,
  defaultCounty: string = 'N/A',
  defaultCity: string = 'N/A',
  defaultCemetery: string = 'N/A'
): DeceasedRecord[] {
  const nowStr = new Date().toISOString();

  return rows.map((row, index) => {
    const getVal = (colKey: keyof ExcelColumnMapping) => {
      const headerName = mapping[colKey];
      if (!headerName || !(headerName in row)) return 'N/A';
      return sanitizeFieldValue(row[headerName]);
    };

    let fullName = getVal('fullName');
    let lastName = 'N/A';
    let firstName = 'N/A';

    if (fullName !== 'N/A' && fullName.trim() !== '') {
      // Check comma separated: "Popescu, Ion"
      if (fullName.includes(',')) {
        const parts = fullName.split(',').map((p) => p.trim());
        lastName = parts[0] || 'N/A';
        firstName = parts.slice(1).join(' ').trim() || 'N/A';
      } else {
        const parts = fullName.trim().split(/\s+/);
        if (parts.length > 1) {
          lastName = parts[0];
          firstName = parts.slice(1).join(' ');
        } else if (parts.length === 1) {
          lastName = parts[0];
          firstName = 'N/A';
        }
      }
    } else {
      lastName = getVal('lastName');
      firstName = getVal('firstName');
    }

    // If firstName is still N/A, automatically detect if the raw row has a separate 'prenume' column
    if (firstName === 'N/A') {
      const prenumeKey = Object.keys(row).find((k) => {
        const ck = k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        return ck === 'prenume' || ck.includes('first name') || ck.includes('given name');
      });
      if (prenumeKey && row[prenumeKey]) {
        const pVal = sanitizeFieldValue(row[prenumeKey]);
        if (pVal !== 'N/A') {
          firstName = pVal;
        }
      }
    }

    // Fallbacks if cemetery info is missing in row but provided as default
    let county = getVal('county');
    if (county === 'N/A' && defaultCounty !== 'N/A' && defaultCounty.trim() !== '') county = defaultCounty;

    let city = getVal('city');
    if (city === 'N/A' && defaultCity !== 'N/A' && defaultCity.trim() !== '') city = defaultCity;

    let cemeteryName = getVal('cemeteryName');
    if (cemeteryName === 'N/A' && defaultCemetery !== 'N/A' && defaultCemetery.trim() !== '') cemeteryName = defaultCemetery;

    return {
      id: `imp-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
      lastName: lastName !== 'N/A' ? lastName : `Nespecificat #${index + 1}`,
      firstName: firstName,
      maidenName: getVal('maidenName'),
      birthDate: getVal('birthDate'),
      deathDate: getVal('deathDate'),
      ageAtDeath: getVal('ageAtDeath'),
      cemeteryName,
      county,
      city,
      sector: getVal('sector'),
      plot: getVal('plot'),
      graveNumber: getVal('graveNumber'),
      religion: getVal('religion'),
      profession: getVal('profession'),
      gender: getVal('gender'),
      notes: getVal('notes'),
      concessionHolder: getVal('concessionHolder'),
      graveStatus: getVal('graveStatus'),
      photoUrl: 'N/A',
      candlesLit: 0,
      tributeMessages: [],
      createdAt: nowStr,
      updatedAt: nowStr
    };
  });
}

// Parse Excel (.xlsx, .xls) and CSV (.csv, .tsv) files from user computer
export function parseExcelOrCSVFile(
  file: File,
  onSuccess: (headers: string[], rows: Record<string, any>[]) => void,
  onError: (errorMsg: string) => void
) {
  const fileName = file.name.toLowerCase();

  // If CSV / TSV / TXT file, try PapaParse first, fallback to XLSX
  if (fileName.endsWith('.csv') || fileName.endsWith('.tsv') || fileName.endsWith('.txt')) {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          const rows = results.data as Record<string, any>[];
          const headers = results.meta.fields || Object.keys(rows[0] || {});
          
          if (headers.length > 0) {
            const sanitizedRows = rows.map(r => {
              const cleanObj: Record<string, any> = {};
              headers.forEach(h => {
                cleanObj[h] = sanitizeFieldValue(r[h]);
              });
              return cleanObj;
            });
            onSuccess(headers, sanitizedRows);
            return;
          }
        }
        readWithXLSX(file, onSuccess, onError);
      },
      error: () => {
        readWithXLSX(file, onSuccess, onError);
      }
    });
  } else {
    readWithXLSX(file, onSuccess, onError);
  }
}

// Backward compatibility alias for parseCSVFile
export const parseCSVFile = parseExcelOrCSVFile;

function readWithXLSX(
  file: File,
  onSuccess: (headers: string[], rows: Record<string, any>[]) => void,
  onError: (errorMsg: string) => void
) {
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array', cellDates: true, dateNF: 'yyyy-mm-dd' });

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        onError('Fișierul nu conține nicio foaie de calcul (sheet) validă.');
        return;
      }

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
        defval: 'N/A',
        raw: false
      });

      if (!rawRows || rawRows.length === 0) {
        onError('Fișierul încărcat nu conține rânduri de date sau este gol.');
        return;
      }

      const headersSet = new Set<string>();
      rawRows.forEach((row) => {
        Object.keys(row).forEach((k) => {
          if (k && !k.startsWith('__EMPTY')) {
            headersSet.add(k);
          }
        });
      });

      const headers = Array.from(headersSet);

      if (headers.length === 0) {
        onError('Nu s-au putut detecta antetele (coloanele) din fișierul Excel.');
        return;
      }

      const sanitizedRows = rawRows.map((r) => {
        const cleanObj: Record<string, any> = {};
        headers.forEach((h) => {
          cleanObj[h] = sanitizeFieldValue(r[h]);
        });
        return cleanObj;
      });

      onSuccess(headers, sanitizedRows);
    } catch (err: any) {
      onError(`A apărut o eroare la procesarea fișierului Excel: ${err?.message || 'Format necorespunzător'}`);
    }
  };

  reader.onerror = () => {
    onError('Eroare la citirea fișierului de pe disc.');
  };

  reader.readAsArrayBuffer(file);
}

// Export database records to Excel (.xlsx) or CSV
export function exportRecordsToExcel(records: DeceasedRecord[], filename: string = 'Registru_Cimitire_Romania.xlsx') {
  const exportData = records.map((r) => ({
    'Nume de Familie': r.lastName || '',
    'Prenume': r.firstName || '',
    'Nume Anterior / De Fată': r.maidenName || '',
    'Data Nașterii': r.birthDate || '',
    'Data Decesului': r.deathDate || '',
    'Vârsta': r.ageAtDeath || '',
    'Cimitir': r.cemeteryName || '',
    'Județ': r.county || '',
    'Localitate': r.city || '',
    'Sector / Alee': r.sector || '',
    'Parcelă': r.plot || '',
    'Număr Mormânt': r.graveNumber || '',
    'Religie': r.religion || '',
    'Profesie': r.profession || '',
    'Observații / Epitaff': r.notes || '',
    'Deținător / Concesionar': r.concessionHolder || '',
    'Stare Mormânt': r.graveStatus || '',
    'Lumânări Aprinse': r.candlesLit ?? 0
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Registru');
  const isCSV = filename.toLowerCase().endsWith('.csv');
  XLSX.writeFile(workbook, filename, isCSV ? { bookType: 'csv' } : { bookType: 'xlsx' });
}

export function exportRecordsToCSV(records: DeceasedRecord[], filename: string = 'Registru_Cimitire_Romania.csv') {
  const cleanName = filename.toLowerCase().endsWith('.csv') ? filename : `${filename}.csv`;
  exportRecordsToExcel(records, cleanName);
}

// Download a pre-formatted Excel (.xlsx) template
export function downloadSampleTemplate() {
  const sampleData = [
    {
      'Nume & Prenume': 'Popescu Ion',
      'Nume Anterior / De Fată': 'N/A',
      'Data Nașterii': '12.05.1945',
      'Data Decesului': '10.10.2018',
      'Gen': 'Masculin',
      'Vârsta': '73',
      'Cimitir': 'Cimitirul Bellu',
      'Județ': 'București',
      'Localitate': 'București',
      'Sector / Alee': 'Aleea Principală',
      'Parcelă': 'Parcela 12',
      'Număr Mormânt': '45',
      'Religie': 'Ortodox',
      'Profesie': 'Profesor',
      'Observații': 'In memoriam',
      'Deținător Loc': 'Popescu Maria',
      'Stare Mormânt': 'Îngrijit'
    },
    {
      'Nume & Prenume': 'Ionescu Elena',
      'Nume Anterior / De Fată': 'Gheorghiu',
      'Data Nașterii': '01.01.1950',
      'Data Decesului': '15.03.2021',
      'Gen': 'Feminin',
      'Vârsta': '71',
      'Cimitir': 'Cimitirul Eternitatea',
      'Județ': 'Iași',
      'Localitate': 'Iași',
      'Sector / Alee': 'N/A',
      'Parcelă': 'Parcela 4',
      'Număr Mormânt': '12B',
      'Religie': 'Ortodox',
      'Profesie': 'N/A',
      'Observații': 'N/A',
      'Deținător Loc': 'N/A',
      'Stare Mormânt': 'N/A'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Model Import');
  XLSX.writeFile(workbook, 'Model_Import_Cimitire.xlsx');
}
