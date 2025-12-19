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

const STORAGE_KEY = 'sitehub_bpo_modern_v1';

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
    const gemt = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!gemt || gemt.dato !== dagsDato()) {
      const frisk = nyDag();
      setDag(frisk);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(frisk));
    } else {
      setDag(gemt);
    }
  }, []);

  useEffect(() => {
    if (dag) localStorage.setItem(STORAGE_KEY, JSON.stringify(dag));
  }, [dag]);

  function logInd() {
    const fundet = BRUGERE.find(b => b.id === brugerId && b.pinkode === pinkode);
    if (!fundet) return setLoginFejl('Forkert bruger eller pinkode');
    setBruger(fundet);
    setLoginFejl('');
  }

  function udførOpgave(id) {
    if (!bruger || bruger.rolle !== 'bpo' || dag.godkendt) return;
    setDag(prev => ({
      ...prev,
      opgaver: prev.opgaver.map(o =>
        o.id !== id || o.udført
          ? o
          : {
              ...o,
              udført: true,
              udførtAf: [...o.udførtAf, { navn: bruger.navn, tid: nuTid() }],
              tidspunkt: nuTid(),
            }
      ),
    }));
  }

  function tilføjAdhoc() {
    if (!adhocTekst.trim()) return;
    setDag(prev => ({
      ...prev,
      opgaver: [...prev.opgaver, { id: uid(), tekst: adhocTekst, kategori: 'AD HOC', udført: false, udførtAf: [], tidspunkt: null }],
    }));
    setAdhocTekst('');
  }

  const færdige = useMemo(() => dag?.opgaver.filter(o => o.udført).length || 0, [dag]);

  if (!dag)
    return null;

  return (
    <div style={{ background: '#f4f6fb', minHeight: '100vh', fontFamily: 'Inter, system-ui' }}>
      {/* TOPBAR */}
      <div style={{ padding: 16, background: '#111827', color: 'white' }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>SiteHub · {SITE}</div>
        <div style={{ fontSize: 13, opacity: 0.8 }}>{dag.dato}</div>
        <div style={{ marginTop: 8, fontSize: 12 }}>
          Status: {dag.godkendt ? '🔒 Godkendt' : færdige === dag.opgaver.length ? '🟢 Klar' : '🟡 I gang'}
        </div>
        <div style={{ marginTop: 6, height: 6, background: '#374151', borderRadius: 4 }}>
          <div
            style={{
              height: '100%',
              width: `${(færdige / dag.opgaver.length) * 100}%`,
              background: '#10b981',
              borderRadius: 4,
            }}
          />
        </div>
      </div>

      {/* LOGIN */}
      {!bruger && (
        <div style={{ padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 14, padding: 16 }}>
            <h3>Log ind</h3>
            <select value={brugerId} onChange={e => setBrugerId(e.target.value)} style={inputStyle}>
              <option value="">Vælg bruger</option>
              {BRUGERE.map(b => (
                <option key={b.id} value={b.id}>{b.navn} ({b.rolle})</option>
              ))}
            </select>
            <input type="password" placeholder="Pinkode" value={pinkode} onChange={e => setPinkode(e.target.value)} style={inputStyle} />
            <button onClick={logInd} style={primaryBtn}>Log ind</button>
            {loginFejl && <p style={{ color: 'red' }}>{loginFejl}</p>}
          </div>
        </div>
      )}

      {/* OPGAVER */}
      {bruger && (
        <div style={{ padding: 16 }}>
          {dag.opgaver.map(o => (
            <div key={o.id} style={{ background: o.udført ? '#ecfdf5' : 'white', borderRadius: 14, padding: 14, marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{o.tekst}</strong>
                <span style={{ fontSize: 12, color: '#6b7280' }}>{o.kategori}</span>
              </div>
              {!o.udført && (
                <button onClick={() => udførOpgave(o.id)} style={smallBtn}>Markér udført</button>
              )}
              {o.tidspunkt && (
                <div style={{ fontSize: 12, marginTop: 6, color: '#065f46' }}>
                  ✓ {o.udførtAf.map(u => u.navn).join(', ')} kl. {new Date(o.tidspunkt).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          ))}

          {/* AD HOC */}
          {bruger.rolle === 'bpo' && (
            <div style={{ background: 'white', borderRadius: 14, padding: 14 }}>
              <h4>+ AD HOC-opgave</h4>
              <input value={adhocTekst} onChange={e => setAdhocTekst(e.target.value)} style={inputStyle} placeholder="Skriv opgave…" />
              <button onClick={tilføjAdhoc} style={primaryBtn}>Tilføj</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =====================
// STYLES
// =====================
const inputStyle = {
  width: '100%',
  padding: 14,
  marginBottom: 10,
  borderRadius: 12,
  border: '1px solid #e5e7eb',
};

const primaryBtn = {
  width: '100%',
  padding: 14,
  borderRadius: 12,
  background: '#111827',
  color: 'white',
  fontWeight: 600,
  border: 'none',
};

const smallBtn = {
  marginTop: 10,
  padding: '8px 12px',
  borderRadius: 10,
  background: '#2563eb',
  color: 'white',
  border: 'none',
};