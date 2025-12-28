import { useEffect, useState } from "react";

/* ======================
   DATA
====================== */

const SITE = "AG WS";

const USERS = [
  { id: "oliver", name: "Oliver", role: "bpo", pin: "1111" },
  { id: "emil", name: "Emil", role: "bpo", pin: "2222" },
  { id: "william", name: "William", role: "bpo", pin: "3333" },

  { id: "martin", name: "Martin", role: "koordinator", pin: "4444" },
  { id: "catharina", name: "Catharina", role: "koordinator", pin: "5555" },
  { id: "hanne", name: "Hanne", role: "koordinator", pin: "6666" },

  { id: "jon", name: "Jon", role: "logistikchef", pin: "9999" },
  { id: "marie", name: "Marie", role: "logistikchef", pin: "8888" },
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

const STORAGE = "sitehub_full_v1";

/* ======================
   HELPERS
====================== */

const today = () => new Date().toISOString().slice(0, 10);
const now = () =>
  new Date().toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" });

function newDay() {
  return {
    tasks: BASE_TASKS.map((t) => ({
      id: crypto.randomUUID(),
      text: t,
      checks: [],
    })),
    log: [],
  };
}

/* ======================
   APP
====================== */

export default function App() {
  const [userId, setUserId] = useState("");
  const [pin, setPin] = useState("");
  const [user, setUser] = useState(null);

  const [calendar, setCalendar] = useState({});
  const [selectedDate, setSelectedDate] = useState(today());
  const [adhocText, setAdhocText] = useState("");

  /* Load */
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem(STORAGE)) || {};
    if (!data[selectedDate]) data[selectedDate] = newDay();
    setCalendar(data);
  }, []);

  /* Save */
  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify(calendar));
  }, [calendar]);

  function ensureDay(date) {
    setCalendar((c) => {
      if (c[date]) return c;
      return { ...c, [date]: newDay() };
    });
  }

  function changeDate(date) {
    ensureDay(date);
    setSelectedDate(date);
  }

  const day = calendar[selectedDate];
  const canCheck = user && (user.role === "bpo" || user.role === "koordinator");

  /* Login */
  function login() {
    const u = USERS.find((u) => u.id === userId && u.pin === pin);
    if (!u) return alert("Forkert login");
    setUser(u);
    setPin("");
  }

  function logout() {
    setUser(null);
    setUserId("");
    setPin("");
  }

  /* Toggle check */
  function toggleCheck(task) {
    if (!canCheck) return;

    setCalendar((c) => {
      const d = { ...c[selectedDate] };
      const t = d.tasks.find((x) => x.id === task.id);
      const existing = t.checks.find((x) => x.user === user.name);

      if (existing) {
        t.checks = t.checks.filter((x) => x.user !== user.name);
        d.log.push(`${now()} – ${user.name} fjernede flueben på "${t.text}"`);
      } else {
        t.checks.push({ user: user.name, time: now() });
        d.log.push(`${now()} – ${user.name} udførte "${t.text}"`);
      }

      return { ...c, [selectedDate]: d };
    });
  }

  /* AD-HOC */
  function addAdhoc() {
    if (!adhocText.trim() || !canCheck) return;

    setCalendar((c) => {
      const d = { ...c[selectedDate] };
      d.tasks.push({ id: crypto.randomUUID(), text: adhocText, checks: [] });
      d.log.push(`${now()} – ${user.name} tilføjede AD-HOC "${adhocText}"`);
      return { ...c, [selectedDate]: d };
    });

    setAdhocText("");
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Daglig tjekliste – {SITE}</h1>

      <input
        type="date"
        value={selectedDate}
        onChange={(e) => changeDate(e.target.value)}
        className="border p-2 mb-4 rounded w-full"
      />

      {!user && (
        <div className="bg-white p-4 rounded shadow mb-4">
          <select
            className="w-full border p-2 mb-2"
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
            className="w-full border p-2 mb-2"
            placeholder="Pinkode"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />

          <button
            onClick={login}
            className="w-full bg-black text-white p-2 rounded"
          >
            Log ind
          </button>
        </div>
      )}

      {user && (
        <div className="bg-white p-3 rounded mb-3 flex justify-between">
          <div>
            {user.name} ({user.role})
          </div>
          <button onClick={logout}>Log ud</button>
        </div>
      )}

      {day &&
        day.tasks.map((t) => (
          <div
            key={t.id}
            className="bg-white p-3 rounded mb-2 flex justify-between items-center"
          >
            <div>
              <div
                className={
                  t.checks.length > 0 ? "line-through text-gray-400" : ""
                }
              >
                {t.text}
              </div>
              {t.checks.length > 0 && (
                <div className="text-xs text-gray-500">
                  {t.checks.map((c) => `${c.user} (${c.time})`).join(", ")}
                </div>
              )}
            </div>

            {canCheck && (
              <input
                type="checkbox"
                checked={t.checks.some((c) => c.user === user.name)}
                onChange={() => toggleCheck(t)}
              />
            )}
          </div>
        ))}

      {canCheck && (
        <div className="bg-white p-3 rounded mt-4">
          <h3 className="font-bold mb-2">AD-HOC</h3>
          <input
            className="border p-2 w-full mb-2"
            placeholder="Ny AD-HOC opgave"
            value={adhocText}
            onChange={(e) => setAdhocText(e.target.value)}
          />
          <button
            onClick={addAdhoc}
            className="w-full bg-black text-white p-2 rounded"
          >
            Tilføj
          </button>
        </div>
      )}

      {user?.role === "logistikchef" && (
        <div className="bg-white p-3 rounded mt-4">
          <h3 className="font-bold mb-2">Ændringslog</h3>
          {day.log.map((l, i) => (
            <div key={i} className="text-xs mb-1">
              {l}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}