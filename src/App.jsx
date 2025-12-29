import { useEffect, useMemo, useState } from "react";

/* ================================
   KONFIGURATION
================================ */

const SITE = "AG WS";
const STORAGE = "sitehub_ag_ws_full";

const USERS = [
  { id: "oliver", name: "Oliver De Morais Andersen", role: "bpo", pin: "andersen" },
  { id: "william", name: "William Garn Snedker Pedersen", role: "bpo", pin: "pedersen" },
  { id: "emil", name: "Emil Gothart", role: "bpo", pin: "gothart" },

  { id: "martin", name: "Martin Pajesø", role: "koordinator", pin: "pajesø" },
  { id: "catharina", name: "Catharina Andersen", role: "koordinator", pin: "andersen" },
  { id: "hanne", name: "Hanne Brobæk Jensen", role: "koordinator", pin: "jensen" },

  { id: "john", name: "John Storm", role: "logistikchef", pin: "storm" },
  { id: "marie", name: "Marie Grand", role: "logistikchef", pin: "grand" }
];

const BASE_TASKS = [
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

/* ================================
   HJÆLPERE
================================ */

const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" });
const uid = () => Math.random().toString(36).slice(2, 9);

function makeDay(date) {
  return {
    date,
    tasks: BASE_TASKS.map(t => ({ id: uid(), text: t, checks: [] })),
    log: []
  };
}

/* ================================
   APP
================================ */

export default function App() {
  const [db, setDb] = useState({});
  const [date, setDate] = useState(today());
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState("");
  const [pin, setPin] = useState("");
  const [view, setView] = useState("start");
  const [adhoc, setAdhoc] = useState("");

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(STORAGE) || "{}");
    if (!stored[today()]) stored[today()] = makeDay(today());
    setDb(stored);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify(db));
  }, [db]);

  const day = db[date] || makeDay(date);
  const canWork = user && (user.role === "bpo" || user.role === "koordinator");
  const isChef = user && user.role === "logistikchef";

  function login() {
    const u = USERS.find(u => u.id === userId && u.pin === pin.toLowerCase().trim());
    if (!u) return alert("Forkert login");
    setUser(u);
    setView("start");
    setPin("");
  }

  function toggleTask(task) {
    if (!canWork) return;

    const mine = task.checks.find(c => c.user === user.name);
    let newChecks;

    if (mine) {
      if (user.role === "bpo") {
        newChecks = task.checks.filter(c => c.user !== user.name);
        log(`${user.name} fjernede: ${task.text}`);
      } else return;
    } else {
      newChecks = [...task.checks, { user: user.name, time: now() }];
      log(`${user.name} udførte: ${task.text}`);
    }

    updateTasks(task.id, newChecks);
  }

  function updateTasks(id, checks) {
    const updated = {
      ...day,
      tasks: day.tasks.map(t => t.id === id ? { ...t, checks } : t)
    };
    setDb(prev => ({ ...prev, [date]: updated }));
  }

  function log(text) {
    setDb(prev => ({
      ...prev,
      [date]: { ...day, log: [...day.log, { time: now(), text }] }
    }));
  }

  function addAdhoc() {
    if (!canWork || !adhoc.trim()) return;
    const t = { id: uid(), text: "AD HOC: " + adhoc, checks: [] };
    setDb(prev => ({
      ...prev,
      [date]: { ...day, tasks: [...day.tasks, t], log: [...day.log, { time: now(), text: `${user.name} tilføjede ${t.text}` }] }
    }));
    setAdhoc("");
  }

  const leaderboard = useMemo(() => {
    const c = {};
    day.tasks.forEach(t => t.checks.forEach(ch => {
      c[ch.user] = (c[ch.user] || 0) + 1;
    }));
    return Object.entries(c).sort((a,b) => b[1] - a[1]);
  }, [day]);

  const percent = Math.round((day.tasks.filter(t => t.checks.length > 0).length / day.tasks.length) * 100);

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
              {USERS.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
            </select>
            <input value={pin} onChange={e => setPin(e.target.value)} placeholder="Efternavn" className="w-full border p-2 rounded" />
            <button onClick={login} className="w-full bg-black text-white p-3 rounded">Log ind</button>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <button onClick={() => setView("start")} className={`flex-1 p-2 rounded ${view==="start"?"bg-black text-white":"bg-gray-200"}`}>Start</button>
              <button onClick={() => setView("list")} className={`flex-1 p-2 rounded ${view==="list"?"bg-black text-white":"bg-gray-200"}`}>Tjekliste</button>
              {isChef && <button onClick={() => setView("dash")} className={`flex-1 p-2 rounded ${view==="dash"?"bg-black text-white":"bg-gray-200"}`}>Dashboard</button>}
            </div>

            {view === "start" && (
              <div className="bg-white p-4 rounded-xl shadow">
                <h2 className="text-lg font-bold">Godmorgen {user.name.split(" ")[0]}</h2>
                <p>Status: {percent}%</p>
                <h3 className="mt-2 font-bold">🏆 Leaderboard</h3>
                {leaderboard.map((l,i)=><div key={i}>{i+1}. {l[0]} – {l[1]}</div>)}
              </div>
            )}

            {view === "list" && day.tasks.map(t => {
              const mine = t.checks.some(c => c.user === user.name);
              return (
                <div key={t.id} onClick={() => toggleTask(t)} className={`p-3 rounded-xl bg-white shadow ${mine?"line-through text-gray-400":""}`}>
                  {t.text}
                </div>
              );
            })}

            {canWork && (
              <div className="bg-white p-4 rounded-xl shadow">
                <input value={adhoc} onChange={e => setAdhoc(e.target.value)} placeholder="AD-HOC" className="w-full border p-2 rounded" />
                <button onClick={addAdhoc} className="w-full mt-2 bg-gray-800 text-white p-2 rounded">Tilføj</button>
              </div>
            )}

            {view === "dash" && isChef && (
              <div className="bg-white p-4 rounded-xl shadow">
                <h2 className="font-bold mb-2">Dashboard</h2>
                <div>Compliance: {percent}%</div>
                <h3 className="mt-2 font-bold">Log</h3>
                {day.log.map((l,i)=><div key={i}>{l.time} – {l.text}</div>)}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
} 