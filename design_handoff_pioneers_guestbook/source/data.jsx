// data.jsx — palettes, city seed db, country code → name mapping, helpers

const PALETTES = {
  bone: {
    label: "Bone & Burgundy",
    "--bg": "#f4f1ea",
    "--bg-2": "#ebe6db",
    "--paper": "#fbf9f3",
    "--ink": "#1a1814",
    "--ink-2": "#2c2823",
    "--muted": "#7a7468",
    "--muted-2": "#b6ad9c",
    "--line": "#d9d2c3",
    "--line-2": "#c4bba8",
    "--accent": "#7a2a2a",
    "--accent-soft": "#b8584a",
    "--gold": "#a08358",
  },
  forest: {
    label: "Cream & Forest",
    "--bg": "#f1ede2",
    "--bg-2": "#e6dfcd",
    "--paper": "#faf6ec",
    "--ink": "#1c1f1b",
    "--ink-2": "#2c322c",
    "--muted": "#6e7268",
    "--muted-2": "#a8ad9e",
    "--line": "#d2cdb9",
    "--line-2": "#bdb69e",
    "--accent": "#2f4a36",
    "--accent-soft": "#5b7a5f",
    "--gold": "#b08a4a",
  },
  navy: {
    label: "Ivory & Navy",
    "--bg": "#f3eee5",
    "--bg-2": "#e6dfd1",
    "--paper": "#fbf7ee",
    "--ink": "#171a25",
    "--ink-2": "#252a3a",
    "--muted": "#737887",
    "--muted-2": "#aeb1bf",
    "--line": "#d2ccbd",
    "--line-2": "#bbb4a3",
    "--accent": "#1f3358",
    "--accent-soft": "#5c79a8",
    "--gold": "#9a7d44",
  },
  parchment: {
    label: "Parchment & Ink",
    "--bg": "#efe9da",
    "--bg-2": "#e2d9c3",
    "--paper": "#f7f1e1",
    "--ink": "#161310",
    "--ink-2": "#2a2520",
    "--muted": "#7d756a",
    "--muted-2": "#b3a995",
    "--line": "#d6cdb6",
    "--line-2": "#bfb497",
    "--accent": "#5d2230",
    "--accent-soft": "#955062",
    "--gold": "#a48345",
  },
};

// A curated seed list for autocomplete suggestions when typing a city.
// (lat, lon, country code, country name)
const CITY_DB = [
  ["New York", 40.7128, -74.0060, "US", "United States"],
  ["Los Angeles", 34.0522, -118.2437, "US", "United States"],
  ["San Francisco", 37.7749, -122.4194, "US", "United States"],
  ["Chicago", 41.8781, -87.6298, "US", "United States"],
  ["Seattle", 47.6062, -122.3321, "US", "United States"],
  ["Boston", 42.3601, -71.0589, "US", "United States"],
  ["Austin", 30.2672, -97.7431, "US", "United States"],
  ["Miami", 25.7617, -80.1918, "US", "United States"],
  ["Denver", 39.7392, -104.9903, "US", "United States"],
  ["Toronto", 43.6532, -79.3832, "CA", "Canada"],
  ["Vancouver", 49.2827, -123.1207, "CA", "Canada"],
  ["Montréal", 45.5017, -73.5673, "CA", "Canada"],
  ["Mexico City", 19.4326, -99.1332, "MX", "Mexico"],
  ["São Paulo", -23.5505, -46.6333, "BR", "Brazil"],
  ["Rio de Janeiro", -22.9068, -43.1729, "BR", "Brazil"],
  ["Buenos Aires", -34.6037, -58.3816, "AR", "Argentina"],
  ["Santiago", -33.4489, -70.6693, "CL", "Chile"],
  ["Lima", -12.0464, -77.0428, "PE", "Peru"],
  ["Bogotá", 4.7110, -74.0721, "CO", "Colombia"],
  ["London", 51.5074, -0.1278, "GB", "United Kingdom"],
  ["Edinburgh", 55.9533, -3.1883, "GB", "United Kingdom"],
  ["Manchester", 53.4808, -2.2426, "GB", "United Kingdom"],
  ["Dublin", 53.3498, -6.2603, "IE", "Ireland"],
  ["Paris", 48.8566, 2.3522, "FR", "France"],
  ["Lyon", 45.7640, 4.8357, "FR", "France"],
  ["Berlin", 52.5200, 13.4050, "DE", "Germany"],
  ["Munich", 48.1351, 11.5820, "DE", "Germany"],
  ["Hamburg", 53.5511, 9.9937, "DE", "Germany"],
  ["Amsterdam", 52.3676, 4.9041, "NL", "Netherlands"],
  ["Brussels", 50.8503, 4.3517, "BE", "Belgium"],
  ["Zurich", 47.3769, 8.5417, "CH", "Switzerland"],
  ["Geneva", 46.2044, 6.1432, "CH", "Switzerland"],
  ["Vienna", 48.2082, 16.3738, "AT", "Austria"],
  ["Madrid", 40.4168, -3.7038, "ES", "Spain"],
  ["Barcelona", 41.3851, 2.1734, "ES", "Spain"],
  ["Lisbon", 38.7223, -9.1393, "PT", "Portugal"],
  ["Rome", 41.9028, 12.4964, "IT", "Italy"],
  ["Milan", 45.4642, 9.1900, "IT", "Italy"],
  ["Florence", 43.7696, 11.2558, "IT", "Italy"],
  ["Athens", 37.9838, 23.7275, "GR", "Greece"],
  ["Stockholm", 59.3293, 18.0686, "SE", "Sweden"],
  ["Oslo", 59.9139, 10.7522, "NO", "Norway"],
  ["Copenhagen", 55.6761, 12.5683, "DK", "Denmark"],
  ["Helsinki", 60.1699, 24.9384, "FI", "Finland"],
  ["Reykjavík", 64.1466, -21.9426, "IS", "Iceland"],
  ["Warsaw", 52.2297, 21.0122, "PL", "Poland"],
  ["Prague", 50.0755, 14.4378, "CZ", "Czechia"],
  ["Budapest", 47.4979, 19.0402, "HU", "Hungary"],
  ["Bucharest", 44.4268, 26.1025, "RO", "Romania"],
  ["Istanbul", 41.0082, 28.9784, "TR", "Turkey"],
  ["Moscow", 55.7558, 37.6173, "RU", "Russia"],
  ["St. Petersburg", 59.9311, 30.3609, "RU", "Russia"],
  ["Kyiv", 50.4501, 30.5234, "UA", "Ukraine"],
  ["Tel Aviv", 32.0853, 34.7818, "IL", "Israel"],
  ["Jerusalem", 31.7683, 35.2137, "IL", "Israel"],
  ["Dubai", 25.2048, 55.2708, "AE", "United Arab Emirates"],
  ["Riyadh", 24.7136, 46.6753, "SA", "Saudi Arabia"],
  ["Cairo", 30.0444, 31.2357, "EG", "Egypt"],
  ["Casablanca", 33.5731, -7.5898, "MA", "Morocco"],
  ["Lagos", 6.5244, 3.3792, "NG", "Nigeria"],
  ["Nairobi", -1.2921, 36.8219, "KE", "Kenya"],
  ["Cape Town", -33.9249, 18.4241, "ZA", "South Africa"],
  ["Johannesburg", -26.2041, 28.0473, "ZA", "South Africa"],
  ["Mumbai", 19.0760, 72.8777, "IN", "India"],
  ["Delhi", 28.7041, 77.1025, "IN", "India"],
  ["Bengaluru", 12.9716, 77.5946, "IN", "India"],
  ["Hyderabad", 17.3850, 78.4867, "IN", "India"],
  ["Chennai", 13.0827, 80.2707, "IN", "India"],
  ["Karachi", 24.8607, 67.0011, "PK", "Pakistan"],
  ["Dhaka", 23.8103, 90.4125, "BD", "Bangladesh"],
  ["Bangkok", 13.7563, 100.5018, "TH", "Thailand"],
  ["Singapore", 1.3521, 103.8198, "SG", "Singapore"],
  ["Kuala Lumpur", 3.1390, 101.6869, "MY", "Malaysia"],
  ["Jakarta", -6.2088, 106.8456, "ID", "Indonesia"],
  ["Manila", 14.5995, 120.9842, "PH", "Philippines"],
  ["Hanoi", 21.0285, 105.8542, "VN", "Vietnam"],
  ["Ho Chi Minh City", 10.8231, 106.6297, "VN", "Vietnam"],
  ["Hong Kong", 22.3193, 114.1694, "HK", "Hong Kong"],
  ["Taipei", 25.0330, 121.5654, "TW", "Taiwan"],
  ["Shanghai", 31.2304, 121.4737, "CN", "China"],
  ["Beijing", 39.9042, 116.4074, "CN", "China"],
  ["Shenzhen", 22.5431, 114.0579, "CN", "China"],
  ["Guangzhou", 23.1291, 113.2644, "CN", "China"],
  ["Seoul", 37.5665, 126.9780, "KR", "South Korea"],
  ["Tokyo", 35.6762, 139.6503, "JP", "Japan"],
  ["Osaka", 34.6937, 135.5023, "JP", "Japan"],
  ["Kyoto", 35.0116, 135.7681, "JP", "Japan"],
  ["Sydney", -33.8688, 151.2093, "AU", "Australia"],
  ["Melbourne", -37.8136, 144.9631, "AU", "Australia"],
  ["Brisbane", -27.4698, 153.0251, "AU", "Australia"],
  ["Perth", -31.9505, 115.8605, "AU", "Australia"],
  ["Auckland", -36.8485, 174.7633, "NZ", "New Zealand"],
  ["Wellington", -41.2865, 174.7762, "NZ", "New Zealand"],
];

// Country code → name & rough centroid (for fallback when only a country is given)
const COUNTRY_DB = {};
CITY_DB.forEach(([city, lat, lon, code, name]) => {
  if (!COUNTRY_DB[code]) {
    COUNTRY_DB[code] = { name, code, lats: [lat], lons: [lon] };
  } else {
    COUNTRY_DB[code].lats.push(lat);
    COUNTRY_DB[code].lons.push(lon);
  }
});
Object.values(COUNTRY_DB).forEach(c => {
  c.lat = c.lats.reduce((a,b)=>a+b,0) / c.lats.length;
  c.lon = c.lons.reduce((a,b)=>a+b,0) / c.lons.length;
  delete c.lats; delete c.lons;
});

// Random anonymous handle generator
const ADJECTIVES = ["Quiet", "Curious", "Distant", "Patient", "Gilded", "Northern", "Southern", "Sage", "Velvet", "Marble", "Aurora", "Linen", "Brass", "Slow", "Quartz", "Coastal", "Hushed", "Verdant", "Ember"];
const NOUNS = ["Voyager", "Wanderer", "Cartographer", "Pilgrim", "Mariner", "Astronomer", "Rambler", "Pioneer", "Drifter", "Compass", "Lantern", "Sojourner", "Atlas", "Almanac", "Steward"];
const EMOJIS = ["✦","✧","☼","☾","◐","◑","◒","◓","❖","✺","◈","◇","◆","✿"];

function makeAnonName() {
  const a = ADJECTIVES[Math.floor(Math.random()*ADJECTIVES.length)];
  const n = NOUNS[Math.floor(Math.random()*NOUNS.length)];
  const e = EMOJIS[Math.floor(Math.random()*EMOJIS.length)];
  return { name: `${a} ${n}`, emoji: e };
}

// Storage
const STORE_KEY = "pioneers_guestbook_v1";
function loadStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return { visitors: [], notes: [] };
}
function saveStore(s) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (e) {}
}

Object.assign(window, {
  PALETTES, CITY_DB, COUNTRY_DB, makeAnonName,
  loadStore, saveStore,
});
