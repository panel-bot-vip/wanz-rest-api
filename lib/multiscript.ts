/**
 * Translator keyword JavaScript <-> Jawa / Sunda / Indonesia.
 * Self-contained: token-level, bukan API-wrapping, gak ngejalankan kode.
 *
 * Data keyword diambil dari struktur [@rafxzflow/multiscript] tapi emitter
 * sendiri biar output bersih & valid (emitter bawaan paket rusak).
 * Tiap entri: [kata-bahasa, sisi-english] — sisi-english identik antar bahasa.
 */

export type Lang = 'js' | 'jawa' | 'sunda' | 'indo';

export const LANGS: Lang[] = ['js', 'jawa', 'sunda', 'indo'];

type Entry = [string, string];

const JAWA: Entry[] = [
  ['ora', 'else'], ['yen', 'if'], ['nompo', 'catch'], ['nyoba', 'try'],
  ['akhire', 'finally'], ['sambil', 'async'], ['kanggo', 'for'],
  ['nganti', 'while'], ['fungsi', 'function'], ['warisan', 'extends'],
  ['kelas', 'class'], ['balekno', 'return'], ['mandheg', 'break'],
  ['lanjutna', 'continue'], ['milih', 'switch'], ['kasus', 'case'],
  ['asale', 'default'], ['buang', 'throw'], ['enteni', 'await'],
  ['anyar', 'new'], ['paten', 'const'], ['ono', 'let'],
  ['tampilno', 'console.log'], ['rajelas', 'undefined'], ['suwung', 'null'],
  ['iki', 'this'], ['bener', 'true'], ['salah', 'false'], ['saka', 'of'],
  ['ing', 'in'], ['lan', '&&'], ['utawa', '||'], ['padhaKaro', '==='],
  ['oraPadha', '!=='], ['gedhePadha', '>='], ['cilikPadha', '<='],
  ['gedhe', '>'], ['cilik', '<'],
];

const SUNDA: Entry[] = [
  ['salian', 'else'], ['lamun', 'if'], ['tangkep', 'catch'], ['coba', 'try'],
  ['ahirna', 'finally'], ['sabari', 'async'], ['keur', 'for'],
  ['salila', 'while'], ['fungsi', 'function'], ['turunan', 'extends'],
  ['kelas', 'class'], ['balikkeun', 'return'], ['eureun', 'break'],
  ['lanjutkeun', 'continue'], ['milih', 'switch'], ['kasus', 'case'],
  ['baku', 'default'], ['balingkeun', 'throw'], ['anti', 'await'],
  ['anyar', 'new'], ['tetep', 'const'], ['aya', 'let'],
  ['tampilkeun', 'console.log'], ['teuJelas', 'undefined'], ['kosong', 'null'],
  ['ieu', 'this'], ['bener', 'true'], ['salah', 'false'], ['tina', 'of'],
  ['dina', 'in'], ['jeung', '&&'], ['atawa', '||'], ['saruaPersis', '==='],
  ['teuSarua', '!=='], ['gedeSama', '>='], ['leutikSama', '<='],
  ['gede', '>'], ['leutik', '<'],
];

const INDO: Entry[] = [
  ['selain', 'else'], ['jika', 'if'], ['tangkap', 'catch'], ['coba', 'try'],
  ['akhirnya', 'finally'], ['sembari', 'async'], ['untuk', 'for'],
  ['selama', 'while'], ['fungsi', 'function'], ['warisi', 'extends'],
  ['kelas', 'class'], ['kembalikan', 'return'], ['hentikan', 'break'],
  ['lanjutkan', 'continue'], ['pilih', 'switch'], ['kasus', 'case'],
  ['asali', 'default'], ['lempar', 'throw'], ['tunggu', 'await'],
  ['baru', 'new'], ['konstanta', 'const'], ['biarkan', 'let'],
  ['cetak', 'console.log'], ['tidakJelas', 'undefined'], ['kosong', 'null'],
  ['ini', 'this'], ['benar', 'true'], ['salah', 'false'], ['dari', 'of'],
  ['dalam', 'in'], ['dan', '&&'], ['atau', '||'], ['samaPersis', '==='],
  ['bukanSama', '!=='], ['besarSama', '>='], ['kecilSama', '<='],
  ['besar', '>'], ['kecil', '<'],
];

const WORDS: Record<Exclude<Lang, 'js'>, Entry[]> = {
  jawa: JAWA, sunda: SUNDA, indo: INDO,
};

// bahasa -> arti english (kata/simbol). js = identitas (kata english itu sendiri).
const toEn: Record<Lang, Map<string, string>> = {
  js: new Map(), // nanti diisi identitas
  jawa: new Map(JAWA.map(([l, e]) => [l, e])),
  sunda: new Map(SUNDA.map(([l, e]) => [l, e])),
  indo: new Map(INDO.map(([l, e]) => [l, e])),
};
// arti english -> bahasa target. js = identitas.
const fromEn: Record<Lang, Map<string, string>> = {
  js: new Map(), // identitas
  jawa: new Map(JAWA.map(([l, e]) => [e, l])),
  sunda: new Map(SUNDA.map(([l, e]) => [e, l])),
  indo: new Map(INDO.map(([l, e]) => [e, l])),
};

// set english (buat deteksi keyword valid saat input js)
const EN_SET = new Set(JAWA.map(([, e]) => e));
EN_SET.forEach((e) => {
  toEn.js.set(e, e);
  fromEn.js.set(e, e);
});

// operator yang di-map (dipanjang dulu biar -> / => / >> gak salah potong)
const OPS = [
  '===', '!==', '>>>', '<<=', '>>=', '...', '=>', '>=', '<=', '&&', '||',
  '==', '!=', '++', '--', '+=', '-=', '*=', '/=', '%=', '??', '?.', '>>', '<<',
  '>', '<', '=', '+', '-', '*', '/', '%', '!', '~', '?', ':', ';', ',', '.',
  '(', ')', '[', ']', '{', '}', '&', '|', '^',
];

const isIdStart = (c: string) => /[A-Za-z_$]/.test(c);
const isIdPart = (c: string) => /[A-Za-z0-9_$]/.test(c);

/**
 * Terjemahkan kode antar bahasa. Hanya mengganti KATA KUNCI & operator —
 * string, komentar, dan nama variabel pengguna tidak disentuh.
 */
export function translateCode(code: string, from: Lang, to: Lang): string {
  if (from === to) return code;
  const tEn = toEn[from];
  const fEn = fromEn[to];
  const out: string[] = [];
  let i = 0;
  const n = code.length;

  const resolve = (token: string): string => {
    // arti english dari token pada bahasa sumber
    let meaning: string | undefined;
    if (from === 'js') {
      meaning = EN_SET.has(token) ? token : undefined;
    } else {
      meaning = tEn.get(token);
    }
    if (meaning === undefined) return token; // bukan keyword -> biarkan
    if (to === 'js') return meaning;
    return fEn.get(meaning) ?? meaning;
  };

  while (i < n) {
    const c = code[i];

    // string biasa
    if (c === "'" || c === '"') {
      const q = c;
      let j = i + 1;
      while (j < n && code[j] !== q) {
        if (code[j] === '\\') j++;
        j++;
      }
      out.push(code.slice(i, j + 1));
      i = j + 1;
      continue;
    }

    // template literal (perlakukan seluruhnya sebagai string, ${} tidak diterjemah)
    if (c === '`') {
      let j = i + 1;
      while (j < n && code[j] !== '`') {
        if (code[j] === '\\') j++;
        j++;
      }
      out.push(code.slice(i, j + 1));
      i = j + 1;
      continue;
    }

    // komentar
    if (c === '/' && code[i + 1] === '/') {
      let j = i;
      while (j < n && code[j] !== '\n') j++;
      out.push(code.slice(i, j));
      i = j;
      continue;
    }
    if (c === '/' && code[i + 1] === '*') {
      let j = code.indexOf('*/', i + 2);
      j = j === -1 ? n : j + 2;
      out.push(code.slice(i, j));
      i = j;
      continue;
    }

    // angka
    if (/[0-9]/.test(c)) {
      let j = i;
      while (j < n && /[0-9a-fA-FxXoObB._]/.test(code[j])) j++;
      out.push(code.slice(i, j));
      i = j;
      continue;
    }

    // identifier / kata kunci
    if (isIdStart(c)) {
      let j = i;
      while (j < n && isIdPart(code[j])) j++;
      let word = code.slice(i, j);
      // gabung console.log jadi satu token
      if (word === 'console' && code[j] === '.' && code.slice(j + 1, j + 4) === 'log' && !isIdPart(code[j + 4] ?? '')) {
        word = 'console.log';
        j += 4;
      }
      out.push(resolve(word));
      i = j;
      continue;
    }

    // whitespace -> salin persis
    if (/\s/.test(c)) {
      out.push(c);
      i++;
      continue;
    }

    // operator: coba yang terpanjang dulu
    let matched: string | null = null;
    for (const op of OPS) {
      if (code.startsWith(op, i)) {
        matched = op;
        break;
      }
    }
    if (matched) {
      const resolved = resolve(matched);
      // operator -> kata (mis. > -> gedhe): tambah spasi HANYA bila perlu
      // (tetangga berupa word-char) biar gak nempel & gak dobel spasi
      if (resolved !== matched && /^[A-Za-z_]/.test(resolved)) {
        const prev = out.length ? out[out.length - 1] : '';
        const nextCh = code[i + matched.length] || '';
        const needLeft = prev !== '' && /[A-Za-z0-9_$]/.test(prev);
        const needRight = /[A-Za-z0-9_$]/.test(nextCh);
        out.push((needLeft ? ' ' : '') + resolved + (needRight ? ' ' : ''));
      } else {
        out.push(resolved);
      }
      i += matched.length;
      continue;
    }

    out.push(c);
    i++;
  }

  return out.join('');
}
