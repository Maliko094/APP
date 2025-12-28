import { useEffect, useMemo, useState } from "react";

/* =========================
   KONFIGURATION
========================= */

const SITE = "AG WS";
const STORAGE = "sitehub_ag_ws_v1";

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

/* =========================
   HJÆLPERE
========================= */

const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toISOString();
const uid = () => Math.random().toString(36).slice(2, 9);

function makeDay(date) {
  return {
    date,
    tasks: BASE_TASKS.map(t => ({ id: uid(), text: t, checks: [] })),
    log: []
  };
}

/* =========================
   APP
========================= */

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
    const u = USERS.find(
      u => u.id === userId && u.pin.toLowerCase() === pin.toLowerCase().trim()
    );
    if (!u) return alert("Forkert login");
    setUser(u);
    setView(u.role === "logistikchef" ? "dashboard" : "start");
    setPin("");
  }

  function toggleTask(task) {
    if (!canWork) return;

    const exists = task.checks.find(c => c.user === user.name);
    let newChecks;

    if (exists) {
      if (user.role === "bpo") {
        newChecks = task.checks.filter(c => c.user !== user.name);
      } else {
        newChecks = [];
      }
    } else {
      newChecks = [...task.checks, { user: user.name, time: now() }];
    }

    const updated = {
      ...day,
      tasks: day.tasks.map(t => t.id === task.id ? { ...t, checks: newChecks } : t),
      log: [...day.log, `${user.name} ændrede: ${task.text}`]
    };

    setDb(prev => ({ ...prev, [date]: updated }));
  }

  function addAdhoc() {
    if (!canWork || !adhoc.trim()) return;

    const updated = {
      ...day,
      tasks: [...day.tasks, { id: uid(), text: adhoc, checks: [] }],
      log: [...day.log, `${user.name} tilføjede AD-HOC: ${adhoc}`]
    };

    setDb(prev => ({ ...prev, [date]: updated }));
    setAdhoc("");
  }

  const total = day.tasks.length;
  const done = day.tasks.filter(t => t.checks.length > 0).length;
  const percent = Math.round((done / total) * 100);
  const color = percent === 100 ? "bg-green-200" : percent >= 80 ? "bg-yellow-200" : "bg-red-200";

  const leaderboard = {};
  day.tasks.forEach(t => t.checks.forEach(c => {
    leaderboard[c.user] = (leaderboard[c.user] || 0) + 1;
  }));

  const leaderboardList = Object.entries(leaderboard).sort((a, b) => b[1] - a[1]);
  const missing = day.tasks.filter(t => t.checks.length === 0);

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
            <input value={pin} onChange={e => setPin(e.target.value)} placeholder="Efternavn" className="w-full border p-2 rounded" />
            <button onClick={login} className="w-full bg-black text-white p-3 rounded">Log ind</button>
          </div>
        ) : (
          <>
            {user.role !== "logistikchef" && (
              <div className="flex gap-2">
                <button onClick={() => setView("start")} className={`flex-1 p-2 rounded ${view === "start" ? "bg-black text-white" : "bg-gray-200"}`}>Start</button>
                <button onClick={() => setView("tjekliste")} className={`flex-1 p-2 rounded ${view === "tjekliste" ? "bg-black text-white" : "bg-gray-200"}`}>Tjekliste</button>
              </div>
            )}

            {view === "start" && (
              <div className={`p-4 rounded-xl shadow ${color}`}>
                <h2 className="text-lg font-bold">Godmorgen {user.name.split(" ")[0]}</h2>
                <div>Status: {done}/{total} ({percent}%)</div>
                <div className="mt-2 font-bold">Leaderboard</div>
                {leaderboardList.map(([n, c], i) => <div key={n}>{i + 1}. {n} – {c}</div>)}
                <div className="mt-2 font-bold">Mangler</div>
                {missing.map(t => <div key={t.id}>{t.text}</div>)}
              </div>
            )}

            {view === "tjekliste" && day.tasks.map(t => {
              const mine = t.checks.some(c => c.user === user.name);
              return (
                <div key={t.id} onClick={() => toggleTask(t)} className={`bg-white p-3 rounded-xl shadow cursor-pointer ${mine ? "line-through text-gray-400" : ""}`}>
                  {t.text}
                </div>
              );
            })}

            {canWork && (
              <div className="bg-white p-4 rounded-xl shadow">
                <input value={adhoc} onChange={e => setAdhoc(e.target.value)} placeholder="AD-HOC opgave" className="w-full border p-2 rounded" />
                <button onClick={addAdhoc} className="w-full bg-gray-800 text-white p-2 mt-2 rounded">Tilføj</button>
              </div>
            )}

            {isChef && (
              <div className="bg-white p-4 rounded-xl shadow">
                <h3 className="font-bold">Dashboard</h3>
                <div className={`p-2 ${color}`}>Compliance: {percent}%</div>
                <div className="mt-2">🏆 {leaderboardList[0]?.[0]}</div>
                <div className="mt-2 font-bold">Log</div>
                {day.log.map((l, i) => <div key={i} className="text-sm">{l}</div>)}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
} 