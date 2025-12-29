import { useEffect, useState } from "react";

const users = [
  { id: 1, name: "Oliver Andersen", role: "BPO", pin: "Andersen" },
  { id: 2, name: "William Pedersen", role: "BPO", pin: "Pedersen" },
  { id: 3, name: "Hanne Jensen", role: "Koordinator", pin: "Jensen" },
  { id: 4, name: "John Storm", role: "Logistikchef", pin: "Storm" },
  { id: 5, name: "Marie Grand", role: "Logistik", pin: "Grand" },
  { id: 6, name: "Catharina Andersen", role: "Pladskoordinator", pin: "Andersen" },
  { id: 7, name: "Emil Gothart", role: "Procesoperatør", pin: "Gothart" }
];

const baseTasks = [
  { id: 1, text: "Arbejdstilladelse – husk sikkerhedskort", type: "Åbning" },
  { id: 2, text: "Tjek alle SiteHub-hegn for skader (inkl. jordvolden)", type: "Åbning" },
  { id: 3, text: "Registrér leverancer i Sitebooking", type: "Åbning" },
  { id: 4, text: "Kontrollér spand med cigaretskodder", type: "Åbning" },
  { id: 5, text: "Ryst / rens spaghettimåtter", type: "Åbning" },
  { id: 6, text: "Rens skærme til fotogenkendelse", type: "Åbning" },
  { id: 7, text: "Skriv besked på Slack ved akutte beskeder", type: "Lukkevagt" },
  { id: 8, text: "Lås container S2", type: "Lukkevagt" },
  { id: 9, text: "Suspendér arbejdstilladelse – ring 30750246", type: "Lukkevagt" }
];

export default function App() {
  const today = new Date().toISOString().slice(0, 10);

  const [currentUser, setCurrentUser] = useState(null);
  const [pin, setPin] = useState("");
  const [date, setDate] = useState(today);
  const [page, setPage] = useState("start");

  const [data, setData] = useState(() => {
    return JSON.parse(localStorage.getItem("sitehub")) || {};
  });

  useEffect(() => {
    localStorage.setItem("sitehub", JSON.stringify(data));
  }, [data]);

  const dayData = data[date] || { tasks: [], log: [] };

  useEffect(() => {
    if (!data[date]) {
      setData(d => ({
        ...d,
        [date]: {
          tasks: baseTasks.map(t => ({ ...t, doneBy: [] })),
          log: []
        }
      }));
    }
  }, [date]);

  function login(user) {
    if (pin !== user.pin) return alert("Forkert pinkode");
    setCurrentUser(user);
    setPin("");
  }

  function logout() {
    setCurrentUser(null);
    setPage("start");
  }

  function toggleTask(taskId) {
    if (!["BPO", "Koordinator"].includes(currentUser.role)) return;

    const updated = dayData.tasks.map(t => {
      if (t.id !== taskId) return t;
      const exists = t.doneBy.find(d => d.name === currentUser.name);
      if (exists) {
        t.doneBy = t.doneBy.filter(d => d.name !== currentUser.name);
        dayData.log.push(`${time()} – ${currentUser.name} fjernede: ${t.text}`);
      } else {
        t.doneBy.push({ name: currentUser.name, time: time() });
        dayData.log.push(`${time()} – ${currentUser.name} udførte: ${t.text}`);
      }
      return t;
    });

    setData(d => ({
      ...d,
      [date]: { ...dayData, tasks: updated }
    }));
  }

  function addAdHoc(text) {
    if (!text) return;
    const newTask = {
      id: Date.now(),
      text,
      type: "AD-HOC",
      doneBy: []
    };
    dayData.tasks.push(newTask);
    setData(d => ({ ...d, [date]: dayData }));
  }

  function time() {
    return new Date().toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" });
  }

  function leaderboard() {
    const scores = {};
    Object.values(data).forEach(day => {
      day.tasks.forEach(t => {
        t.doneBy.forEach(d => {
          scores[d.name] = (scores[d.name] || 0) + 1;
        });
      });
    });
    return Object.entries(scores).sort((a, b) => b[1] - a[1]);
  }

  if (!currentUser) {
    return (
      <div className="p-6 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">SiteHub AG WS</h1>
        <select className="w-full p-2 border rounded mb-2" onChange={e => setCurrentUser(users.find(u => u.id == e.target.value))}>
          <option>Vælg bruger</option>
          {{users.map(u => (
  <option key={u.id} value={u.id}>
    {u.name}
  </option>
))}
        </select>
        <input className="w-full p-2 border rounded mb-2" placeholder="Pinkode" value={pin} onChange={e => setPin(e.target.value)} />
        <button className="w-full bg-black text-white p-2 rounded" onClick={() => login(currentUser)}>Log ind</button>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      <div className="flex justify-between">
        <div>{currentUser.name} ({currentUser.role})</div>
        <button onClick={logout}>Log ud</button>
      </div>

      <div className="flex gap-2 text-sm">
        <button onClick={() => setPage("start")}>Start</button>
        <button onClick={() => setPage("list")}>Tjekliste</button>
        <button onClick={() => setPage("dashboard")}>Dashboard</button>
        <button onClick={() => setPage("leaderboard")}>Leaderboard</button>
      </div>

      {page === "start" && (
        <div>
          <h2 className="text-xl font-bold">Godmorgen 👋</h2>
          <p>God arbejdslyst!</p>
        </div>
      )}

      {page === "list" && (
        <div>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          {dayData.tasks.map(t => (
            <div key={t.id} onClick={() => toggleTask(t.id)} className="p-2 bg-white rounded shadow mb-2 flex justify-between">
              <div className={t.doneBy.length ? "line-through" : ""}>{t.type}: {t.text}</div>
              <div>{t.doneBy.map(d => d.name.split(" ")[0]).join(", ")}</div>
            </div>
          ))}
          <input placeholder="AD-HOC opgave" onKeyDown={e => e.key === "Enter" && addAdHoc(e.target.value)} className="w-full p-2 border rounded" />
        </div>
      )}

      {page === "dashboard" && (
        <div>
          <h2>Udført {dayData.tasks.filter(t => t.doneBy.length).length} / {dayData.tasks.length}</h2>
          <div className="text-sm">{dayData.log.map((l, i) => <div key={i}>{l}</div>)}</div>
        </div>
      )}

      {page === "leaderboard" && (
        <div>
          <h2 className="font-bold">Leaderboard</h2>
          {leaderboard().map(([name, score]) => (
            <div key={name} className="flex justify-between">
              <span>{name}</span>
              <span>{score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}