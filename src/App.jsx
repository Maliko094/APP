import { useEffect, useMemo, useState } from 'react';

// =====================
// CONFIG
// =====================
const SITE = 'AG WS';
const USERS = [
  { id: 'oliver', name: 'Oliver', role: 'bpo', pin: '1111' },
  { id: 'emil', name: 'Emil', role: 'bpo', pin: '2222' },
  { id: 'william', name: 'William', role: 'bpo', pin: '3333' },
  { id: 'jon', name: 'Jon', role: 'chef', pin: '9999' },
];

const OPENING_TASKS = [
  'Åbne arbejdstilladelse – husk sikkerhedskort',
  'Tjek SiteHub hegn',
  'Registrér leverancer i Sitebooking',
  'Rens skærm til fotogenkendelse',
  'Billede af følgeseddel',
];

const CLOSING_TASKS = [
  'Tjek cigaretskodder',
  'Rens måtter',
  'Oprydning',
  'Luk porte og hegn',
  'Plads lukket korrekt',
];

const STORAGE_KEY = 'sitehub_bpo_day_v1';

// =====================
// HELPERS
// =====================
const todayISO = () => new Date().toISOString().slice(0, 10);
const nowISO = () => new Date().toISOString();
const uid = () => Math.random().toString(36).slice(2, 10);

function freshDay() {
  return {
    site: SITE,
    date: todayISO(),
    approved: false,
    approvedBy: null,
    tasks: [
      ...OPENING_TASKS.map(t => ({
        id: uid(),
        text: t,
        type: 'opening',
        done: false,
        signedBy: [],
        completedAt: null,
      })),
      ...CLOSING_TASKS.map(t => ({
        id: uid(),
        text: t,
        type: 'closing',
        done: false,
        signedBy: [],
        completedAt: null,
      })),
    ],
  };
}

// =====================
// APP
// =====================
export default function App() {
  // auth
  const [userId, setUserId] = useState('');
  const [pin, setPin] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [authError, setAuthError] = useState('');

  // day state
  const [day, setDay] = useState(null);

  // adhoc
  const [adhocText, setAdhocText] = useState('');

  // init day (with corruption guard)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) throw new Error('no data');
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.tasks)) throw new Error('invalid');
      // reset day if date changed
      if (parsed.date !== todayISO()) {
        const fresh = freshDay();
        setDay(fresh);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      } else {
        setDay(parsed);
      }
    } catch {
      const fresh = freshDay();
      setDay(fresh);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    }
  }, []);

  useEffect(() => {
    if (day) localStorage.setItem(STORAGE_KEY, JSON.stringify(day));
  }, [day]);

  // auth actions
  function login() {
    const u = USERS.find(x => x.id === userId && x.pin === pin);
    if (!u) {
      setAuthError('Forkert navn eller pinkode');
      return;
    }
    setCurrentUser(u);
    setPin('');
    setAuthError('');
  }

  function logout() {
    setCurrentUser(null);
    setUserId('');
    setPin('');
  }

  // task actions
  function toggleTask(taskId) {
    if (!currentUser || currentUser.role !== 'bpo' || day.approved) return;
    setDay(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => {
        if (t.id !== taskId) return t;
        const already = t.signedBy.some(s => s.id === currentUser.id);
        if (already) return t;
        const signedBy = [...t.signedBy, { id: currentUser.id, name: currentUser.name, time: nowISO() }];
        return {
          ...t,
          done: true,
          signedBy,
          completedAt: nowISO(),
        };
      })
    }));
  }

  function addAdhoc() {
    if (!currentUser || currentUser.role !== 'bpo' || day.approved) return;
    if (!adhocText.trim()) return;
    setDay(prev => ({
      ...prev,
      tasks: [...prev.tasks, {
        id: uid(),
        text: adhocText.trim(),
        type: 'adhoc',
        done: false,
        signedBy: [],
        completedAt: null,
      }]
    }));
    setAdhocText('');
  }

  // approval
  const allDone = useMemo(() => (day?.tasks || []).length > 0 && (day?.tasks || []).every(t => t.done), [day]);

  function approveDay() {
    if (!currentUser || currentUser.role !== 'chef') return;
    if (!allDone) return;
    setDay(prev => ({ ...prev, approved: true, approvedBy: { name: currentUser.name, time: nowISO() } }));
  }

  // =====================
  // RENDER
  // =====================
  if (!day) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6f8', padding: 16, fontFamily: 'Arial, sans-serif' }}>
      <h2>SiteHub BPO – {SITE}</h2>
      <p style={{ color: '#666' }}>Dato: {day.date}</p>

      {!currentUser ? (
        <div style={{ background: '#fff', padding: 16, borderRadius: 8, maxWidth: 420 }}>
          <h3>Log ind</h3>
          <select value={userId} onChange={e => setUserId(e.target.value)} style={{ width: '100%', padding: 10, marginBottom: 10 }}>
            <option value="">Vælg bruger</option>
            {USERS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <input type="password" placeholder="Pinkode" value={pin} onChange={e => setPin(e.target.value)} style={{ width: '100%', padding: 10, marginBottom: 10 }} />
          <button onClick={login} style={{ width: '100%', padding: 12 }}>Log ind</button>
          {authError && <p style={{ color: 'red' }}>{authError}</p>}
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <strong>Logget ind:</strong> {currentUser.name} ({currentUser.role})
          <button onClick={logout} style={{ marginLeft: 'auto' }}>Log ud</button>
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        {day.tasks.map(t => (
          <div key={t.id} style={{ background: '#fff', borderRadius: 8, padding: 12, marginBottom: 8 }}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={t.done}
                disabled={!currentUser || currentUser.role !== 'bpo' || day.approved}
                onChange={() => toggleTask(t.id)}
              />
              <strong>[{t.type}]</strong> {t.text}
            </label>
            {t.completedAt && (
              <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>
                Udført af: {t.signedBy.map(s => s.name).join(', ')} · {new Date(t.completedAt).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>
        ))}
      </div>

      {currentUser?.role === 'bpo' && !day.approved && (
        <div style={{ background: '#fff', borderRadius: 8, padding: 12, marginTop: 12 }}>
          <h4>AD HOC-opgave</h4>
          <input value={adhocText} onChange={e => setAdhocText(e.target.value)} placeholder="Skriv opgave…" style={{ width: '100%', padding: 10 }} />
          <button onClick={addAdhoc} style={{ marginTop: 8, padding: 12, width: '100%' }}>Tilføj</button>
        </div>
      )}

      {currentUser?.role === 'chef' && !day.approved && (
        <button onClick={approveDay} disabled={!allDone} style={{ marginTop: 16, padding: 14, width: '100%' }}>
          Godkend dagen
        </button>
      )}

      {day.approved && (
        <div style={{ marginTop: 16, padding: 12, background: '#e6f6ec', borderRadius: 8 }}>
          <strong>Dagen er godkendt</strong>
          <div>Af: {day.approvedBy?.name}</div>
        </div>
      )}
    </div>
  );
}
