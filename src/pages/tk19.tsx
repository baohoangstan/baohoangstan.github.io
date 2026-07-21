import { useRef, useState } from 'react';
import Layout from '@theme/Layout';
import { Loader2 } from 'lucide-react';

import { Button } from '@site/src/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@site/src/components/ui/card';
import { Input } from '@site/src/components/ui/input';
import { Label } from '@site/src/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@site/src/components/ui/select';

const SUBMIT = 'https://n8n.wtboss.com/webhook/avatar-generate';
const STATUS = 'https://n8n.wtboss.com/webhook/avatar-status';
const POLL_MS = 3000;
const TIMEOUT_MS = 300000;

const sleep = (ms: number): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

const COLORS = [
  { value: 'Blue', label: 'Xanh Dương', swatch: '#2563eb' },
  { value: 'Red', label: 'Đỏ', swatch: '#dc2626' },
  { value: 'Green', label: 'Xanh Lá', swatch: '#16a34a' },
  { value: 'Gold', label: 'Vàng Kim', swatch: '#d4af37' },
  { value: 'Purple', label: 'Tím', swatch: '#9333ea' },
  { value: 'Silver', label: 'Bạc', swatch: '#c0c0c0' },
  { value: 'Teal', label: 'Xanh Mòng Két', swatch: '#0d9488' },
  { value: 'Orange', label: 'Cam', swatch: '#ea580c' },
  { value: 'Rose Pink', label: 'Hồng Phấn', swatch: '#f43f5e' },
  { value: 'Black', label: 'Đen', swatch: '#0f172a' },
];

const ColorSwatch = ({ swatch }: { swatch: string }): JSX.Element => (
  <span
    className="h-3.5 w-3.5 shrink-0 rounded-full border border-border/50 shadow-sm"
    style={{ backgroundColor: swatch }}
  />
);

const SelectedColor = ({ value }: { value: string }): JSX.Element | null => {
  const c = COLORS.find((x) => x.value === value);
  if (!c) return null;
  return (
    <span className="flex items-center gap-2">
      <ColorSwatch swatch={c.swatch} />
      {c.label}
    </span>
  );
};

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

function AvatarGenerator(): JSX.Element {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>('');
  const [text, setText] = useState('15 Năm TK19');
  const [color, setColor] = useState('Blue');
  const [frame, setFrame] = useState('Full');
  const [background, setBackground] = useState('Keep');
  const [speed, setSpeed] = useState('quick');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [images, setImages] = useState<string[]>([]);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setPreview(f ? await fileToDataUrl(f) : '');
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setImages([]);
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError('Vui lòng chọn một ảnh.');
      return;
    }

    setLoading(true);
    setStatus('Đang gửi…');
    try {
      const imageB64 = await fileToDataUrl(file);
      const payload = { imageB64, text, color, frame, background, speed };

      // 1) Submit — returns instantly with a jobId
      const subRes = await fetch(SUBMIT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const sub = await subRes.json();
      if (!sub.jobId) {
        setStatus('');
        setError('Không thể bắt đầu tạo ảnh.');
        return;
      }

      // 2) Poll the status endpoint until done / error / timeout
      setStatus('Đang tạo ảnh của bạn… có thể mất đến một phút.');
      const started = Date.now();
      while (Date.now() - started < TIMEOUT_MS) {
        await sleep(POLL_MS);
        let st;
        try {
          const r = await fetch(
            STATUS + '?jobId=' + encodeURIComponent(sub.jobId),
            { method: 'GET' },
          );
          st = await r.json();
        } catch (_) {
          continue; // transient network hiccup — keep polling
        }

        if (st.status === 'done' && st.images && st.images.length) {
          setStatus('');
          setImages(
            st.images.map((b64: string) => 'data:image/png;base64,' + b64),
          );
          return;
        }
        if (st.status === 'error' || st.status === 'not_found') {
          setStatus('');
          setError(st.error || 'Tạo ảnh thất bại. Vui lòng thử lại.');
          return;
        }
        // status === "processing" → keep polling
      }
      setStatus('');
      setError('Hết thời gian chờ tạo ảnh. Vui lòng thử lại.');
    } catch (ex: any) {
      setStatus('');
      setError('Lỗi mạng: ' + ex.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-lg shadow-md">
      <CardHeader>
        <CardTitle>Tạo ảnh đẹp đi bạn ơi</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="avatar-image">Ảnh Đại Diện</Label>
            <Input
              id="avatar-image"
              type="file"
              ref={fileRef}
              accept=".png,.jpg,.jpeg,.webp"
              required
              onChange={onFileChange}
              className="h-auto py-2 file:mr-3 file:cursor-pointer file:rounded-md file:bg-secondary file:px-3 file:py-1 file:text-secondary-foreground"
            />
            {preview && (
              <img
                src={preview}
                alt="preview"
                className="mt-2 max-h-32 rounded-md border border-border object-contain shadow-sm"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="frame-text">Chữ Trên Khung</Label>
            <Input
              id="frame-text"
              type="text"
              placeholder="Kỷ Niệm 20 Năm"
              required
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="main-color">Màu Chính</Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger id="main-color">
                  <SelectValue>
                    <SelectedColor value={color} />
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {COLORS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <span className="flex items-center gap-2">
                        <ColorSwatch swatch={c.swatch} />
                        {c.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="frame-style">Kiểu Khung</Label>
              <Select value={frame} onValueChange={setFrame}>
                <SelectTrigger id="frame-style">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Full">Toàn Phần</SelectItem>
                  <SelectItem value="Half">Một Nửa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="background">Nền</Label>
              <Select value={background} onValueChange={setBackground}>
                <SelectTrigger id="background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Keep">Giữ Nguyên</SelectItem>
                  <SelectItem value="Remove">Xóa Nền</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="speed">Tốc Độ</Label>
              <Select value={speed} onValueChange={setSpeed}>
                <SelectTrigger id="speed">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quick">Nhanh (chất lượng thường)</SelectItem>
                  <SelectItem value="slow">Chậm (chất lượng cao)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Đang tạo…' : 'Tạo Ảnh Đại Diện'}
          </Button>

          {status && (
            <p className="flex items-center gap-2 text-sm font-medium text-primary">
              <Loader2 className="h-4 w-4 animate-spin" />
              {status}
            </p>
          )}

          {error && (
            <p className="text-sm font-medium text-destructive">{error}</p>
          )}
        </form>

        {images.length > 0 && (
          <div className="mt-6 space-y-6">
            {images.map((src, i) => (
              <div key={i} className="flex flex-col items-center gap-3">
                <img
                  src={src}
                  alt={`avatar ${i + 1}`}
                  className="max-w-full rounded-lg border border-border shadow-md"
                />
                <Button asChild variant="secondary" size="sm">
                  <a download={`avatar-${i + 1}.png`} href={src}>
                    Tải Ảnh PNG
                  </a>
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function TK19(): JSX.Element {
  return (
    <Layout title="TK19">
      <main className="px-4 py-8">
        <AvatarGenerator />
      </main>
    </Layout>
  );
}
