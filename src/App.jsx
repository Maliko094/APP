import { useEffect, useMemo, useState } from "react";

/* ================================
   KONFIGURATION
================================ */

const SITE = "AG WS";

const USERS = [
  { id: "oliver", name: "Oliver", role: "bpo", pin: "1111" },
  { id: "emil", name: "Emil", role: "bpo", pin: "2222" },
  { id: "william", name: "William", role: "bpo", pin: "3333" },

  { id: "martin", name: "Martin", role: "koordinator", pin: "4444" },
  { id: "catharina", name: "Catharina", role: "koordinator", pin: "5555" },

  { id: "jon", name: "Jon", role: "logistikchef", pin: "9999" },
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

const STORAGE = "sitehub_daily_v1";

const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toLocaleTimeString("da-DK");

/* ================================
   INIT
================================ */

function newDay() {
  return {
    date: today(),
    tasks: BASE_TASKS.map((t) => ({
      id: crypto.randomUUID(),
      text: t,
      done: false,
      doneBy: null,
      time: null,
    })),
    adhoc: [],
    log: [],
  };
}

/* ================================
   APP
================================ */

export default function App() {
  const [userId, setUserId] = useState("");
  const [pin, setPin] = useState("");
  const [user, setUser] = useState(null);
  const [day, setDay] = useState(null);
  const [adhocText, setAdhocText] = useState("");

  /* Load / reset per day */
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(STORAGE));
    if (!saved || saved.date !== today()) {
      const fresh = newDay();
      localStorage.setItem(STORAGE, JSON.stringify(fresh));
      setDay(fresh);
    } else {
      setDay(saved);
    }
  }, []);

  useEffect(() => {
    if (day) localStorage.setItem(STORAGE, JSON.stringify(day));
  }, [day]);

  /* Login */
  function login() {
    const u = USERS.find((u) => u.id === userId && u.pin === pin);
    if (u) setUser(u);
    else showingAlert("Forkert login");
  }

  function logout() {
    setUser(null);
    setUserId("");
    setPin("");
  }

  function showingAlert(msg) {
    alert(msg);
  }

  /* Toggle task */
  function toggleTask(task) {
    if (!user || user.role !== "bpo") return;

    setDay((d) => {
      const updated = d.tasks.map((t) => {
        if (t.id !== task.id) return t;

        // If already done, only same user can undo
        if (t.done && t.doneBy !== user.name) return t;

        const newState = !t.done;

        return {
          ...t,
          done: newState,
          doneBy: newState ? user.name : null,
          time: newState ? now() : null,
        };
      });

      return {
        ...d,
        tasks: updated,
        log: [
          ...d.log,
          `${now()} – ${user.name} ${task.done ? "fjernede" : "udførte"}: ${
            task.text
          }`,
        ],
      };
    });
  }

  /* Add AD-HOC */
  function addAdhoc() {
    if (!adhocText.trim()) return;

    setDay((d) => ({
      ...d,
      adhoc: [
        ...d.adhoc,
        {
          id: crypto.randomUUID(),
          text: adhocText,
          done: false,
          doneBy: null,
          time: null,
        },
      ],
      log: [...d.log, `${now()} – ${user.name} oprettede AD-HOC: ${adhocText}`],
    }));

    setAdhocText("");
  }

  function toggleAdhoc(task) {
    if (task.done && task.doneBy !== user.name) return;

    setDay((d) => ({
      ...d,
      adhoc: d.adhoc.map((t) =>
        t.id === task.id
          ? {
              ...t,
              done: !t.done,
              doneBy: !t.done ? user.name : null,
              time: !t.done ? now() : null,
            }
          : t
      ),
      log: [
        ...d.log,
        `${now()} – ${user.name} ${task.done ? "fjernede" : "udførte"} AD-HOC: ${
          task.text
        }`,
      ],
    }));
  }

  if (!day) return null;

  return (
    <div className="min-h-screen bg-gray-100 p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">SiteHub BPO – {SITE}</h1>
      <p className="text-gray-600 mb-4">Dato: {day.date}</p>

      {!user && (
        <div className="bg-white p-4 rounded shadow mb-4">
          <select
            className="w-full border p-2 mb-2 rounded"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          >
            <option value="">Vælg bruger</option>
            {USERS.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>

          <input
            type="password"
            className="w-full border p-2 mb-2 rounded"
            placeholder="Pinkode"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />

          <button
            className="w-full bg-black text-white p-2 rounded"
            onClick={login}
          >
            Log ind
          </button>
        </div>
      )}

      {user && (
        <>
          <div className="bg-white p-3 rounded mb-3 flex justify-between">
            <div>
              Logget ind som <b>{user.name}</b> ({user.role})
            </div>
            <button onClick={logout}>Log ud</button>
          </div>

          {day.tasks.map((t) => (
            <div
              key={t.id}
              className="bg-white p-3 rounded mb-2 flex justify-between items-center"
            >
              <div>
                <div className={t.done ? "line-through text-gray-500" : ""}>
                  {t.text}
                </div>
                {t.done && (
                  <div className="text-xs text-gray-500">
                    Udført af {t.doneBy} kl. {t.time}
                  </div>
                )}
              </div>

              {user.role === "bpo" && (
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={() => toggleTask(t)}
                />
              )}
            </div>
          ))}

          <div className="bg-white p-3 rounded mt-4">
            <h3 className="font-bold mb-2">AD-HOC</h3>
            {day.adhoc.map((t) => (
              <div key={t.id} className="flex justify-between mb-2">
                <span>{t.text}</span>
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={() => toggleAdhoc(t)}
                />
              </div>
            ))}

            {user.role === "bpo" && (
              <>
                <input
                  className="border p-2 w-full mt-2"
                  placeholder="Ny AD-HOC opgave"
                  value={adhocText}
                  onChange={(e) => setAdhocText(e.target.value)}
                />
                <button
                  className="w-full bg-black text-white p-2 mt-2 rounded"
                  onClick={addAdhoc}
                >
                  Tilføj
                </button>
              </>
            )}
          </div>

          {user.role === "logistikchef" && (
            <div className="bg-white p-3 mt-4 rounded">
              <h3 className="font-bold mb-2">Ændringslog</h3>
              {day.log.map((l, i) => (
                <div key={i} className="text-xs mb-1">
                  {l}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}