import { CemeteryInfo, DeceasedRecord } from '../types/cemetery';

export const INITIAL_CEMETERIES: CemeteryInfo[] = [
  {
    id: 'bellu-bucuresti',
    name: 'Cimitirul Șerban Vodă (Bellu)',
    county: 'București',
    city: 'București',
    address: 'Calea Șerban Vodă nr. 249, Sector 4',
    totalGraves: 45000,
    religionMain: 'Ortodox / Multiconfesional',
    establishedYear: '1858',
    coordinates: { lat: 44.4045, lng: 26.0982 },
    description: 'Cel mai cunoscut și mai important cimitir din România, desemnat ansamblu monumental istoric.',
    photoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=800',
    mapUrl: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1200'
  },
  {
    id: 'hazsongard-cluj',
    name: 'Cimitirul Central (Házsongárd)',
    county: 'Cluj',
    city: 'Cluj-Napoca',
    address: 'Str. Avram Iancu nr. 26-28',
    totalGraves: 32000,
    religionMain: 'Multiconfesional',
    establishedYear: '1585',
    coordinates: { lat: 46.7621, lng: 23.5932 },
    description: 'Un panteon al Transilvaniei, funcțional neîrerupt din secolul al XVI-lea.',
    photoUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=800',
    mapUrl: 'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&q=80&w=1200'
  },
  {
    id: 'eternitatea-iasi',
    name: 'Cimitirul Eternitatea',
    county: 'Iași',
    city: 'Iași',
    address: 'Str. Eternitate nr. 121',
    totalGraves: 28000,
    religionMain: 'Ortodox',
    establishedYear: '1875',
    coordinates: { lat: 47.1654, lng: 27.6012 },
    description: 'Principalul cimitir istoric din Iași, adăpostind personalități ale culturii române.',
    photoUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'ronat-timisoara',
    name: 'Cimitirul Ronaț / Calea Lipovei',
    county: 'Timiș',
    city: 'Timișoara',
    address: 'Calea Lipovei nr. 89',
    totalGraves: 19500,
    religionMain: 'Ortodox / Catolic',
    establishedYear: '1890',
    coordinates: { lat: 45.7720, lng: 21.2389 },
    description: 'Cimitir reprezentativ pentru arhitectura funerară a Banatului.',
    photoUrl: 'https://images.unsplash.com/photo-1508873696983-2df515122519?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'central-brasov',
    name: 'Cimitirul Central Brașov',
    county: 'Brașov',
    city: 'Brașov',
    address: 'Str. Cimitirului nr. 2',
    totalGraves: 16000,
    religionMain: 'Ortodox / Evanghelic',
    establishedYear: '1830',
    coordinates: { lat: 45.6580, lng: 25.6012 },
    description: 'Cimitir amplasat la poalele Muntelui Tâmpa, cu o istorie de două secole.',
    photoUrl: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'sineasca-craiova',
    name: 'Cimitirul Sineasca',
    county: 'Dolj',
    city: 'Craiova',
    address: 'Str. Brestei nr. 140',
    totalGraves: 22000,
    religionMain: 'Ortodox',
    establishedYear: '1892',
    coordinates: { lat: 44.3211, lng: 23.7850 },
    description: 'Cimitirul istoric al Olteniei cu monumente de artă funerară.',
    photoUrl: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'municipal-constanta',
    name: 'Cimitirul Central Constanța',
    county: 'Constanța',
    city: 'Constanța',
    address: 'Str. Bărăganului nr. 1',
    totalGraves: 25000,
    religionMain: 'Multiconfesional',
    establishedYear: '1895',
    coordinates: { lat: 44.1801, lng: 28.6310 },
    description: 'Baza de date și ansamblu funerar din Dobrogea.',
    photoUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'sfanta-vineri-bucuresti',
    name: 'Cimitirul Sfânta Vineri',
    county: 'București',
    city: 'București',
    address: 'Calea Griviței nr. 202, Sector 1',
    totalGraves: 18000,
    religionMain: 'Ortodox',
    establishedYear: '1871',
    coordinates: { lat: 44.4532, lng: 26.0691 },
    description: 'Unul dintre cele mai vechi cimitire din zona de nord a capitalei.',
    photoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=800'
  }
];

export const INITIAL_DECEASED_RECORDS: DeceasedRecord[] = [];
