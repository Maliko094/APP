import { useEffect, useMemo, useState } from "react";

/* ===========================
   KONFIGURATION
=========================== */

const SITE = "AG WS";

/* Brugere (pinkode = efternavn) */
const USERS = [
  { id: "oliver", name: "Oliver De Morais Andersen", role: "bpo", pin: "Andersen" },
  { id: "william", name: "William Garn Snedker Pedersen", role: "bpo", pin: "Pedersen" },
  { id: "emil", name: "Emil Gothart", role: "bpo", pin: "Gothart" },

  { id: "martin", name: "Martin Pajesø", role: "koordinator", pin: "Pajesø" },
  { id: "catharina", name: "Catharina Andersen", role: "koordinator", pin: "Andersen" },
  { id: "hanne", name: "Hanne Brobæk Jensen", role: "koordinator", pin: "Jensen" },

  { id: "john", name: "John Storm", role: "logistikchef", pin: "Storm" },
  { id: "marie", name: "Marie Grand", role: "logistikchef", pin: "Grand" },
];

const OPENING = [
  "Arbejdstilladelse – husk sikkerhedskort",
  "Tjek alle SiteHub-hegn for skader (inkl. jordvolden)",
  "Registrér leverancer i Sitebooking (billeder af nr.plade og følgeseddel)",
  "Kontrollér spand med cigaretskodder",
  "Ryst / rens spaghettimåtter",
  "Rens skærme til fotogenkendelse",
];

const CLOSING = [
  "Tjek alle SiteHub-hegn for skader",
  "Skriv besked på Slack ved akutte beskeder",
  "Lås container S2 ved fyraften",
  "Suspendér arbejdstilladelse – ring 30750246",
];

const STORAGE = "sitehub_data_v1";

/* ===========================
   HJÆLPERE
=========================== */

const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" });
const uid = () => Math.random().toString(36).slice(2, 9);

/* ===========================
   INIT DAG
=========================== */

function newDay() {
  return {
    date: today(),
    tasks: [
      ...OPENING.map(t => ({ id: uid(), text: t, type: "Åbning", doneBy: [] })),
      ...CLOSING.map(t => ({ id: uid(), text: t, type: "Lukkevagt", doneBy: [] })),
    ],
    adhoc: [],
    log: [],
  };
}

/* ===========================
   APP
=========================== */

export default function App() {
  const [userId, setUserId] = useState("");
  const [pin, setPin] = useState("");
  const [user, setUser] = useState(null);
  const [view, setView] = useState("start");

  const [days, setDays] = useState({});
  const [date, setDate] = useState(today());
  const [adhocText, setAdhocText] = useState("");

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem(STORAGE) || "{}");
    if (!data[date]) data[date] = newDay();
    setDays(data);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify(days));
  }, [days]);

  const day = days[date] || newDay();

  /* LOGIN */
  function login() {
    const u = USERS.find(x => x.id === userId && x.pin === pin);
    if (!u) return alert("Forkert login");
    setUser(u);
  }
  function logout() {
    setUser(null);
    setView("start");
  }

  /* TASK TOGGLE */
  function toggle(task) {
    if (!["bpo", "koordinator"].includes(user.role)) return;

    setDays(prev => {
      const copy = { ...prev };
      const d = { ...copy[date] };
      d.tasks = d.tasks.map(t => {
        if (t.id !== task.id) return t;
        const exists = t.doneBy.find(x => x.name === user.name);
        let doneBy = exists
          ? t.doneBy.filter(x => x.name !== user.name)
          : [...t.doneBy, { name: user.name, time: now() }];

        d.log.push(`${now()} – ${user.name} ${exists ? "fjernede" : "udførte"}: ${t.text}`);

        return { ...t, doneBy };
      });
      copy[date] = d;
      return copy;
    });
  }

  /* AD HOC */
  function addAdhoc() {
    if (!adhocText.trim()) return;
    setDays(prev => {
      const copy = { ...prev };
      copy[date].adhoc.push({
        id: uid(),
        text: adhocText,
        doneBy: [],
      });
      copy[date].log.push(`${now()} – ${user.name} oprettede AD HOC: ${adhocText}`);
      return copy;
    });
    setAdhocText("");
  }

  /* LEADERBOARD */
  const leaderboard = useMemo(() => {
    const scores = {};
    Object.values(days).forEach(d => {
      [...d.tasks, ...d.adhoc].forEach(t =>
        t.doneBy.forEach(p => {
          scores[p.name] = (scores[p.name] || 0) + 1;
        })
      );
    });
    return Object.entries(scores).sort((a, b) => b[1] - a[1]);
  }, [days]);

  return (
    <div style={{ fontFamily: "system-ui", background: "#f2f2f7", minHeight: "100vh", paddingBottom: 80 }}>
      <div style={{ padding: 16, background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}>
        {user ? (
          <>
            <strong>{user.name}</strong> ({user.role}){" "}
            <button onClick={logout} style={{ float: "right" }}>Log ud</button>
            <div style={{ marginTop: 10 }}>
              {["start","tjek","dashboard","leader"].map(v=>(
                <button key={v} onClick={()=>setView(v)} style={{marginRight:8}}>{v}</button>
              ))}
            </div>
          </>
        ) : (
          <>
            <select onChange={e=>setUserId(e.target.value)}>
              <option>Vælg bruger</option>
              {USERS.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <input placeholder="Efternavn" value={pin} onChange={e=>setPin(e.target.value)} />
            <button onClick={login}>Log ind</button>
          </>
        )}
      </div>

      {view==="start" && (
        <div style={{padding:16}}>
          <h2>Godmorgen 👋</h2>
          <h3>Leaderboard</h3>
          {leaderboard.map(([n,s],i)=><div key={n}>{i+1}. {n} – {s} opgaver</div>)}
        </div>
      )}

      {view==="tjek" && user && (
        <div style={{padding:16}}>
          {[...day.tasks,...day.adhoc].map(t=>(
            <div key={t.id} onClick={()=>toggle(t)} style={{
              background:"#fff",
              padding:12,
              marginBottom:8,
              borderRadius:10,
              textDecoration: t.doneBy.length?"line-through":"none"
            }}>
              <strong>{t.type||"AD HOC"}:</strong> {t.text}
              <div style={{fontSize:12}}>
                {t.doneBy.map(p=>`${p.name} ${p.time}`).join(", ")}
              </div>
            </div>
          ))}
          <input value={adhocText} onChange={e=>setAdhocText(e.target.value)} placeholder="AD HOC opgave" />
          <button onClick={addAdhoc}>Tilføj</button>
        </div>
      )}

      {view==="dashboard" && (
        <div style={{padding:16}}>
          <h3>Log</h3>
          {day.log.map((l,i)=><div key={i}>{l}</div>)}
        </div>
      )}

      {view==="leader" && (
        <div style={{padding:16}}>
          <h3>Leaderboard</h3>
          {leaderboard.map(([n,s])=><div key={n}>{n}: {s}</div>)}
        </div>
      )}
    </div>
  );
}