import { useState } from 'react';

const TASKS = [
  'Åbne arbejdstilladelse – husk sikkerhedskort',
  'Tjek SiteHub hegn',
  'Registrér leverancer i Sitebooking',
  'Rens skærm til fotogenkendelse',
  'AD HOC opgaver'
];

export default function App() {
  const [checked, setChecked] = useState({});
  const [names, setNames] = useState({});
  const [currentName, setCurrentName] = useState('');

  function toggle(task) {
    if (!currentName) return alert('Indtast dit navn først');
    setChecked(prev => ({ ...prev, [task]: !prev[task] }));
    setNames(prev => ({ ...prev, [task]: currentName }));
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
        {TASKS.map(task => (
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
    </div>
  );
}