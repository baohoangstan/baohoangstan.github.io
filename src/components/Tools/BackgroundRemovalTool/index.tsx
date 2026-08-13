import {useRef, useState} from 'react';
import styles from '../styles.module.css';

const ENDPOINT = 'https://n8n.wtboss.com/webhook/remove-png-background';
const MAX_FILES = 5;

type SelectedImage = {
  key: string;
  /** Sent to the API so results can be matched back to the input file. */
  id: string;
  fileName: string;
  dataUrl: string;
};

type ResultImage = {
  id: string;
  src: string;
};

type ApiImage = {
  id?: string;
  imageB64?: string;
};

type ApiError = {
  id?: string;
  error?: string;
};

type ApiResponse = {
  ok?: boolean;
  jobId?: string;
  status?: 'done' | 'partial_error' | 'error' | string;
  count?: number;
  images?: ApiImage[];
  errors?: ApiError[];
};

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

// Saving a `data:` URL via `<a download>` is broken on mobile: iOS Safari
// ignores the download attribute (it just navigates to the URL) and Android
// Chrome flakes on large data URIs. Prefer the native share sheet (lets users
// save to Photos), and fall back to an object-URL download on desktop.
const saveImage = async (src: string, filename: string): Promise<void> => {
  let blob: Blob;
  try {
    blob = await (await fetch(src)).blob();
  } catch {
    window.open(src, '_blank');
    return;
  }

  const file = new File([blob], filename, {type: 'image/png'});
  if (
    typeof navigator.canShare === 'function' &&
    navigator.canShare({files: [file]})
  ) {
    try {
      await navigator.share({files: [file]});
      return;
    } catch (err) {
      if ((err as Error).name === 'AbortError') return; // user dismissed
      // otherwise fall through to the download path
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

function stripExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(0, dot) : name;
}

/** Ids are the map back to each input file, so they have to stay unique. */
function uniqueId(base: string, taken: Set<string>): string {
  const seed = base.trim() || 'image';
  if (!taken.has(seed)) return seed;
  let n = 2;
  while (taken.has(`${seed}-${n}`)) n++;
  return `${seed}-${n}`;
}

function isPng(file: File): boolean {
  return file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
}

function toSrc(value: string): string {
  // The API returns data URLs, but tolerate a raw base64 payload.
  return value.startsWith('data:') ? value : `data:image/png;base64,${value}`;
}

export default function BackgroundRemovalTool(): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<SelectedImage[]>([]);
  const [results, setResults] = useState<ResultImage[]>([]);
  const [itemErrors, setItemErrors] = useState<ApiError[]>([]);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSelect(
    e: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    const picked = Array.from(e.target.files ?? []);
    // Let the same file be picked again after it was removed.
    e.target.value = '';
    if (picked.length === 0) return;

    setError('');

    const pngs = picked.filter(isPng);
    const skipped = picked.length - pngs.length;

    const room = MAX_FILES - files.length;
    const accepted = pngs.slice(0, Math.max(room, 0));
    const overflow = pngs.length - accepted.length;

    const messages: string[] = [];
    if (skipped > 0) {
      messages.push(
        `${skipped} non-PNG file${skipped > 1 ? 's were' : ' was'} skipped.`,
      );
    }
    if (overflow > 0) {
      messages.push(
        `Only ${MAX_FILES} images per run — ${overflow} extra file${
          overflow > 1 ? 's were' : ' was'
        } left out.`,
      );
    }
    setNotice(messages.join(' '));

    if (accepted.length === 0) return;

    const taken = new Set(files.map((f) => f.id));
    const next: SelectedImage[] = [];
    for (const file of accepted) {
      const id = uniqueId(stripExtension(file.name), taken);
      taken.add(id);
      next.push({
        key: `${id}-${Date.now()}-${next.length}`,
        id,
        fileName: file.name,
        dataUrl: await fileToDataUrl(file),
      });
    }
    setFiles((prev) => [...prev, ...next].slice(0, MAX_FILES));
  }

  function handleRemove(key: string): void {
    setFiles((prev) => prev.filter((f) => f.key !== key));
    setNotice('');
  }

  function handleClear(): void {
    setFiles([]);
    setResults([]);
    setItemErrors([]);
    setNotice('');
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  }

  async function handleSubmit(): Promise<void> {
    if (files.length === 0) {
      setError('Pick at least one PNG image first.');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);
    setItemErrors([]);

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          images: files.map((f) => ({id: f.id, imageB64: f.dataUrl})),
        }),
      });

      let data: ApiResponse;
      try {
        data = (await res.json()) as ApiResponse;
      } catch {
        setError(`The service returned an unreadable response (HTTP ${res.status}).`);
        return;
      }

      const images = Array.isArray(data.images) ? data.images : [];
      const errors = Array.isArray(data.errors) ? data.errors : [];

      // Map before filtering so the positional fallback still lines up with
      // the input list when the service omits an id.
      const done: ResultImage[] = images
        .map((img, i) => ({
          id: img?.id || files[i]?.id || `image-${i + 1}`,
          src: img?.imageB64 ? toSrc(img.imageB64) : '',
        }))
        .filter((img) => img.src !== '');

      setResults(done);
      setItemErrors(errors);

      if (done.length === 0 && errors.length === 0) {
        setError(
          res.ok
            ? 'The service returned no images.'
            : `Request failed (HTTP ${res.status}).`,
        );
      }
    } catch (ex) {
      setError(`Network error: ${(ex as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.toolBody}>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel} htmlFor="bg-removal-files">
          PNG images (up to {MAX_FILES})
        </label>
        <input
          id="bg-removal-files"
          ref={inputRef}
          type="file"
          className={styles.fileInput}
          accept=".png,image/png"
          multiple
          onChange={handleSelect}
        />
      </div>

      {files.length > 0 && (
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            Selected — {files.length} of {MAX_FILES}
          </label>
          <div className={styles.imageGrid}>
            {files.map((f) => (
              <div key={f.key} className={styles.imageCard}>
                <div className={styles.imageFrame}>
                  <img
                    className={styles.imageThumb}
                    src={f.dataUrl}
                    alt={f.fileName}
                  />
                </div>
                <div className={styles.imageMeta}>
                  <span className={styles.imageName} title={f.fileName}>
                    {f.fileName}
                  </span>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => handleRemove(f.key)}
                    aria-label={`Remove ${f.fileName}`}
                    title={`Remove ${f.fileName}`}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.buttonRow}>
        <button
          type="button"
          className="button button--primary button--sm"
          onClick={handleSubmit}
          disabled={loading || files.length === 0}
        >
          {loading ? 'Removing background…' : 'Remove background'}
        </button>
        {(files.length > 0 || results.length > 0) && (
          <button
            type="button"
            className="button button--outline button--primary button--sm"
            onClick={handleClear}
            disabled={loading}
          >
            Clear
          </button>
        )}
      </div>

      <div aria-live="polite">
        {loading && (
          <p className={styles.statusMsg}>
            <span className={styles.spinner} aria-hidden="true" />
            Processing {files.length} image{files.length > 1 ? 's' : ''} — this
            can take a moment.
          </p>
        )}
        {notice && <p className={styles.noticeMsg}>{notice}</p>}
      </div>
      {error && (
        <p className={styles.errorMsg} role="alert">
          {error}
        </p>
      )}

      {itemErrors.length > 0 && (
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            Failed image{itemErrors.length > 1 ? 's' : ''}
          </label>
          <ul className={styles.errorList}>
            {itemErrors.map((e, i) => (
              <li key={`${e.id ?? 'error'}-${i}`} className={styles.errorListItem}>
                {e.id && <span className={styles.errorListId}>{e.id}: </span>}
                {e.error || 'Unknown error.'}
              </li>
            ))}
          </ul>
        </div>
      )}

      {results.length > 0 && (
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            Result{results.length > 1 ? 's' : ''} — transparent PNG
            {results.length > 1 ? 's' : ''}
          </label>
          <div className={styles.imageGrid}>
            {results.map((r, i) => (
              <div key={`${r.id}-${i}`} className={styles.imageCard}>
                <div className={styles.imageFrameLarge}>
                  <img
                    className={styles.imageThumb}
                    src={r.src}
                    alt={`${r.id} without background`}
                  />
                </div>
                <div className={styles.cardActions}>
                  <span className={styles.resultName} title={r.id}>
                    {r.id}
                  </span>
                  <button
                    type="button"
                    className="button button--outline button--primary button--sm"
                    onClick={() => saveImage(r.src, `${r.id}-no-bg.png`)}
                  >
                    Save PNG
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className={styles.metaText}>
            The checkerboard behind each image is the transparent area.
          </p>
        </div>
      )}
    </div>
  );
}
