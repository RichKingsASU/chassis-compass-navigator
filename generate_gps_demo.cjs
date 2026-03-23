/**
 * generate_gps_demo.cjs
 * Generates synthetic GPS breadcrumb trails for 7 demo chassis, 10 loads each.
 * Reads demo_data_anon.json, outputs gps_demo_data.json.
 * Uses deterministic RNG (mulberry32 seed 1337).
 */
const fs = require('fs');
const path = require('path');

// ── Deterministic RNG ───────────────────────────────────────
function mulberry32(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(1337);

function randInt(min, max) { return Math.floor(rng() * (max - min + 1)) + min; }
function randFloat(min, max) { return rng() * (max - min) + min; }
function pick(arr) { return arr[Math.floor(rng() * arr.length)]; }

// ── City coordinates ────────────────────────────────────────
const CITIES = {
  'Virginia Beach, VA': { lat: 36.8529, lng: -75.9780 },
  'Boston, MA':         { lat: 42.3601, lng: -71.0589 },
  'Hartford, CT':       { lat: 41.7658, lng: -72.6851 },
  'College Park, MD':   { lat: 38.9807, lng: -76.9369 },
  'Chicago, IL':        { lat: 41.8781, lng: -87.6298 },
  'Norfolk, VA':        { lat: 36.8508, lng: -76.2859 },
  'Savannah, GA':       { lat: 32.0835, lng: -81.0998 },
  'Bridgeport, CT':     { lat: 41.1865, lng: -73.1952 },
  'Houston, TX':        { lat: 29.7604, lng: -95.3698 },
  'Springfield, MA':    { lat: 42.1015, lng: -72.5898 },
  'Baltimore, MD':      { lat: 39.2904, lng: -76.6122 },
  'Elizabeth, NJ':      { lat: 40.6640, lng: -74.2107 },
  'Dallas, TX':         { lat: 32.7767, lng: -96.7970 },
  'Allentown, PA':      { lat: 40.6084, lng: -75.4902 },
  'Newark, NJ':         { lat: 40.7357, lng: -74.1724 },
  'Philadelphia, PA':   { lat: 39.9526, lng: -75.1652 },
  'New York, NY':       { lat: 40.7128, lng: -74.0060 },
  'Charlotte, NC':      { lat: 35.2271, lng: -80.8431 },
  'Atlanta, GA':        { lat: 33.7490, lng: -84.3880 },
  'Miami, FL':          { lat: 25.7617, lng: -80.1918 },
  'Tampa, FL':          { lat: 27.9506, lng: -82.4572 },
  'Orlando, FL':        { lat: 28.5383, lng: -81.3792 },
  'Jacksonville, FL':   { lat: 30.3322, lng: -81.6557 },
  'Columbus, OH':       { lat: 39.9612, lng: -82.9988 },
  'Cleveland, OH':      { lat: 41.4993, lng: -81.6944 },
  'Cincinnati, OH':     { lat: 39.1031, lng: -84.5120 },
  'Augusta, GA':        { lat: 33.4735, lng: -82.0105 },
  'Charleston, SC':     { lat: 32.7765, lng: -79.9311 },
  'Columbia, SC':       { lat: 34.0007, lng: -81.0348 },
  'Greenville, SC':     { lat: 34.8526, lng: -82.3940 },
  'Greer, SC':          { lat: 34.9387, lng: -82.2268 },
  'Wilmington, NC':     { lat: 34.2257, lng: -77.9447 },
  'Raleigh, NC':        { lat: 35.7796, lng: -78.6382 },
  'Richmond, VA':       { lat: 37.5407, lng: -77.4360 },
  'Long Beach, CA':     { lat: 33.7701, lng: -118.1937 },
  'Los Angeles, CA':    { lat: 34.0522, lng: -118.2437 },
  'Oakland, CA':        { lat: 37.8044, lng: -122.2712 },
  'San Antonio, TX':    { lat: 29.4241, lng: -98.4936 },
  'Joliet, IL':         { lat: 41.5250, lng: -88.0817 },
  'Springfield, IL':    { lat: 39.7817, lng: -89.6501 },
  'Harrisburg, PA':     { lat: 40.2732, lng: -76.8867 },
  'King of Prussia, PA':{ lat: 40.0912, lng: -75.3824 },
  'Worcester, MA':      { lat: 42.2626, lng: -71.8023 },
  'New Haven, CT':      { lat: 41.3083, lng: -72.9279 },
  'Staten Island, NY':  { lat: 40.5795, lng: -74.1502 },
  'Carteret, NJ':       { lat: 40.5776, lng: -74.2282 },
  'Edison, NJ':         { lat: 40.5187, lng: -74.4121 },
};

const TERMINALS = [
  { name: 'LGBCT Chassis Yard - Long Beach',  lat: 33.7540, lng: -118.2150 },
  { name: 'Port Newark Container Terminal',    lat: 40.6870, lng: -74.1440 },
  { name: 'Savannah Port Terminal',            lat: 31.9966, lng: -81.0955 },
  { name: 'Houston Ship Channel Terminal',     lat: 29.7355, lng: -95.2706 },
  { name: 'Charleston Container Terminal',     lat: 32.7523, lng: -79.8956 },
  { name: 'Baltimore Marine Terminal',         lat: 39.2567, lng: -76.5787 },
  { name: 'Virginia International Gateway',    lat: 36.9146, lng: -76.3260 },
];

const YARDS = [
  { name: 'JED Logistics Yard',       lat: 33.8228, lng: -118.1038 },
  { name: 'Navy Way Chassis Depot',    lat: 33.7467, lng: -118.2614 },
  { name: 'POLA Chassis Staging',      lat: 33.7363, lng: -118.2589 },
  { name: 'Port Newark Yard B',        lat: 40.6823, lng: -74.1389 },
  { name: 'Carteret Intermodal Yard',  lat: 40.5751, lng: -74.2295 },
  { name: 'Savannah Chassis Depot',    lat: 32.0712, lng: -81.1345 },
];

const GPS_PROVIDERS = ['Samsara', 'BlackBerry Radar', 'Anytrek', 'Fleetlocate', 'Fleetview'];
const UPLOAD_ID = 'a1b2c3d4-0000-0000-0000-000000000001';

// ── Resolve city to coordinates ─────────────────────────────
function cityCoords(locName) {
  if (CITIES[locName]) return CITIES[locName];
  // Try partial match
  const lower = locName.toLowerCase();
  for (const [k, v] of Object.entries(CITIES)) {
    if (k.toLowerCase().includes(lower) || lower.includes(k.toLowerCase())) return v;
  }
  // Fallback: pick random city
  const keys = Object.keys(CITIES);
  return CITIES[keys[Math.floor(rng() * keys.length)]];
}

// ── Nearest terminal to a coordinate ────────────────────────
function nearestTerminal(lat, lng) {
  let best = TERMINALS[0], bestDist = Infinity;
  for (const t of TERMINALS) {
    const d = (t.lat - lat) ** 2 + (t.lng - lng) ** 2;
    if (d < bestDist) { bestDist = d; best = t; }
  }
  return best;
}

function nearestYard(lat, lng) {
  let best = YARDS[0], bestDist = Infinity;
  for (const y of YARDS) {
    const d = (y.lat - lat) ** 2 + (y.lng - lng) ** 2;
    if (d < bestDist) { bestDist = d; best = y; }
  }
  return best;
}

// ── Bearing between two points ──────────────────────────────
function bearing(lat1, lng1, lat2, lng2) {
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(lat2 * Math.PI / 180);
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
            Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
}

// ── Interpolate waypoints between two points ────────────────
function interpolate(from, to, steps) {
  const points = [];
  // Add a midpoint offset for realistic routing
  const midLat = (from.lat + to.lat) / 2 + randFloat(-0.5, 0.5);
  const midLng = (from.lng + to.lng) / 2 + randFloat(-0.3, 0.3);

  const halfSteps = Math.floor(steps / 2);
  const rest = steps - halfSteps;

  // First half: from -> midpoint
  for (let i = 0; i < halfSteps; i++) {
    const t = (i + 1) / halfSteps;
    points.push({
      lat: from.lat + (midLat - from.lat) * t + randFloat(-0.01, 0.01),
      lng: from.lng + (midLng - from.lng) * t + randFloat(-0.01, 0.01),
    });
  }
  // Second half: midpoint -> to
  for (let i = 0; i < rest; i++) {
    const t = (i + 1) / rest;
    points.push({
      lat: midLat + (to.lat - midLat) * t + randFloat(-0.01, 0.01),
      lng: midLng + (to.lng - midLng) * t + randFloat(-0.01, 0.01),
    });
  }
  return points;
}

// ── Generate pings for a movement leg ───────────────────────
function movementPings(from, to, startTime, durationMinutes, provider, chassisNum, ldNum, steps) {
  const pings = [];
  const waypoints = interpolate(from, to, steps);
  const intervalMs = (durationMinutes * 60 * 1000) / steps;

  let prevLat = from.lat, prevLng = from.lng;
  for (let i = 0; i < waypoints.length; i++) {
    const wp = waypoints[i];
    const ts = new Date(startTime.getTime() + intervalMs * (i + 1));
    const hdg = bearing(prevLat, prevLng, wp.lat, wp.lng);
    const speed = randFloat(25, 65);

    pings.push({
      upload_id: UPLOAD_ID,
      provider,
      device_id: chassisNum,
      latitude: Math.round(wp.lat * 100000) / 100000,
      longitude: Math.round(wp.lng * 100000) / 100000,
      recorded_at: ts.toISOString(),
      speed: Math.round(speed * 10) / 10,
      heading: Math.round(hdg * 10) / 10,
      altitude: Math.round(randFloat(5, 300) * 10) / 10,
      battery_level: randInt(60, 100),
      raw_data: {
        chassis_number: chassisNum,
        load_number: ldNum,
        location_name: null,
        status: 'moving',
      },
    });
    prevLat = wp.lat;
    prevLng = wp.lng;
  }
  return pings;
}

// ── Generate idle pings ─────────────────────────────────────
function idlePings(location, startTime, durationMinutes, intervalMinutes, provider, chassisNum, ldNum, locName) {
  const pings = [];
  const count = Math.max(1, Math.floor(durationMinutes / intervalMinutes));
  for (let i = 0; i < count; i++) {
    const ts = new Date(startTime.getTime() + intervalMinutes * 60000 * i);
    pings.push({
      upload_id: UPLOAD_ID,
      provider,
      device_id: chassisNum,
      latitude: Math.round((location.lat + randFloat(-0.001, 0.001)) * 100000) / 100000,
      longitude: Math.round((location.lng + randFloat(-0.001, 0.001)) * 100000) / 100000,
      recorded_at: ts.toISOString(),
      speed: 0,
      heading: Math.round(randFloat(0, 360) * 10) / 10,
      altitude: Math.round(randFloat(5, 50) * 10) / 10,
      battery_level: randInt(60, 100),
      raw_data: {
        chassis_number: chassisNum,
        load_number: ldNum,
        location_name: locName,
        status: 'stationary',
      },
    });
  }
  return pings;
}

// ── Main ────────────────────────────────────────────────────
const demoData = JSON.parse(fs.readFileSync(path.join(__dirname, 'demo_data_anon.json'), 'utf8'));
const allPings = [];

const chassisKeys = Object.keys(demoData.chassis);
console.log(`Processing ${chassisKeys.length} chassis...`);

for (let ci = 0; ci < chassisKeys.length; ci++) {
  const chassisNum = chassisKeys[ci];
  const chassis = demoData.chassis[chassisNum];
  const provider = GPS_PROVIDERS[ci % GPS_PROVIDERS.length];
  const loadsToProcess = chassis.loads.slice(0, 10); // first 10 loads

  console.log(`  ${chassisNum} (${provider}): ${loadsToProcess.length} loads`);

  for (let li = 0; li < loadsToProcess.length; li++) {
    const load = loadsToProcess[li];
    const originCoords = cityCoords(load.pickup_loc);
    const destCoords = cityCoords(load.delivery_loc);
    const terminal = nearestTerminal(originCoords.lat, originCoords.lng);
    const yard = nearestYard(destCoords.lat, destCoords.lng);

    // Parse pickup date as base timestamp
    const pickupDate = new Date(load.pickup_date + 'T08:00:00Z');

    // 1. Terminal → Origin (bobtail, 2-4 hrs before pickup)
    const bobtailDuration = randInt(120, 240); // minutes
    const bobtailStart = new Date(pickupDate.getTime() - bobtailDuration * 60000);
    const bobtailSteps = randInt(15, 25);
    allPings.push(...movementPings(
      terminal, originCoords, bobtailStart, bobtailDuration, provider, chassisNum, load.ld_num, bobtailSteps
    ));

    // 2. Origin idle (loading dwell, 30-90 min)
    const loadingDwell = randInt(30, 90);
    allPings.push(...idlePings(
      originCoords, pickupDate, loadingDwell, 10, provider, chassisNum, load.ld_num, load.pickup_loc
    ));

    // 3. Origin → Destination (en route)
    const transitStart = new Date(pickupDate.getTime() + loadingDwell * 60000);
    const daysOnLoad = load.days_on_load || 2;
    const transitMinutes = Math.max(300, daysOnLoad * 24 * 60 * 0.4); // ~40% of total days
    const transitSteps = randInt(30, 50);
    allPings.push(...movementPings(
      originCoords, destCoords, transitStart, transitMinutes, provider, chassisNum, load.ld_num, transitSteps
    ));

    // 4. Destination idle (unloading dwell, 1-3 hrs)
    const deliveryTime = new Date(transitStart.getTime() + transitMinutes * 60000);
    const unloadDwell = randInt(60, 180);
    allPings.push(...idlePings(
      destCoords, deliveryTime, unloadDwell, 10, provider, chassisNum, load.ld_num, load.delivery_loc
    ));

    // 5. Destination → Yard
    const toYardStart = new Date(deliveryTime.getTime() + unloadDwell * 60000);
    const toYardDuration = randInt(60, 180);
    const toYardSteps = randInt(12, 20);
    allPings.push(...movementPings(
      destCoords, yard, toYardStart, toYardDuration, provider, chassisNum, load.ld_num, toYardSteps
    ));

    // 6. Yard idle (8-48 hrs between loads)
    const yardArrival = new Date(toYardStart.getTime() + toYardDuration * 60000);
    const yardIdleHours = randInt(8, 48);
    const yardIdleMinutes = yardIdleHours * 60;
    allPings.push(...idlePings(
      yard, yardArrival, yardIdleMinutes, 30, provider, chassisNum, load.ld_num, yard.name
    ));

    // 7. Yard → Terminal (return for next load)
    const returnStart = new Date(yardArrival.getTime() + yardIdleMinutes * 60000);
    const returnDuration = randInt(60, 180);
    const returnSteps = randInt(12, 20);
    allPings.push(...movementPings(
      yard, terminal, returnStart, returnDuration, provider, chassisNum, load.ld_num, returnSteps
    ));
  }
}

// Sort all pings by recorded_at
allPings.sort((a, b) => a.recorded_at.localeCompare(b.recorded_at));

const output = {
  upload: {
    id: UPLOAD_ID,
    provider: 'Synthetic Demo',
    file_name: 'gps_demo_synthetic.json',
    file_path: 'synthetic/gps_demo_synthetic.json',
    file_type: 'application/json',
    data_date: '2024-01-01',
    notes: 'Synthetic GPS breadcrumb data for 7 demo chassis — 10 loads each',
    status: 'processed',
    row_count: allPings.length,
  },
  gps_rows: allPings,
};

fs.writeFileSync(path.join(__dirname, 'gps_demo_data.json'), JSON.stringify(output, null, 2));
console.log(`\nDone! Wrote ${allPings.length} GPS pings to gps_demo_data.json`);
