import { useEffect, useState } from "react";

// =====================
// KONFIGURATION
// =====================
const SITE = "AG WS";

const MEDARBEJDERE = [
  // BPO’er
  { id: "oliver", navn: "Oliver", rolle: "bpo", pinkode: "1111" },
  { id: "emil", navn: "Emil", rolle: "bpo", pinkode: "2222" },
  { id: "william", navn: "William", rolle: "bpo", pinkode: "3333" },

  // Koordinatorer
  { id: "martin", navn: "Martin", rolle: "koordinator", pinkode: "4444" },
  { id: "catharina", navn: "Catharina", rolle: "koordinator", pinkode: "5555" },

  // Logistikchef
  { id: "jon", navn: "Jon", rolle: "logistikchef", pinkode: "9999" },
];

const OPGAVER = [
  { id: 1, type: "åbning", tekst: "Åbne arbejdstilladelse – husk sikkerhedskort" },
  { id: 2, type: "åbning", tekst: "Tjek SiteHub-hegn" },
  { id: 3, type: "åbning", tekst: "Registrér leverancer i Sitebooking" },
  { id: 4, type: "åbning", tekst: "Rens skærm til fotogenkendelse" },
  { id: 5, type: "åbning", tekst: "Billede af følgeseddel" },
  { id: 6, type: "lukkevagt", tekst: "Tjek cigaretskodder" },
  { id: 7, type: "lukkevagt", tekst: "Rens måtter" },
  { id: 8, type: "lukkevagt", tekst: "Oprydning" },
  { id: 9, type: "lukkevagt", tekst: "Luk porte og hegn" },
];

// =====================
// APP
// =====================
export default function App() {
  const [brugerId, setBrugerId] = useState("");
  const [pinkode, setPinkode] = useState("");
  const [bruger, setBruger] = useState(null);
  const [fejl, setFejl] = useState("");

  const [udført, setUdført] = useState({});
  const dato = new Date().toISOString().slice(0, 10);

  // =====================
  // LOGIN
  // =====================
  function logInd() {
    const fundet = MEDARBEJDERE.find(
      m => m.id === brugerId && m.pinkode === pinkode
    );

    if (!fundet) {
      setFejl("Forkert bruger eller pinkode");
      return;
    }

    setBruger(fundet);
    setPinkode("");
    setFejl("");
  }

  function logUd() {
    setBruger(null);
    setBrugerId("");
    setPinkode("");
    setUdført({});
  }

  // =====================
  // OPGAVER
  // =====================
  function toggle(id) {
    if (!bruger || bruger.rolle !== "bpo") return;

    setUdført(prev => ({
      ...prev,
      [id]: prev[id]
        ? null
        : {
            navn: bruger.navn,
            rolle: bruger.rolle,
            tid: new Date().toLocaleTimeString("da-DK", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
    }));
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      {/* HEADER */}
      <header className="sticky top-0 z-10 bg-white shadow px-4 py-3">
        <h1 className="text-xl font-bold">SiteHub BPO – {SITE}</h1>
        <p className="text-sm text-gray-500">Dato: {dato}</p>
        {bruger && (
          <p className="text-sm mt-1">
            Logget ind: <strong>{bruger.navn}</strong> ({bruger.rolle})
          </p>
        )}
      </header>

      <main className="p-4 space-y-4">
        {/* LOGIN */}
        {!bruger && (
          <section className="bg-white rounded-xl shadow p-4 space-y-3">
            <h2 className="font-semibold text-lg">Log ind</h2>

            <select
              value={brugerId}
              onChange={e => setBrugerId(e.target.value)}
              className="w-full p-3 rounded-lg border"
            >
              <option value="">Vælg medarbejder</option>
              <optgroup label="BPO’er">
                {MEDARBEJDERE.filter(m => m.rolle === "bpo").map(m => (
                  <option key={m.id} value={m.id}>{m.navn}</option>
                ))}
              </optgroup>
              <optgroup label="Koordinatorer">
                {MEDARBEJDERE.filter(m => m.rolle === "koordinator").map(m => (
                  <option key={m.id} value={m.id}>{m.navn}</option>
                ))}
              </optgroup>
              <optgroup label="Logistikchef">
                {MEDARBEJDERE.filter(m => m.rolle === "logistikchef").map(m => (
                  <option key={m.id} value={m.id}>{m.navn}</option>
                ))}
              </optgroup>
            </select>

            <input
              type="password"
              placeholder="Pinkode"
              value={pinkode}
              onChange={e => setPinkode(e.target.value)}
              className="w-full p-3 rounded-lg border"
            />

            <button
              onClick={logInd}
              className="w-full bg-black text-white py-3 rounded-lg"
            >
              Log ind
            </button>

            {fejl && <p className="text-red-600 text-sm">{fejl}</p>}
          </section>
        )}

        {/* OPGAVER */}
        {bruger && (
          <>
            {OPGAVER.map(opg => {
              const done = udført[opg.id];
              return (
                <div
                  key={opg.id}
                  className={`rounded-xl p-4 shadow bg-white border-l-4 ${
                    opg.type === "åbning"
                      ? "border-blue-500"
                      : "border-orange-500"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-xs uppercase font-semibold text-gray-500">
                        {opg.type}
                      </span>
                      <p className="font-medium mt-1">{opg.tekst}</p>
                    </div>

                    {bruger.rolle === "bpo" && (
                      <button
                        onClick={() => toggle(opg.id)}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                          done
                            ? "bg-green-500 border-green-500 text-white"
                            : "border-gray-300"
                        }`}
                      >
                        ✓
                      </button>
                    )}
                  </div>

                  {done && (
                    <p className="text-xs text-gray-500 mt-2">
                      Udført af {done.navn} ({done.rolle}) kl. {done.tid}
                    </p>
                  )}
                </div>
              );
            })}

            <button
              onClick={logUd}
              className="w-full mt-6 bg-gray-200 py-3 rounded-lg"
            >
              Log ud
            </button>
          </>
        )}
      </main>
    </div>
  );
}
