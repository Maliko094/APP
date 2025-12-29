import { useEffect, useState } from "react";

/* ================= USERS ================= */
const USERS = [
  { name: "Oliver De Morais Andersen", role: "bpo", pin: "Andersen" },
  { name: "William Garn Snedker Pedersen", role: "bpo", pin: "Pedersen" },
  { name: "Emil Gothart", role: "bpo", pin: "Gothart" },

  { name: "Martin Pajesø", role: "koordinator", pin: "Pajesø" },
  { name: "Catharina Andersen", role: "koordinator", pin: "Andersen" },
  { name: "Hanne Brobæk Jensen", role: "koordinator", pin: "Jensen" },

  { name: "John Storm", role: "logistikchef", pin: "Storm" },
  { name: "Marie Grand", role: "logistikchef", pin: "Grand" }
];

/* ================= TASKS ================= */
const OPENING = [
  "Arbejdstilladelse – husk sikkerhedskort",
  "Tjek alle SiteHub-hegn for skader",
  "Registrér leverancer i Sitebooking",
  "Kontrollér spand med cigaretskodder",
  "Ryst / rens spaghettimåtter",
  "Rens skærme til fotogenkendelse"
];

const CLOSING = [
  "Skriv besked på Slack ved akutte beskeder",
  "Lås container S2",
  "Suspendér arbejdstilladelse – ring 30750246"
];

/* ================= HELPERS ================= */
const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" });

function loadData() {
  return JSON.parse(localStorage.getItem("sitehub")) || {};
}

function saveData(d) {
  localStorage.setItem("sitehub", JSON.stringify(d));
}

/* ================= APP ================= */
export default function App() {
  const [user, setUser] = useState(null);
  const [pin, setPin] = useState("");
  const [view, setView] = useState("start");
  const [date, setDate] = useState(today());
  const [adhoc, setAdhoc] = useState("");

  const data = loadData();
  if (!data[date]) {
    data[date] = {
      tasks: [...OPENING.map(t => ({ text: t, type: "åbning", actions: [] })),
              ...CLOSING.map(t => ({ text: t, type: "lukkevagt", actions: [] }))],
      adhoc: [],
      log: []
    };
    saveData(data);
  }

  const day = data[date];

  /* ================= LOGIN ================= */
  function login(name) {
    const u = USERS.find(u => u.name === name && u.pin === pin);
    if (!u) return alert("Forkert pinkode");
    setUser(u);
    setPin("");
  }

  function logout() {
    setUser(null);
    setView("start");
  }

  /* ================= TOGGLE ================= */
  function toggle(task) {
    if (!user || !["bpo", "koordinator"].includes(user.role)) return;

    const existing = task.actions.find(a => a.user === user.name);
    if (existing) {
      task.actions = task.actions.filter(a => a.user !== user.name);
      day.log.push({ time: now(), user: user.name, text: `fjernede: ${task.text}` });
    } else {
      task.actions.push({ user: user.name, time: now() });
      day.log.push({ time: now(), user: user.name, text: `udførte: ${task.text}` });
    }
    saveData(data);
    setView(v => v);
  }

  /* ================= AD HOC ================= */
  function addAdhoc() {
    if (!adhoc.trim()) return;
    day.adhoc.push({ text: adhoc, actions: [] });
    day.log.push({ time: now(), user: user.name, text: `oprettede AD-HOC: ${adhoc}` });
    setAdhoc("");
    saveData(data);
    setView(v => v);
  }

  /* ================= STATS ================= */
  const allActions = Object.values(data).flatMap(d =>
    [...d.tasks, ...d.adhoc].flatMap(t => t.actions.map(a => a.user))
  );

  const leaderboard = USERS.map(u => ({
    name: u.name,
    score: allActions.filter(a => a === u.name).length
  })).sort((a, b) => b.score - a.score);

  /* ================= UI ================= */
  if (!user) {
    return (
      <div className="p-6 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">Daglig tjekliste – AG WS</h1>
        <select className="w-full p-2 mb-2 border" onChange={e => setUser({ name: e.target.value })}>
          <option>Vælg bruger</option>
          {USERS.map(u => <option key={u.name}>{u.name}</option>)}
        </select>
        <input className="w-full p-2 mb-2 border" placeholder="Efternavn"
          value={pin} onChange={e => setPin(e.target.value)} />
        <button className="w-full p-3 bg-black text-white"
          onClick={() => login(user?.name)}>Log ind</button>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <div>{user.name} ({user.role})</div>
        <button onClick={logout}>Log ud</button>
      </div>

      <div className="flex gap-3 text-sm">
        <button onClick={() => setView("start")}>Start</button>
        <button onClick={() => setView("list")}>Tjekliste</button>
        <button onClick={() => setView("dashboard")}>Dashboard</button>
        <button onClick={() => setView("leaderboard")}>Leaderboard</button>
      </div>

      {view === "start" && (
        <div>
          <h2 className="text-xl">Godmorgen 👋</h2>
          <p>God arbejdslyst.</p>
          <h3 className="mt-4 font-bold">Top i dag</h3>
          {leaderboard.slice(0,3).map(l => <div key={l.name}>{l.name}: {l.score}</div>)}
        </div>
      )}

      {view === "list" && (
        <>
          {[...day.tasks, ...day.adhoc].map((t,i) => (
            <div key={i} onClick={() => toggle(t)}
              className={`p-3 rounded border ${t.actions.length ? "line-through bg-green-100" : ""}`}>
              {t.type && <small>{t.type}</small>} {t.text}
              {t.actions.map(a => <div key={a.user}>{a.user} {a.time}</div>)}
            </div>
          ))}
          <input value={adhoc} onChange={e=>setAdhoc(e.target.value)} className="w-full p-2 border" placeholder="AD-HOC opgave"/>
          <button onClick={addAdhoc} className="w-full bg-black text-white p-3">Tilføj</button>
        </>
      )}

      {view === "dashboard" && (
        <div>
          <h2 className="font-bold">Log</h2>
          {day.log.map((l,i)=><div key={i}>{l.time} – {l.user} {l.text}</div>)}
        </div>
      )}

      {view === "leaderboard" && (
        <div>
          <h2 className="font-bold">Leaderboard</h2>
          {leaderboard.map(l=><div key={l.name}>{l.name}: {l.score}</div>)}
        </div>
      )}
    </div>
  );
}