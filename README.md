# Quran Mapping

Situs statis yang mengurai 114 surah Al-Quran: pokok kandungan, pelajaran & hikmah, hukum yang terkandung, dan keterkaitan antar surah (munasabah).

## Struktur proyek

```
quran-mapping/
├── index.html          → seluruh tampilan + logika (satu file)
├── data/
│   ├── manifest.js     → daftar 114 nama surah + daftar yang tersedia (AVAILABLE)
│   ├── surah-001.js    → konten Al-Fatihah
│   ├── surah-112.js    → konten Al-Ikhlas
│   ├── surah-113.js    → konten Al-Falaq
│   └── surah-114.js    → konten An-Nas
└── README.md
```

## Menambah surah baru

1. Buat file `data/surah-XXX.js` (XXX = nomor surah 3 digit) mengikuti pola file yang sudah ada — panggil `registerSurah({...})` dengan struktur data yang sama.
2. Tambahkan nomor surah ke array `AVAILABLE` di `data/manifest.js`.
3. Selesai — surah otomatis muncul di daftar dan bisa dibuka.

Audio per ayat otomatis tersambung ke EveryAyah.com berdasarkan nomor surah dan ayat (butuh koneksi internet). Qari default: Mishary Rashid Alafasy — bisa diganti lewat konstanta `QARI` di `index.html`.

## Menjalankan lokal

Buka `index.html` langsung di browser (dobel klik) — semua konten berjalan tanpa server. Fitur audio dan font premium membutuhkan internet.

## Deploy (instruksi untuk agent)

Target: Cloudflare Pages, terhubung ke repo GitHub ini.

1. Push seluruh isi folder ini ke repo GitHub (branch `main`).
2. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → pilih repo ini.
   - Build command: (kosongkan — situs statis murni)
   - Build output directory: `/` (root)
3. Setelah live di `*.pages.dev`, tambahkan custom domain di tab Custom Domains.
4. JANGAN mengubah konfigurasi DNS lain di luar record yang dibutuhkan custom domain ini.

Catatan keamanan: gunakan token dengan izin terbatas — GitHub fine-grained token (akses repo ini saja) dan Cloudflare API token dengan scope Pages saja.

## Status konten

Seluruh konten tafsir berstatus **draf** sampai ditinjau oleh ahli tafsir. Setiap file surah memiliki field `status` — perbarui setelah peninjauan selesai (nama peninjau + tanggal).

Rujukan utama: Tafsir Ibnu Katsir, Tafsir As-Sa'di, Tafsir Kemenag RI. Teks & terjemahan: Tanzil.net / Kemenag RI. Audio: EveryAyah.com.
