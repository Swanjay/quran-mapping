use serde::Serialize;
use wasm_bindgen::prelude::*;
use libmuslim_rs::{calculate, CalculationMethod, Coordinates, Date, MethodParams, UtcOffset};

#[derive(Serialize)]
pub struct PrayerTimesResponse {
    pub fajr: String,
    pub sunrise: String,
    pub dhuha: String,
    pub dhuhr: String,
    pub asr: String,
    pub maghrib: String,
    pub isha: String,
    pub method: String,
}

#[wasm_bindgen]
pub fn calculate_prayer_times(
    lat: f64,
    lng: f64,
    year: i32,
    month: u8,
    day: u8,
    timezone_offset: f64,
    method_str: &str,
) -> Result<JsValue, JsValue> {
    // Parse method
    let method = match method_str {
        "mwl" => CalculationMethod::Mwl,
        "makkah" => CalculationMethod::Makkah,
        "isna" => CalculationMethod::Isna,
        "egypt" => CalculationMethod::Egypt,
        "karachi" => CalculationMethod::Karachi,
        "turkey" => CalculationMethod::Turkey,
        "singapore" => CalculationMethod::Singapore,
        "jakim" => CalculationMethod::Jakim,
        "kemenag" => CalculationMethod::Kemenag,
        "france" => CalculationMethod::France,
        "russia" => CalculationMethod::Russia,
        "dubai" => CalculationMethod::Dubai,
        "qatar" => CalculationMethod::Qatar,
        "kuwait" => CalculationMethod::Kuwait,
        "jordan" => CalculationMethod::Jordan,
        "gulf" => CalculationMethod::Gulf,
        "tunisia" => CalculationMethod::Tunisia,
        "algeria" => CalculationMethod::Algeria,
        "morocco" => CalculationMethod::Morocco,
        "portugal" => CalculationMethod::Portugal,
        "moonsighting" => CalculationMethod::Moonsighting,
        _ => CalculationMethod::Kemenag, // default
    };

    let date = match Date::new(year, month, day) {
        Ok(d) => d,
        Err(e) => return Err(JsValue::from_str(&format!("Invalid date: {:?}", e))),
    };

    let coords = match Coordinates::new(lat, lng) {
        Ok(c) => c,
        Err(e) => return Err(JsValue::from_str(&format!("Invalid coordinates: {:?}", e))),
    };

    let offset = match UtcOffset::from_hours(timezone_offset) {
        Ok(o) => o,
        Err(e) => return Err(JsValue::from_str(&format!("Invalid timezone: {:?}", e))),
    };

    let params = match MethodParams::for_method(method) {
        Ok(mut p) => {
            // Tambah ihtiyat 2 menit biar aman
            p.ihtiyat_minutes = 2;
            p
        }
        Err(e) => return Err(JsValue::from_str(&format!("Method params error: {:?}", e))),
    };

    let times = match calculate(date, coords, offset, &params) {
        Ok(t) => t,
        Err(e) => return Err(JsValue::from_str(&format!("Calculation error: {:?}", e))),
    };

    let response = PrayerTimesResponse {
        fajr: times.fajr.format_hm(),
        sunrise: times.sunrise.format_hm(),
        dhuha: times.dhuha.format_hm(),
        dhuhr: times.dhuhr.format_hm(),
        asr: times.asr.format_hm(),
        maghrib: times.maghrib.format_hm(),
        isha: times.isha.format_hm(),
        method: method.as_str().to_owned(),
    };

    serde_json::to_string(&response)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
        .map(|s| JsValue::from_str(&s))
}