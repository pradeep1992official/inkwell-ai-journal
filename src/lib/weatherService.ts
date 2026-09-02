import { JournalEntry, WeatherData } from '../types';

export interface WeatherCodeInfo {
  label: string;
  emoji: string;
  category: 'clear' | 'cloudy' | 'rainy' | 'snowy' | 'foggy' | 'stormy';
}

/**
 * Maps Open-Meteo / WMO weather codes to human-readable labels, emojis, and categories.
 */
export function decodeWeatherCode(code: number): WeatherCodeInfo {
  switch (code) {
    case 0:
      return { label: 'Clear', emoji: '☀️', category: 'clear' };
    case 1:
      return { label: 'Mainly Clear', emoji: '🌤️', category: 'clear' };
    case 2:
      return { label: 'Partly Cloudy', emoji: '⛅', category: 'cloudy' };
    case 3:
      return { label: 'Overcast', emoji: '☁️', category: 'cloudy' };
    case 45:
    case 48:
      return { label: 'Foggy', emoji: '🌫️', category: 'foggy' };
    case 51:
      return { label: 'Light Drizzle', emoji: '🌦️', category: 'rainy' };
    case 53:
      return { label: 'Moderate Drizzle', emoji: '🌦️', category: 'rainy' };
    case 55:
      return { label: 'Dense Drizzle', emoji: '🌧️', category: 'rainy' };
    case 56:
    case 57:
      return { label: 'Freezing Drizzle', emoji: '🌧️', category: 'rainy' };
    case 61:
      return { label: 'Light Rain', emoji: '🌧️', category: 'rainy' };
    case 63:
      return { label: 'Rainy', emoji: '🌧️', category: 'rainy' };
    case 65:
      return { label: 'Heavy Rain', emoji: '🌧️', category: 'rainy' };
    case 66:
    case 67:
      return { label: 'Freezing Rain', emoji: '🌧️', category: 'rainy' };
    case 71:
      return { label: 'Light Snow', emoji: '❄️', category: 'snowy' };
    case 73:
      return { label: 'Snowy', emoji: '❄️', category: 'snowy' };
    case 75:
      return { label: 'Heavy Snow', emoji: '❄️', category: 'snowy' };
    case 77:
      return { label: 'Snow Grains', emoji: '❄️', category: 'snowy' };
    case 80:
      return { label: 'Light Showers', emoji: '🌦️', category: 'rainy' };
    case 81:
    case 82:
      return { label: 'Heavy Showers', emoji: '🌧️', category: 'rainy' };
    case 85:
    case 86:
      return { label: 'Snow Showers', emoji: '🌨️', category: 'snowy' };
    case 95:
      return { label: 'Thunderstorm', emoji: '⛈️', category: 'stormy' };
    case 96:
    case 99:
      return { label: 'Thunderstorm & Hail', emoji: '⛈️', category: 'stormy' };
    default:
      if (code < 10) return { label: 'Clear', emoji: '☀️', category: 'clear' };
      if (code < 50) return { label: 'Cloudy', emoji: '⛅', category: 'cloudy' };
      if (code < 70) return { label: 'Rainy', emoji: '🌧️', category: 'rainy' };
      if (code < 80) return { label: 'Snowy', emoji: '❄️', category: 'snowy' };
      return { label: 'Variable', emoji: '🌤️', category: 'clear' };
  }
}

/**
 * Standard known city coordinate index for resolving locations tagged without GPS coordinates.
 */
export const KNOWN_CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  coimbatore: { lat: 11.0168, lng: 76.9558 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  mumbai: { lat: 19.076, lng: 72.8777 },
  delhi: { lat: 28.6139, lng: 77.209 },
  'new delhi': { lat: 28.6139, lng: 77.209 },
  hyderabad: { lat: 17.385, lng: 78.4867 },
  kolkata: { lat: 22.5726, lng: 88.3639 },
  pune: { lat: 18.5204, lng: 73.8567 },
  ahmedabad: { lat: 23.0225, lng: 72.5714 },
  kochi: { lat: 9.9312, lng: 76.2673 },
  madurai: { lat: 9.9252, lng: 78.1198 },
  tiruchirappalli: { lat: 10.7905, lng: 78.7047 },
  salem: { lat: 11.6643, lng: 78.146 },
  mysuru: { lat: 12.2958, lng: 76.6394 },
  mysore: { lat: 12.2958, lng: 76.6394 },
  trivandrum: { lat: 8.5241, lng: 76.9366 },
  thiruvananthapuram: { lat: 8.5241, lng: 76.9366 },
  goa: { lat: 15.2993, lng: 74.124 },
  jaipur: { lat: 26.9124, lng: 75.7873 },
  chandigarh: { lat: 30.7333, lng: 76.7794 },
  'new york': { lat: 40.7128, lng: -74.006 },
  'san francisco': { lat: 37.7749, lng: -122.4194 },
  'los angeles': { lat: 34.0522, lng: -118.2437 },
  chicago: { lat: 41.8781, lng: -87.6298 },
  seattle: { lat: 47.6062, lng: -122.3321 },
  austin: { lat: 30.2672, lng: -97.7431 },
  london: { lat: 51.5074, lng: -0.1278 },
  paris: { lat: 48.8566, lng: 2.3522 },
  berlin: { lat: 52.52, lng: 13.405 },
  tokyo: { lat: 35.6762, lng: 139.6503 },
  singapore: { lat: 1.3521, lng: 103.8198 },
  sydney: { lat: -33.8688, lng: 151.2093 },
  melbourne: { lat: -37.8136, lng: 144.9631 },
  toronto: { lat: 43.6532, lng: -79.3832 },
  vancouver: { lat: 49.2827, lng: -123.1207 },
  dubai: { lat: 25.2048, lng: 55.2708 },
};

/**
 * Resolves latitude & longitude coordinates for an entry from attached place or city metadata.
 * Strictly returns null if no valid location can be determined, avoiding arbitrary guessing.
 */
export function resolveCoordinatesForEntry(entry: JournalEntry): {
  lat: number;
  lng: number;
  locationName: string;
} | null {
  const loc = entry.metadata?.placeLocation;

  // 1. Direct coordinates on place
  if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
    return {
      lat: loc.lat,
      lng: loc.lng,
      locationName: loc.name || loc.city || 'Tagged Place',
    };
  }

  // 2. City name match
  const cityCandidate = (loc?.city || loc?.locality || loc?.name || entry.metadata?.location || '')
    .toLowerCase()
    .trim();

  if (cityCandidate) {
    for (const [cityName, coords] of Object.entries(KNOWN_CITY_COORDINATES)) {
      if (cityCandidate.includes(cityName)) {
        return {
          lat: coords.lat,
          lng: coords.lng,
          locationName: loc?.name || loc?.city || cityName,
        };
      }
    }
  }

  // 3. Formatted address token match
  const address = (loc?.formattedAddress || '').toLowerCase();
  if (address) {
    for (const [cityName, coords] of Object.entries(KNOWN_CITY_COORDINATES)) {
      if (new RegExp(`\\b${cityName}\\b`, 'i').test(address)) {
        return {
          lat: coords.lat,
          lng: coords.lng,
          locationName: loc?.name || cityName,
        };
      }
    }
  }

  return null;
}

/**
 * Fetches current weather for given coordinates from Open-Meteo's Forecast API.
 * Free, no API key required.
 */
export async function fetchCurrentWeather(lat: number, lng: number): Promise<WeatherData | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}&current=temperature_2m,relative_humidity_2m,weather_code&current_weather=true`;

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`Open-Meteo Forecast API responded with status ${res.status}`);
      return null;
    }

    const data = await res.json();
    let temp = 20;
    let humidity = 60;
    let weatherCode = 0;

    if (data.current) {
      temp = Math.round(data.current.temperature_2m ?? 20);
      humidity = Math.round(data.current.relative_humidity_2m ?? 60);
      weatherCode = Number(data.current.weather_code ?? 0);
    } else if (data.current_weather) {
      temp = Math.round(data.current_weather.temperature ?? 20);
      weatherCode = Number(data.current_weather.weathercode ?? 0);
    }

    const decoded = decodeWeatherCode(weatherCode);

    return {
      condition: decoded.label,
      conditionEmoji: decoded.emoji,
      temperature: temp,
      humidity,
      weatherCode,
      capturedAt: Date.now(),
      isBackfilled: false,
    };
  } catch (err) {
    console.warn('Unable to fetch weather from Open-Meteo Forecast API:', err);
    return null;
  }
}

/**
 * Formats a timestamp into an ISO Date string YYYY-MM-DD.
 */
function toIsoDate(timestamp: number): string {
  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Fetches historical weather for a specific past date & coordinates via Open-Meteo's Archive API,
 * with graceful fallback to Forecast API's past_days range if recent.
 */
export async function fetchHistoricalWeather(
  lat: number,
  lng: number,
  timestamp: number
): Promise<WeatherData | null> {
  const dateStr = toIsoDate(timestamp);
  const hour = new Date(timestamp).getHours();

  // Try Open-Meteo Archive API first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const archiveUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}&start_date=${dateStr}&end_date=${dateStr}&hourly=temperature_2m,relative_humidity_2m,weather_code`;

    const res = await fetch(archiveUrl, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.hourly && Array.isArray(data.hourly.time) && data.hourly.time.length > 0) {
        const targetIndex = hour >= 0 && hour < data.hourly.time.length ? hour : 12;
        const temp = Math.round(data.hourly.temperature_2m?.[targetIndex] ?? 22);
        const humidity = Math.round(data.hourly.relative_humidity_2m?.[targetIndex] ?? 65);
        const weatherCode = Number(data.hourly.weather_code?.[targetIndex] ?? 0);
        const decoded = decodeWeatherCode(weatherCode);

        return {
          condition: decoded.label,
          conditionEmoji: decoded.emoji,
          temperature: temp,
          humidity,
          weatherCode,
          capturedAt: timestamp,
          isBackfilled: true,
        };
      }
    }
  } catch {
    // Continue to fallback
  }

  // Fallback: Open-Meteo Forecast API past_days for recent dates (ERA5 archive lag)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}&start_date=${dateStr}&end_date=${dateStr}&hourly=temperature_2m,relative_humidity_2m,weather_code`;

    const res = await fetch(forecastUrl, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.hourly && Array.isArray(data.hourly.time) && data.hourly.time.length > 0) {
        const targetIndex = hour >= 0 && hour < data.hourly.time.length ? hour : 12;
        const temp = Math.round(data.hourly.temperature_2m?.[targetIndex] ?? 22);
        const humidity = Math.round(data.hourly.relative_humidity_2m?.[targetIndex] ?? 65);
        const weatherCode = Number(data.hourly.weather_code?.[targetIndex] ?? 0);
        const decoded = decodeWeatherCode(weatherCode);

        return {
          condition: decoded.label,
          conditionEmoji: decoded.emoji,
          temperature: temp,
          humidity,
          weatherCode,
          capturedAt: timestamp,
          isBackfilled: true,
        };
      }
    }
  } catch (err) {
    console.warn(`Could not backfill weather for ${dateStr}:`, err);
  }

  return null;
}

/**
 * Result structure for the observational weather pattern insight.
 */
export interface WeatherPatternInsight {
  hasSufficientData: boolean;
  totalWeatherEntries: number;
  minimumRequired: number;
  primaryObservation: string;
  secondaryObservation?: string;
  conditionBreakdown: Array<{
    category: string;
    label: string;
    emoji: string;
    count: number;
    avgWords: number;
    topMood?: string;
  }>;
}

/**
 * Purely statistical observational analysis comparing journal reflection lengths
 * and moods across recorded weather conditions.
 *
 * Guaranteed non-clinical and strictly non-diagnostic:
 * - Requires at least 5 entries with weather data
 * - Avoids psychological claims or unsolicited advice
 * - Focuses on factual correlations (e.g. entry length or mood distribution)
 */
export function analyzeWeatherPatterns(entries: JournalEntry[]): WeatherPatternInsight | null {
  const weatherEntries = entries.filter(
    (e) => !e.deletedAt && e.metadata?.weather && e.metadata.weather.condition
  );

  const MINIMUM_REQUIRED = 5;

  if (weatherEntries.length < MINIMUM_REQUIRED) {
    return {
      hasSufficientData: false,
      totalWeatherEntries: weatherEntries.length,
      minimumRequired: MINIMUM_REQUIRED,
      primaryObservation: `Weather reflections will surface once you have at least ${MINIMUM_REQUIRED} entries with ambient weather attached (currently ${weatherEntries.length}/${MINIMUM_REQUIRED}).`,
      conditionBreakdown: [],
    };
  }

  // Calculate word count for each entry
  const entryStats = weatherEntries.map((e) => {
    let wordCount = e.metadata?.wordCount;
    if (!wordCount || wordCount === 0) {
      const allText = e.messages.map((m) => m.content).join(' ');
      wordCount = allText.trim() ? allText.trim().split(/\s+/).length : 0;
    }

    const weather = e.metadata.weather!;
    const decoded =
      typeof weather.weatherCode === 'number'
        ? decodeWeatherCode(weather.weatherCode)
        : {
            label: weather.condition,
            emoji: weather.conditionEmoji || '⛅',
            category: 'cloudy' as const,
          };

    return {
      id: e.id,
      wordCount,
      mood: e.metadata?.mood,
      conditionLabel: weather.condition,
      emoji: weather.conditionEmoji || decoded.emoji,
      category: decoded.category,
      temperature: weather.temperature,
    };
  });

  const totalWords = entryStats.reduce((acc, curr) => acc + curr.wordCount, 0);
  const overallAvgWords = Math.round(totalWords / entryStats.length);

  // Group by condition label
  const groups: Record<
    string,
    {
      label: string;
      emoji: string;
      category: string;
      count: number;
      wordsTotal: number;
      moods: Record<string, number>;
    }
  > = {};

  for (const s of entryStats) {
    const key = s.conditionLabel;
    if (!groups[key]) {
      groups[key] = {
        label: s.conditionLabel,
        emoji: s.emoji,
        category: s.category,
        count: 0,
        wordsTotal: 0,
        moods: {},
      };
    }
    groups[key].count += 1;
    groups[key].wordsTotal += s.wordCount;
    if (s.mood) {
      groups[key].moods[s.mood] = (groups[key].moods[s.mood] || 0) + 1;
    }
  }

  const breakdown = Object.values(groups).map((g) => {
    const avgWords = Math.round(g.wordsTotal / g.count);
    let topMood: string | undefined = undefined;
    let maxMoodCount = 0;
    for (const [m, count] of Object.entries(g.moods)) {
      if (count > maxMoodCount) {
        maxMoodCount = count;
        topMood = m;
      }
    }
    return {
      category: g.category,
      label: g.label,
      emoji: g.emoji,
      count: g.count,
      avgWords,
      topMood,
    };
  });

  // Sort by entry count descending
  breakdown.sort((a, b) => b.count - a.count);

  // Group by broad category: rainy vs clear vs cloudy
  const rainyEntries = entryStats.filter((e) => e.category === 'rainy' || e.category === 'stormy');
  const clearEntries = entryStats.filter((e) => e.category === 'clear');
  const cloudyEntries = entryStats.filter((e) => e.category === 'cloudy' || e.category === 'foggy');

  const avgRainyWords =
    rainyEntries.length > 0
      ? Math.round(
          rainyEntries.reduce((a, b) => a + b.wordCount, 0) / rainyEntries.length
        )
      : 0;

  const avgClearWords =
    clearEntries.length > 0
      ? Math.round(
          clearEntries.reduce((a, b) => a + b.wordCount, 0) / clearEntries.length
        )
      : 0;

  const avgCloudyWords =
    cloudyEntries.length > 0
      ? Math.round(
          cloudyEntries.reduce((a, b) => a + b.wordCount, 0) / cloudyEntries.length
        )
      : 0;

  let primaryObservation = '';
  let secondaryObservation = '';

  // 1. Check entry length correlations
  if (rainyEntries.length >= 2 && avgRainyWords > overallAvgWords * 1.15) {
    primaryObservation = `You tend to write longer reflections on rainy days (avg. ${avgRainyWords} words vs. ${overallAvgWords} words overall).`;
  } else if (clearEntries.length >= 2 && avgClearWords > overallAvgWords * 1.15) {
    primaryObservation = `Your reflections tend to be more expansive during clear and sunny weather (avg. ${avgClearWords} words vs. ${overallAvgWords} overall).`;
  } else if (cloudyEntries.length >= 2 && avgCloudyWords > overallAvgWords * 1.15) {
    primaryObservation = `You tend to write more in-depth reflections on overcast or cloudy days (avg. ${avgCloudyWords} words vs. ${overallAvgWords} overall).`;
  } else {
    // Factual frequency observation
    const top = breakdown[0];
    primaryObservation = `Most of your reflections were written during ${top.label.toLowerCase()} weather (${top.count} of ${weatherEntries.length} entries), averaging ${top.avgWords} words.`;
  }

  // 2. Secondary observation based on moods or temperatures
  const topWithMood = breakdown.find((b) => b.topMood && b.count >= 2);
  if (topWithMood && topWithMood.topMood) {
    secondaryObservation = `During ${topWithMood.label.toLowerCase()} conditions, your reflections are most frequently tagged as "${topWithMood.topMood}".`;
  } else if (breakdown.length >= 2) {
    const second = breakdown[1];
    secondaryObservation = `Reflections recorded during ${second.label.toLowerCase()} conditions average ${second.avgWords} words.`;
  }

  return {
    hasSufficientData: true,
    totalWeatherEntries: weatherEntries.length,
    minimumRequired: MINIMUM_REQUIRED,
    primaryObservation,
    secondaryObservation,
    conditionBreakdown: breakdown,
  };
}
