import {useState} from 'react';
import styles from '../styles.module.css';

function generateUuidV4(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback using crypto.getRandomValues
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

export default function UuidTool(): JSX.Element {
  const [count, setCount] = useState(1);
  const [uuids, setUuids] = useState<string[]>([]);

  function handleGenerate(): void {
    const n = Math.max(1, Math.min(count, 100));
    const results: string[] = [];
    for (let i = 0; i < n; i++) {
      results.push(generateUuidV4());
    }
    setUuids(results);
  }

  function handleCopy(): void {
    if (uuids.length > 0) {
      navigator.clipboard.writeText(uuids.join('\n'));
    }
  }

  return (
    <div className={styles.toolBody}>
      <div className={styles.buttonRow}>
        <label className={styles.fieldLabel} htmlFor="uuid-count">
          Count
        </label>
        <input
          id="uuid-count"
          type="number"
          className={styles.input}
          value={count}
          min={1}
          max={100}
          onChange={(e) => setCount(Number(e.target.value))}
        />
        <button
          type="button"
          className="button button--primary button--sm"
          onClick={handleGenerate}
        >
          Generate
        </button>
        {uuids.length > 0 && (
          <button
            type="button"
            className="button button--outline button--primary button--sm"
            onClick={handleCopy}
          >
            Copy
          </button>
        )}
      </div>

      {uuids.length > 0 && (
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Result</label>
          <div className={styles.outputList}>
            {uuids.join('\n')}
          </div>
        </div>
      )}
    </div>
  );
}
