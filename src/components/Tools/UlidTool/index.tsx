import {useState} from 'react';
import styles from '../styles.module.css';

const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const ENCODING_LEN = 32;
const TIME_LEN = 10;
const RANDOM_LEN = 16;

function encodeTime(time: number, len: number): string {
  let now = time;
  let str = '';
  for (let i = len - 1; i >= 0; i--) {
    const mod = now % ENCODING_LEN;
    str = ENCODING[mod] + str;
    now = (now - mod) / ENCODING_LEN;
  }
  return str;
}

function encodeRandom(len: number): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let str = '';
  for (let i = 0; i < len; i++) {
    str += ENCODING[bytes[i] % ENCODING_LEN];
  }
  return str;
}

function generateUlid(): string {
  return encodeTime(Date.now(), TIME_LEN) + encodeRandom(RANDOM_LEN);
}

export default function UlidTool(): JSX.Element {
  const [count, setCount] = useState(1);
  const [ulids, setUlids] = useState<string[]>([]);

  function handleGenerate(): void {
    const n = Math.max(1, Math.min(count, 100));
    const results: string[] = [];
    for (let i = 0; i < n; i++) {
      results.push(generateUlid());
    }
    setUlids(results);
  }

  function handleCopy(): void {
    if (ulids.length > 0) {
      navigator.clipboard.writeText(ulids.join('\n'));
    }
  }

  return (
    <div className={styles.toolBody}>
      <div className={styles.buttonRow}>
        <label className={styles.fieldLabel} htmlFor="ulid-count">
          Count
        </label>
        <input
          id="ulid-count"
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
        {ulids.length > 0 && (
          <button
            type="button"
            className="button button--outline button--primary button--sm"
            onClick={handleCopy}
          >
            Copy
          </button>
        )}
      </div>

      {ulids.length > 0 && (
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Result</label>
          <div className={styles.outputList}>
            {ulids.join('\n')}
          </div>
        </div>
      )}
    </div>
  );
}
