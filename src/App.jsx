import { useEffect, useMemo, useState } from "react";

/* ==========================
   KONFIGURATION
========================== */

const SITE = "AG WS";
const STORAGE = "sitehub_daily_v7";

const USERS = [
  { id: "oliver", name: "Oliver De Morais Andersen", role: "bpo", pin: "andersen" },
  { id: "william", name: "William Garn Snedker Pedersen", role: "bpo", pin: "pedersen" },
  { id: "emil", name: "Emil Gothart", role: "bpo", pin: "gothart" },

  { id: "catharina", name: "Catharina Andersen", role: "koordinator", pin: "andersen" },
  { id: "hanne", name: "Hanne Brobæk Jensen", role: "koordinator", pin: "jensen" },
  { id: "martin", name: "Martin Pajesø", role: "koordinator", pin: "pajesø" },

  { id: "john", name: "John Storm", role: "logistikchef", pin: "storm" },
  { id: "marie", name: "Marie Grand", role: "logistikchef", pin: "grand" },
];

const BASE_TASKS = [
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

/* ==========================
   HJÆLPERE
========================== */

const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toISOString();
const uid = () => Math.random().toString(36).slice(2, 9);

function makeDay(date) {
  return {
    date,
    locked: false,
    approvedBy: null,
    tasks: BASE_TASKS.map(t => ({ id: uid(), text: t, checks: [] })),
    log: [],
  };
}

/* ==========================
   APP
========================== */

export default function App() {
  const [db, setDb] = useState({});
  const [date, setDate] = useState(today());
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState("");
  const [pin, setPin] = useState("");
  const [adhoc, setAdhoc] = useState("");

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(STORAGE) || "{}");
    if (!saved[today()]) saved[today()] = makeDay(today());
    setDb(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify(db));
  }, [db]);

  const day = db[date] || makeDay(date);

  const canWork = user && (user.role === "bpo" || user.role === "koordinator");
  const isChef = user && user.role === "logistikchef";

  function login() {
    const u = USERS.find(
      u => u.id === userId && u.pin.toLowerCase() === pin.toLowerCase().trim()
    );
    if (!u) return alert("Forkert login");
    setUser(u);
    setPin("");
  }

  function toggleTask(task) {
    if (!canWork || day.locked) return;

    const exists = task.checks.find(c => c.user === user.name);
    let newChecks;
    let action;

    if (exists) {
      if (user.role === "bpo") {
        newChecks = task.checks.filter(c => c.user !== user.name);
        action = "fjernede";
      } else {
        newChecks = [];
        action = "nulstillede";
      }
    } else {
      newChecks = [...task.checks, { user: user.name, time: now() }];
      action = "udførte";
    }

    const updated = {
      ...day,
      tasks: day.tasks.map(t => t.id === task.id ? { ...t, checks: newChecks } : t),
      log: [...day.log, `${new Date().toLocaleTimeString("da-DK")} – ${user.name} ${action}: ${task.text}`],
    };

    setDb(prev => ({ ...prev, [date]: updated }));
  }

  function addAdhoc() {
    if (!canWork || day.locked || !adhoc.trim()) return;

    const updated = {
      ...day,
      tasks: [...day.tasks, { id: uid(), text: adhoc, checks: [], adhoc: true }],
      log: [...day.log, `${new Date().toLocaleTimeString("da-DK")} – ${user.name} tilføjede AD-HOC: ${adhoc}`],
    };

    setDb(prev => ({ ...prev, [date]: updated }));
    setAdhoc("");
  }

  const allDone = day.tasks.every(t => t.checks.length > 0);

  function approve() {
    if (!isChef || !allDone) return;
    setDb(prev => ({
      ...prev,
      [date]: { ...day, locked: true, approvedBy: { name: user.name, time: now() } }
    }));
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-xl mx-auto space-y-4">

        <div className="bg-white p-4 rounded-xl shadow">
          <h1 className="text-xl font-bold">Daglig tjekliste – {SITE}</h1>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-2 w-full border p-2 rounded" />
        </div>

        {!user ? (
          <div className="bg-white p-4 rounded-xl shadow space-y-2">
            <select value={userId} onChange={e => setUserId(e.target.value)} className="w-full border p-2 rounded">
              <option value="">Vælg bruger</option>
              {USERS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <input type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="Efternavn" className="w-full border p-2 rounded" />
            <button onClick={login} className="w-full bg-black text-white p-3 rounded">Log ind</button>
          </div>
        ) : (
          <div className="bg-white p-4 rounded-xl shadow flex justify-between">
            <div>{user.name} ({user.role})</div>
            <button onClick={() => setUser(null)}>Log ud</button>
          </div>
        )}

        {day.tasks.map(t => {
          const mine = t.checks.some(c => c.user === user?.name);
          return (
            <div key={t.id} onClick={() => toggleTask(t)} className={`bg-white p-3 rounded-xl shadow flex justify-between cursor-pointer ${mine ? "line-through text-gray-400" : ""}`}>
              <div>
                {t.text}
                <div className="text-xs text-gray-500">{t.checks.map(c => `${c.user.split(" ")[0]} ${new Date(c.time).toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })}`).join(", ")}</div>
              </div>
              {mine && "✔"}
            </div>
          );
        })}

        {canWork && !day.locked && (
          <div className="bg-white p-4 rounded-xl shadow space-y-2">
            <input value={adhoc} onChange={e => setAdhoc(e.target.value)} placeholder="AD-HOC opgave…" className="w-full border p-2 rounded" />
            <button onClick={addAdhoc} className="w-full bg-gray-800 text-white p-2 rounded">Tilføj</button>
          </div>
        )}

        {isChef && !day.locked && (
          <button disabled={!allDone} onClick={approve} className="w-full bg-green-700 text-white p-3 rounded">
            Godkend dag
          </button>
        )}

        {isChef && (
          <div className="bg-white p-4 rounded-xl shadow">
            <h3 className="font-bold">Dashboard</h3>
            <div>Udført: {day.tasks.filter(t => t.checks.length > 0).length} / {day.tasks.length}</div>
            <div className="mt-2">
              {day.log.map((l, i) => <div key={i} className="text-sm">{l}</div>)}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}