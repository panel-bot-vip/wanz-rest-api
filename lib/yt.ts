import vm from 'node:vm';
import { Innertube, Platform } from 'youtubei.js';

let shimInstalled = false;

function installEvaluator() {
  if (shimInstalled) return;
  // youtubei.js v18+ butuh evaluator JS sendiri untuk decipher.
  // Implementasi via node:vm (pola yang sama dipakai ytdl-core).
  (Platform.shim as any).eval = async (data: any, env: any) => {
    const sandbox: Record<string, unknown> = {
      URL,
      URLSearchParams,
      encodeURIComponent,
      decodeURIComponent,
      Object,
      Array,
      Math,
      String,
      Number,
      Boolean,
      Error,
      Map,
      Set,
      RegExp,
      JSON,
      console: { log() { /* diam */ }, warn() { /* diam */ }, error() { /* diam */ }, info() { /* diam */ } },
    };
    vm.createContext(sandbox);
    const code =
      '(function(){\n' +
      String(data.output) +
      '\nreturn process(' +
      JSON.stringify(env.n || '') +
      ', ' +
      JSON.stringify(env.sp || '') +
      ', ' +
      JSON.stringify(env.sig || '') +
      ');\n})()';
    return vm.runInContext(code, sandbox, { timeout: 8000 });
  };
  shimInstalled = true;
}

let ytPromise: Promise<any> | null = null;

function getYt(): Promise<any> {
  installEvaluator();
  if (!ytPromise) {
    ytPromise = Innertube.create({ generate_session_locally: true }).catch((e) => {
      ytPromise = null;
      throw e;
    });
  }
  return ytPromise;
}

export function extractVideoId(input: string): string | null {
  const s = (input || '').trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s);
    const host = u.hostname.toLowerCase();
    if (host === 'youtu.be') {
      const id = u.pathname.split('/').filter(Boolean)[0];
      if (id && /^[A-Za-z0-9_-]{11}$/.test(id)) return id;
    }
    if (host.indexOf('youtube.com') !== -1 || host.indexOf('music.youtube.com') !== -1) {
      const v = u.searchParams.get('v');
      if (v && /^[A-Za-z0-9_-]{11}$/.test(v)) return v;
      const m = u.pathname.match(/\/(shorts|embed|live)\/([A-Za-z0-9_-]{11})/);
      if (m) return m[2];
    }
  } catch {
    /* bukan URL, coba regex kasar */
  }
  const m = s.match(/(?:v=|\/shorts\/|\/embed\/|\/live\/|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

export interface YtFormat {
  itag: number;
  mime: string;
  quality: string | null;
  bitrate: number | null;
  url: string;
}

export interface YtInfo {
  id: string;
  title: string | null;
  author: string | null;
  duration: number | null;
  thumbnail: string | null;
}

export async function getVideo(id: string): Promise<{ yt: any; info: any }> {
  const yt = await getYt();
  const info = await yt.getInfo(id);
  if (!info || !info.basic_info) throw new Error('no_info');
  if (!info.streaming_data) throw new Error('no_stream');
  return { yt, info };
}

export function baseInfo(info: any, id: string): YtInfo {
  const b = info.basic_info || {};
  const thumbs = b.thumbnail || [];
  return {
    id,
    title: b.title || null,
    author: b.author || null,
    duration: typeof b.duration === 'number' ? b.duration : null,
    thumbnail: thumbs.length > 0 ? thumbs[thumbs.length - 1].url || null : null,
  };
}

export async function decipherFormat(yt: any, format: any): Promise<string> {
  const url = await format.decipher(yt.session.player);
  return String(url);
}

export function pickProgressive(info: any): any | null {
  try {
    const f = info.chooseFormat({ quality: 'best', type: 'video+audio' });
    return f || null;
  } catch {
    return null;
  }
}

export function pickAudio(info: any): any | null {
  try {
    const audios = (info.streaming_data?.adaptive_formats || []).filter((f: any) =>
      String(f.mime_type || '').indexOf('audio/') === 0
    );
    audios.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));
    return audios.length > 0 ? audios[0] : null;
  } catch {
    return null;
  }
}
