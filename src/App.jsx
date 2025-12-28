import { useEffect, useState } from "react";

const SITE = "AG WS";

const BRUGERE = [
  { id: "oliver", navn: "Oliver", pinkode: "1111", rolle: "bpo" },
  { id: "emil", navn: "Emil", pinkode: "2222", rolle: "bpo" },
  { id: "william", navn: "William", pinkode: "3333", rolle: "bpo" },
  { id: "jon", navn: "Jon", pinkode: "9999", rolle: "chef" },
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
  "Suspendér arbejdstilladelse – ring 30750246"
];

export default function App() {
  const [brugerId, setBrugerId] = useState("");
  const [pinkode, setPinkode] = useState("");
  const [bruger, setBruger] = useState(null);

  const [opgaver, setOpgaver] = useState(
    OPGAVER.map(o => ({ tekst: o, udført: false, af: null, tid: null }))
  );

  function logInd() {
    const b = BRUGERE.find(b => b.id === brugerId && b.pinkode === pinkode);
    if (b) setBruger(b);
    else alert("Forkert pinkode");
  }

  function toggle(i) {
    if (!bruger || bruger.rolle !== "bpo") return;

    setOpgaver(prev =>
      prev.map((o, index) => {
        if (index !== i) return o;

        // Kun den der satte flueben må fjerne det
        if (o.udført && o.af !== bruger.navn) return o;

        return {
          ...o,
          udført: !o.udført,
          af: !o.udført ? bruger.navn : null,
          tid: !o.udført ? new Date().toLocaleTimeString("da-DK", {hour:"2-digit", minute:"2-digit"}) : null
        };
      })
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto space-y-4">

        <div className="bg-white rounded-xl p-4 shadow">
          <h1 className="text-xl font-bold">SiteHub BPO – {SITE}</h1>

          {!bruger && (
            <div className="space-y-2 mt-3">
              <select className="w-full p-2 rounded border"
                value={brugerId}
                onChange={e => setBrugerId(e.target.value)}
              >
                <option value="">Vælg bruger</option>
                {BRUGERE.map(b => (
                  <option key={b.id} value={b.id}>{b.navn}</option>
                ))}
              </select>

              <input
                type="password"
                placeholder="Pinkode"
                className="w-full p-2 border rounded"
                value={pinkode}
                onChange={e => setPinkode(e.target.value)}
              />

              <button
                onClick={logInd}
                className="w-full bg-blue-600 text-white py-2 rounded font-semibold"
              >
                Log ind
              </button>
            </div>
          )}

          {bruger && (
            <div className="mt-2 text-sm text-gray-600">
              Logget ind som <b>{bruger.navn}</b>
            </div>
          )}
        </div>

        {opgaver.map((o, i) => (
          <div
            key={i}
            onClick={() => toggle(i)}
            className={`p-4 rounded-xl shadow cursor-pointer bg-white flex justify-between items-center
              ${o.udført ? "border-l-8 border-green-500" : "border-l-8 border-gray-300"}`}
          >
            <div>
              <div className="font-medium">{o.tekst}</div>
              {o.udført && (
                <div className="text-xs text-gray-500">
                  Udført af {o.af} kl. {o.tid}
                </div>
              )}
            </div>

            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
              ${o.udført ? "bg-green-500 border-green-500 text-white" : "border-gray-400"}`}>
              {o.udført && "✓"}
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}