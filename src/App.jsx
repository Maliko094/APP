import { useEffect, useMemo, useState } from "react";

/* =========================
   KONFIGURATION
========================= */

const SITE = "AG WS";
const STORAGE = "sitehub_ag_ws_final";

const USERS = [
  { id: "oliver", navn: "Oliver De Morais Andersen", rolle: "bpo", pin: "andersen" },
  { id: "william", navn: "William Garn Snedker Pedersen", rolle: "bpo", pin: "pedersen" },
  { id: "emil", navn: "Emil Gothart", rolle: "bpo", pin: "gothart" },

  { id: "martin", navn: "Martin Pajesø", rolle: "koordinator", pin: "pajesø" },
  { id: "catharina", navn: "Catharina Andersen", rolle: "koordinator", pin: "andersen" },
  { id: "hanne", navn: "Hanne Brobæk Jensen", rolle: "koordinator", pin: "jensen" },

  { id: "john", navn: "John Storm", rolle: "logistikchef", pin: "storm" },
  { id: "marie", navn: "Marie Grand", rolle: "logistikchef", pin: "grand" }
];

const BASE_OPGAVER = [
  "Arbejdstilladelse – husk sikkerhedskort",
  "Tjek SiteHub-hegn",
  "Registrér leverancer i Sitebooking",
  "Rens fotogenkendelses-skærme",
  "Billede af følgeseddel",
  "Rens spaghettimåtter",
  "Tjek cigaretskodder",
  "Oprydning",
  "Lås container S2",
  "Suspendér arbejdstilladelse"
];

/* =========================
   HJÆLPERE
========================= */

const idag = () => new Date().toISOString().slice(0, 10);
const klokke = () => new Date().toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" });
const uid = () => Math.random().toString(36).slice(2, 9);

function nyDag(dato) {
  return {
    dato,
    opgaver: BASE_OPGAVER.map(t => ({ id: uid(), tekst: t, udførtAf: [] })),
    log: [],
    godkendt: false,
    godkendtAf: null
  };
}

/* =========================
   APP
========================= */

export default function App() {
  const [db, setDb] = useState({});
  const [dato, setDato] = useState(idag());
  const [bruger, setBruger] = useState(null);
  const [brugerId, setBrugerId] = useState("");
  const [pinkode, setPinkode] = useState("");
  const [visning, setVisning] = useState("start");
  const [adhoc, setAdhoc] = useState("");

  useEffect(() => {
    const gemt = JSON.parse(localStorage.getItem(STORAGE) || "{}");
    if (!gemt[idag()]) gemt[idag()] = nyDag(idag());
    setDb(gemt);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify(db));
  }, [db]);

  const dag = db[dato] || nyDag(dato);
  const kanArbejde = bruger && (bruger.rolle === "bpo" || bruger.rolle === "koordinator");
  const erChef = bruger && bruger.rolle === "logistikchef";

  function logInd() {
    const fundet = USERS.find(u => u.id === brugerId && u.pin === pinkode.toLowerCase());
    if (!fundet) return alert("Forkert login");
    setBruger(fundet);
    setVisning("start");
    setPinkode("");
  }

  function logUd() {
    setBruger(null);
    setBrugerId("");
    setPinkode("");
    setVisning("start");
  }

  function log(tekst) {
    setDb(prev => ({
      ...prev,
      [dato]: { ...dag, log: [...dag.log, { tid: klokke(), tekst }] }
    }));
  }

  function toggle(opg) {
    if (!kanArbejde || dag.godkendt) return;

    const har = opg.udførtAf.find(u => u.navn === bruger.navn);
    let nyListe;

    if (har) {
      if (bruger.rolle === "bpo") {
        nyListe = opg.udførtAf.filter(u => u.navn !== bruger.navn);
        log(`${bruger.navn} fjernede: ${opg.tekst}`);
      } else return;
    } else {
      nyListe = [...opg.udførtAf, { navn: bruger.navn, tid: klokke() }];
      log(`${bruger.navn} udførte: ${opg.tekst}`);
    }

    setDb(prev => ({
      ...prev,
      [dato]: { ...dag, opgaver: dag.opgaver.map(o => o.id === opg.id ? { ...o, udførtAf: nyListe } : o) }
    }));
  }

  function tilføjAdhoc() {
    if (!kanArbejde || !adhoc.trim()) return;
    const ny = { id: uid(), tekst: "AD HOC: " + adhoc, udførtAf: [] };
    setDb(prev => ({
      ...prev,
      [dato]: { ...dag, opgaver: [...dag.opgaver, ny], log: [...dag.log, { tid: klokke(), tekst: `${bruger.navn} tilføjede ${ny.tekst}` }] }
    }));
    setAdhoc("");
  }

  const leaderboard = useMemo(() => {
    const c = {};
    dag.opgaver.forEach(o => o.udførtAf.forEach(u => c[u.navn] = (c[u.navn] || 0) + 1));
    return Object.entries(c).sort((a,b) => b[1] - a[1]);
  }, [dag]);

  const udført = dag.opgaver.filter(o => o.udførtAf.length > 0).length;
  const procent = Math.round((udført / dag.opgaver.length) * 100);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-xl mx-auto space-y-4">

        {/* Topbar */}
        <div className="bg-white p-4 rounded-xl shadow flex justify-between items-center">
          <h1 className="font-bold">Daglig tjekliste – {SITE}</h1>
          {bruger ? (
            <div className="flex gap-2 items-center">
              <span>{bruger.navn}</span>
              <button onClick={logUd} className="bg-red-500 text-white px-3 py-1 rounded">Log ud</button>
            </div>
          ) : null}
        </div>

        {!bruger ? (
          <div className="bg-white p-4 rounded-xl shadow space-y-2">
            <select value={brugerId} onChange={e => setBrugerId(e.target.value)} className="w-full border p-2 rounded">
              <option value="">Vælg bruger</option>
              {USERS.map(u => <option key={u.id} value={u.id}>{u.navn} ({u.rolle})</option>)}
            </select>
            <input value={pinkode} onChange={e => setPinkode(e.target.value)} placeholder="Efternavn" className="w-full border p-2 rounded" />
            <button onClick={logInd} className="w-full bg-black text-white p-2 rounded">Log ind</button>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <button onClick={()=>setVisning("start")} className={`flex-1 p-2 rounded ${visning==="start"?"bg-black text-white":"bg-gray-200"}`}>Start</button>
              <button onClick={()=>setVisning("list")} className={`flex-1 p-2 rounded ${visning==="list"?"bg-black text-white":"bg-gray-200"}`}>Tjekliste</button>
              {erChef && <button onClick={()=>setVisning("dash")} className={`flex-1 p-2 rounded ${visning==="dash"?"bg-black text-white":"bg-gray-200"}`}>Dashboard</button>}
            </div>

            {visning==="start" && (
              <div className="bg-white p-4 rounded-xl shadow">
                <h2 className="font-bold">Godmorgen {bruger.navn.split(" ")[0]}</h2>
                <p>Status: {procent}%</p>
                <h3 className="mt-2 font-bold">🏆 Leaderboard</h3>
                {leaderboard.map((l,i)=><div key={i}>{i+1}. {l[0]} – {l[1]}</div>)}
              </div>
            )}

            {visning==="list" && (
              <>
                {dag.opgaver.map(o=>{
                  const mine=o.udførtAf.some(u=>u.navn===bruger.navn);
                  return <div key={o.id} onClick={()=>toggle(o)} className={`p-3 bg-white rounded-xl shadow mb-2 ${mine?"line-through text-gray-400":""}`}>{o.tekst}</div>;
                })}
                {kanArbejde && (
                  <div className="bg-white p-4 rounded-xl shadow mt-2">
                    <input value={adhoc} onChange={e=>setAdhoc(e.target.value)} placeholder="AD-HOC opgave" className="w-full border p-2 rounded"/>
                    <button onClick={tilføjAdhoc} className="w-full mt-2 bg-gray-800 text-white p-2 rounded">Tilføj</button>
                  </div>
                )}
              </>
            )}

            {visning==="dash" && erChef && (
              <div className="bg-white p-4 rounded-xl shadow">
                <div>Compliance: {procent}%</div>
                <h3 className="mt-2 font-bold">Log</h3>
                {dag.log.map((l,i)=><div key={i}>{l.tid} – {l.tekst}</div>)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}