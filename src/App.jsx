import { useState, useEffect } from "react";

/* ===============================
   DATA
================================*/

const USERS = [
  { id: 1, name: "Oliver Andersen", role: "BPO" },
  { id: 2, name: "William Pedersen", role: "BPO" },
  { id: 3, name: "Hanne Jensen", role: "Koordinator" },
  { id: 4, name: "John Storm", role: "Logistikchef" },
  { id: 5, name: "Marie Grand", role: "Logistik" },
  { id: 6, name: "Catharina Andersen", role: "Pladskoordinator" },
  { id: 7, name: "Emil Gothart", role: "Procesoperatør" }
];

const BASE_TASKS = [
  { id: 1, title: "Arbejdstilladelse – husk sikkerhedskort", type: "Åbning" },
  { id: 2, title: "Tjek alle SiteHub-hegn for skader", type: "Åbning" },
  { id: 3, title: "Registrér leverancer i Sitebooking", type: "Åbning" },
  { id: 4, title: "Kontrollér spand med cigaretskodder", type: "Åbning" },
  { id: 5, title: "Ryst / rens spaghettimåtter", type: "Åbning" },
  { id: 6, title: "Rens skærme til fotogenkendelse", type: "Åbning" },
  { id: 7, title: "Skriv besked på Slack ved akutte beskeder", type: "Lukkevagt" },
  { id: 8, title: "Lås container S2", type: "Lukkevagt" },
  { id: 9, title: "Suspendér arbejdstilladelse", type: "Lukkevagt" }
];

/* ===============================
   HELPERS
================================*/

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function load(key, fallback) {
  return JSON.parse(localStorage.getItem(key)) || fallback;
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/* ===============================
   APP
================================*/

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("start");

  const [tasks, setTasks] = useState(() =>
    load("tasks_" + todayKey(), BASE_TASKS.map(t => ({ ...t, doneBy: null, time: null })))
  );

  const [log, setLog] = useState(() => load("log", []));
  const [adHoc, setAdHoc] = useState(() => load("adhoc_" + todayKey(), []));
  const [newAdhoc, setNewAdhoc] = useState("");

  useEffect(() => {
    save("tasks_" + todayKey(), tasks);
    save("log", log);
    save("adhoc_" + todayKey(), adHoc);
  }, [tasks, log, adHoc]);

  function toggleTask(taskId) {
    if (!["BPO", "Koordinator"].includes(user.role)) return;

    setTasks(prev =>
      prev.map(t => {
        if (t.id !== taskId) return t;
        const done = t.doneBy ? null : user.name;
        const time = done ? new Date().toLocaleTimeString() : null;

        setLog(l => [
          { time: new Date().toLocaleTimeString(), text: `${user.name} ${done ? "udførte" : "fjernede"}: ${t.title}` },
          ...l
        ]);

        return { ...t, doneBy: done, time };
      })
    );
  }

  function addAdhoc() {
    if (!newAdhoc.trim()) return;
    setAdHoc([...adHoc, { id: Date.now(), title: newAdhoc, doneBy: null, time: null }]);
    setNewAdhoc("");
  }

  function toggleAdhoc(id) {
    if (!["BPO", "Koordinator"].includes(user.role)) return;
    setAdHoc(prev =>
      prev.map(a => {
        if (a.id !== id) return a;
        const done = a.doneBy ? null : user.name;
        const time = done ? new Date().toLocaleTimeString() : null;

        setLog(l => [
          { time: new Date().toLocaleTimeString(), text: `${user.name} ${done ? "udførte" : "fjernede"} AD-HOC: ${a.title}` },
          ...l
        ]);

        return { ...a, doneBy: done, time };
      })
    );
  }

  const doneCount = tasks.filter(t => t.doneBy).length + adHoc.filter(a => a.doneBy).length;

  const leaderboard = {};
  log.forEach(l => {
    const name = l.text.split(" ")[0];
    leaderboard[name] = (leaderboard[name] || 0) + 1;
  });

  /* ===============================
     LOGIN
  ================================*/

  if (!user) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold mb-4">SiteHub AG WS</h1>
        {USERS.map(u => (
          <button
            key={u.id}
            className="block w-full bg-gray-100 p-3 mb-2 rounded"
            onClick={() => setUser(u)}
          >
            {u.name} ({u.role})
          </button>
        ))}
      </div>
    );
  }

  /* ===============================
     UI
  ================================*/

  return (
    <div className="p-4 max-w-xl mx-auto">
      <div className="flex justify-between mb-3">
        <div>{user.name} ({user.role})</div>
        <button onClick={() => setUser(null)}>Log ud</button>
      </div>

      <div className="flex gap-2 mb-4">
        {["start", "tjek", "dashboard", "leader"].map(v => (
          <button key={v} onClick={() => setView(v)}>{v}</button>
        ))}
      </div>

      {view === "start" && (
        <div>
          <h2 className="text-xl">Godmorgen 👋</h2>
          <p>{doneCount} opgaver udført i dag</p>
        </div>
      )}

      {view === "tjek" && (
        <>
          {tasks.map(t => (
            <div key={t.id} className={`p-3 mb-2 rounded ${t.doneBy ? "bg-green-200 line-through" : "bg-white"}`} onClick={() => toggleTask(t.id)}>
              <b>{t.type}:</b> {t.title}
              {t.doneBy && <div>{t.doneBy} – {t.time}</div>}
            </div>
          ))}

          <h3>AD-HOC</h3>
          {adHoc.map(a => (
            <div key={a.id} className={`p-2 ${a.doneBy ? "line-through" : ""}`} onClick={() => toggleAdhoc(a.id)}>
              {a.title}
            </div>
          ))}

          <input value={newAdhoc} onChange={e => setNewAdhoc(e.target.value)} placeholder="Ny AD-HOC opgave" />
          <button onClick={addAdhoc}>Tilføj</button>
        </>
      )}

      {view === "dashboard" && (
        <div>
          {log.map((l, i) => (
            <div key={i}>{l.time} – {l.text}</div>
          ))}
        </div>
      )}

      {view === "leader" && (
        <div>
          {Object.entries(leaderboard).map(([name, count]) => (
            <div key={name}>{name}: {count}</div>
          ))}
        </div>
      )}
    </div>
  );
}