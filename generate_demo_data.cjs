// generate_demo_data.js — Generates demo_data_anon.json for chassis utilization demo
// Run: node generate_demo_data.js

const fs = require('fs');

// Deterministic pseudo-random number generator (mulberry32)
function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(42);

function randInt(min, max) {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function randFloat(min, max, decimals = 2) {
  return parseFloat((rand() * (max - min) + min).toFixed(decimals));
}

function pick(arr) {
  return arr[Math.floor(rand() * arr.length)];
}

function formatDate(d) {
  return d.toISOString().split('T')[0];
}

function addDays(d, days) {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
}

// Constants
const chassisNumbers = [
  'MCCZ000001', 'MCCZ000002', 'MCCZ000003',
  'MCCZ000004', 'MCCZ000005', 'MCCZ000006', 'MCCZ000007'
];

const loadsPerChassis = [93, 80, 76, 82, 82, 85, 83]; // total = 581

const chassisTypes = ['53ft Dry Van', '40ft Container', '20ft Container', '53ft Reefer'];
const chassisDescs = ['Standard Dry Van Chassis', 'Intermodal Container Chassis', 'Short Container Chassis', 'Refrigerated Chassis'];
const colors = ['White', 'Gray', 'Blue', 'Red', 'Black', 'Silver', 'Green'];
const containerTypes = ['20DC', '40DC', '40HC', '45HC', '53DV'];
const services = ['Drayage', 'Intermodal', 'OTR', 'Local'];
const statuses = ['Delivered', 'Delivered', 'Delivered', 'Delivered', 'Completed']; // mostly delivered

const states = ['NJ', 'NY', 'PA', 'SC', 'GA', 'FL', 'VA', 'MD', 'NC', 'CT', 'MA', 'OH', 'IL', 'TX', 'CA'];
const cities = {
  NJ: ['Newark', 'Elizabeth', 'Jersey City', 'Edison', 'Carteret'],
  NY: ['New York', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'],
  PA: ['Philadelphia', 'Harrisburg', 'Allentown', 'King of Prussia'],
  SC: ['Charleston', 'Greer', 'Columbia', 'Greenville'],
  GA: ['Savannah', 'Atlanta', 'Augusta'],
  FL: ['Jacksonville', 'Miami', 'Tampa', 'Orlando'],
  VA: ['Norfolk', 'Richmond', 'Virginia Beach'],
  MD: ['Baltimore', 'College Park'],
  NC: ['Charlotte', 'Raleigh', 'Wilmington'],
  CT: ['Hartford', 'New Haven', 'Bridgeport'],
  MA: ['Boston', 'Worcester', 'Springfield'],
  OH: ['Columbus', 'Cleveland', 'Cincinnati'],
  IL: ['Chicago', 'Joliet', 'Springfield'],
  TX: ['Houston', 'Dallas', 'San Antonio'],
  CA: ['Los Angeles', 'Long Beach', 'Oakland']
};

const mrEventTypes = ['Tire Replacement', 'Brake Repair', 'Frame Repair', 'Light Repair', 'Annual Inspection', 'Axle Repair'];
const mrVendors = ['Fleet Maintenance Corp', 'National Trailer Repair', 'Quick Fix Mobile', 'Harbor Services LLC', 'Interstate Equipment'];
const mrDescriptions = [
  'Replaced worn tires', 'Brake pad and drum replacement', 'Frame weld repair',
  'LED light replacement and wiring', 'DOT annual inspection', 'Axle bearing replacement',
  'Suspension repair', 'Landing gear repair', 'ABS sensor replacement'
];

// Date range: 2024-01 to 2025-06 (18 months)
const startDate = new Date('2024-01-01');
const endDate = new Date('2025-06-30');

function getMonthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function generateLocation() {
  const state = pick(states);
  const city = pick(cities[state]);
  return { city, state, loc: `${city}, ${state}` };
}

let loadCounter = 0;

function generateLoads(chassisNum, count, chassisStart, chassisEnd) {
  const loads = [];
  let currentDate = new Date(chassisStart);
  const totalDays = (chassisEnd - chassisStart) / (1000 * 60 * 60 * 24);
  const avgGap = totalDays / count;

  for (let i = 0; i < count; i++) {
    loadCounter++;
    const pickup = new Date(currentDate);
    const daysOnLoad = randInt(1, 5);
    const delivery = addDays(pickup, daysOnLoad);
    const pickupLoc = generateLocation();
    const deliveryLoc = generateLocation();
    const miles = randFloat(20, 800, 1);
    const revenue = rand() < 0.05 ? 0 : randFloat(150, 3500, 2);
    const carrierCost = revenue > 0 ? randFloat(revenue * 0.5, revenue * 0.85, 2) : 0;

    loads.push({
      ld_num: `LD${String(loadCounter).padStart(6, '0')}`,
      container: `CONT${String(randInt(100000, 999999))}`,
      container_type: pick(containerTypes),
      customer: `Customer ${String(randInt(1, 31)).padStart(2, '0')}`,
      carrier: `Carrier ${String(randInt(1, 23)).padStart(2, '0')}`,
      pickup_loc: pickupLoc.loc,
      pickup_city: pickupLoc.city,
      pickup_state: pickupLoc.state,
      delivery_loc: deliveryLoc.loc,
      delivery_city: deliveryLoc.city,
      delivery_state: deliveryLoc.state,
      pickup_date: formatDate(pickup),
      delivery_date: formatDate(delivery),
      revenue,
      carrier_cost: carrierCost,
      miles,
      status: pick(statuses),
      service: pick(services),
      days_on_load: daysOnLoad,
    });

    // Advance date with some gap
    const gap = randInt(Math.max(1, Math.floor(avgGap) - 3), Math.floor(avgGap) + 5);
    currentDate = addDays(delivery, gap);
    if (currentDate > chassisEnd) {
      currentDate = addDays(chassisStart, randInt(0, 30));
    }
  }

  return loads;
}

function computeMonthlyStats(loads) {
  const monthMap = {};
  for (const l of loads) {
    const mk = l.pickup_date.substring(0, 7);
    if (!monthMap[mk]) {
      monthMap[mk] = { loads: 0, revenue: 0, carrier_cost: 0, miles: 0, active_days: new Set() };
    }
    monthMap[mk].loads++;
    monthMap[mk].revenue += l.revenue;
    monthMap[mk].carrier_cost += l.carrier_cost;
    monthMap[mk].miles += l.miles;
    // Track unique active days
    let d = new Date(l.pickup_date);
    const end = new Date(l.delivery_date);
    while (d <= end) {
      monthMap[mk].active_days.add(formatDate(d));
      d = addDays(d, 1);
    }
  }

  const monthly = {};
  for (const [month, stats] of Object.entries(monthMap)) {
    const daysInMonth = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0).getDate();
    const activeDays = stats.active_days.size;
    const utilization = parseFloat(((activeDays / daysInMonth) * 100).toFixed(1));
    const margin = parseFloat((stats.revenue - stats.carrier_cost).toFixed(2));
    const marginPct = stats.revenue > 0 ? parseFloat(((margin / stats.revenue) * 100).toFixed(1)) : 0;

    monthly[month] = {
      loads: stats.loads,
      active_days: activeDays,
      revenue: parseFloat(stats.revenue.toFixed(2)),
      carrier_cost: parseFloat(stats.carrier_cost.toFixed(2)),
      miles: parseFloat(stats.miles.toFixed(1)),
      utilization_pct: utilization,
      margin,
      margin_pct: marginPct,
    };
  }
  return monthly;
}

function generateMREvents(chassisNum, count) {
  const events = [];
  for (let i = 0; i < count; i++) {
    const eventDate = addDays(startDate, randInt(0, 500));
    const duration = randInt(1, 7);
    events.push({
      date: formatDate(eventDate),
      end: formatDate(addDays(eventDate, duration)),
      type: pick(mrEventTypes),
      desc: pick(mrDescriptions),
      cost: randFloat(150, 3500, 2),
      vendor: pick(mrVendors),
    });
  }
  return events;
}

function generateIdleGaps(loads) {
  const gaps = [];
  const sorted = [...loads].sort((a, b) => a.delivery_date.localeCompare(b.delivery_date));

  for (let i = 0; i < sorted.length - 1; i++) {
    const gapStart = addDays(new Date(sorted[i].delivery_date), 1);
    const gapEnd = new Date(sorted[i + 1].pickup_date);
    const days = Math.round((gapEnd - gapStart) / (1000 * 60 * 60 * 24));
    if (days >= 3) {
      gaps.push({
        start: formatDate(gapStart),
        end: formatDate(gapEnd),
        days,
        type: days > 14 ? 'extended' : days > 7 ? 'moderate' : 'short',
      });
    }
  }
  return gaps;
}

// Generate all data
const chassisData = {};
let totalMREvents = 0;
let totalIdleGaps = 0;
const targetMREvents = 16;
const targetIdleGaps = 175;

// Per-chassis date ranges to achieve ~107 total monthly_stats rows
// 18 months total (2024-01 to 2025-06). Target: 107 months total.
// Distribution: 16, 16, 15, 15, 15, 15, 15 = 107
const chassisDateRanges = [
  { start: new Date('2024-01-01'), end: new Date('2025-04-30') }, // 16 months
  { start: new Date('2024-01-01'), end: new Date('2025-04-30') }, // 16 months
  { start: new Date('2024-03-01'), end: new Date('2025-05-31') }, // 15 months
  { start: new Date('2024-02-01'), end: new Date('2025-04-30') }, // 15 months
  { start: new Date('2024-04-01'), end: new Date('2025-06-30') }, // 15 months
  { start: new Date('2024-01-01'), end: new Date('2025-03-31') }, // 15 months
  { start: new Date('2024-02-01'), end: new Date('2025-04-30') }, // 15 months
];

// First pass: generate loads, monthly stats
for (let i = 0; i < chassisNumbers.length; i++) {
  const cn = chassisNumbers[i];
  const range = chassisDateRanges[i];
  const loads = generateLoads(cn, loadsPerChassis[i], range.start, range.end);
  const monthly = computeMonthlyStats(loads);

  chassisData[cn] = {
    chassis_number: cn,
    chassis_type: chassisTypes[i % chassisTypes.length],
    chassis_desc: chassisDescs[i % chassisDescs.length],
    year: 2019 + (i % 5),
    color: colors[i],
    loads,
    monthly,
    mr_events: [],
    idle_gaps: [],
  };
}

// Generate M&R events: distribute 16 across chassis
const mrDistribution = [3, 3, 2, 2, 2, 2, 2]; // = 16
for (let i = 0; i < chassisNumbers.length; i++) {
  chassisData[chassisNumbers[i]].mr_events = generateMREvents(chassisNumbers[i], mrDistribution[i]);
}

// Generate idle gaps
for (let i = 0; i < chassisNumbers.length; i++) {
  const cn = chassisNumbers[i];
  const gaps = generateIdleGaps(chassisData[cn].loads);
  chassisData[cn].idle_gaps = gaps;
  totalIdleGaps += gaps.length;
}

// Adjust idle gaps to match target of 175
// We may need to trim or add gaps
if (totalIdleGaps > targetIdleGaps) {
  // Trim from the chassis with most gaps
  let excess = totalIdleGaps - targetIdleGaps;
  for (let i = chassisNumbers.length - 1; i >= 0 && excess > 0; i--) {
    const cn = chassisNumbers[i];
    const toRemove = Math.min(excess, chassisData[cn].idle_gaps.length - 10);
    if (toRemove > 0) {
      chassisData[cn].idle_gaps = chassisData[cn].idle_gaps.slice(0, chassisData[cn].idle_gaps.length - toRemove);
      excess -= toRemove;
    }
  }
} else if (totalIdleGaps < targetIdleGaps) {
  // Add synthetic short gaps
  let deficit = targetIdleGaps - totalIdleGaps;
  let idx = 0;
  while (deficit > 0) {
    const cn = chassisNumbers[idx % chassisNumbers.length];
    const gapStart = addDays(startDate, randInt(0, 500));
    chassisData[cn].idle_gaps.push({
      start: formatDate(gapStart),
      end: formatDate(addDays(gapStart, randInt(3, 10))),
      days: randInt(3, 10),
      type: 'short',
    });
    deficit--;
    idx++;
  }
}

// Recount
totalIdleGaps = 0;
for (const cn of chassisNumbers) {
  totalIdleGaps += chassisData[cn].idle_gaps.length;
}

// Compute chassis-level summary stats
for (const cn of chassisNumbers) {
  const c = chassisData[cn];
  const allLoads = c.loads;
  const totalRevenue = allLoads.reduce((s, l) => s + l.revenue, 0);
  const totalCarrierCost = allLoads.reduce((s, l) => s + l.carrier_cost, 0);
  const totalMiles = allLoads.reduce((s, l) => s + l.miles, 0);
  const monthlyEntries = Object.entries(c.monthly);

  let bestMonth = null, bestUtil = -1, worstMonth = null, worstUtil = 999;
  for (const [month, stats] of monthlyEntries) {
    if (stats.utilization_pct > bestUtil) { bestUtil = stats.utilization_pct; bestMonth = month; }
    if (stats.utilization_pct < worstUtil) { worstUtil = stats.utilization_pct; worstMonth = month; }
  }

  const avgUtil = monthlyEntries.length > 0
    ? parseFloat((monthlyEntries.reduce((s, [, m]) => s + m.utilization_pct, 0) / monthlyEntries.length).toFixed(1))
    : 0;

  const dates = allLoads.map(l => l.pickup_date).sort();
  const totalMRCost = c.mr_events.reduce((s, e) => s + e.cost, 0);
  const totalMRDays = c.mr_events.reduce((s, e) => {
    const d = Math.round((new Date(e.end) - new Date(e.date)) / (1000 * 60 * 60 * 24));
    return s + d;
  }, 0);

  c.total_loads = allLoads.length;
  c.total_revenue = parseFloat(totalRevenue.toFixed(2));
  c.total_carrier_cost = parseFloat(totalCarrierCost.toFixed(2));
  c.total_margin = parseFloat((totalRevenue - totalCarrierCost).toFixed(2));
  c.total_miles = parseFloat(totalMiles.toFixed(1));
  c.avg_miles_per_load = parseFloat((totalMiles / allLoads.length).toFixed(1));
  c.avg_revenue_per_load = parseFloat((totalRevenue / allLoads.length).toFixed(2));
  c.avg_utilization = avgUtil;
  c.best_month = bestMonth;
  c.best_month_util = bestUtil;
  c.worst_month = worstMonth;
  c.worst_month_util = worstUtil;
  c.first_activity = dates[0] || null;
  c.last_activity = dates[dates.length - 1] || null;
  c.months_active = monthlyEntries.length;
  c.total_mr_cost = parseFloat(totalMRCost.toFixed(2));
  c.total_mr_days = totalMRDays;
}

// Count totals
let totalLoads = 0, totalMonthly = 0;
totalMREvents = 0;
totalIdleGaps = 0;
for (const cn of chassisNumbers) {
  totalLoads += chassisData[cn].loads.length;
  totalMonthly += Object.keys(chassisData[cn].monthly).length;
  totalMREvents += chassisData[cn].mr_events.length;
  totalIdleGaps += chassisData[cn].idle_gaps.length;
}

console.log(`Chassis: ${chassisNumbers.length}`);
console.log(`Loads: ${totalLoads} (expected 581)`);
console.log(`Monthly stats: ${totalMonthly} (expected 107)`);
console.log(`M&R events: ${totalMREvents} (expected 16)`);
console.log(`Idle gaps: ${totalIdleGaps} (expected 175)`);

const output = { chassis: chassisData };
fs.writeFileSync('./demo_data_anon.json', JSON.stringify(output, null, 2));
console.log('\nWrote demo_data_anon.json');
