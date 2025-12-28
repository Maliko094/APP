import { useEffect, useState } from "react";

/* ============================
   KONFIG
============================ */

const SITE = "AG WS";

const BRUGERE = [
  { id: "oliver", navn: "Oliver", rolle: "bpo", pin: "1111" },
  { id: "emil", navn: "Emil", rolle: "bpo", pin: "2222" },
  { id: "william", navn: "William", rolle: "bpo", pin: "3333" },
  { id: "jon", navn: "Jon", rolle: "chef", pin: "9999" },
];

const STANDARD_OPGAVER = [
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

const STORAGE = "sitehub_agws_v1";

/* ============================
   HJÆLPERE
============================ */

const iDag = () => new Date().toISOString().slice(0, 10);
const klokke = () => new Date().toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" });
const uid = () => Math.random().toString(36).slice(2, 9);

/* ============================
   INIT
============================ */

function nyDag() {
  return {
    dato: iDag(),
    opgaver: STANDARD_OPGAVER.map(t => ({
      id: uid(),
      tekst: t,
      udført: false,
      udførtAf: null,
      tid: null,
    })),
    adhoc: [],
    log: [],
  };
}

/* ============================
   APP
============================ */

export default function App() {
  const [brugerId, setBrugerId] = useState("");
  const [pin, setPin] = useState("");
  const [bruger, setBruger] = useState(null);
  const [dag, setDag] = useState(null);
  const [adhocTekst, setAdhocTekst] = useState("");

  /* load dag */
  useEffect(() => {
    const gemt = JSON.parse(localStorage.getItem(STORAGE));
    if (gemt && gemt.dato === iDag()) setDag(gemt);
    else {
      const n = nyDag();
      setDag(n);
      localStorage.setItem(STORAGE, JSON.stringify(n));
    }
  }, []);

  useEffect(() => {
    if (dag) localStorage.setItem(STORAGE, JSON.stringify(dag));
  }, [dag]);

  /* login */
  function logInd() {
    const b = BRUGERE.find(u => u.id === brugerId && u.pin === pin);
    if (!b) return alert("Forkert login");
    setBruger(b);
    setPin("");
  }

  function logUd() {
    setBruger(null);
    setBrugerId("");
    setPin("");
  }

  /* LOG */
  function log(tekst) {
    setDag(d => ({
      ...d,
      log: [{ tid: klokke(), tekst }, ...d.log],
    }));
  }

  /* Toggle opgave */
  function toggleOpgave(opg) {
    if (!bruger || bruger.rolle !== "bpo") return;

    setDag(d => ({
      ...d,
      opgaver: d.opgaver.map(o => {
        if (o.id !== opg.id) return o;

        // Hvis allerede udført → kun samme BPO må fjerne
        if (o.udført && o.udførtAf !== bruger.navn) return o;

        const ny = !o.udført;

        log(
          ny
            ? `${bruger.navn} markerede "${o.tekst}"`
            : `${bruger.navn} fjernede flueben på "${o.tekst}"`
        );

        return {
          ...o,
          udført: ny,
          udførtAf: ny ? bruger.navn : null,
          tid: ny ? klokke() : null,
        };
      }),
    }));
  }

  /* AD HOC */
  function tilføjAdhoc() {
    if (!adhocTekst.trim()) return;
    const opg = {
      id: uid(),
      tekst: adhocTekst,
      udført: false,
      udførtAf: null,
      tid: null,
    };

    log(`${bruger.navn} oprettede AD HOC: "${adhocTekst}"`);

    setDag(d => ({ ...d, adhoc: [...d.adhoc, opg] }));
    setAdhocTekst("");
  }

  function toggleAdhoc(opg) {
    if (!bruger || bruger.rolle !== "bpo") return;

    setDag(d => ({
      ...d,
      adhoc: d.adhoc.map(o => {
        if (o.id !== opg.id) return o;
        if (o.udført && o.udførtAf !== bruger.navn) return o;

        const ny = !o.udført;
        log(
          ny
            ? `${bruger.navn} udførte AD HOC "${o.tekst}"`
            : `${bruger.navn} fjernede AD HOC "${o.tekst}"`
        );

        return { ...o, udført: ny, udførtAf: ny ? bruger.navn : null, tid: ny ? klokke() : null };
      }),
    }));
  }

  if (!dag) return null;

  /* ============================
     UI
  ============================ */

  return (
    <div style={{ fontFamily: "system-ui", background: "#f3f4f6", minHeight: "100vh", padding: 16 }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>

        <h2>SiteHub BPO – {SITE}</h2>
        <div>Dato: {dag.dato}</div>

        {!bruger ? (
          <div style={{ background: "#fff", padding: 12, borderRadius: 10 }}>
            <select value={brugerId} onChange={e => setBrugerId(e.target.value)} style={{ width: "100%", padding: 10 }}>
              <option value="">Vælg bruger</option>
              {BRUGERE.map(b => <option key={b.id} value={b.id}>{b.navn}</option>)}
            </select>
            <input type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="Pinkode" style={{ width: "100%", padding: 10, marginTop: 8 }} />
            <button onClick={logInd} style={{ width: "100%", marginTop: 10 }}>Log ind</button>
          </div>
        ) : (
          <div>
            Logget ind som <strong>{bruger.navn}</strong> ({bruger.rolle})
            <button onClick={logUd} style={{ float: "right" }}>Log ud</button>
          </div>
        )}

        {[...dag.opgaver, ...dag.adhoc].map(o => (
          <div key={o.id} style={{ background: "#fff", padding: 10, marginTop: 8, borderRadius: 8 }}>
            <label>
              <input
                type="checkbox"
                checked={o.udført}
                onChange={() => (STANDARD_OPGAVER.includes(o.tekst) ? toggleOpgave(o) : toggleAdhoc(o))}
              /> {o.tekst}
            </label>
            {o.tid && <div style={{ fontSize: 12 }}>Udført af {o.udførtAf} kl. {o.tid}</div>}
          </div>
        ))}

        {bruger?.rolle === "bpo" && (
          <div style={{ background: "#fff", padding: 12, marginTop: 16 }}>
            <input value={adhocTekst} onChange={e => setAdhocTekst(e.target.value)} placeholder="AD HOC opgave…" style={{ width: "100%", padding: 8 }} />
            <button onClick={tilføjAdhoc} style={{ width: "100%", marginTop: 8 }}>Tilføj</button>
          </div>
        )}

        {bruger?.rolle === "chef" && (
          <div style={{ background: "#111", color: "#0f0", padding: 10, marginTop: 16, fontFamily: "monospace" }}>
            <strong>Ændringslog</strong>
            {dag.log.map((l, i) => <div key={i}>{l.tid} – {l.tekst}</div>)}
          </div>
        )}

      </div>
    </div>
  );
}
