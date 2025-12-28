import { useEffect, useMemo, useState } from "react";

const SITE = "AG WS";
const STORAGE_KEY = "bpo_daglig_data_v5";

/* ========= BRUGERE ========= */
const USERS = [
  { id: "oliver", name: "Oliver De Morais Andersen", role: "bpo", pin: "Andersen" },
  { id: "william", name: "William Garn Snedker Pedersen", role: "bpo", pin: "Pedersen" },
  { id: "emil", name: "Emil Gothart", role: "bpo", pin: "Gothart" },

  { id: "catharina", name: "Catharina Andersen", role: "koordinator", pin: "Andersen" },
  { id: "hanne", name: "Hanne Brobæk Jensen", role: "koordinator", pin: "Jensen" },
  { id: "martin", name: "Martin Pajesø", role: "koordinator", pin: "Pajesø" },

  { id: "john", name: "John Storm", role: "logistikchef", pin: "Storm" },
  { id: "marie", name: "Marie Grand", role: "logistikchef", pin: "Grand" },
];

/* ========= OPGAVER ========= */
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

const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toISOString();
const uid = () => Math.random().toString(36).slice(2, 9);

function newDay() {
  return {
    date: today(),
    tasks: BASE_TASKS.map(t => ({
      id: uid(),
      text: t,
      checks: [], // { user, time }
    })),
    log: [],
  };
}

/* ========= APP ========= */
export default function App() {
  const [db, setDb] = useState({});
  const [date, setDate] = useState(today());
  const [userId, setUserId] = useState("");
  const [pin, setPin] = useState("");
  const [user, setUser] = useState(null);
  const [adhoc, setAdhoc] = useState("");

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    setDb(stored);
    if (!stored[today()]) {
      const n = newDay();
      stored[today()] = n;
      setDb({ ...stored });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    }
  }, []);

  const day = db[date];

  useEffect(() => {
    if (db && date) localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }, [db, date]);

  function login() {
    const u = USERS.find(u => u.id === userId && u.pin === pin);
    if (!u) return alert("Forkert login");
    setUser(u);
    setPin("");
  }

  function logout() {
    setUser(null);
  }

  function toggleTask(id) {
    if (!user) return;

    setDb(prev => {
      const copy = { ...prev };
      const d = { ...copy[date] };
      const task = d.tasks.find(t => t.id === id);

      const existing = task.checks.find(c => c.user === user.name);

      if (existing) {
        task.checks = task.checks.filter(c => c.user !== user.name);
        d.log.push(`${user.name} fjernede "${task.text}"`);
      } else {
        task.checks.push({ user: user.name, time: now() });
        d.log.push(`${user.name} udførte "${task.text}"`);
      }

      copy[date] = d;
      return copy;
    });
  }

  function addAdhoc() {
    if (!adhoc.trim()) return;
    setDb(prev => {
      const copy = { ...prev };
      copy[date].tasks.push({
        id: uid(),
        text: adhoc.trim(),
        checks: [],
        adhoc: true,
      });
      copy[date].log.push(`${user.name} tilføjede AD-HOC: "${adhoc}"`);
      return copy;
    });
    setAdhoc("");
  }

  function resetDay() {
    if (user.role !== "koordinator") return;
    setDb(prev => {
      const copy = { ...prev };
      copy[date] = newDay();
      return copy;
    });
  }

  if (!day) return null;

  return (
    <div className="min-h-screen bg-slate-100 p-4">
      <div className="max-w-xl mx-auto space-y-4">

        <div className="bg-white p-4 rounded-xl shadow">
          <h1 className="text-2xl font-bold">Daglig tjekliste</h1>
          <p className="text-gray-500">SiteHub {SITE}</p>

          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-2 w-full p-2 border rounded" />
        </div>

        {!user ? (
          <div className="bg-white p-4 rounded-xl shadow space-y-2">
            <select value={userId} onChange={e => setUserId(e.target.value)} className="w-full p-2 border rounded">
              <option value="">Vælg bruger</option>
              {USERS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <input value={pin} onChange={e => setPin(e.target.value)} placeholder="Efternavn" className="w-full p-2 border rounded" />
            <button onClick={login} className="w-full bg-black text-white p-3 rounded">Log ind</button>
          </div>
        ) : (
          <div className="bg-white p-4 rounded-xl shadow flex justify-between">
            <div>{user.name} ({user.role})</div>
            <button onClick={logout}>Log ud</button>
          </div>
        )}

        {day.tasks.map(t => {
          const mine = t.checks.some(c => c.user === user?.name);
          return (
            <div key={t.id} onClick={() => user && toggleTask(t.id)}
              className={`p-4 rounded-xl shadow flex justify-between items-center bg-white cursor-pointer ${mine ? "line-through text-gray-400" : ""}`}>
              <div>
                {t.text}
                <div className="text-xs text-gray-400">
                  {t.checks.length} udført
                </div>
              </div>
              {mine && "✔"}
            </div>
          );
        })}

        {user?.role === "bpo" && (
          <div className="bg-white p-4 rounded-xl shadow">
            <input value={adhoc} onChange={e => setAdhoc(e.target.value)} placeholder="AD-HOC opgave" className="w-full p-2 border rounded" />
            <button onClick={addAdhoc} className="mt-2 w-full bg-black text-white p-2 rounded">Tilføj</button>
          </div>
        )}

        {user?.role === "koordinator" && (
          <button onClick={resetDay} className="w-full bg-red-600 text-white p-3 rounded">Nulstil dagen</button>
        )}

        {user?.role === "logistikchef" && (
          <div className="bg-white p-4 rounded-xl shadow">
            <h3 className="font-bold">Log</h3>
            {day.log.map((l, i) => <div key={i} className="text-sm">{l}</div>)}
          </div>
        )}

      </div>
    </div>
  );
}