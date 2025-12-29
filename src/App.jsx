import { useEffect, useMemo, useState } from "react";

const SITE = "AG WS";

const USERS = [
  { id: 1, name: "Oliver De Morais Andersen", role: "bpo", pin: "Andersen" },
  { id: 2, name: "William Garn Snedker Pedersen", role: "bpo", pin: "Pedersen" },
  { id: 3, name: "Hanne Brobæk Jensen", role: "koordinator", pin: "Jensen" },
  { id: 4, name: "Martin Pajesø", role: "koordinator", pin: "Pajesø" },
  { id: 5, name: "Marie Grand", role: "logistikchef", pin: "Grand" },
  { id: 6, name: "John Storm", role: "logistik", pin: "Storm" }
];

const BASE_TASKS = [
  { id: 1, text: "Arbejdstilladelse – husk sikkerhedskort", type: "Åbning" },
  { id: 2, text: "Tjek alle SiteHub-hegn for skader", type: "Åbning" },
  { id: 3, text: "Registrér leverancer i Sitebooking", type: "Åbning" },
  { id: 4, text: "Kontrollér spand med cigaretskodder", type: "Åbning" },
  { id: 5, text: "Ryst / rens spaghettimåtter", type: "Åbning" },
  { id: 6, text: "Rens skærme til fotogenkendelse", type: "Åbning" },
  { id: 7, text: "Skriv besked på Slack ved akutte beskeder", type: "Lukkevagt" },
  { id: 8, text: "Lås container S2", type: "Lukkevagt" },
  { id: 9, text: "Suspendér arbejdstilladelse", type: "Lukkevagt" }
];

const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toISOString();

export default function App() {
  const [user, setUser] = useState(null);
  const [pin, setPin] = useState("");
  const [userId, setUserId] = useState("");

  const [view, setView] = useState("login");
  const [data, setData] = useState(null);
  const [adhoc, setAdhoc] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem("sitehub-" + today());
    if (raw) setData(JSON.parse(raw));
    else {
      const fresh = {
        date: today(),
        tasks: BASE_TASKS.map(t => ({
          ...t,
          done: false,
          doneBy: [],
          time: null
        })),
        adhoc: [],
        log: []
      };
      setData(fresh);
      localStorage.setItem("sitehub-" + today(), JSON.stringify(fresh));
    }
  }, []);

  useEffect(() => {
    if (data) localStorage.setItem("sitehub-" + today(), JSON.stringify(data));
  }, [data]);

  function login() {
    const u = USERS.find(u => u.id === Number(userId) && u.pin === pin);
    if (!u) return alert("Forkert pinkode");
    setUser(u);
    setView("start");
  }

  function toggleTask(id) {
    if (!["bpo", "koordinator"].includes(user.role)) return;

    setData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => {
        if (t.id !== id) return t;
        if (t.done && !t.doneBy.find(x => x.name === user.name)) return t;

        const done = !t.done;
        return {
          ...t,
          done,
          doneBy: done ? [...t.doneBy, { name: user.name, time: now() }] : t.doneBy.filter(x => x.name !== user.name),
          time: now()
        };
      }),
      log: [...prev.log, `${user.name} ændrede opgave ${id}`]
    }));
  }

  function addAdhoc() {
    if (!adhoc) return;
    setData(prev => ({
      ...prev,
      adhoc: [...prev.adhoc, { id: Math.random(), text: adhoc, by: user.name, time: now() }]
    }));
    setAdhoc("");
  }

  const leaderboard = useMemo(() => {
    const score = {};
    data?.tasks.forEach(t =>
      t.doneBy.forEach(u => (score[u.name] = (score[u.name] || 0) + 1))
    );
    return score;
  }, [data]);

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {!user ? (
        <div className="max-w-md mx-auto bg-white p-4 rounded">
          <select onChange={e => setUserId(e.target.value)} className="w-full p-2 mb-2">
            <option value="">Vælg bruger</option>
            {USERS.map(u => (
              <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
            ))}
          </select>
          <input value={pin} onChange={e => setPin(e.target.value)} placeholder="Pinkode (efternavn)" className="w-full p-2 mb-2" />
          <button onClick={login} className="w-full bg-black text-white p-2">Log ind</button>
        </div>
      ) : (
        <>
          <div className="flex justify-between mb-2">
            <div>{user.name} ({user.role})</div>
            <button onClick={() => { setUser(null); setView("login"); }}>Log ud</button>
          </div>

          <div className="flex gap-2 mb-4">
            <button onClick={() => setView("start")}>Start</button>
            <button onClick={() => setView("check")}>Tjekliste</button>
            <button onClick={() => setView("dash")}>Dashboard</button>
            <button onClick={() => setView("leader")}>Leaderboard</button>
          </div>

          {view === "check" && (
            <>
              {data.tasks.map(t => (
                <div key={t.id} className={`p-2 bg-white mb-2 rounded ${t.done ? "line-through opacity-50" : ""}`}>
                  <div className="flex justify-between">
                    <span>{t.type}: {t.text}</span>
                    <button onClick={() => toggleTask(t.id)}>✔</button>
                  </div>
                  {t.doneBy.length > 0 && (
                    <div className="text-xs text-gray-500">
                      {t.doneBy.map(x => x.name).join(", ")}
                    </div>
                  )}
                </div>
              ))}

              <input value={adhoc} onChange={e => setAdhoc(e.target.value)} className="w-full p-2" placeholder="AD HOC opgave" />
              <button onClick={addAdhoc} className="w-full bg-black text-white p-2 mt-2">Tilføj</button>
            </>
          )}

          {view === "leader" && (
            <div>
              {Object.entries(leaderboard).map(([n, v]) => (
                <div key={n}>{n}: {v}</div>
              ))}
            </div>
          )}

          {view === "dash" && (
            <div>
              {data.log.map((l, i) => <div key={i}>{l}</div>)}
            </div>
          )}
        </>
      )}
    </div>
  );
}