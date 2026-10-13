'use client';

import { WarnIcon, CheckIcon, XIcon, ZapIcon, LockIcon, UnlockIcon, BanIcon } from '@/components/icons';


/**
 * Section sindir API lain yang ngaku "gratis" tapi minta API key.
 * Marquee roast jalan terus (murni CSS) + kartu perbandingan.
 */

const ROASTS = [
  'API lain: "Gratis!" *syarat & ketentuan berlaku, wajib ambil API key',
  'Mau unlimited? Daftar dulu, verifikasi email, baru dikasih key',
  'Free API tapi minta API key = itu namanya gak gratis, bro',
  'Request pertama butuh 40 lapis konfigurasi & 3 tutorial',
  'Rate limit 100/hari, key bocor = saldo lenyap',
  'Wanz: tanpa key, tanpa daftar, tanpa ribet. Langsung gas.',
];

const BAD = [
  { Icon: LockIcon, text: 'Wajib daftar & verifikasi email dulu' },
  { Icon: LockIcon, text: 'Butuh API key di setiap request' },
  { Icon: WarnIcon, text: 'Rate limit 100 request/hari, habis = nunggu' },
  { Icon: BanIcon, text: '"Gratis"*, syarat & ketentuan berlaku' },
  { Icon: XIcon, text: 'Key bocor? Saldo langsung lenyap' },
];

const GOOD = [
  { Icon: UnlockIcon, text: 'Tanpa daftar, tanpa login' },
  { Icon: ZapIcon, text: 'Tanpa API key sama sekali' },
  { Icon: CheckIcon, text: 'Bebas request, alergi key' },
  { Icon: CheckIcon, text: 'Tinggal pakai, selesai' },
  { Icon: CheckIcon, text: 'Open source & transparan' },
];

export default function RoastSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-12" id="roast">
      {/* Marquee roast */}
      <div className="roast-marquee" data-reveal>
        <div className="roast-track">
          {[...ROASTS, ...ROASTS].map((text, i) => (
            <span className="roast-item" key={i}>
              <ZapIcon size={16} />
              {text}
              <span className="sep">•</span>
            </span>
          ))}
        </div>
      </div>

      <h2
        className="handwritten icon-text"
        data-reveal
        style={{
          fontSize: '2.5rem',
          justifyContent: 'center',
          textAlign: 'center',
          marginBottom: '8px',
          color: 'var(--text-primary)',
        }}
      >
        <WarnIcon size={30} /> Kenapa Pilih Wanz?
      </h2>
      <p
        data-reveal
        style={{
          textAlign: 'center',
          color: 'var(--text-secondary)',
          marginBottom: '32px',
          fontSize: '1.05rem',
        }}
      >
        API lain ngaku gratis, eh minta API key. Wanz? Alergi key.
      </p>

      <div className="roast-grid">
        <div className="roast-card bad" data-reveal>
          <div className="roast-head">
            <XIcon size={22} /> API Lain
          </div>
          <div className="roast-sub">Katanya gratis… eh minta API key</div>
          <ul className="roast-list">
            {BAD.map((b, i) => (
              <li key={i}>
                <span className="ic"><b.Icon size={18} /></span>
                {b.text}
              </li>
            ))}
          </ul>
        </div>

        <div className="roast-card good" data-reveal>
          <div className="roast-head">
            <CheckIcon size={22} /> Wanz REST API&apos;s
          </div>
          <div className="roast-sub">Beneran gratis, tanpa ribet</div>
          <ul className="roast-list">
            {GOOD.map((g, i) => (
              <li key={i}>
                <span className="ic"><g.Icon size={18} /></span>
                {g.text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
