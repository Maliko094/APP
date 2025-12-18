import { useState } from 'react';

export default function App() {
  const [tasks, setTasks] = useState([
    'Åbne arbejdstilladelse – husk sikkerhedskort',
    'Tjek SiteHub hegn',
    'Registrér leverancer i Sitebooking',
    'Rens skærm til fotogenkendelse'
  ]);

  const [checked, setChecked] = useState({});
  const [names, setNames] = useState({});
  const [currentName, setCurrentName] = useState('');
  const [adhoc, setAdhoc] = useState('');

  function toggle(task) {
    if (!currentName) {
      alert('Skriv dit navn først');
      return;
    }
    setChecked(prev => ({ ...prev, [task]: !prev[task] }));
    setNames(prev => ({ ...prev, [task]: currentName }));
  }

  function addAdhoc() {
    if (!adhoc.trim()) {
      alert('Skriv en AD HOC-opgave');
      return;
    }
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
        style={{ padding: 10, width: '100%', marginBottom: 20 }}
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

      <h3>AD HOC-opgave</h3>
      <input
        placeholder="Skriv opgave…"
        value={adhoc}
        onChange={e => setAdhoc(e.target.value)}
        style={{ padding: 10, width: '100%' }}
      />
      <button
        onClick={addAdhoc}
        style={{ marginTop: 10, padding: 12, width: '100%' }}
      >
        Tilføj AD HOC
      </button>
    </div>
  );
}