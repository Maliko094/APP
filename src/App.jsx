import { useEffect, useMemo, useState } from "react";

const SITE = "AG WS";

const BRUGERE = [
  { id: "oliver", navn: "Oliver", rolle: "bpo", pinkode: "1111" },
  { id: "emil", navn: "Emil", rolle: "bpo", pinkode: "2222" },
  { id: "william", navn: "William", rolle: "bpo", pinkode: "3333" },
  { id: "jon", navn: "Jon", rolle: "logistikchef", pinkode: "9999" },
  { id: "martin", navn: "Martin", rolle: "koordinator", pinkode: "4444" },
  { id: "catharina", navn: "Catharina", rolle: "koordinator", pinkode: "5555" },
];

const OPGAVER = [
  "Arbejdstilladelse – husk sikkerhedskort",
  "Tjek alle SiteHub-hegn for skader (inkl. jordvolden)",
  "Registrér leverancer i Sitebooking (billeder af nr.plade og følgeseddel)",
  "Kontrollér spand med cigaretskodder",
  "Ryst / rens spaghettimåtter",
  "Rens skærme til fotogenkendelse",
  "Tjek alle SiteHub-hegn for skader",
  "Skriv besked på Slack ved akutte beskeder",
  "Lås container S2 ved fyraften",
  "Suspendér arbejdstilladelse – ring 30750246",
];

const STORAGE = "sitehub_bpo_audit_v1";

const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toISOString();
const uid = () => Math.random().toString(36).slice(2, 10);

function nyDag() {
  return {
    site: SITE,
    dato: today(),
    godkendt: false,
    godkendtAf: null,
    opgaver: OPGAVER.map(t => ({
      id: uid(),
      tekst: t,
      udført: false,
      udførtAf: [],
      tidspunkt: null
    })),
    log: []
  };
}

export default function App() {
  const [brugerId, setBrugerId] = useState("");
  const [pinkode, setPinkode] = useState("");
  const [bruger, setBruger] = useState(null);
  const [fejl, setFejl] = useState("");
  const [dag, setDag] = useState(null);
  const [adhoc, setAdhoc] = useState("");

  useEffect(() => {
    try {
      const gemt = JSON.parse(localStorage.getItem(STORAGE));
      if (!gemt || gemt.dato !== today()) throw 0;
      setDag(gemt);
    } catch {
      const frisk = nyDag();
      setDag(frisk);
      localStorage.setItem(STORAGE, JSON.stringify(frisk));
    }
  }, []);

  useEffect(() => {
    if (dag) localStorage.setItem(STORAGE, JSON.stringify(dag));
  }, [dag]);

  function logInd() {
    const fundet = BRUGERE.find(b => b.id === brugerId && b.pinkode === pinkode);
    if (!fundet) return setFejl("Forkert bruger eller pinkode");
    setBruger(fundet);
    setFejl("");
  }

  function toggleOpgave(id) {
    if (!bruger || dag.godkendt) return;

    setDag(prev => {
      const opgave = prev.opgaver.find(o => o.id === id);
      if (!opgave) return prev;

      const erChef = bruger.rolle === "logistikchef" || bruger.rolle === "koordinator";
      const erBPO = bruger.rolle === "bpo";
      const harSelv = opgave.udførtAf.some(u => u.navn === bruger.navn);

      if (opgave.udført) {
        if (!(erChef || (erBPO && harSelv))) return prev;
        return {
          ...prev,
          opgaver: prev.opgaver.map(o => o.id === id ? { ...o, udført: false, udførtAf: [], tidspunkt: null } : o),
          log: [...prev.log, { id: uid(), tekst: `❌ ${bruger.navn} fjernede flueben på "${opgave.tekst}"`, tid: new Date().toLocaleTimeString("da-DK") }]
        };
      }

      return {
        ...prev,
        opgaver: prev.opgaver.map(o =>
          o.id === id ? { ...o, udført: true, tidspunkt: now(), udførtAf: [...o.udførtAf, { navn: bruger.navn, tid: now() }] } : o
        ),
        log: [...prev.log, { id: uid(), tekst: `✅ ${bruger.navn} udførte "${opgave.tekst}"`, tid: new Date().toLocaleTimeString("da-DK") }]
      };
    });
  }

  const alleUdført = useMemo(() => dag?.opgaver.every(o => o.udført), [dag]);

  function godkend() {
    if (bruger?.rolle !== "logistikchef" || !alleUdført) return;
    setDag(prev => ({ ...prev, godkendt: true, godkendtAf: { navn: bruger.navn, tid: now() } }));
  }

  if (!dag) return null;

  return (
    <div style={{ background: "#f3f4f6", minHeight: "100vh", padding: 16 }}>
      <h2>SiteHub BPO – {SITE}</h2>

      {!bruger ? (
        <div>
          <select onChange={e => setBrugerId(e.target.value)}>
            <option value="">Vælg bruger</option>
            {BRUGERE.map(b => <option key={b.id} value={b.id}>{b.navn} ({b.rolle})</option>)}
          </select>
          <input type="password" placeholder="Pinkode" onChange={e => setPinkode(e.target.value)} />
          <button onClick={logInd}>Log ind</button>
          {fejl && <p style={{ color: "red" }}>{fejl}</p>}
        </div>
      ) : (
        <p>Logget ind som {bruger.navn} ({bruger.rolle})</p>
      )}

      {dag.opgaver.map(o => (
        <div key={o.id}>
          <input type="checkbox" checked={o.udført} disabled={dag.godkendt} onChange={() => toggleOpgave(o.id)} /> {o.tekst}
          {o.tidspunkt && <small> – {o.udførtAf.map(u => u.navn).join(", ")} kl. {new Date(o.tidspunkt).toLocaleTimeString("da-DK")}</small>}
        </div>
      ))}

      {bruger?.rolle === "logistikchef" && !dag.godkendt && (
        <button disabled={!alleUdført} onClick={godkend}>Godkend dagen</button>
      )}

      {(bruger?.rolle === "logistikchef" || bruger?.rolle === "koordinator") && (
        <div style={{ marginTop: 20, background: "#111", color: "#fff", padding: 10 }}>
          <strong>Ændringslog</strong>
          {dag.log.map(l => <div key={l.id}>{l.tid} – {l.tekst}</div>)}
        </div>
      )}
    </div>
  );
}