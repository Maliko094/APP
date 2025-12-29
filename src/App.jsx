import { useEffect, useMemo, useState } from "react";

/* ===================================
   KONFIGURATION
=================================== */

const SITE = "AG WS";

const USERS = [
  { id: 1, name: "Oliver Hansen", role: "BPO", pin: "hansen" },
  { id: 2, name: "Emil Jensen", role: "BPO", pin: "jensen" },
  { id: 3, name: "William Nielsen", role: "BPO", pin: "nielsen" },

  { id: 4, name: "Martin Larsen", role: "Koordinator", pin: "larsen" },
  { id: 5, name: "Catharina Madsen", role: "Koordinator", pin: "madsen" },
  { id: 6, name: "Hanne Pedersen", role: "Koordinator", pin: "pedersen" },

  { id: 7, name: "Jon Sørensen", role: "Logistik", pin: "sorensen" },
  { id: 8, name: "Marie Holm", role: "Logistik", pin: "holm" },
];

const TASKS = [
  "Åbne arbejdstilladelse",
  "Tjek hegn",
  "Modtag leverancer",
  "Rens scanner",
  "Tag følgeseddel billede",
  "Tjek cigaretskodder",
  "Rens måtter",
  "Oprydning",
  "Luk porte",
  "Plads lukket korrekt",
];

const STORAGE = "SITEHUB_DATA_V1";

/* ===================================
   HJÆLPERE
=================================== */

const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toISOString();
const uid = () => Math.random().toString(36).slice(2, 9);

function newDay() {
  return {
    date: today(),
    tasks: TASKS.map(t => ({
      id: uid(),
      text: t,
      done: false,
      people: [],
      time: null
    })),
    adhoc: [],
    approved: null
  };
}

/* ===================================
   APP
=================================== */

export default function App() {
  const [data, setData] = useState({});
  const [user, setUser] = useState(null);
  const [pin, setPin] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [page, setPage] = useState("start");
  const [adhocText, setAdhocText] = useState("");

  /* Load */
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(STORAGE) || "{}");
    if (!saved[today()]) saved[today()] = newDay();
    setData(saved);
    localStorage.setItem(STORAGE, JSON.stringify(saved));
  }, []);

  /* Save */
  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify(data));
  }, [data]);

  const day = data[today()];

  /* LOGIN */
  function login() {
    const u = USERS.find(
      x => x.id === Number(selectedUser) && x.pin === pin.toLowerCase()
    );
    if (!u) return alert("Forkert login");
    setUser(u);
    setPin("");
  }

  function logout() {
    setUser(null);
    setPage("start");
  }

  /* TASK */
  function toggleTask(id) {
    if (!user || (user.role !== "BPO" && user.role !== "Koordinator")) return;

    setData(prev => {
      const copy = { ...prev };
      const t = copy[today()].tasks.find(t => t.id === id);
      if (!t) return prev;

      if (t.done) {
        t.people = t.people.filter(p => p !== user.name);
        if (t.people.length === 0) {
          t.done = false;
          t.time = null;
        }
      } else {
        t.done = true;
        t.people.push(user.name);
        t.time = now();
      }

      return copy;
    });
  }

  function addAdhoc() {
    if (!adhocText) return;
    setData(prev => {
      const copy = { ...prev };
      copy[today()].adhoc.push({
        id: uid(),
        text: adhocText,
        done: false,
        people: [],
        time: null
      });
      return copy;
    });
    setAdhocText("");
  }

  const leaderboard = useMemo(() => {
    const score = {};
    Object.values(data).forEach(d => {
      d.tasks.concat(d.adhoc).forEach(t => {
        t.people.forEach(p => {
          score[p] = (score[p] || 0) + 1;
        });
      });
    });
    return Object.entries(score).sort((a, b) => b[1] - a[1]);
  }, [data]);

  if (!day) return null;

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {!user && (
        <div className="max-w-sm mx-auto bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4">SiteHub Login</h2>

          <select
            className="w-full p-2 border mb-2"
            value={selectedUser}
            onChange={e => setSelectedUser(e.target.value)}
          >
            <option value="">Vælg bruger</option>
            {USERS.map(u => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>

          <input
            className="w-full p-2 border mb-2"
            placeholder="Pinkode"
            value={pin}
            onChange={e => setPin(e.target.value)}
          />

          <button
            className="w-full bg-black text-white p-2"
            onClick={login}
          >
            Log ind
          </button>
        </div>
      )}

      {user && (
        <div>
          <div className="flex justify-between mb-4">
            <div>{user.name} ({user.role})</div>
            <button onClick={logout}>Log ud</button>
          </div>

          <div className="flex gap-2 mb-4">
            <button onClick={() => setPage("start")}>Start</button>
            <button onClick={() => setPage("tasks")}>Tjekliste</button>
            <button onClick={() => setPage("leaderboard")}>Leaderboard</button>
          </div>

          {page === "tasks" && (
            <div>
              {day.tasks.map(t => (
                <div
                  key={t.id}
                  className={`p-2 mb-2 border ${t.done ? "line-through text-green-600" : ""}`}
                  onClick={() => toggleTask(t.id)}
                >
                  {t.text} {t.people.length > 0 && `(${t.people.join(", ")})`}
                </div>
              ))}

              <input
                className="w-full p-2 border"
                placeholder="Ad-hoc opgave"
                value={adhocText}
                onChange={e => setAdhocText(e.target.value)}
              />
              <button onClick={addAdhoc}>Tilføj</button>
            </div>
          )}

          {page === "leaderboard" && (
            <div>
              {leaderboard.map(([n, s]) => (
                <div key={n}>{n}: {s}</div>
              ))}
            </div>
          )}

          {page === "start" && (
            <div className="text-center">
              <h1 className="text-2xl font-bold">Godmorgen 👋</h1>
              <p>Site {SITE}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}