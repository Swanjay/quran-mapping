// ==================== PRAYER TIMES WIDGET ====================
const PRAYER_API = 'https://quran-mapping-prayer.workers.dev/api/prayer-times';
const CITIES = [
    { name: 'Mekkah', lat: 21.4225, lng: 39.8262, tz: 'Asia/Riyadh' },
    { name: 'Madinah', lat: 24.4672, lng: 39.6112, tz: 'Asia/Riyadh' },
    { name: 'Jakarta', lat: -6.2088, lng: 106.8456, tz: 'Asia/Jakarta' },
    { name: 'Banda Aceh', lat: 5.5483, lng: 95.3238, tz: 'Asia/Jakarta' },
    { name: 'Medan', lat: 3.5952, lng: 98.6722, tz: 'Asia/Jakarta' },
    { name: 'Palembang', lat: -2.9761, lng: 104.7754, tz: 'Asia/Jakarta' },
    { name: 'Bandung', lat: -6.9175, lng: 107.6191, tz: 'Asia/Jakarta' },
    { name: 'Semarang', lat: -6.9667, lng: 110.4167, tz: 'Asia/Jakarta' },
    { name: 'Yogyakarta', lat: -7.7956, lng: 110.3695, tz: 'Asia/Jakarta' },
    { name: 'Surabaya', lat: -7.2575, lng: 112.7521, tz: 'Asia/Jakarta' },
    { name: 'Makassar', lat: -5.1477, lng: 119.4327, tz: 'Asia/Makassar' },
    { name: 'Manado', lat: 1.4748, lng: 124.8421, tz: 'Asia/Makassar' },
    { name: 'Jayapura', lat: -2.5916, lng: 140.6690, tz: 'Asia/Jayapura' },
    { name: 'Kuala Lumpur', lat: 3.1390, lng: 101.6869, tz: 'Asia/Kuala_Lumpur' },
    { name: 'Singapura', lat: 1.3521, lng: 103.8198, tz: 'Asia/Singapore' },
    { name: 'Kairo', lat: 30.0444, lng: 31.2357, tz: 'Africa/Cairo' },
    { name: 'Istanbul', lat: 41.0082, lng: 28.9784, tz: 'Europe/Istanbul' },
    { name: 'Karachi', lat: 24.8607, lng: 67.0011, tz: 'Asia/Karachi' },
    { name: 'Dhaka', lat: 23.8103, lng: 90.4125, tz: 'Asia/Dhaka' },
];

let prayerWidgetVisible = true;
let selectedCity = null;

function getPrayerMethod() {
    // Deteksi lokasi user via IP (fallback ke Kemenag)
    return 'kemenag';
}

async function fetchPrayerTimes(lat, lng, date, tz) {
    const dateStr = date || new Date().toISOString().split('T')[0];
    const url = `${PRAYER_API}?lat=${lat}&lng=${lng}&date=${dateStr}&method=kemenag&tz=${tz}`;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Network error');
        return await res.json();
    } catch (err) {
        console.error('Prayer times fetch error:', err);
        return null;
    }
}

function renderPrayerWidget(data, cityName) {
    const widget = document.getElementById('prayer-widget');
    if (!widget) return;

    if (!data) {
        widget.innerHTML = `
            <div style="padding:12px;text-align:center;color:var(--ink-mute);font-size:13px">
                ⏳ Gagal memuat waktu shalat
            </div>
        `;
        return;
    }

    const times = [
        { label: 'Subuh', value: data.fajr },
        { label: 'Syuruq', value: data.sunrise },
        { label: 'Dhuha', value: data.dhuha },
        { label: 'Dzuhur', value: data.dhuhr },
        { label: 'Ashar', value: data.asr },
        { label: 'Maghrib', value: data.maghrib },
        { label: 'Isya', value: data.isha },
    ];

    // Cari tahu waktu sekarang untuk highlight
    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTime = currentHour * 60 + currentMin;

    // Konversi waktu ke menit
    const timeToMinutes = (str) => {
        if (!str) return -1;
        const parts = str.split(':');
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    };

    let nextPrayer = null;
    let nextIndex = -1;
    for (let i = 0; i < times.length; i++) {
        const t = timeToMinutes(times[i].value);
        if (t > currentTime) {
            nextPrayer = times[i];
            nextIndex = i;
            break;
        }
    }
    if (!nextPrayer) {
        // Semua waktu lewat, ambil yang pertama besok
        nextPrayer = times[0];
        nextIndex = 0;
    }

    widget.innerHTML = `
        <div style="background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 16px;box-shadow:0 4px 16px rgba(0,0,0,0.08);min-width:200px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                <span style="font-weight:600;font-size:14px;color:var(--emerald-deep)">🕌 ${cityName || 'Lokasi'}</span>
                <span style="font-size:11px;color:var(--ink-mute)">${data.date || ''}</span>
                <button onclick="togglePrayerWidget()" style="background:none;border:none;cursor:pointer;font-size:16px;color:var(--ink-mute)">✕</button>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;font-size:13px">
                ${times.map((t, i) => `
                    <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--line);${i === nextIndex ? 'background:var(--emerald-pale);border-radius:4px;padding:3px 6px;' : ''}">
                        <span style="color:${i === nextIndex ? 'var(--emerald)' : 'var(--ink-soft)'}">${t.label}</span>
                        <span style="font-weight:${i === nextIndex ? '600' : '400'};color:${i === nextIndex ? 'var(--emerald-deep)' : 'var(--ink)'}">${t.value || '--:--'}</span>
                    </div>
                `).join('')}
            </div>
            ${nextPrayer ? `<div style="margin-top:8px;font-size:11px;color:var(--gold);text-align:center">⏰ ${nextPrayer.label} berikutnya</div>` : ''}
            <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap">
                <select id="city-select" onchange="changeCity(this.value)" style="flex:1;padding:4px 8px;border:1px solid var(--line);border-radius:6px;font-size:12px;background:var(--card);color:var(--ink)">
                    <option value="">Pilih kota</option>
                    ${CITIES.map(c => `<option value="${c.lat},${c.lng},${c.tz}">${c.name}</option>`).join('')}
                </select>
                <button onclick="refreshPrayerTimes()" style="padding:4px 10px;border:1px solid var(--line);border-radius:6px;background:var(--card);cursor:pointer;font-size:12px;color:var(--ink-soft)">↻</button>
            </div>
        </div>
    `;
}

function togglePrayerWidget() {
    prayerWidgetVisible = !prayerWidgetVisible;
    const widget = document.getElementById('prayer-widget');
    if (widget) {
        widget.style.display = prayerWidgetVisible ? 'block' : 'none';
    }
    localStorage.setItem('qm-prayer-visible', prayerWidgetVisible ? 'true' : 'false');
}

function changeCity(value) {
    if (!value) return;
    const [lat, lng, tz] = value.split(',');
    selectedCity = { lat: parseFloat(lat), lng: parseFloat(lng), tz };
    const cityName = CITIES.find(c => c.lat === parseFloat(lat) && c.lng === parseFloat(lng))?.name || 'Kota';
    loadPrayerTimes(parseFloat(lat), parseFloat(lng), cityName, tz);
}

async function loadPrayerTimes(lat, lng, cityName, tz) {
    const data = await fetchPrayerTimes(lat, lng, null, tz);
    renderPrayerWidget(data, cityName);
    if (data) {
        // Simpan di localStorage
        localStorage.setItem('qm-prayer-data', JSON.stringify({ lat, lng, cityName, tz, data }));
    }
}

function refreshPrayerTimes() {
    const widget = document.getElementById('prayer-widget');
    if (!widget) return;
    const select = document.getElementById('city-select');
    if (select && select.value) {
        changeCity(select.value);
    } else {
        // Auto-detect lokasi
        detectLocation();
    }
}

async function detectLocation() {
    try {
        // Gunakan IP API sederhana
        const res = await fetch('https://ipapi.co/json/');
        if (!res.ok) throw new Error('IP API error');
        const data = await res.json();
        const lat = data.latitude || -6.2;
        const lng = data.longitude || 106.8;
        const tz = data.timezone || 'Asia/Jakarta';
        const cityName = data.city || 'Jakarta';
        selectedCity = { lat, lng, tz };
        loadPrayerTimes(lat, lng, cityName, tz);
    } catch (err) {
        console.error('Location detection error:', err);
        // Fallback ke Jakarta
        loadPrayerTimes(-6.2088, 106.8456, 'Jakarta', 'Asia/Jakarta');
    }
}

// Inisialisasi widget
function initPrayerWidget() {
    const container = document.createElement('div');
    container.id = 'prayer-widget';
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.right = '20px';
    container.style.zIndex = '1000';
    container.style.maxWidth = '280px';
    document.body.appendChild(container);

    // Cek localStorage
    const saved = localStorage.getItem('qm-prayer-data');
    const visible = localStorage.getItem('qm-prayer-visible');
    prayerWidgetVisible = visible !== 'false';
    container.style.display = prayerWidgetVisible ? 'block' : 'none';

    if (saved) {
        try {
            const data = JSON.parse(saved);
            renderPrayerWidget(data.data, data.cityName);
            // Refresh otomatis tiap 5 menit
            setInterval(() => {
                loadPrayerTimes(data.lat, data.lng, data.cityName, data.tz);
            }, 5 * 60 * 1000);
            return;
        } catch (e) {}
    }

    // Deteksi lokasi otomatis
    detectLocation();
    // Refresh tiap 5 menit
    setInterval(() => {
        if (selectedCity) {
            loadPrayerTimes(selectedCity.lat, selectedCity.lng, selectedCity.cityName || 'Kota', selectedCity.tz);
        }
    }, 5 * 60 * 1000);
}

// Eksekusi saat DOM siap
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPrayerWidget);
} else {
    initPrayerWidget();
}