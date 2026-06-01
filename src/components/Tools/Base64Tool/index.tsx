import {useState} from 'react';
import clsx from 'clsx';
import styles from '../styles.module.css';

type Mode = 'encode' | 'decode';

function base64Encode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64Decode(str: string): string {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export default function Base64Tool(): JSX.Element {
  const [mode, setMode] = useState<Mode>('encode');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  function handleConvert(): void {
    setError('');
    try {
      if (mode === 'encode') {
        setOutput(base64Encode(input));
      } else {
        setOutput(base64Decode(input));
      }
    } catch {
      setOutput('');
      setError(
        mode === 'decode'
          ? 'Invalid Base64 input. Please check your string and try again.'
          : 'Failed to encode the input.',
      );
    }
  }

  function handleCopy(): void {
    if (output) {
      navigator.clipboard.writeText(output);
    }
  }

  return (
    <div className={styles.toolBody}>
      <div className={styles.buttonRow}>
        <div className={styles.modeToggle}>
          <button
            type="button"
            className={clsx(styles.modeToggleBtn, mode === 'encode' && styles.modeToggleBtnActive)}
            onClick={() => { setMode('encode'); setError(''); }}
          >
            Encode
          </button>
          <button
            type="button"
            className={clsx(styles.modeToggleBtn, mode === 'decode' && styles.modeToggleBtnActive)}
            onClick={() => { setMode('decode'); setError(''); }}
          >
            Decode
          </button>
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel} htmlFor="base64-input">
          {mode === 'encode' ? 'Text' : 'Base64'}
        </label>
        <textarea
          id="base64-input"
          className={styles.textarea}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === 'encode' ? 'Enter text to encode...' : 'Enter Base64 to decode...'}
        />
      </div>

      <div className={styles.buttonRow}>
        <button
          type="button"
          className="button button--primary button--sm"
          onClick={handleConvert}
        >
          {mode === 'encode' ? 'Encode' : 'Decode'}
        </button>
      </div>

      {error && <p className={styles.errorMsg} role="alert">{error}</p>}

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel} htmlFor="base64-output">
          Output
        </label>
        <div className={styles.outputArea}>
          <textarea
            id="base64-output"
            className={styles.outputTextarea}
            value={output}
            readOnly
            placeholder="Result will appear here..."
          />
          {output && (
            <button type="button" className={styles.copyBtn} onClick={handleCopy}>
              Copy
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
