import { PrayerTimes, Coordinates, CalculationMethod } from 'adhan';
import moment from 'moment-timezone';

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const path = url.pathname;

        if (path === '/api/prayer-times') {
            const params = new URLSearchParams(url.search);
            const lat = parseFloat(params.get('lat') || '0');
            const lng = parseFloat(params.get('lng') || '0');
            const dateStr = params.get('date') || new Date().toISOString().split('T')[0];
            const methodKey = params.get('method') || 'kemenag';
            const tz = params.get('tz') || 'Asia/Jakarta';

            try {
                // Parse date
                const [year, month, day] = dateStr.split('-').map(Number);
                const date = new Date(Date.UTC(year, month - 1, day));

                // Method mapping
                const methodMap = {
                    'mwl': CalculationMethod.MuslimWorldLeague(),
                    'makkah': CalculationMethod.UmmAlQura(),
                    'isna': CalculationMethod.ISNA(),
                    'egypt': CalculationMethod.Egyptian(),
                    'karachi': CalculationMethod.Karachi(),
                    'kemenag': {
                        method: 'kemenag',
                        fajrAngle: 20,
                        ishaAngle: 18,
                        ishaInterval: 0
                    },
                    'singapore': {
                        method: 'singapore',
                        fajrAngle: 20,
                        ishaAngle: 18,
                        ishaInterval: 0
                    },
                    'jakim': {
                        method: 'jakim',
                        fajrAngle: 20,
                        ishaAngle: 18,
                        ishaInterval: 0
                    },
                    'turkey': CalculationMethod.Turkey(),
                    'dubai': CalculationMethod.Dubai(),
                    'qatar': CalculationMethod.Qatar(),
                    'kuwait': CalculationMethod.Kuwait(),
                };

                let params_method;
                if (methodKey === 'kemenag' || methodKey === 'singapore' || methodKey === 'jakim') {
                    // Custom method
                    params_method = {
                        fajrAngle: 20,
                        ishaAngle: 18,
                        ishaInterval: 0,
                        maghribAngle: 0
                    };
                } else {
                    params_method = methodMap[methodKey] || CalculationMethod.MuslimWorldLeague();
                }

                const coordinates = new Coordinates(lat, lng);
                const prayerTimes = new PrayerTimes(coordinates, date, params_method);

                // Format waktu ke timezone lokal
                const tzOffset = moment.tz.zone(tz)?.utcOffset(date) || 420; // default WIB
                const offsetMinutes = tzOffset;

                const formatTime = (dateObj) => {
                    if (!dateObj) return '--:--';
                    const d = new Date(dateObj.getTime() + offsetMinutes * 60000);
                    return d.toTimeString().slice(0, 5);
                };

                const response = {
                    fajr: formatTime(prayerTimes.fajr),
                    sunrise: formatTime(prayerTimes.sunrise),
                    dhuha: formatTime(new Date(prayerTimes.sunrise.getTime() + 15 * 60000)), // 15 min after sunrise
                    dhuhr: formatTime(prayerTimes.dhuhr),
                    asr: formatTime(prayerTimes.asr),
                    maghrib: formatTime(prayerTimes.maghrib),
                    isha: formatTime(prayerTimes.isha),
                    method: methodKey,
                    date: dateStr,
                    coordinates: { lat, lng }
                };

                return new Response(JSON.stringify(response), {
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Cache-Control': 'public, max-age=3600'
                    }
                });
            } catch (err) {
                return new Response(JSON.stringify({ error: err.message }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        return new Response('Not found', { status: 404 });
    }
};