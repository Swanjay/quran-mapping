// ==================== PRAYER TIMES WIDGET — FULLY FIXED ====================
(function() {
    const CITY_KEY = 'qm-city';
    const PRAYER_KEY = 'qm-prayer-cache';

    const CITIES = [
        { name: 'Jakarta', lat: -6.2088, lng: 106.8456, tz: 'Asia/Jakarta' },
        { name: 'Bandung', lat: -6.9175, lng: 107.6191, tz: 'Asia/Jakarta' },
        { name: 'Surabaya', lat: -7.2575, lng: 112.7521, tz: 'Asia/Jakarta' },
        { name: 'Mekkah', lat: 21.4225, lng: 39.8262, tz: 'Asia/Riyadh' },
        { name: 'Madinah', lat: 24.4672, lng: 39.6112, tz: 'Asia/Riyadh' }
    ];

    let selected = null;
    let adhan = null;
    let initAttempts = 0;
    const MAX_INIT_ATTEMPTS = 5;

    function loadAdhan() {
        return new Promise((resolve) => {
            if (window.adhan) {
                adhan = window.adhan;
                resolve(true);
                return;
            }
            // Try multiple CDN sources in sequence
            const cdnUrls = [
                'https://cdnjs.cloudflare.com/ajax/libs/adhan/4.0.0/adhan.min.js',
                'https://unpkg.com/adhan@4.0.0/dist/adhan.umd.min.js',
                'https://cdn.jsdelivr.net/npm/adhan@4.0.0/dist/adhan.umd.min.js'
            ];
            let idx = 0;

            function tryNext() {
                if (idx >= cdnUrls.length) {
                    resolve(false);
                    return;
                }
                const script = document.createElement('script');
                script.src = cdnUrls[idx];
                script.onload = () => {
                    if (window.adhan) {
                        adhan = window.adhan;
                        resolve(true);
                    } else {
                        idx++;
                        tryNext();
                    }
                };
                script.onerror = () => {
                    idx++;
                    tryNext();
                };
                document.head.appendChild(script);
            }
            tryNext();
        });
    }

    function toMinutes(time) {
        if (!time) return -1;
        const parts = time.split(':');
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }

    function formatTime(date) {
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    }

    function calculatePrayerTimes(lat, lng, tz) {
        if (!adhan) return null;
        try {
            const coords = new adhan.Coordinates(lat, lng);
            const params = adhan.CalculationMethod.MuslimWorldLeague();
            const date = new Date();
            const times = new adhan.PrayerTimes(coords, date, params);
            return {
                fajr: formatTime(times.fajr),
                sunrise: formatTime(times.sunrise),
                dhuhr: formatTime(times.dhuhr),
                asr: formatTime(times.asr),
                maghrib: formatTime(times.maghrib),
                isha: formatTime(times.isha),
                date: date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
            };
        } catch(e) {
            console.error('Prayer calculation error:', e);
            return null;
        }
    }

    function render(data, city) {
        const el = document.getElementById('prayer-widget');
        if (!el) return;
        if (!data || !adhan) {
            // Show loading state with retry button
            el.innerHTML = `<div style="padding:12px;background:var(--card);border-radius:12px;border:1px solid var(--line);text-align:center;color:var(--ink-mute);max-width:280px;font-size:13px">
                <div>⏳ Memuat waktu shalat...</div>
                <button onclick="window.retryPrayerWidget()" style="margin-top:8px;padding:4px 12px;border:1px solid var(--line);border-radius:6px;background:var(--card);cursor:pointer;font-size:12px">🔄 Coba lagi</button>
            </div>`;
            return;
        }
        const now = new Date();
        const currentMin = now.getHours() * 60 + now.getMinutes();
        const times = [
            { label: 'Subuh', val: data.fajr },
            { label: 'Syuruq', val: data.sunrise },
            { label: 'Dzuhur', val: data.dhuhr },
            { label: 'Ashar', val: data.asr },
            { label: 'Maghrib', val: data.maghrib },
            { label: 'Isya', val: data.isha }
        ];
        let next = null;
        for (const t of times) {
            const m = toMinutes(t.val);
            if (m > currentMin) { next = t; break; }
        }
        if (!next) next = times[0];

        el.innerHTML = `
        <div style="background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px;box-shadow:0 4px 16px rgba(0,0,0,0.08);max-width:280px;font-size:13px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <span style="font-weight:600;color:var(--emerald-deep)">🕌 ${city.name}</span>
                <span style="font-size:11px;color:var(--ink-mute)">${data.date}</span>
                <button onclick="document.getElementById('prayer-widget').style.display='none';localStorage.setItem('qm-prayer-hidden','true')" style="background:none;border:none;cursor:pointer;color:var(--ink-mute);font-size:16px">✕</button>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 10px">
                ${times.map(t => `
                    <div style="display:flex;justify-content:space-between;padding:2px 0;${t === next ? 'background:var(--emerald-pale);border-radius:4px;padding:2px 6px;' : ''}">
                        <span style="color:${t === next ? 'var(--emerald)' : 'var(--ink-soft)'}">${t.label}</span>
                        <span style="font-weight:${t === next ? '600' : '400'}">${t.val}</span>
                    </div>
                `).join('')}
            </div>
            <div style="margin-top:6px;font-size:11px;color:var(--gold);text-align:center">⏰ ${next.label} berikutnya</div>
            <div style="display:flex;gap:6px;margin-top:8px">
                <select id="city-select" onchange="window.changeCity(this.value)" style="flex:1;padding:4px 6px;border:1px solid var(--line);border-radius:6px;font-size:12px;background:var(--card);color:var(--ink)">
                    <option value="">Pilih kota</option>
                    ${CITIES.map(c => `<option value="${c.lat},${c.lng},${c.tz}" ${c.name === city.name ? 'selected' : ''}>${c.name}</option>`).join('')}
                </select>
                <button onclick="window.refreshPrayer()" style="padding:4px 10px;border:1px solid var(--line);border-radius:6px;background:var(--card);cursor:pointer;font-size:14px">↻</button>
            </div>
        </div>`;
    }

    async function load(city) {
        if (!adhan) {
            const ok = await loadAdhan();
            if (!ok) {
                render(null, city);
                return;
            }
        }
        const data = calculatePrayerTimes(city.lat, city.lng, city.tz);
        render(data, city);
        if (data) {
            try { localStorage.setItem(PRAYER_KEY, JSON.stringify({ city, data, ts: Date.now() })); } catch(e) {}
        }
    }

    function detectCity() {
        const saved = localStorage.getItem(CITY_KEY);
        if (saved) {
            try {
                const c = JSON.parse(saved);
                if (c.lat && c.lng) return c;
            } catch(e) {}
        }
        return CITIES[0];
    }

    window.changeCity = function(val) {
        if (!val) return;
        const [lat, lng, tz] = val.split(',');
        const city = { lat: parseFloat(lat), lng: parseFloat(lng), tz };
        const name = CITIES.find(c => c.lat === parseFloat(lat))?.name || 'Kota';
        city.name = name;
        localStorage.setItem(CITY_KEY, JSON.stringify(city));
        selected = city;
        load(city);
    };

    window.refreshPrayer = function() {
        if (selected) load(selected);
    };

    window.retryPrayerWidget = function() {
        if (selected) {
            adhan = null;
            load(selected);
        }
    };

    function init() {
        // Check if container exists, if not create it
        let container = document.getElementById('prayer-widget');
        if (!container) {
            container = document.createElement('div');
            container.id = 'prayer-widget';
            container.style.position = 'fixed';
            container.style.bottom = '20px';
            container.style.right = '20px';
            container.style.zIndex = '1000';
            container.style.maxWidth = '280px';
            document.body.appendChild(container);
        }

        if (localStorage.getItem('qm-prayer-hidden') === 'true') {
            container.style.display = 'none';
        }

        const city = detectCity();
        selected = city;
        load(city);

        setInterval(() => {
            if (selected && container.style.display !== 'none') {
                load(selected);
            }
        }, 5 * 60 * 1000);
    }

    // Wait for DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();