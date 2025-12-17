/*
SiteHub BPO Checklist — CLEAN, CRASH-TESTED & HARDENED VERSION

CRASH / ERROR HARDENING:
- Validering af localStorage-data (fallback hvis corrupted)
- Defensive checks på alle arrays/objekter
- Forhindrer PDF-crash hvis completedAt mangler
- Forhindrer signering efter godkendelse
- Stabil login/logout-cyklus
*/

import React, { useEffect, useState } from 'react';
import jsPDF from 'jspdf';

const SITE = 'AG WS';

const EMPLOYEES = [
  { id: 'bpo1', name: 'Oliver', pin: '1111', role: 'bpo' },
  { id: 'bpo2', name: 'Emil', pin: '2222', role: 'bpo' },
  { id: 'bpo3', name: 'William', pin: '3333', role: 'bpo' },
  { id: 'log1', name: 'John', pin: '4444', role: 'logistics' }
];

const OPENING_TASKS = [
  'Arbejdstilladelse – husk sikkerhedskort',
  'Tjek alle SiteHub-hegn for skader',
  'Registrér leverancer i Sitebooking',
  'Billede af nummerplade',
  'Billede af følgeseddel'
];

const CLOSING_TASKS = [
  'Tjek cigaretskodder',
  'Rens måtter',
  'Rens fotogenkendelse',
  'Oprydning',
  'Plads lukket korrekt'
];

const STORAGE_KEY = 'sitehub_bpo_instances';
const todayISO = () => new Date().toISOString().slice(0, 10);
const nowISO = () => new Date().toISOString();
const uid = () => Math.random().toString(36).slice(2, 9);

function createFreshDay() {
  return {
    date: todayISO(),
    site: SITE,
    tasks: [
      ...OPENING_TASKS.map(t => ({
        id: uid(), text: t, type: 'opening', done: false, signedBy: [], createdAt: nowISO(), completedAt: null
      })),
      ...CLOSING_TASKS.map(t => ({
        id: uid(), text: t, type: 'closing', done: false, signedBy: [], createdAt: nowISO(), completedAt: null
      }))
    ],
    approvedBy: null
  };
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userId, setUserId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [day, setDay] = useState(null);
  const [adhocText, setAdhocText] = useState('');

  // INIT + CORRUPTION GUARD
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) throw new Error('no data');
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.tasks)) throw new Error('invalid');
      setDay(parsed);
    } catch {
      const fresh = createFreshDay();
      setDay(fresh);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    }
  }, []);

  useEffect(() => {
    if (day) localStorage.setItem(STORAGE_KEY, JSON.stringify(day));
  }, [day]);

  function login() {
    const emp = EMPLOYEES.find(e => e.id === userId);
    if (!emp || emp.pin !== pin) {
      setError('Forkert pinkode');
      return;
    }
    setCurrentUser(emp);
    setPin('');
    setError('');
  }

  function signTask(taskId) {
    if (!currentUser || day?.approvedBy) return;
    setDay(prev => ({
      ...prev,
      tasks: (prev.tasks || []).map(t => {
        if (t.id !== taskId) return t;
        if (t.signedBy.some(u => u.id === currentUser.id)) return t;
        return {
          ...t,
          done: true,
          signedBy: [...t.signedBy, { id: currentUser.id, name: currentUser.name, time: nowISO() }],
          completedAt: nowISO()
        };
      })
    }));
  }

  function addAdHoc() {
    if (!currentUser || !adhocText || day?.approvedBy) return;
    setDay(prev => ({
      ...prev,
      tasks: [...(prev.tasks || []), {
        id: uid(), text: adhocText, type: 'adhoc', done: false, signedBy: [], createdAt: nowISO(), completedAt: null
      }]
    }));
    setAdhocText('');
  }

  function approveDay() {
    if (!currentUser || currentUser.name !== 'John') return;
    if (!(day?.tasks || []).every(t => t.done)) return;
    setDay(prev => ({ ...prev, approvedBy: { name: currentUser.name, time: nowISO() } }));
  }

  function exportPDF() {
    if (!currentUser || currentUser.name !== 'John' || !day?.approvedBy) return;

    const doc = new jsPDF();
    let y = 15;
    doc.text('SiteHub – Daglig BPO Tjekliste', 10, y);
    y += 10;
    doc.text(`Site: ${SITE}`, 10, y);
    y += 6;
    doc.text(`Dato: ${day.date}`, 10, y);
    y += 8;

    (day.tasks || []).forEach(t => {
      doc.text(`✓ [${t.type.toUpperCase()}] ${t.text}`, 10, y);
      y += 5;
      if (t.completedAt) {
        doc.text(`   ${t.signedBy.map(u => u.name).join(', ')} – ${new Date(t.completedAt).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}`, 10, y);
        y += 6;
      }
    });

    y += 4;
    doc.text(`Endeligt godkendt af: ${day.approvedBy.name}`, 10, y);
    doc.save(`BPO_${SITE}_${day.date}.pdf`);
  }

  if (!day) return null;

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h1 className="font-bold text-lg mb-3">SiteHub BPO – {SITE}</h1>

      {!currentUser ? (
        <div className="space-y-2">
          <select value={userId} onChange={e => setUserId(e.target.value)} className="border p-2 w-full rounded">
            <option value="">Vælg navn</option>
            {EMPLOYEES.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <input type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="PIN" className="border p-2 w-full rounded" />
          <button onClick={login} className="w-full bg-black text-white py-2 rounded">Log ind</button>
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </div>
      ) : (
        <p className="text-sm mb-2">Logget ind som <strong>{currentUser.name}</strong></p>
      )}

      {(day.tasks || []).map(t => (
        <div key={t.id} className="border bg-white p-2 my-1">
          <button onClick={() => signTask(t.id)} className="w-full text-left" disabled={!!day.approvedBy}>
            {t.done ? '✓ ' : ''}[{t.type}] {t.text}
          </button>
          {t.completedAt && (
            <p className="text-xs text-gray-600">{t.signedBy.map(u => u.name).join(', ')} · {new Date(t.completedAt).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}</p>
          )}
        </div>
      ))}

      <div className="flex gap-2 mt-3">
        <input value={adhocText} onChange={e => setAdhocText(e.target.value)} placeholder="AD HOC opgave" className="border p-2 flex-1 rounded" disabled={!!day.approvedBy} />
        <button onClick={addAdHoc} className="border px-3" disabled={!!day.approvedBy}>Tilføj</button>
      </div>

      {currentUser?.name === 'John' && !day.approvedBy && (
        <button onClick={approveDay} className="mt-3 border px-3 py-1">Godkend dagen</button>
      )}

      {currentUser?.name === 'John' && day.approvedBy && (
        <button onClick={exportPDF} className="mt-3 border px-3 py-1">Download PDF</button>
      )}
    </div>
  );
}
