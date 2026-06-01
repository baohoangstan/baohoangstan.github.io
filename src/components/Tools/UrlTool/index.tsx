import {useState} from 'react';
import clsx from 'clsx';
import styles from '../styles.module.css';

type Mode = 'encode' | 'decode';

export default function UrlTool(): JSX.Element {
  const [mode, setMode] = useState<Mode>('encode');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  function handleConvert(): void {
    setError('');
    try {
      if (mode === 'encode') {
        setOutput(encodeURIComponent(input));
      } else {
        setOutput(decodeURIComponent(input));
      }
    } catch {
      setOutput('');
      setError('Invalid input. Please check your string and try again.');
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
        <label className={styles.fieldLabel} htmlFor="url-input">
          {mode === 'encode' ? 'Text' : 'Encoded URL'}
        </label>
        <textarea
          id="url-input"
          className={styles.textarea}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === 'encode' ? 'Enter text to encode...' : 'Enter URL-encoded string to decode...'}
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
        <label className={styles.fieldLabel} htmlFor="url-output">
          Output
        </label>
        <div className={styles.outputArea}>
          <textarea
            id="url-output"
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
