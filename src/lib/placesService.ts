import { JournalEntry, LocationMemory } from '../types';

export interface PlaceSuggestion {
  placeId: string;
  name: string;
  formattedAddress: string;
  city: string;
  locality?: string;
  country?: string;
  lat?: number;
  lng?: number;
}

// Built-in comprehensive realistic places dataset for instantaneous offline/demo response
export const SAMPLE_PLACES: PlaceSuggestion[] = [
  // India
  {
    placeId: 'pl-cbe-ab',
    name: 'Absolute Barbecues, Coimbatore',
    formattedAddress: '102, Avinashi Rd, Peelamedu, Coimbatore, Tamil Nadu 641004, India',
    city: 'Coimbatore',
    locality: 'Peelamedu',
    country: 'India',
    lat: 11.0267,
    lng: 77.0028,
  },
  {
    placeId: 'pl-cbe-mar',
    name: 'Marudhamalai Temple',
    formattedAddress: 'Temple Road, Marudhamalai, Coimbatore, Tamil Nadu 641046, India',
    city: 'Coimbatore',
    locality: 'Marudhamalai',
    country: 'India',
    lat: 11.0463,
    lng: 76.8524,
  },
  {
    placeId: 'pl-cbe-race',
    name: 'Race Course Walking Track',
    formattedAddress: 'Race Course Road, Gopalapuram, Coimbatore, Tamil Nadu 641018, India',
    city: 'Coimbatore',
    locality: 'Gopalapuram',
    country: 'India',
    lat: 11.0023,
    lng: 76.9749,
  },
  {
    placeId: 'pl-chn-mb',
    name: 'Marina Beach',
    formattedAddress: 'Marina Beach Road, Triplicane, Chennai, Tamil Nadu 600005, India',
    city: 'Chennai',
    locality: 'Triplicane',
    country: 'India',
    lat: 13.0499,
    lng: 80.2824,
  },
  {
    placeId: 'pl-chn-tn',
    name: 'Amethyst Cafe, Royapettah',
    formattedAddress: 'Whites Road, Royapettah, Chennai, Tamil Nadu 600014, India',
    city: 'Chennai',
    locality: 'Royapettah',
    country: 'India',
    lat: 13.0567,
    lng: 80.2575,
  },
  {
    placeId: 'pl-blr-cp',
    name: 'Cubbon Park',
    formattedAddress: 'Kasturba Road, Sampangi Rama Nagar, Bengaluru, Karnataka 560001, India',
    city: 'Bengaluru',
    locality: 'Sampangi Rama Nagar',
    country: 'India',
    lat: 12.9763,
    lng: 77.5929,
  },
  {
    placeId: 'pl-blr-ind',
    name: 'Indiranagar 100 Feet Road',
    formattedAddress: '100 Feet Rd, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038, India',
    city: 'Bengaluru',
    locality: 'Indiranagar',
    country: 'India',
    lat: 12.9719,
    lng: 77.6412,
  },
  {
    placeId: 'pl-mum-md',
    name: 'Marine Drive Promenade',
    formattedAddress: 'Netaji Subhash Chandra Bose Road, Mumbai, Maharashtra 400020, India',
    city: 'Mumbai',
    locality: 'South Mumbai',
    country: 'India',
    lat: 18.9432,
    lng: 72.823,
  },
  {
    placeId: 'pl-del-ig',
    name: 'India Gate & Kartavya Path',
    formattedAddress: 'Rajpath, India Gate, New Delhi, Delhi 110001, India',
    city: 'New Delhi',
    locality: 'Central Delhi',
    country: 'India',
    lat: 28.6129,
    lng: 77.2295,
  },
  // Global
  {
    placeId: 'pl-nyc-cp',
    name: 'Central Park',
    formattedAddress: 'Central Park, New York, NY 10024, USA',
    city: 'New York',
    locality: 'Manhattan',
    country: 'United States',
    lat: 40.7851,
    lng: -73.9683,
  },
  {
    placeId: 'pl-sf-ggb',
    name: 'Golden Gate Bridge & Presidio',
    formattedAddress: 'Golden Gate Bridge, San Francisco, CA 94129, USA',
    city: 'San Francisco',
    locality: 'Presidio',
    country: 'United States',
    lat: 37.8199,
    lng: -122.4783,
  },
  {
    placeId: 'pl-lon-hp',
    name: 'Hyde Park & Kensington Gardens',
    formattedAddress: 'Hyde Park, London W2 2UH, United Kingdom',
    city: 'London',
    locality: 'Westminster',
    country: 'United Kingdom',
    lat: 51.5073,
    lng: -0.1657,
  },
  {
    placeId: 'pl-par-et',
    name: 'Eiffel Tower & Champ de Mars',
    formattedAddress: 'Champ de Mars, 5 Av. Anatole France, 75007 Paris, France',
    city: 'Paris',
    locality: '7th arrondissement',
    country: 'France',
    lat: 48.8584,
    lng: 2.2945,
  },
  {
    placeId: 'pl-tok-sh',
    name: 'Shibuya Crossing',
    formattedAddress: '2 Chome-2-1 Dogenzaka, Shibuya City, Tokyo 150-0043, Japan',
    city: 'Tokyo',
    locality: 'Shibuya',
    country: 'Japan',
    lat: 35.6595,
    lng: 139.7005,
  },
];

/**
 * Extracts a clean City / Locality name from a place's formatted address or name.
 */
export function extractCityFromAddress(address: string, fallbackName?: string): string {
  if (!address && fallbackName) {
    const parts = fallbackName.split(',').map((s) => s.trim());
    if (parts.length > 1) return parts[parts.length - 1];
    return fallbackName;
  }
  if (!address) return 'Unknown Location';

  const parts = address.split(',').map((p) => p.trim()).filter(Boolean);

  // Common Indian and international address parsing:
  // e.g. "102, Avinashi Rd, Peelamedu, Coimbatore, Tamil Nadu 641004, India" -> "Coimbatore"
  // e.g. "Marina Beach Road, Triplicane, Chennai, Tamil Nadu 600005, India" -> "Chennai"
  // e.g. "Central Park, New York, NY 10024, USA" -> "New York"
  // e.g. "Hyde Park, London W2 2UH, United Kingdom" -> "London"

  // Known major cities list for precise matching
  const knownCities = [
    'Coimbatore',
    'Chennai',
    'Bengaluru',
    'Bangalore',
    'Mumbai',
    'Delhi',
    'New Delhi',
    'Hyderabad',
    'Kolkata',
    'Pune',
    'Ahmedabad',
    'Kochi',
    'Madurai',
    'Tiruchirappalli',
    'Salem',
    'Mysuru',
    'Mysore',
    'Trivandrum',
    'Thiruvananthapuram',
    'Goa',
    'Jaipur',
    'Chandigarh',
    'New York',
    'San Francisco',
    'Los Angeles',
    'Chicago',
    'Seattle',
    'Austin',
    'London',
    'Paris',
    'Berlin',
    'Tokyo',
    'Singapore',
    'Sydney',
    'Melbourne',
    'Toronto',
    'Vancouver',
    'Dubai',
  ];

  for (const part of parts) {
    for (const city of knownCities) {
      if (new RegExp(`\\b${city}\\b`, 'i').test(part)) {
        return city;
      }
    }
  }

  // Heuristic: If we have multiple parts, the city is usually 2-3 tokens from the end
  if (parts.length >= 3) {
    const candidate = parts[parts.length - 3] || parts[parts.length - 2];
    // Strip zip codes or state names if mixed
    const clean = candidate.replace(/\b\d{5,6}\b/g, '').replace(/\b(Tamil Nadu|Karnataka|Maharashtra|California|NY|CA|UK|USA|India)\b/gi, '').trim();
    if (clean.length > 2) return clean;
  }

  if (parts.length >= 2) {
    const candidate = parts[parts.length - 2].replace(/\b\d{5,6}\b/g, '').trim();
    if (candidate.length > 2) return candidate;
  }

  return parts[0] || 'Local Memory';
}

/**
 * Autocomplete place search with server proxy and resilient offline fallbacks.
 */
export async function searchPlaces(query: string, sessionToken?: string): Promise<PlaceSuggestion[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return SAMPLE_PLACES.slice(0, 6);
  }

  try {
    const response = await fetch('/api/places/autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: trimmed,
        sessionToken: sessionToken || `session-${Date.now()}`,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.predictions) && data.predictions.length > 0) {
        return data.predictions.map((p: any) => ({
          placeId: p.placeId || p.place_id || `place-${Math.random().toString(36).substr(2, 6)}`,
          name: p.name || p.structuredFormat?.mainText?.text || p.description || trimmed,
          formattedAddress: p.formattedAddress || p.description || trimmed,
          city: p.city || extractCityFromAddress(p.formattedAddress || p.description || '', p.name),
          locality: p.locality || p.structuredFormat?.secondaryText?.text,
          country: p.country,
        }));
      }
    }
  } catch (err) {
    console.warn('Backend Places API proxy unavailable, using client-side places fallback:', err);
  }

  // Filter sample database
  const lower = trimmed.toLowerCase();
  const matched = SAMPLE_PLACES.filter(
    (p) =>
      p.name.toLowerCase().includes(lower) ||
      p.formattedAddress.toLowerCase().includes(lower) ||
      p.city.toLowerCase().includes(lower) ||
      (p.locality && p.locality.toLowerCase().includes(lower))
  );

  // If no direct match in samples, create a clean custom place suggestion for the user's search
  if (matched.length === 0) {
    const city = extractCityFromAddress(trimmed);
    return [
      {
        placeId: `custom-${Date.now()}`,
        name: trimmed,
        formattedAddress: trimmed,
        city,
      },
      ...SAMPLE_PLACES.slice(0, 4),
    ];
  }

  return matched;
}

export interface CityMemoryGroup {
  city: string;
  count: number;
  entries: JournalEntry[];
  latestDate: number;
}

/**
 * Groups a user's location-tagged journal entries by City/Locality.
 */
export function groupEntriesByCity(entries: JournalEntry[]): Record<string, CityMemoryGroup> {
  const groups: Record<string, CityMemoryGroup> = {};

  for (const entry of entries) {
    if (entry.deletedAt) continue;
    const loc = entry.metadata?.placeLocation;
    if (!loc || !loc.name) continue;

    const city = loc.city || extractCityFromAddress(loc.formattedAddress, loc.name);
    if (!groups[city]) {
      groups[city] = {
        city,
        count: 0,
        entries: [],
        latestDate: 0,
      };
    }

    groups[city].count += 1;
    groups[city].entries.push(entry);
    if (entry.createdAt > groups[city].latestDate) {
      groups[city].latestDate = entry.createdAt;
    }
  }

  // Sort entries within each city group descending by date
  for (const city in groups) {
    groups[city].entries.sort((a, b) => b.createdAt - a.createdAt);
  }

  return groups;
}
