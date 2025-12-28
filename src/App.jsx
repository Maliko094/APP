import { useEffect, useMemo, useState } from "react";

/* =======================
   KONFIGURATION
======================= */

const SITE = "AG WS";

const USERS = [
  { id: "oliver", name: "Oliver De Morais Andersen", role: "bpo", pin: "andersen" },
  { id: "emil", name: "Emil Gothart", role: "bpo", pin: "gothart" },
  { id: "william", name: "William Garn Snedker Pedersen", role: "bpo", pin: "pedersen" },

  { id: "catharina", name: "Catharina Andersen", role: "koordinator", pin: "andersen" },
  { id: "martin", name: "Martin Pajesø", role: "koordinator", pin: "pajesø" },
  { id: "hanne", name: "Hanne Brobæk Jensen", role: "koordinator", pin: "jensen" },

  { id: "john", name: "John Storm", role: "logistikchef", pin: "storm" },
  { id: "marie", name: "Marie Grand", role: "logistikchef", pin: "grand" },
];

const FIXED_TASKS = [
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

/* =======================
   HJÆLPERE
======================= */

const todayKey = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
};

const now = () => new Date().toISOString();

const uid = () => Math.random().toString(36).slice(2, 9);

function emptyDay(date) {
  return {
    date,
    locked: false,
    approvedBy: null,
    tasks: FIXED_TASKS.map(t => ({
      id: uid(),
      text: t,
      checks: []
    })),
    adhoc: [],
    log: []
  };
}

/* =======================
   APP
======================= */

export default function App() {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const [date, setDate] = useState(todayKey());
  const [db, setDb] = useState({});
  const [adhocText, setAdhocText] = useState("");

  /* ===== Load / Save ===== */
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("sitehub_data") || "{}");
    setDb(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("sitehub_data", JSON.stringify(db));
  }, [db]);

  const day = useMemo(() => {
    return db[date] || emptyDay(date);
  }, [db, date]);

  function saveDay(updated) {
    setDb(prev => ({ ...prev, [date]: updated }));
  }

  /* ===== Login ===== */
  function login() {
    const u = USERS.find(
      u => u.id === userId && u.pin.toLowerCase() === pin.toLowerCase().trim()
    );
    if (!u) {
      setError("Forkert bruger eller pinkode");
      return;
    }
    setUser(u);
    setPin("");
    setError("");
  }

  function logout() {
    setUser(null);
    setUserId("");
    setPin("");
  }

  /* ===== Permission ===== */
  const canEdit = user && (user.role === "bpo" || user.role === "koordinator");
  const isChef = user && user.role === "logistikchef";

  /* ===== Task toggle ===== */
  function toggleTask(task) {
    if (!canEdit || day.locked) return;

    const exists = task.checks.find(c => c.user === user.name);

    let newChecks;
    let action;

    if (exists) {
      if (user.role === "bpo") {
        newChecks = task.checks.filter(c => c.user !== user.name);
        action = "fjernede flueben på";
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
      tasks: day.tasks.map(t =>
        t.id === task.id ? { ...t, checks: newChecks } : t
      ),
      log: [
        ...day.log,
        { time: now(), text: `${user.name} ${action} "${task.text}"` }
      ]
    };

    saveDay(updated);
  }

  /* ===== ADHOC ===== */
  function addAdhoc() {
    if (!canEdit || day.locked || !adhocText.trim()) return;

    const task = { id: uid(), text: adhocText, checks: [] };

    const updated = {
      ...day,
      adhoc: [...day.adhoc, task],
      log: [...day.log, { time: now(), text: `${user.name} oprettede AD-HOC: "${adhocText}"` }]
    };

    saveDay(updated);
    setAdhocText("");
  }

  /* ===== Approval ===== */
  const allDone = [...day.tasks, ...day.adhoc].every(t => t.checks.length > 0);

  function approveDay() {
    if (!isChef || !allDone) return;

    saveDay({
      ...day,
      locked: true,
      approvedBy: { name: user.name, time: now() }
    });
  }

  /* =======================
     RENDER
  ======================= */

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-xl mx-auto space-y-4">

        <div className="bg-white p-4 rounded shadow">
          <h1 className="text-xl font-bold">Daglig tjekliste – {SITE}</h1>
          <p className="text-sm text-gray-500">Dato: {date}</p>
        </div>

        {!user ? (
          <div className="bg-white p-4 rounded shadow space-y-2">
            <select className="w-full p-2 border" value={userId} onChange={e => setUserId(e.target.value)}>
              <option value="">Vælg bruger</option>
              {USERS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <input type="password" className="w-full p-2 border" placeholder="Efternavn" value={pin} onChange={e => setPin(e.target.value)} />
            <button className="w-full bg-black text-white p-2" onClick={login}>Log ind</button>
            {error && <div className="text-red-600">{error}</div>}
          </div>
        ) : (
          <div className="bg-white p-4 rounded shadow flex justify-between">
            <div>{user.name} ({user.role})</div>
            <button onClick={logout}>Log ud</button>
          </div>
        )}

        {[...day.tasks, ...day.adhoc].map(t => (
          <div key={t.id} className="bg-white p-3 rounded shadow flex justify-between">
            <div className={t.checks.length ? "line-through text-gray-400" : ""}>{t.text}</div>
            <button onClick={() => toggleTask(t)} className="text-xl">✔</button>
          </div>
        ))}

        {canEdit && !day.locked && (
          <div className="bg-white p-4 rounded shadow space-y-2">
            <input className="w-full p-2 border" placeholder="AD-HOC opgave…" value={adhocText} onChange={e => setAdhocText(e.target.value)} />
            <button className="w-full bg-gray-800 text-white p-2" onClick={addAdhoc}>Tilføj</button>
          </div>
        )}

        {isChef && !day.locked && (
          <button disabled={!allDone} onClick={approveDay} className="w-full p-3 bg-green-700 text-white rounded">
            Godkend dag
          </button>
        )}

        {day.locked && (
          <div className="bg-green-100 p-4 rounded">
            Godkendt af {day.approvedBy?.name}
          </div>
        )}

        {isChef && (
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-bold mb-2">Log</h3>
            {day.log.map((l, i) => (
              <div key={i} className="text-sm text-gray-600">{l.text}</div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}