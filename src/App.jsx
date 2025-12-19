import { useEffect, useMemo, useState } from 'react';

// =====================
// KONFIGURATION
// =====================
const SITE = 'AG WS';

const BRUGERE = [
  { id: 'oliver', navn: 'Oliver', rolle: 'bpo', pinkode: '1111' },
  { id: 'emil', navn: 'Emil', rolle: 'bpo', pinkode: '2222' },
  { id: 'william', navn: 'William', rolle: 'bpo', pinkode: '3333' },
  { id: 'jon', navn: 'Jon', rolle: 'logistikchef', pinkode: '9999' },
  { id: 'martin', navn: 'Martin', rolle: 'koordinator', pinkode: '4444' },
  { id: 'catharina', navn: 'Catharina', rolle: 'koordinator', pinkode: '5555' },
];

const ÅBNINGSOPGAVER = [
  'Åbne arbejdstilladelse – husk sikkerhedskort',
  'Tjek SiteHub-hegn',
  'Registrér leverancer i Sitebooking',
  'Rens skærm til fotogenkendelse',
  'Billede af følgeseddel',
];

const LUKKEOPGAVER = [
  'Tjek cigaretskodder',
  'Rens måtter',
  'Oprydning',
  'Luk porte og hegn',
  'Plads lukket korrekt',
];

const STORAGE_KEY = 'sitehub_bpo_tailwind_v1';

// =====================
// HJÆLPERE
// =====================
const dagsDato = () => new Date().toISOString().slice(0, 10);
const nuTid = () => new Date().toISOString();
const uid = () => Math.random().toString(36).slice(2, 10);

function nyDag() {
  return {
    site: SITE,
    dato: dagsDato(),
    godkendt: false,
    godkendtAf: null,
    lukkevagt: null,
    opgaver: [
      ...ÅBNINGSOPGAVER.map(t => ({ id: uid(), tekst: t, kategori: 'Åbning', udført: false, udførtAf: [], tidspunkt: null })),
      ...LUKKEOPGAVER.map(t => ({ id: uid(), tekst: t, kategori: 'Lukkevagt', udført: false, udførtAf: [], tidspunkt: null })),
    ],
  };
}

// =====================
// APP
// =====================
export default function App() {
  const [brugerId, setBrugerId] = useState('');
  const [pinkode, setPinkode] = useState('');
  const [bruger, setBruger] = useState(null);
  const [loginFejl, setLoginFejl] = useState('');
  const [dag, setDag] = useState(null);
  const [adhocTekst, setAdhocTekst] = useState('');

  useEffect(() => {
    try {
      const gemt = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!gemt || gemt.dato !== dagsDato()) throw new Error();
      setDag(gemt);
    } catch {
      const frisk = nyDag();
      setDag(frisk);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(frisk));
    }
  }, []);

  useEffect(() => {
    if (dag) localStorage.setItem(STORAGE_KEY, JSON.stringify(dag));
  }, [dag]);

  function logInd() {
    const fundet = BRUGERE.find(b => b.id === brugerId && b.pinkode === pinkode);
    if (!fundet) {
      setLoginFejl('Forkert bruger eller pinkode');
      return;
    }
    setBruger(fundet);
    setPinkode('');
    setLoginFejl('');
  }

  function logUd() {
    setBruger(null);
    setBrugerId('');
    setPinkode('');
  }

  function udførOpgave(id) {
    if (!bruger || bruger.rolle !== 'bpo' || dag.godkendt) return;

    setDag(prev => ({
      ...prev,
      opgaver: prev.opgaver.map(o => {
        if (o.id !== id || o.udført) return o;
        if (o.kategori === 'Lukkevagt' && prev.lukkevagt && prev.lukkevagt !== bruger.navn) return o;
        return { ...o, udført: true, tidspunkt: nuTid(), udførtAf: [{ navn: bruger.navn, tid: nuTid() }] };
      }),
      lukkevagt: prev.lukkevagt || (prev.opgaver.find(o => o.id === id)?.kategori === 'Lukkevagt' ? bruger.navn : prev.lukkevagt),
    }));
  }

  function tilføjAdhoc() {
    if (!adhocTekst.trim() || !bruger || bruger.rolle !== 'bpo') return;
    setDag(prev => ({
      ...prev,
      opgaver: [...prev.opgaver, { id: uid(), tekst: adhocTekst, kategori: 'AD HOC', udført: false, udførtAf: [], tidspunkt: null }],
    }));
    setAdhocTekst('');
  }

  const alleUdført = useMemo(() => dag?.opgaver.every(o => o.udført), [dag]);

  function godkendDag() {
    if (bruger?.rolle !== 'logistikchef' || !alleUdført) return;
    setDag(prev => ({ ...prev, godkendt: true, godkendtAf: { navn: bruger.navn, tid: nuTid() } }));
  }

  if (!dag) return null;

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-6">
      <div className="max-w-xl mx-auto space-y-4">
        <header className="bg-white rounded-xl p-4 shadow">
          <h1 className="text-xl font-bold">SiteHub BPO – {SITE}</h1>
          <p className="text-sm text-gray-500">Dato: {dag.dato}</p>
          {bruger && <p className="mt-1 text-sm">Logget ind: <strong>{bruger.navn}</strong> ({bruger.rolle})</p>}
        </header>

        {!bruger && (
          <section className="bg-white rounded-xl p-4 shadow space-y-3">
            <h2 className="font-semibold">Log ind</h2>
            <select className="w-full p-3 rounded-lg border" value={brugerId} onChange={e => setBrugerId(e.target.value)}>
              <option value="">Vælg bruger</option>
              {BRUGERE.map(b => <option key={b.id} value={b.id}>{b.navn} ({b.rolle})</option>)}
            </select>
            <input type="password" className="w-full p-3 rounded-lg border" placeholder="Pinkode" value={pinkode} onChange={e => setPinkode(e.target.value)} />
            <button onClick={logInd} className="w-full py-3 rounded-lg bg-black text-white">Log ind</button>
            {loginFejl && <p className="text-red-600 text-sm">{loginFejl}</p>}
          </section>
        )}

        {bruger && (
          <button onClick={logUd} className="text-sm underline">Log ud</button>
        )}

        {dag.opgaver.map(o => (
          <div key={o.id} className={`rounded-xl p-4 shadow bg-white ${o.udført ? 'opacity-70' : ''}`}>
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-semibold uppercase text-blue-600">{o.kategori}</span>
                <p className="font-medium">{o.tekst}</p>
              </div>
              {bruger?.rolle === 'bpo' && !o.udført && (
                <button onClick={() => udførOpgave(o.id)} className="px-4 py-2 bg-green-600 text-white rounded-lg">Udført</button>
              )}
            </div>
            {o.tidspunkt && (
              <p className="text-xs text-gray-500 mt-2">Udført af {o.udførtAf[0]?.navn} kl. {new Date(o.tidspunkt).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}</p>
            )}
          </div>
        ))}

        {bruger?.rolle === 'bpo' && (
          <section className="bg-white rounded-xl p-4 shadow space-y-2">
            <h3 className="font-semibold">AD HOC-opgave</h3>
            <input value={adhocTekst} onChange={e => setAdhocTekst(e.target.value)} className="w-full p-3 rounded-lg border" placeholder="Skriv opgave…" />
            <button onClick={tilføjAdhoc} className="w-full py-3 bg-blue-600 text-white rounded-lg">Tilføj</button>
          </section>
        )}

        {bruger?.rolle === 'logistikchef' && !dag.godkendt && (
          <button onClick={godkendDag} disabled={!alleUdført} className="w-full py-4 bg-emerald-700 text-white rounded-xl disabled:opacity-50">Godkend dagen</button>
        )}

        {dag.godkendt && (
          <div className="bg-emerald-100 p-4 rounded-xl text-sm">
            Dagen er godkendt af {dag.godkendtAf?.navn}
          </div>
        )}
      </div>
    </div>
  );
}