import { useEffect, useMemo, useState } from 'react';
import jsPDF from 'jspdf';

// =====================
// KONFIGURATION (DANSK)
// =====================
const SITE = 'AG WS';

const BRUGERE = [
  { id: 'oliver', navn: 'Oliver', rolle: 'bpo', pinkode: '1111' },
  { id: 'emil', navn: 'Emil', rolle: 'bpo', pinkode: '2222' },
  { id: 'william', navn: 'William', rolle: 'bpo', pinkode: '3333' },
  { id: 'jon', navn: 'Jon', rolle: 'chef', pinkode: '9999' },
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

const STORAGE_KEY = 'sitehub_bpo_dag_v2';

// =====================
// HJÆLPERE
// =====================
const dagsDato = () => new Date().toISOString().slice(0, 10);
const nuTid = () => new Date().toISOString();
const id = () => Math.random().toString(36).slice(2, 10);

function nyDag() {
  return {
    site: SITE,
    dato: dagsDato(),
    godkendt: false,
    godkendtAf: null,
    lukkevagt: null,
    opgaver: [
      ...ÅBNINGSOPGAVER.map(tekst => ({
        id: id(),
        tekst,
        type: 'åbning',
        udført: false,
        udførtAf: [],
        tidspunkt: null,
      })),
      ...LUKKEOPGAVER.map(tekst => ({
        id: id(),
        tekst,
        type: 'lukke',
        udført: false,
        udførtAf: [],
        tidspunkt: null,
      })),
    ],
  };
}

// =====================
// APP
// =====================
export default function App() {
  // Login
  const [brugerId, setBrugerId] = useState('');
  const [pinkode, setPinkode] = useState('');
  const [bruger, setBruger] = useState(null);
  const [loginFejl, setLoginFejl] = useState('');

  // Dag
  const [dag, setDag] = useState(null);

  // AD HOC
  const [adhocTekst, setAdhocTekst] = useState('');

  // INIT
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

  // LOGIN
  function logInd() {
    const fundet = BRUGERE.find(b => b.id === brugerId && b.pinkode === pinkode);
    if (!fundet) {
      setLoginFejl('Forkert bruger eller pinkode');
      return;
    }
    setBruger(fundet);
    setLoginFejl('');
    setPinkode('');
  }

  function logUd() {
    setBruger(null);
    setBrugerId('');
    setPinkode('');
  }

  // OPGAVER
  function udførOpgave(opgaveId) {
    if (!bruger || bruger.rolle !== 'bpo' || dag.godkendt) return;

    setDag(prev => ({
      ...prev,
      opgaver: prev.opgaver.map(o => {
        if (o.id !== opgaveId) return o;

        // Lukkevagt: kun én person
        if (o.type === 'lukke' && prev.lukkevagt && prev.lukkevagt !== bruger.navn) return o;

        const allerede = o.udførtAf.some(u => u.navn === bruger.navn);
        if (allerede) return o;

        return {
          ...o,
          udført: true,
          udførtAf: [...o.udførtAf, { navn: bruger.navn, tid: nuTid() }],
          tidspunkt: nuTid(),
        };
      }),
      lukkevagt: prev.lukkevagt || (prev.opgaver.find(o => o.id === opgaveId)?.type === 'lukke' ? bruger.navn : prev.lukkevagt),
    }));
  }

  function tilføjAdhoc() {
    if (!bruger || bruger.rolle !== 'bpo' || dag.godkendt) return;
    if (!adhocTekst.trim()) return;

    setDag(prev => ({
      ...prev,
      opgaver: [...prev.opgaver, {
        id: id(),
        tekst: adhocTekst.trim(),
        type: 'adhoc',
        udført: false,
        udførtAf: [],
        tidspunkt: null,
      }]
    }));
    setAdhocTekst('');
  }

  const alleUdført = useMemo(() => dag?.opgaver.every(o => o.udført), [dag]);

  // GODKEND
  function godkendDag() {
    if (!bruger || bruger.rolle !== 'chef' || !alleUdført) return;
    setDag(prev => ({ ...prev, godkendt: true, godkendtAf: { navn: bruger.navn, tid: nuTid() } }));
  }

  // PDF
  function hentPDF() {
    if (!dag?.godkendt) return;
    const pdf = new jsPDF();
    let y = 12;
    pdf.text(`SiteHub – Daglig BPO-rapport`, 10, y); y += 8;
    pdf.text(`Site: ${SITE}`, 10, y); y += 6;
    pdf.text(`Dato: ${dag.dato}`, 10, y); y += 8;

    dag.opgaver.forEach(o => {
      pdf.text(`• [${o.type.toUpperCase()}] ${o.tekst}`, 10, y); y += 5;
      if (o.tidspunkt) {
        pdf.text(`   Udført af: ${o.udførtAf.map(u => u.navn).join(', ')} kl. ${new Date(o.tidspunkt).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}`, 10, y);
        y += 5;
      }
    });

    y += 6;
    pdf.text(`Godkendt af: ${dag.godkendtAf.navn}`, 10, y);
    pdf.save(`BPO_${SITE}_${dag.dato}.pdf`);
  }

  if (!dag) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6f8', padding: 16, fontFamily: 'Arial' }}>
      <h2>SiteHub BPO – {SITE}</h2>
      <p>Dato: {dag.dato}</p>

      {!bruger ? (
        <div style={{ background: '#fff', padding: 16, borderRadius: 8, maxWidth: 420 }}>
          <h3>Log ind</h3>
          <select value={brugerId} onChange={e => setBrugerId(e.target.value)} style={{ width: '100%', padding: 10, marginBottom: 10 }}>
            <option value="">Vælg bruger</option>
            {BRUGERE.map(b => <option key={b.id} value={b.id}>{b.navn}</option>)}
          </select>
          <input type="password" placeholder="Pinkode" value={pinkode} onChange={e => setPinkode(e.target.value)} style={{ width: '100%', padding: 10, marginBottom: 10 }} />
          <button onClick={logInd} style={{ width: '100%', padding: 12 }}>Log ind</button>
          {loginFejl && <p style={{ color: 'red' }}>{loginFejl}</p>}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
          <strong>Logget ind:</strong> {bruger.navn} ({bruger.rolle})
          <button onClick={logUd} style={{ marginLeft: 'auto' }}>Log ud</button>
        </div>
      )}

      {dag.opgaver.map(o => (
        <div key={o.id} style={{ background: '#fff', borderRadius: 8, padding: 12, marginBottom: 8 }}>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="checkbox" checked={o.udført} disabled={!bruger || bruger.rolle !== 'bpo' || dag.godkendt} onChange={() => udførOpgave(o.id)} />
            <strong>[{o.type}]</strong> {o.tekst}
          </label>
          {o.tidspunkt && (
            <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>
              Udført af: {o.udførtAf.map(u => u.navn).join(', ')} kl. {new Date(o.tidspunkt).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
      ))}

      {bruger?.rolle === 'bpo' && !dag.godkendt && (
        <div style={{ background: '#fff', borderRadius: 8, padding: 12, marginTop: 12 }}>
          <h4>AD HOC-opgave</h4>
          <input value={adhocTekst} onChange={e => setAdhocTekst(e.target.value)} placeholder="Skriv opgave…" style={{ width: '100%', padding: 10 }} />
          <button onClick={tilføjAdhoc} style={{ marginTop: 8, padding: 12, width: '100%' }}>Tilføj</button>
        </div>
      )}

      {bruger?.rolle === 'chef' && !dag.godkendt && (
        <button onClick={godkendDag} disabled={!alleUdført} style={{ marginTop: 16, padding: 14, width: '100%' }}>Godkend dagen</button>
      )}

      {dag.godkendt && (
        <div style={{ marginTop: 16, padding: 12, background: '#e6f6ec', borderRadius: 8 }}>
          <strong>Dagen er godkendt</strong>
          <div>Af: {dag.godkendtAf?.navn}</div>
          <button onClick={hentPDF} style={{ marginTop: 8, padding: 12, width: '100%' }}>Hent PDF-rapport</button>
        </div>
      )}
    </div>
  );
}
