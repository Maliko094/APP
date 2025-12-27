import { useEffect, useMemo, useState } from "react";

/* ============================
   KONFIGURATION
============================ */
const SITE = "AG WS";

const BRUGERE = [
  { id: "oliver", navn: "Oliver", rolle: "bpo", pinkode: "1111" },
  { id: "emil", navn: "Emil", rolle: "bpo", pinkode: "2222" },
  { id: "william", navn: "William", rolle: "bpo", pinkode: "3333" },

  { id: "jon", navn: "Jon", rolle: "logistikchef", pinkode: "9999" },

  { id: "martin", navn: "Martin", rolle: "koordinator", pinkode: "4444" },
  { id: "catharina", navn: "Catharina", rolle: "koordinator", pinkode: "5555" },
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

const STORAGE = "sitehub_bpo_prod_v1";

/* ============================
   HJÆLPERE
============================ */
const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toISOString();
const uid = () => Math.random().toString(36).slice(2, 10);

function nyDag() {
  return {
    site: SITE,
    dato: today(),
    godkendt: false,
    godkendtAf: null,
    opgaver: STANDARD_OPGAVER.map((t) => ({
      id: uid(),
      tekst: t,
      udført: false,
      udførtAf: [],
      tidspunkt: null,
    })),
  };
}

/* ============================
   APP
============================ */
export default function App() {
  const [brugerId, setBrugerId] = useState("");
  const [pinkode, setPinkode] = useState("");
  const [bruger, setBruger] = useState(null);
  const [fejl, setFejl] = useState("");

  const [dag, setDag] = useState(null);
  const [adhoc, setAdhoc] = useState("");

  /* Init dag */
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
    const fundet = BRUGERE.find(
      (b) => b.id === brugerId && b.pinkode === pinkode
    );
    if (!fundet) return setFejl("Forkert bruger eller pinkode");
    setBruger(fundet);
    setFejl("");
    setPinkode("");
  }

  function logUd() {
    setBruger(null);
    setBrugerId("");
    setPinkode("");
  }

  function udfør(id) {
    if (!bruger || bruger.rolle !== "bpo" || dag.godkendt) return;
    setDag((prev) => ({
      ...prev,
      opgaver: prev.opgaver.map((o) =>
        o.id !== id || o.udført
          ? o
          : {
              ...o,
              udført: true,
              tidspunkt: now(),
              udførtAf: [...o.udførtAf, { navn: bruger.navn, tid: now() }],
            }
      ),
    }));
  }

  function tilføjAdhoc() {
    if (!adhoc.trim() || dag.godkendt || bruger?.rolle !== "bpo") return;
    setDag((prev) => ({
      ...prev,
      opgaver: [
        ...prev.opgaver,
        {
          id: uid(),
          tekst: "AD HOC: " + adhoc,
          udført: false,
          udførtAf: [],
          tidspunkt: null,
        },
      ],
    }));
    setAdhoc("");
  }

  const alleUdført = useMemo(
    () => dag?.opgaver.every((o) => o.udført),
    [dag]
  );

  function godkend() {
    if (bruger?.rolle !== "logistikchef" || !alleUdført) return;
    setDag((prev) => ({
      ...prev,
      godkendt: true,
      godkendtAf: { navn: bruger.navn, tid: now() },
    }));
  }

  if (!dag) return null;

  /* ============================
     UI
============================ */
  return (
    <div style={{ background: "#f3f4f6", minHeight: "100vh", padding: 16 }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <h2>SiteHub BPO – {SITE}</h2>
        <p>Dato: {dag.dato}</p>

        {!bruger ? (
          <div style={{ background: "#fff", padding: 16, borderRadius: 10 }}>
            <h3>Log ind</h3>
            <select
              value={brugerId}
              onChange={(e) => setBrugerId(e.target.value)}
              style={{ width: "100%", padding: 12, marginBottom: 10 }}
            >
              <option value="">Vælg bruger</option>
              <optgroup label="BPO’er">
                {BRUGERE.filter((b) => b.rolle === "bpo").map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.navn}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Koordinatorer">
                {BRUGERE.filter((b) => b.rolle === "koordinator").map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.navn}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Logistikchef">
                {BRUGERE.filter((b) => b.rolle === "logistikchef").map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.navn}
                  </option>
                ))}
              </optgroup>
            </select>

            <input
              type="password"
              placeholder="Pinkode"
              value={pinkode}
              onChange={(e) => setPinkode(e.target.value)}
              style={{ width: "100%", padding: 12 }}
            />

            <button
              onClick={logInd}
              style={{
                width: "100%",
                padding: 14,
                marginTop: 10,
                background: "#111",
                color: "#fff",
                borderRadius: 8,
              }}
            >
              Log ind
            </button>
            {fejl && <p style={{ color: "red" }}>{fejl}</p>}
          </div>
        ) : (
          <p>
            Logget ind som <strong>{bruger.navn}</strong> ({bruger.rolle}){" "}
            <button onClick={logUd}>Log ud</button>
          </p>
        )}

        {dag.opgaver.map((o) => (
          <div
            key={o.id}
            style={{
              background: "#fff",
              padding: 12,
              marginTop: 8,
              borderRadius: 8,
            }}
          >
            <label>
              <input
                type="checkbox"
                checked={o.udført}
                disabled={!bruger || dag.godkendt || bruger.rolle !== "bpo"}
                onChange={() => udfør(o.id)}
              />{" "}
              {o.tekst}
            </label>
            {o.tidspunkt && (
              <div style={{ fontSize: 12, color: "#555" }}>
                Udført af {o.udførtAf.map((u) => u.navn).join(", ")} kl.{" "}
                {new Date(o.tidspunkt).toLocaleTimeString("da-DK")}
              </div>
            )}
          </div>
        ))}

        {bruger?.rolle === "bpo" && !dag.godkendt && (
          <div style={{ marginTop: 16 }}>
            <input
              value={adhoc}
              onChange={(e) => setAdhoc(e.target.value)}
              placeholder="Ny AD HOC opgave"
              style={{ width: "100%", padding: 12 }}
            />
            <button onClick={tilføjAdhoc} style={{ width: "100%", marginTop: 8 }}>
              Tilføj
            </button>
          </div>
        )}

        {bruger?.rolle === "logistikchef" && !dag.godkendt && (
          <button
            disabled={!alleUdført}
            onClick={godkend}
            style={{
              marginTop: 16,
              width: "100%",
              padding: 16,
              background: "#065f46",
              color: "#fff",
              borderRadius: 10,
            }}
          >
            Godkend dagen
          </button>
        )}

        {dag.godkendt && (
          <div style={{ marginTop: 20, background: "#ecfdf5", padding: 16 }}>
            Godkendt af {dag.godkendtAf.navn} kl.{" "}
            {new Date(dag.godkendtAf.tid).toLocaleTimeString("da-DK")}
          </div>
        )}
      </div>
    </div>
  );
}