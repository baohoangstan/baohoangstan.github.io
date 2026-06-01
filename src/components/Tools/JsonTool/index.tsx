import {useState} from 'react';
import styles from '../styles.module.css';

export default function JsonTool(): JSX.Element {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function handleFormat(): void {
    setError('');
    setSuccess('');
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, 2));
      setSuccess('Valid JSON — formatted.');
    } catch (e) {
      setOutput('');
      setError((e as Error).message);
    }
  }

  function handleMinify(): void {
    setError('');
    setSuccess('');
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      setSuccess('Valid JSON — minified.');
    } catch (e) {
      setOutput('');
      setError((e as Error).message);
    }
  }

  function handleValidate(): void {
    setError('');
    setSuccess('');
    setOutput('');
    try {
      JSON.parse(input);
      setSuccess('Valid JSON.');
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function handleCopy(): void {
    if (output) {
      navigator.clipboard.writeText(output);
    }
  }

  return (
    <div className={styles.toolBody}>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel} htmlFor="json-input">
          JSON Input
        </label>
        <textarea
          id="json-input"
          className={styles.textarea}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Paste JSON here...'
          rows={6}
        />
      </div>

      <div className={styles.buttonRow}>
        <button
          type="button"
          className="button button--primary button--sm"
          onClick={handleFormat}
        >
          Format
        </button>
        <button
          type="button"
          className="button button--outline button--primary button--sm"
          onClick={handleMinify}
        >
          Minify
        </button>
        <button
          type="button"
          className="button button--outline button--primary button--sm"
          onClick={handleValidate}
        >
          Validate
        </button>
      </div>

      {error && <p className={styles.errorMsg} role="alert">{error}</p>}
      {success && <p className={styles.successMsg}>{success}</p>}

      {output && (
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="json-output">
            Output
          </label>
          <div className={styles.outputArea}>
            <textarea
              id="json-output"
              className={styles.outputTextarea}
              value={output}
              readOnly
              rows={8}
            />
            <button type="button" className={styles.copyBtn} onClick={handleCopy}>
              Copy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
