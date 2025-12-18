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

  function toggle(task) {
    setChecked(prev => ({ ...prev, [task]: !prev[task] }));
  }

  return (
    <div style={{ padding: 20, fontFamily: 'Arial' }}>
      <h1>SiteHub BPO – AG WS</h1>
      <p>Daglig tjekliste</p>

      <ul>
        {TASKS.map(task => (
          <li key={task} style={{ marginBottom: 10 }}>
            <label>
              <input
                type="checkbox"
                checked={!!checked[task]}
                onChange={() => toggle(task)}
              />{' '}
              {task}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

