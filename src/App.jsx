import { useEffect, useState } from "react";

/* ================= USERS ================= */
const USERS = [
  { id: 1, name: "Catharina Andersen", role: "Koordinator", code: "andersen" },
  { id: 2, name: "Emil Gothart", role: "Procesoperatør", code: "gothart" },
  { id: 3, name: "Hanne Brobæk Jensen", role: "Koordinator", code: "jensen" },
  { id: 4, name: "John Storm", role: "Logistikchef", code: "storm" },
  { id: 5, name: "Marie Grand", role: "Logistik", code: "grand" },
  { id: 6, name: "Martin Pajesø", role: "Koordinator", code: "pajesø" },
  { id: 7, name: "Oliver De Morais Andersen", role: "BPO", code: "andersen" },
  { id: 8, name: "William Garn Snedker Pedersen", role: "BPO", code: "pedersen" },
];

const CAN_CHECK = (role) => role === "BPO" || role === "Koordinator";

/* ================= TASKS ================= */
const BASE_TASKS = [
  { id: 1, text: "Arbejdstilladelse – husk sikkerhedskort", type: "open" },
  { id: 2, text: "Tjek alle SiteHub-hegn for skader (inkl. jordvolden)", type: "open" },
  { id: 3, text: "Registrér leverancer i Sitebooking (nr.plade + følgeseddel)", type: "open" },
  { id: 4, text: "Kontrollér spand med cigaretskodder", type: "open" },
  { id: 5, text: "Ryst / rens spaghettimåtter", type: "open" },
  { id: 6, text: "Rens skærme til fotogenkendelse", type: "open" },
  { id: 7, text: "Skriv besked på Slack ved akutte beskeder", type: "close" },
  { id: 8, text: "Lås container S2", type: "close" },
  { id: 9, text: "Suspendér arbejdstilladelse – ring 30750246", type: "close" },
];

/* ================= UTIL ================= */
const todayStr = () => new Date().toISOString().slice(0, 10);

const loadDay = (date) => {
  const raw = localStorage.getItem("sitehub-" + date);
  if (!raw) {
    return { tasks: BASE_TASKS.map(t => ({ ...t, doneBy: [] })), log: [] };
  }
  return JSON.parse(raw);
};

const saveDay = (date, data) => {
  localStorage.setItem("sitehub-" + date, JSON.stringify(data));
};

/* ================= APP ================= */
export default function App() {
  const [date, setDate] = useState(todayStr());
  const [dayData, setDayData] = useState(loadDay(todayStr()));

  const [currentUser, setCurrentUser] = useState(null);
  const [code, setCode] = useState("");
  const [page, setPage] = useState("start");
  const [adHocText, setAdHocText] = useState("");

  useEffect(() => {
    const d = loadDay(date);
    setDayData(d);
  }, [date]);

  const login = () => {
    const u = USERS.find(
      u => u.code === code.toLowerCase()
    );
    if (!u) return alert("Forkert kode");
    setCurrentUser(u);
  };

  const logout = () => {
    setCurrentUser(null);
    setCode("");
    setPage("start");
  };

  const toggleTask = (taskId) => {
    if (!CAN_CHECK(currentUser.role)) return;

    const newData = { ...dayData };
    const t = newData.tasks.find(t => t.id === taskId);

    const already = t.doneBy.find(d => d.userId === currentUser.id);

    if (already) {
      t.doneBy = t.doneBy.filter(d => d.userId !== currentUser.id);
      newData.log.push({
        time: new Date().toLocaleTimeString(),
        text: `${currentUser.name} fjernede: ${t.text}`,
      });
    } else {
      t.doneBy.push({ userId: currentUser.id, name: currentUser.name });
      newData.log.push({
        time: new Date().toLocaleTimeString(),
        text: `${currentUser.name} udførte: ${t.text}`,
      });
    }

    setDayData(newData);
    saveDay(date, newData);
  };

  const addAdHoc = () => {
    if (!adHocText.trim()) return;
    const newTask = {
      id: Date.now(),
      text: adHocText,
      type: "adhoc",
      doneBy: [],
    };
    const newData = { ...dayData };
    newData.tasks.push(newTask);
    newData.log.push({
      time: new Date().toLocaleTimeString(),
      text: `${currentUser.name} oprettede AD-HOC: ${adHocText}`,
    });
    setDayData(newData);
    saveDay(date, newData);
    setAdHocText("");
  };

  /* ================= STATS ================= */
  const stats = {};
  dayData.tasks.forEach(t =>
    t.doneBy.forEach(d => {
      stats[d.name] = (stats[d.name] || 0) + 1;
    })
  );

  const leaderboard = Object.entries(stats).sort((a, b) => b[1] - a[1]);

  /* ================= UI ================= */
  if (!currentUser) {
    return (
      <div style={{ padding: 20 }}>
        <h2>SiteHub AG WS</h2>
        <select onChange={e => setCode("")}>
          <option>Vælg bruger</option>
          {USERS.map(u => (
            <option key={u.id}>{u.name}</option>
          ))}
        </select>
        <input placeholder="Kodeord" value={code} onChange={e => setCode(e.target.value)} />
        <button onClick={login}>Log ind</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <div>
        {currentUser.name} ({currentUser.role})
        <button onClick={logout}>Log ud</button>
      </div>

      <div>
        <button onClick={() => setPage("start")}>Start</button>
        <button onClick={() => setPage("list")}>Tjekliste</button>
        <button onClick={() => setPage("dashboard")}>Dashboard</button>
        <button onClick={() => setPage("leaderboard")}>Leaderboard</button>
      </div>

      {page === "start" && (
        <div>
          <h2>Godmorgen 👋</h2>
          <p>God arbejdslyst</p>
          <h3>Leaderboard i dag</h3>
          {leaderboard.map(([n, c]) => (
            <div key={n}>{n}: {c}</div>
          ))}
        </div>
      )}

      {page === "list" && (
        <div>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          {dayData.tasks.map(t => (
            <div key={t.id} onClick={() => toggleTask(t.id)}>
              {t.type === "open" && "Åbning: "}
              {t.type === "close" && "Lukkevagt: "}
              {t.text}
              {t.doneBy.length > 0 && (
                <span> ✔ ({t.doneBy.map(d => d.name).join(", ")})</span>
              )}
            </div>
          ))}

          <input
            placeholder="AD-HOC opgave"
            value={adHocText}
            onChange={e => setAdHocText(e.target.value)}
          />
          <button onClick={addAdHoc}>Tilføj</button>
        </div>
      )}

      {page === "dashboard" && (
        <div>
          <h3>Log</h3>
          {dayData.log.map((l, i) => (
            <div key={i}>{l.time} – {l.text}</div>
          ))}
        </div>
      )}

      {page === "leaderboard" && (
        <div>
          <h3>Leaderboard</h3>
          {leaderboard.map(([n, c]) => (
            <div key={n}>{n}: {c} opgaver</div>
          ))}
        </div>
      )}
    </div>
  );
}