import { useEffect, useMemo, useState } from "react";

/* =====================
   KONFIGURATION
===================== */
const SITE = "AG WS";

const BRUGERE = [
  { id: "oliver", navn: "Oliver", rolle: "BPO", pinkode: "1111" },
  { id: "emil", navn: "Emil", rolle: "BPO", pinkode: "2222" },
  { id: "william", navn: "William", rolle: "BPO", pinkode: "3333" },

  { id: "martin", navn: "Martin", rolle: "Koordinator", pinkode: "4444" },
  { id: "catharina", navn: "Catharina", rolle: "Koordinator", pinkode: "5555" },

  { id: "jon", navn: "Jon", rolle: "Logistikchef", pinkode: "9999" },
];

const ÅBNING = [
  "Åbne arbejdstilladelse – husk sikkerhedskort",
  "Tjek SiteHub-hegn",
  "Registrér leverancer i Sitebooking",
  "Rens skærm til fotogenkendelse",
  "Billede af følgeseddel",
];

const LUK = [
  "Tjek cigaretskodder",
  "Rens måtter",
  "Oprydning",
  "Luk porte og hegn",
  "Plads lukket korrekt",
];

const STORAGE = "sitehub_bpo_v4";

/* =====================
   HJÆLPERE
===================== */
const iDag = () => new Date().toISOString().slice(0, 10);
const nu = () => new Date();
const uid = () => Math.random().toString(36).slice(2, 9);

/* =====================
   NY DAG
===================== */
function nyDag() {
  return {
    site: SITE,
    dato: iDag(),
    lukkevagt: null,
    godkendt: false,
    godkendtAf: null,
    opgaver: [
      ...ÅBNING.map(t => ({
        id: uid(),
        tekst: t,
        type: "Åbning",
        udført: false,
        udførtAf: null,
        tid: null,
      })),
      ...LUK.map(t => ({
        id: uid(),
        tekst: t,
        type: "Lukkevagt",
        udført: false,
        udførtAf: null,
        tid: null,
      })),
    ],
  };
}

/* =====================
   APP
===================== */
export default function App() {
  const [brugerId, setBrugerId] = useState("");
  const [pinkode, setPinkode] = useState("");
  const [bruger, setBruger] = useState(null);
  const [fejl, setFejl] = useState("");

  const [dag, setDag] = useState(null);
  const [adhoc, setAdhoc] = useState("");

  /* Init */
  useEffect(() => {
    const gemt = JSON.parse(localStorage.getItem(STORAGE));
    if (gemt && gemt.dato === iDag()) setDag(gemt);
    else {
      const d = nyDag();
      setDag(d);
      localStorage.setItem(STORAGE, JSON.stringify(d));
    }
  }, []);

  useEffect(() => {
    if (dag) localStorage.setItem(STORAGE, JSON.stringify(dag));
  }, [dag]);

  /* Login */
  function logInd() {
    const u = BRUGERE.find(
      b => b.id === brugerId && b.pinkode === pinkode
    );
    if (!u) {
      setFejl("Forkert bruger eller pinkode");
      return;
    }
    setBruger(u);
    setPinkode("");
    setFejl("");
  }

  function logUd() {
    setBruger(null);
    setBrugerId("");
    setPinkode("");
  }

  /* Opgaver */
  function toggleOpgave(id) {
    if (!bruger || bruger.rolle !== "BPO" || dag.godkendt) return;

    setDag(prev => ({
      ...prev,
      opgaver: prev.opgaver.map(o => {
        if (o.id !== id || o.udført) return o;

        if (
          o.type === "Lukkevagt" &&
          prev.lukkevagt &&
          prev.lukkevagt !== bruger.navn
        )
          return o;

        return {
          ...o,
          udført: true,
          udførtAf: bruger.navn,
          tid: nu().toLocaleTimeString("da-DK", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
      }),
      lukkevagt:
        prev.lukkevagt ||
        (prev.opgaver.find(o => o.id === id)?.type === "Lukkevagt"
          ? bruger.navn
          : prev.lukkevagt),
    }));
  }

  function tilføjAdhoc() {
    if (!adhoc.trim() || bruger?.rolle !== "BPO") return;
    setDag(prev => ({
      ...prev,
      opgaver: [
        ...prev.opgaver,
        {
          id: uid(),
          tekst: adhoc,
          type: "AD HOC",
          udført: false,
          udførtAf: null,
          tid: null,
        },
      ],
    }));
    setAdhoc("");
  }

  const alleUdført = useMemo(
    () => dag?.opgaver.every(o => o.udført),
    [dag]
  );

  function godkendDag() {
    if (bruger?.rolle !== "Logistikchef" || !alleUdført) return;
    setDag(prev => ({
      ...prev,
      godkendt: true,
      godkendtAf: bruger.navn,
    }));
  }

  if (!dag) return null;

  /* =====================
     UI
  ===================== */
  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9" }}>
      {/* HEADER */}
      <header style={{
        position: "sticky",
        top: 0,
        background: "#0f172a",
        color: "#fff",
        padding: 16,
        zIndex: 10,
      }}>
        <h2 style={{ margin: 0 }}>SiteHub BPO – {SITE}</h2>
        <small>Dato: {dag.dato}</small>
      </header>

      <main style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
        {/* LOGIN */}
        {!bruger && (
          <div className="card">
            <h3>Log ind</h3>
            <select value={brugerId} onChange={e => setBrugerId(e.target.value)}>
              <option value="">Vælg bruger</option>
              {BRUGERE.map(b => (
                <option key={b.id} value={b.id}>
                  {b.navn} ({b.rolle})
                </option>
              ))}
            </select>
            <input
              type="password"
              placeholder="Pinkode"
              value={pinkode}
              onChange={e => setPinkode(e.target.value)}
            />
            <button onClick={logInd}>Log ind</button>
            {fejl && <p style={{ color: "red" }}>{fejl}</p>}
          </div>
        )}

        {/* BRUGERINFO */}
        {bruger && (
          <div className="card">
            <strong>{bruger.navn}</strong> – {bruger.rolle}
            <button onClick={logUd} style={{ float: "right" }}>
              Log ud
            </button>
          </div>
        )}

        {/* OPGAVER */}
        {dag.opgaver.map(o => (
          <div key={o.id} className="card">
            <label>
              <input
                type="checkbox"
                checked={o.udført}
                disabled={bruger?.rolle !== "BPO" || dag.godkendt}
                onChange={() => toggleOpgave(o.id)}
              />{" "}
              <b>[{o.type}]</b> {o.tekst}
            </label>
            {o.udført && (
              <div className="meta">
                Udført af {o.udførtAf} kl. {o.tid}
              </div>
            )}
          </div>
        ))}

        {/* AD HOC */}
        {bruger?.rolle === "BPO" && !dag.godkendt && (
          <div className="card">
            <h4>AD HOC-opgave</h4>
            <input
              value={adhoc}
              onChange={e => setAdhoc(e.target.value)}
              placeholder="Skriv opgave…"
            />
            <button onClick={tilføjAdhoc}>Tilføj</button>
          </div>
        )}

        {/* GODKEND */}
        {bruger?.rolle === "Logistikchef" && !dag.godkendt && (
          <button
            onClick={godkendDag}
            disabled={!alleUdført}
            style={{ width: "100%", padding: 16 }}
          >
            Godkend dagen
          </button>
        )}

        {dag.godkendt && (
          <div className="card" style={{ background: "#dcfce7" }}>
            Dagen er godkendt af <b>{dag.godkendtAf}</b>
          </div>
        )}
      </main>

      <style>{`
        .card {
          background: #fff;
          border-radius: 12px;
          padding: 14px;
          margin-bottom: 12px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.05);
        }
        input, select, button {
          width: 100%;
          padding: 12px;
          margin-top: 8px;
          border-radius: 10px;
          border: 1px solid #cbd5f5;
        }
        button {
          background: #0f172a;
          color: white;
          font-weight: 600;
        }
        .meta {
          margin-top: 6px;
          font-size: 12px;
          color: #475569;
        }
      `}</style>
    </div>
  );
} 