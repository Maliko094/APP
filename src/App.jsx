import { useEffect, useMemo, useState } from "react";

const SITE = "AG WS";

const BRUGERE = [
  { id: "oliver", navn: "Oliver", rolle: "bpo", pin: "1111" },
  { id: "emil", navn: "Emil", rolle: "bpo", pin: "2222" },
  { id: "jon", navn: "Jon", rolle: "logistikchef", pin: "9999" },
];

const OPGAVER_FAST = [
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

const STORAGE = "sitehub_dag_v4";

const idag = () => new Date().toISOString().slice(0, 10);
const tid = () => new Date().toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" });
const uid = () => Math.random().toString(36).slice(2, 9);

function nyDag() {
  return {
    dato: idag(),
    opgaver: OPGAVER_FAST.map(t => ({
      id: uid(),
      tekst: t,
      udført: false,
      udførtAf: null,
      tid: null
    })),
    adhoc: [],
    log: []
  };
}

export default function App() {
  const [brugerId, setBrugerId] = useState("");
  const [pin, setPin] = useState("");
  const [bruger, setBruger] = useState(null);
  const [dag, setDag] = useState(null);
  const [adhoc, setAdhoc] = useState("");

  useEffect(() => {
    const gemt = JSON.parse(localStorage.getItem(STORAGE));
    if (gemt && gemt.dato === idag()) setDag(gemt);
    else {
      const n = nyDag();
      setDag(n);
      localStorage.setItem(STORAGE, JSON.stringify(n));
    }
  }, []);

  useEffect(() => {
    if (dag) localStorage.setItem(STORAGE, JSON.stringify(dag));
  }, [dag]);

  function login() {
    const u = BRUGERE.find(b => b.id === brugerId && b.pin === pin);
    if (u) setBruger(u);
    else alert("Forkert login");
  }

  function toggleOpgave(id) {
    if (!bruger || bruger.rolle !== "bpo") return;

    setDag(prev => {
      const opgaver = prev.opgaver.map(o => {
        if (o.id !== id) return o;

        // Kun den der satte flueben må fjerne det
        if (o.udført && o.udførtAf !== bruger.navn) return o;

        const ny = !o.udført;
        return {
          ...o,
          udført: ny,
          udførtAf: ny ? bruger.navn : null,
          tid: ny ? tid() : null
        };
      });

      return {
        ...prev,
        opgaver,
        log: [
          ...prev.log,
          `${tid()} – ${bruger.navn} ændrede: ${prev.opgaver.find(o => o.id === id).tekst}`
        ]
      };
    });
  }

  function tilføjAdhoc() {
    if (!adhoc.trim()) return;
    setDag(prev => ({
      ...prev,
      adhoc: [...prev.adhoc, { id: uid(), tekst: adhoc, af: bruger.navn, tid: tid() }],
      log: [...prev.log, `${tid()} – ${bruger.navn} tilføjede AD-HOC: ${adhoc}`]
    }));
    setAdhoc("");
  }

  if (!dag) return null;

  return (
    <div className="min-h-screen bg-slate-100 p-4">
      <div className="max-w-xl mx-auto space-y-4">

        <div className="bg-white rounded-xl p-4 shadow">
          <h1 className="text-xl font-bold">SiteHub BPO – {SITE}</h1>
          <p className="text-sm text-gray-500">Dato: {dag.dato}</p>
        </div>

        {!bruger && (
          <div className="bg-white rounded-xl p-4 shadow space-y-2">
            <select className="w-full p-3 rounded bg-gray-100" onChange={e => setBrugerId(e.target.value)}>
              <option value="">Vælg bruger</option>
              {BRUGERE.map(b => <option key={b.id} value={b.id}>{b.navn}</option>)}
            </select>
            <input className="w-full p-3 rounded bg-gray-100" placeholder="Pinkode" type="password" onChange={e => setPin(e.target.value)} />
            <button onClick={login} className="w-full bg-blue-600 text-white py-3 rounded-lg">Log ind</button>
          </div>
        )}

        {bruger && (
          <div className="bg-white rounded-xl p-4 shadow space-y-2">
            <p className="font-semibold">Logget ind som {bruger.navn} ({bruger.rolle})</p>

            {dag.opgaver.map(o => (
              <div key={o.id} onClick={() => toggleOpgave(o.id)}
                className={`p-3 rounded-lg flex justify-between items-center ${o.udført ? "bg-green-100" : "bg-gray-100"}`}>
                <div>
                  <p className="font-medium">{o.tekst}</p>
                  {o.udført && <p className="text-xs text-gray-600">Udført af {o.udførtAf} kl. {o.tid}</p>}
                </div>
                <input type="checkbox" checked={o.udført} readOnly />
              </div>
            ))}

            <div className="mt-4">
              <input value={adhoc} onChange={e => setAdhoc(e.target.value)}
                className="w-full p-3 bg-gray-100 rounded" placeholder="AD-HOC opgave…" />
              <button onClick={tilføjAdhoc} className="mt-2 w-full bg-black text-white py-2 rounded">Tilføj</button>
            </div>

            {bruger.rolle === "logistikchef" && (
              <div className="mt-6 bg-black text-green-400 p-3 rounded text-xs font-mono">
                {dag.log.map((l,i)=><div key={i}>{l}</div>)}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}