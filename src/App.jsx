import { useEffect, useMemo, useState } from 'react';

// =====================
// KONFIGURATION
// =====================
const SITE = 'AG WS';

const BRUGERE = [
  // BPO’er
  { id: 'oliver', navn: 'Oliver', rolle: 'bpo', pinkode: '1111' },
  { id: 'emil', navn: 'Emil', rolle: 'bpo', pinkode: '2222' },
  { id: 'william', navn: 'William', rolle: 'bpo', pinkode: '3333' },

  // Logistikchef
  { id: 'jon', navn: 'Jon', rolle: 'logistikchef', pinkode: '9999' },

  // Koordinatorer
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

const STORAGE_KEY = 'sitehub_bpo_dag_v3';

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
      ...ÅBNINGSOPGAVER.map(tekst => ({
        id: uid(), tekst, kategori: 'Åbning', udført: false, udførtAf: [], tidspunkt: null
      })),
      ...LUKKEOPGAVER.map(tekst => ({
        id: uid(), tekst, kategori: 'Lukkevagt', udført: false, udførtAf: [], tidspunkt: null
      })),
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
  const [valgtRolle, setValgtRolle] = useState('');
  const [dag, setDag] = useState(null);
  const [adhocTekst, setAdhocTekst] = useState('');

  // Init dag
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

  // Login
 function login() {
  const emp = EMPLOYEES.find(
    e => e.id === userId && e.role === valgtRolle
  );

  if (!emp || emp.pin !== pin) {
    setError('Forkert rolle, bruger eller pinkode');
    return;
  }

  setCurrentUser(emp);
  setPin('');
  setError('');
}

  function logUd() {
    setBruger(null);
    setBrugerId('');
    setPinkode('');
  }

  // Opgaver
  function udførOpgave(opgaveId) {
    if (!bruger || bruger.rolle !== 'bpo' || dag.godkendt) return;

    setDag(prev => ({
      ...prev,
      opgaver: prev.opgaver.map(o => {
        if (o.id !== opgaveId) return o;

        // Lukkevagt-regel
        if (o.kategori === 'Lukkevagt' && prev.lukkevagt && prev.lukkevagt !== bruger.navn) return o;

        if (o.udført) return o;

        return {
          ...o,
          udført: true,
          udførtAf: [...o.udførtAf, { navn: bruger.navn, tid: nuTid() }],
          tidspunkt: nuTid(),
        };
      }),
      lukkevagt: prev.lukkevagt || (prev.opgaver.find(o => o.id === opgaveId)?.kategori === 'Lukkevagt' ? bruger.navn : prev.lukkevagt),
    }));
  }

  function tilføjAdhoc() {
    if (!bruger || bruger.rolle !== 'bpo' || dag.godkendt) return;
    if (!adhocTekst.trim()) return;

    setDag(prev => ({
      ...prev,
      opgaver: [...prev.opgaver, {
        id: uid(), tekst: adhocTekst.trim(), kategori: 'AD HOC', udført: false, udførtAf: [], tidspunkt: null
      }]
    }));
    setAdhocTekst('');
  }

  const alleUdført = useMemo(() => dag?.opgaver.every(o => o.udført), [dag]);

  function godkendDag() {
    if (!bruger || bruger.rolle !== 'logistikchef' || !alleUdført) return;
    setDag(prev => ({ ...prev, godkendt: true, godkendtAf: { navn: bruger.navn, tid: nuTid() } }));
  }

      });

    y += 8;
    pdf.text(`Godkendt af: ${dag.godkendtAf.navn}`, 10, y);
    pdf.save(`BPO_${SITE}_${dag.dato}.pdf`);
  }

  if (!dag) return null;

  // =====================
  // RENDER (NEUTRAL / PROFESSIONEL UI)
  // =====================
  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', padding: 16, fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <header style={{ background: '#ffffff', padding: 16, borderRadius: 8, marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>SiteHub BPO – {SITE}</h2>
          <div style={{ color: '#555', marginTop: 4 }}>Dato: {dag.dato}</div>
        </header>

        {!bruger ? (
          <section style={{ background: '#ffffff', padding: 16, borderRadius: 8 }}>
            <h3>Log ind</h3>
            <select value={brugerId} onChange={e => setBrugerId(e.target.value)} style={{ width: '100%', padding: 10, marginBottom: 10 }}>
              <option value="">Vælg bruger</option>
              <optgroup label="BPO’er">
                {BRUGERE.filter(b => b.rolle === 'bpo').map(b => (
                  <option key={b.id} value={b.id}>{b.navn}</option>
                ))}
              </optgroup>
              <optgroup label="Koordinatorer">
                {BRUGERE.filter(b => b.rolle === 'koordinator').map(b => (
                  <option key={b.id} value={b.id}>{b.navn}</option>
                ))}
              </optgroup>
              <optgroup label="Logistikchef">
                {BRUGERE.filter(b => b.rolle === 'logistikchef').map(b => (
                  <option key={b.id} value={b.id}>{b.navn}</option>
                ))}
              </optgroup>
            </select>
            <input type="password" placeholder="Pinkode" value={pinkode} onChange={e => setPinkode(e.target.value)} style={{ width: '100%', padding: 10, marginBottom: 10 }} />
            <button onClick={logInd} style={{ width: '100%', padding: 12, background: '#111827', color: '#fff', borderRadius: 6 }}>Log ind</button>
            {loginFejl && <p style={{ color: '#b91c1c', marginTop: 8 }}>{loginFejl}</p>}
          </section>
        ) : (
          <section style={{ background: '#ffffff', padding: 16, borderRadius: 8, marginBottom: 16 }}>
            <strong>{bruger.navn}</strong> ({bruger.rolle})
            <button onClick={logUd} style={{ float: 'right' }}>Log ud</button>
          </section>
        )}

        {dag.opgaver.map(o => (
          <section key={o.id} style={{ background: '#ffffff', padding: 12, borderRadius: 8, marginBottom: 8 }}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="checkbox" checked={o.udført} disabled={!bruger || bruger.rolle !== 'bpo' || dag.godkendt} onChange={() => udførOpgave(o.id)} />
              <strong>{o.kategori}:</strong> {o.tekst}
            </label>
            {o.tidspunkt && (
              <div style={{ fontSize: 12, color: '#4b5563', marginTop: 4 }}>
                Udført af {o.udførtAf.map(u => u.navn).join(', ')} kl. {new Date(o.tidspunkt).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </section>
        ))}

        {bruger?.rolle === 'bpo' && !dag.godkendt && (
          <section style={{ background: '#ffffff', padding: 16, borderRadius: 8, marginTop: 16 }}>
            <h4>AD HOC-opgave</h4>
            <input value={adhocTekst} onChange={e => setAdhocTekst(e.target.value)} placeholder="Skriv opgave…" style={{ width: '100%', padding: 10 }} />
            <button onClick={tilføjAdhoc} style={{ marginTop: 8, padding: 12, width: '100%' }}>Tilføj</button>
          </section>
        )}

        {bruger?.rolle === 'logistikchef' && !dag.godkendt && (
          <button onClick={godkendDag} disabled={!alleUdført} style={{ marginTop: 16, padding: 14, width: '100%', background: '#065f46', color: '#fff', borderRadius: 6 }}>Godkend dagen</button>
        )}

        {dag.godkendt && (
          <section style={{ marginTop: 16, padding: 16, background: '#ecfdf5', borderRadius: 8 }}>
            <strong>Dagen er godkendt</strong>
            <div>Godkendt af {dag.godkendtAf?.navn}</div>
            
          </section>
        )}
      </div>
    </div>
  );
}
