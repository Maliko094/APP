import { useState } from 'react';

const DEFAULT_TASKS = [
  'Åbne arbejdstilladelse – husk sikkerhedskort',
  'Tjek SiteHub hegn',
  'Registrér leverancer i Sitebooking',
  'Rens skærm til fotogenkendelse'
];

export default function App() {
  const [tasks, setTasks] = useState(DEFAULT_TASKS);
  const [checked, setChecked] = useState({});
  const [names, setNames] = useState({});
  const [currentName, setCurrentName] = useState('');
  const [adhoc, setAdhoc] = useState('');

  function toggle(task) {
    if (!currentName) return alert('Indtast dit navn først');
    setChecked(prev => ({ ...prev, [task]: !prev[task] }));
    setNames(prev => ({ ...prev, [task]: currentName }));
  }

  function addAdhoc() {
    if (!adhoc.trim()) return;
    setTasks(prev => [...prev, adhoc]);
    setAdhoc('');
  }

  return (
    <div style={{ padding: 20, fontFamily: 'Arial' }}>
      <h1>SiteHub BPO – AG WS</h1>
      <p>Daglig tjekliste</p>

      <input
        placeholder="Dit navn"
        value={currentName}
        onChange={e => setCurrentName(e.target.value)}
        style={{ padding: 8, marginBottom: 20, width: '100%' }}
      />

      <ul>
        {tasks.map(task => (
          <li key={task} style={{ marginBottom: 14 }}>
            <label>
              <input
                type="checkbox"
                checked={!!checked[task]}
                onChange={() => toggle(task)}
              />{' '}
              {task}
            </label>

            {checked[task] && (
              <div style={{ fontSize: 12, marginTop: 4 }}>
                Udført af: <strong>{names[task]}</strong>
              </div>
            )}
          </li>
        ))}
      </ul>

      <hr style={{ margin: '30px 0' }} />

      <h3>Tilføj AD HOC-opgave</h3>
      <input
        placeholder="Skriv opgave…"
        value={adhoc}
        onChange={e => setAdhoc(e.target.value)}
        style={{ padding: 8, width: '100%' }}
      />
      <button
        onClick={addAdhoc}
        style={{ marginTop: 10, padding: 10, width: '100%' }}
      >
        Tilføj
      </button>
    </div>
  );
}