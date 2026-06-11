/* ============================================================
   PULSE — Personal Health Tracker
   All data stored locally in browser (localStorage).
   ============================================================ */

const STORAGE_KEY = 'pulse_health_tracker_v1';

// ---------- DEFAULT STATE ----------
const defaultState = {
  profile: {
    name: 'Friend',
    age: null,
    height: null,
    weight: null,
    gender: '',
    photo: ''
  },
  goals: {
    steps: 10000,
    cals: 2000,
    water: 8,
    sleep: 8,
    workouts: 5
  },
  reminders: {
    water: false, meals: false, workout: false, bed: false
  },
  theme: 'light',
  points: 0,
  badges: [],
  logs: {}    // logs[YYYY-MM-DD] = { steps, workouts:[], cals, water, protein, carbs, fats, meals:[], sleepHrs, sleepQ, mood, stress, weight, hr, bpSys, bpDia, sugar }
};

let state = loadState();
let charts = {};

// ---------- STORAGE ----------
function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return structuredClone(defaultState);
    const parsed = JSON.parse(saved);
    return { ...structuredClone(defaultState), ...parsed,
      profile: { ...defaultState.profile, ...(parsed.profile||{}) },
      goals: { ...defaultState.goals, ...(parsed.goals||{}) },
      reminders: { ...defaultState.reminders, ...(parsed.reminders||{}) }
    };
  } catch(e) { return structuredClone(defaultState); }
}
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ---------- HELPERS ----------
const $ = (id) => document.getElementById(id);
const todayKey = () => new Date().toISOString().slice(0, 10);
const dateKey = (d) => d.toISOString().slice(0, 10);
function getLog(date = todayKey()) {
  if (!state.logs[date]) state.logs[date] = {
    steps: 0, workouts: [], cals: 0, water: 0,
    protein: 0, carbs: 0, fats: 0, meals: [],
    sleepHrs: 0, sleepQ: 0, mood: '', stress: 0,
    weight: null, hr: null, bpSys: null, bpDia: null, sugar: null
  };
  return state.logs[date];
}
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 2500);
}

// ---------- QUOTES ----------
const QUOTES = [
  "Small steps every day lead to big changes every year.",
  "Your body deserves the best — listen to it.",
  "Drink water. Move daily. Sleep well. Repeat.",
  "Progress, not perfection.",
  "Rest is part of the process.",
  "Healthy isn't a goal, it's a way of living.",
  "A workout is a celebration of what your body can do.",
  "Sleep is the best meditation. — Dalai Lama",
  "Take care of your body, it's the only place you have to live.",
  "Eat the rainbow. Move with joy. Sleep with peace.",
  "Hydration is a love letter to your future self.",
  "Mood follows action — start small, feel better.",
  "Consistency beats intensity, every single time.",
  "Your only competition is who you were yesterday."
];
function setDailyQuote() {
  const idx = new Date().getDate() % QUOTES.length;
  $('dailyQuote').textContent = QUOTES[idx];
}

// ---------- BADGES ----------
const BADGE_DEFS = [
  { id: 'first_log',   emoji: '🎉', name: 'First Log',        desc: 'Logged your first entry' },
  { id: 'streak_3',    emoji: '🔥', name: '3-Day Streak',     desc: 'Logged 3 days in a row' },
  { id: 'streak_7',    emoji: '⚡', name: 'Week Warrior',     desc: '7-day streak' },
  { id: 'streak_30',   emoji: '👑', name: 'Month Master',     desc: '30-day streak' },
  { id: 'water_hero',  emoji: '💧', name: 'Hydration Hero',   desc: 'Hit water goal' },
  { id: 'step_10k',    emoji: '👟', name: '10K Steps',        desc: 'Walked 10,000 steps' },
  { id: 'workout_5',   emoji: '💪', name: 'Workout 5',        desc: '5 workouts logged' },
  { id: 'sleep_8',     emoji: '😴', name: 'Sleeper',          desc: 'Slept 8+ hours' },
  { id: 'level_5',     emoji: '🏆', name: 'Level 5',          desc: 'Reached level 5' },
  { id: 'mood_great',  emoji: '😄', name: 'Great Vibes',      desc: 'Felt great today' },
  { id: 'protein_pro', emoji: '🥩', name: 'Protein Pro',      desc: '100g+ protein' },
  { id: 'all_areas',   emoji: '🌟', name: 'Full Spectrum',    desc: 'Logged all 4 areas in one day' }
];
function maybeEarnBadges() {
  const today = getLog();
  const streak = currentStreak();
  const totalWorkouts = Object.values(state.logs).reduce((a,l)=>a+(l.workouts?.length||0),0);
  const checks = {
    first_log: Object.keys(state.logs).length >= 1 && (today.steps||today.cals||today.sleepHrs||today.weight),
    streak_3: streak >= 3,
    streak_7: streak >= 7,
    streak_30: streak >= 30,
    water_hero: today.water >= state.goals.water,
    step_10k: today.steps >= 10000,
    workout_5: totalWorkouts >= 5,
    sleep_8: today.sleepHrs >= 8,
    level_5: Math.floor(state.points/100) + 1 >= 5,
    mood_great: today.mood === 'great',
    protein_pro: today.protein >= 100,
    all_areas: (today.steps>0 || today.workouts.length>0) && today.cals>0 && today.sleepHrs>0 && (today.weight!=null || today.hr!=null)
  };
  let newOnes = [];
  for (const b of BADGE_DEFS) {
    if (checks[b.id] && !state.badges.includes(b.id)) {
      state.badges.push(b.id);
      newOnes.push(b);
      state.points += 25;
    }
  }
  if (newOnes.length) {
    toast(`🏆 Earned: ${newOnes.map(b=>b.name).join(', ')}`);
    save();
  }
}

// ---------- STREAK ----------
function currentStreak() {
  let streak = 0;
  let d = new Date();
  while (true) {
    const k = dateKey(d);
    const log = state.logs[k];
    const has = log && (log.steps>0||log.cals>0||log.sleepHrs>0||log.water>0||log.weight!=null||log.workouts.length>0);
    if (!has) break;
    streak++;
    d.setDate(d.getDate()-1);
  }
  return streak;
}

// ---------- HEALTH SCORE ----------
function computeHealthScore() {
  const t = getLog();
  let s = 0;
  // Steps (25%)
  s += Math.min(25, (t.steps / state.goals.steps) * 25);
  // Water (15%)
  s += Math.min(15, (t.water / state.goals.water) * 15);
  // Sleep (20%) — best near goal
  if (t.sleepHrs > 0) {
    const diff = Math.abs(t.sleepHrs - state.goals.sleep);
    s += Math.max(0, 20 - diff * 4);
  }
  // Calories (15%) — penalize overshoot
  if (t.cals > 0) {
    const ratio = t.cals / state.goals.cals;
    s += ratio < 1.1 ? Math.min(15, ratio * 15) : Math.max(0, 15 - (ratio - 1) * 20);
  }
  // Workout (15%)
  if (t.workouts.length > 0) s += 15;
  // Mood (10%)
  const moodScore = { great: 10, good: 8, okay: 5, low: 3, bad: 1 }[t.mood] || 0;
  s += moodScore;
  return Math.round(Math.min(100, s));
}

// ---------- BMI ----------
function computeBMI() {
  const w = state.profile.weight;
  const h = state.profile.height;
  if (!w || !h) return { val: null, label: 'Set weight & height' };
  const bmi = w / Math.pow(h/100, 2);
  let label = 'Normal';
  if (bmi < 18.5) label = 'Underweight';
  else if (bmi < 25) label = 'Normal';
  else if (bmi < 30) label = 'Overweight';
  else label = 'Obese';
  return { val: bmi.toFixed(1), label };
}

// ---------- NAVIGATION ----------
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const page = btn.dataset.page;
    $('page-' + page).classList.add('active');
    renderAll();
    $('sidebar').classList.remove('open');
  });
});
$('hamburger').addEventListener('click', () => $('sidebar').classList.toggle('open'));

// ---------- THEME ----------
function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  $('themeToggle').textContent = state.theme === 'dark' ? '☀️' : '🌙';
  // Re-render charts so colors update
  Object.values(charts).forEach(c => c && c.destroy());
  charts = {};
  renderAll();
}
$('themeToggle').addEventListener('click', () => {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  save();
  applyTheme();
});

// ---------- HERO + GREETING ----------
function renderHero() {
  const hr = new Date().getHours();
  const greet = hr < 12 ? 'Good morning,' : hr < 18 ? 'Good afternoon,' : 'Good evening,';
  $('heroGreeting').textContent = greet;
  $('heroName').textContent = (state.profile.name || 'Friend') + '!';
  $('heroDate').textContent = new Date().toLocaleDateString(undefined, { weekday:'long', month:'long', day:'numeric', year:'numeric' });
  $('topName').textContent = state.profile.name || 'You';
  // Avatar
  const av = state.profile.photo;
  const setAvatar = (el) => {
    if (av) { el.style.backgroundImage = `url(${av})`; el.textContent = ''; }
    else    { el.style.backgroundImage = ''; el.textContent = (state.profile.name||'Y')[0].toUpperCase(); }
  };
  setAvatar($('heroAvatar'));
  setAvatar($('topAvatar'));

  const t = getLog();
  animateNum($('heroSteps'), t.steps);
  animateNum($('heroCalIn'), t.cals);
  $('heroSleep').textContent = (t.sleepHrs||0) + 'h';
  $('heroHR').textContent = t.hr || '--';
}

function animateNum(el, val) {
  const start = parseInt(el.textContent.replace(/,/g,'')) || 0;
  const dur = 800;
  const t0 = performance.now();
  function step(now) {
    const p = Math.min(1, (now - t0) / dur);
    const cur = Math.round(start + (val - start) * (1 - Math.pow(1-p, 3)));
    el.textContent = cur.toLocaleString();
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ---------- HIGHLIGHT CARDS ----------
function renderHighlights() {
  const streak = currentStreak();
  $('streakDays').textContent = streak;
  const level = Math.floor(state.points / 100) + 1;
  $('userLevel').textContent = level;
  $('userPoints').textContent = state.points;

  const score = computeHealthScore();
  $('healthScore').textContent = score;
  $('scoreFill').style.width = score + '%';

  const bmi = computeBMI();
  $('bmiValue').textContent = bmi.val || '--';
  $('bmiLabel').textContent = bmi.label;

  $('badgeCount').textContent = state.badges.length;
  if (state.badges.length) {
    const last = BADGE_DEFS.find(b => b.id === state.badges[state.badges.length-1]);
    if (last) $('latestBadge').textContent = `Latest: ${last.emoji} ${last.name}`;
  } else {
    $('latestBadge').textContent = 'Start logging to earn!';
  }
}

// ---------- QUICK GRID ----------
function renderQuickGrid() {
  const t = getLog();
  $('qaSteps').textContent = t.steps.toLocaleString();
  $('qaWorkouts').textContent = t.workouts.length;
  $('qaStepsBar').style.width = Math.min(100, (t.steps/state.goals.steps)*100) + '%';

  $('qaCals').textContent = t.cals.toLocaleString();
  $('qaWater').textContent = t.water;
  $('qaWaterBar').style.width = Math.min(100, (t.water/state.goals.water)*100) + '%';

  $('qaSleepHrs').textContent = (t.sleepHrs||0) + 'h';
  const moodMap = { great:'😄', good:'🙂', okay:'😐', low:'😕', bad:'😞' };
  $('qaMood').textContent = moodMap[t.mood] || '--';
  $('qaSleepBar').style.width = Math.min(100, (t.sleepHrs/state.goals.sleep)*100) + '%';

  $('qaWeight').textContent = t.weight ?? state.profile.weight ?? '--';
  $('qaHR').textContent = t.hr || '--';
  $('qaVitalsBar').style.width = (t.weight || t.hr) ? '100%' : '0%';
}

// ---------- HEATMAP ----------
function renderHeatmap() {
  const grid = $('heatmapGrid');
  grid.innerHTML = '';
  for (let i = 89; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const k = dateKey(d);
    const log = state.logs[k];
    let level = 0;
    if (log) {
      const score = (log.steps>0?1:0) + (log.cals>0?1:0) + (log.sleepHrs>0?1:0) + (log.water>0?1:0) + (log.workouts.length>0?1:0);
      level = Math.min(4, score);
    }
    const cell = document.createElement('div');
    cell.className = `heat-cell l${level}`;
    cell.title = `${k}: ${level}/5 activities`;
    grid.appendChild(cell);
  }
}

// ---------- CHARTS ----------
function chartColors() {
  const dark = state.theme === 'dark';
  return {
    grid: dark ? '#334155' : '#E2E8F0',
    text: dark ? '#94A3B8' : '#64748B',
    blue: '#3B82F6',
    green: '#10B981',
    coral: '#FF6B6B',
    yellow: '#FBBF24',
    purple: '#8B5CF6'
  };
}
function commonOpts() {
  const c = chartColors();
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: c.text, font: { size: 12 } } }
    },
    scales: {
      x: { ticks: { color: c.text }, grid: { color: c.grid, drawBorder: false } },
      y: { ticks: { color: c.text }, grid: { color: c.grid, drawBorder: false } }
    },
    animation: { duration: 800, easing: 'easeOutCubic' }
  };
}
function last7Days() {
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate()-i);
    out.push({ date: d, key: dateKey(d), label: d.toLocaleDateString(undefined, { weekday: 'short' }) });
  }
  return out;
}
function last30Days() {
  const out = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate()-i);
    out.push({ key: dateKey(d), label: d.getDate() + '/' + (d.getMonth()+1) });
  }
  return out;
}
function makeChart(id, cfg) {
  const el = $(id);
  if (!el) return;
  if (charts[id]) charts[id].destroy();
  charts[id] = new Chart(el, cfg);
}

function renderDashboardCharts() {
  const c = chartColors();
  const days = last7Days();
  const thisWeek = days.map(d => state.logs[d.key] || {});

  // Last week
  const lastWeekDays = [];
  for (let i = 13; i >= 7; i--) {
    const d = new Date(); d.setDate(d.getDate()-i);
    lastWeekDays.push(state.logs[dateKey(d)] || {});
  }

  makeChart('weeklyCompareChart', {
    type: 'bar',
    data: {
      labels: days.map(d => d.label),
      datasets: [
        { label: 'Steps (this wk)', data: thisWeek.map(l=>l.steps||0), backgroundColor: c.blue, borderRadius: 6 },
        { label: 'Steps (last wk)', data: lastWeekDays.map(l=>l.steps||0), backgroundColor: c.coral + '99', borderRadius: 6 }
      ]
    },
    options: commonOpts()
  });

  const today = getLog();
  makeChart('macrosChart', {
    type: 'doughnut',
    data: {
      labels: ['Protein','Carbs','Fats'],
      datasets: [{
        data: [today.protein||0, today.carbs||0, today.fats||0],
        backgroundColor: [c.coral, c.yellow, c.green],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { color: c.text } } },
      cutout: '65%'
    }
  });
}

function renderFitnessCharts() {
  const c = chartColors();
  const days = last7Days();
  makeChart('fitnessChart', {
    type: 'bar',
    data: {
      labels: days.map(d=>d.label),
      datasets: [{
        label: 'Steps',
        data: days.map(d => (state.logs[d.key]||{}).steps||0),
        backgroundColor: c.coral,
        borderRadius: 6
      }]
    },
    options: commonOpts()
  });
  makeChart('caloriesBurnChart', {
    type: 'bar',
    data: {
      labels: days.map(d=>d.label),
      datasets: [{
        label: 'Burned',
        data: days.map(d => {
          const l = state.logs[d.key]||{};
          return (l.workouts||[]).reduce((a,w)=>a+(w.calBurn||0),0);
        }),
        backgroundColor: c.yellow,
        borderRadius: 6
      }]
    },
    options: commonOpts()
  });
}

function renderNutritionCharts() {
  const c = chartColors();
  const days = last7Days();
  makeChart('nutritionChart', {
    type: 'bar',
    data: {
      labels: days.map(d=>d.label),
      datasets: [
        { label: 'Calories', data: days.map(d=>(state.logs[d.key]||{}).cals||0), backgroundColor: c.green, borderRadius: 6 },
        { label: 'Goal', data: days.map(()=>state.goals.cals), type:'line', borderColor: c.coral, borderDash:[6,6], pointRadius:0, fill:false }
      ]
    },
    options: commonOpts()
  });
  const t = getLog();
  makeChart('macrosBigChart', {
    type: 'doughnut',
    data: {
      labels: ['Protein','Carbs','Fats'],
      datasets: [{
        data: [t.protein||0, t.carbs||0, t.fats||0],
        backgroundColor: [c.coral, c.yellow, c.green],
        borderWidth: 0
      }]
    },
    options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'bottom', labels:{color:c.text}}}, cutout:'65%' }
  });
}

function renderSleepCharts() {
  const c = chartColors();
  const days = last7Days();
  makeChart('sleepChart', {
    type: 'bar',
    data: {
      labels: days.map(d=>d.label),
      datasets: [
        { label: 'Hours', data: days.map(d=>(state.logs[d.key]||{}).sleepHrs||0), backgroundColor: c.purple, borderRadius: 6 },
        { label: 'Goal', data: days.map(()=>state.goals.sleep), type:'line', borderColor: c.green, borderDash:[6,6], pointRadius:0, fill:false }
      ]
    },
    options: commonOpts()
  });
  const moodScoreMap = { great:5, good:4, okay:3, low:2, bad:1 };
  makeChart('moodChart', {
    type: 'bar',
    data: {
      labels: days.map(d=>d.label),
      datasets: [{
        label: 'Mood (1-5)',
        data: days.map(d=>moodScoreMap[(state.logs[d.key]||{}).mood]||0),
        backgroundColor: c.blue,
        borderRadius: 6
      }]
    },
    options: { ...commonOpts(), scales: { ...commonOpts().scales, y: { ...commonOpts().scales.y, min:0, max:5 } } }
  });
}

function renderVitalsCharts() {
  const c = chartColors();
  const days = last30Days();
  makeChart('vitalsChart', {
    type: 'bar',
    data: {
      labels: days.map(d=>d.label),
      datasets: [{
        label: 'Weight (kg)',
        data: days.map(d => (state.logs[d.key]||{}).weight || null),
        backgroundColor: c.blue,
        borderRadius: 4
      }]
    },
    options: commonOpts()
  });
  const last14 = days.slice(-14);
  makeChart('hrChart', {
    type: 'bar',
    data: {
      labels: last14.map(d=>d.label),
      datasets: [{
        label: 'HR (bpm)',
        data: last14.map(d=>(state.logs[d.key]||{}).hr || null),
        backgroundColor: c.coral,
        borderRadius: 4
      }]
    },
    options: commonOpts()
  });
}

// ---------- FITNESS PAGE ----------
function renderFitnessPage() {
  const t = getLog();
  $('fSteps').textContent = t.steps.toLocaleString();
  $('fStepsGoal').textContent = state.goals.steps.toLocaleString();
  $('fCalBurn').textContent = (t.workouts||[]).reduce((a,w)=>a+(w.calBurn||0),0);
  $('fActiveMin').textContent = (t.workouts||[]).reduce((a,w)=>a+(w.duration||0),0);
  let wkWorkouts = 0;
  last7Days().forEach(d => wkWorkouts += ((state.logs[d.key]||{}).workouts||[]).length);
  $('fWorkoutsWeek').textContent = wkWorkouts;

  // History
  const list = $('workoutHistory');
  list.innerHTML = '';
  const items = [];
  Object.entries(state.logs).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,10).forEach(([date, log]) => {
    (log.workouts||[]).forEach(w => items.push({ date, ...w }));
  });
  if (items.length === 0) list.innerHTML = '<div class="empty-state">No workouts yet. Tap "+ Log Workout" to get started!</div>';
  items.slice(0,15).forEach(w => {
    list.insertAdjacentHTML('beforeend', `
      <div class="history-item">
        <div class="h-left"><span class="h-icon">💪</span>
          <div class="h-meta"><strong>${w.type||'Workout'}</strong><small>${w.date} · ${w.duration||0} min</small></div>
        </div>
        <div class="h-val">${w.calBurn||0} cal</div>
      </div>`);
  });
  renderFitnessCharts();
}

// ---------- NUTRITION PAGE ----------
function renderNutritionPage() {
  const t = getLog();
  $('nCals').textContent = t.cals.toLocaleString();
  $('nCalGoal').textContent = state.goals.cals;
  $('nWater').textContent = t.water;
  $('waterFill').style.width = Math.min(100,(t.water/state.goals.water)*100) + '%';
  $('nProtein').textContent = (t.protein||0) + 'g';
  $('nCarbs').textContent = t.carbs||0;
  $('nFats').textContent = t.fats||0;

  const list = $('mealHistory');
  list.innerHTML = '';
  if (!t.meals || t.meals.length===0) list.innerHTML = '<div class="empty-state">No meals logged today.</div>';
  (t.meals||[]).forEach(m => {
    list.insertAdjacentHTML('beforeend', `
      <div class="history-item">
        <div class="h-left"><span class="h-icon">🍽️</span>
          <div class="h-meta"><strong>${m.name||'Meal'}</strong><small>${m.cals||0} cal</small></div>
        </div>
        <div class="h-val">${m.time||''}</div>
      </div>`);
  });
  renderNutritionCharts();
}

// ---------- SLEEP PAGE ----------
function renderSleepPage() {
  const t = getLog();
  $('sHours').textContent = (t.sleepHrs||0) + 'h';
  $('sQuality').textContent = t.sleepQ || '--';
  const moodMap = { great:'😄', good:'🙂', okay:'😐', low:'😕', bad:'😞' };
  $('sMoodEmoji').textContent = moodMap[t.mood] || '--';
  $('sMoodLabel').textContent = t.mood ? t.mood[0].toUpperCase()+t.mood.slice(1) : 'No log yet';
  $('sStress').textContent = t.stress || '--';

  let sum=0, n=0;
  last7Days().forEach(d => { const l = state.logs[d.key]||{}; if (l.sleepHrs) { sum+=l.sleepHrs; n++; } });
  $('sAvgWeek').textContent = n ? (sum/n).toFixed(1) + 'h' : '0h';

  const list = $('sleepHistory');
  list.innerHTML = '';
  const items = Object.entries(state.logs).filter(([_,l])=>l.sleepHrs>0).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,10);
  if (items.length===0) list.innerHTML = '<div class="empty-state">No sleep logs yet.</div>';
  items.forEach(([date,l]) => {
    list.insertAdjacentHTML('beforeend', `
      <div class="history-item">
        <div class="h-left"><span class="h-icon">😴</span>
          <div class="h-meta"><strong>${l.sleepHrs}h sleep</strong><small>${date} · Quality ${l.sleepQ||'--'}/10</small></div>
        </div>
        <div class="h-val">${moodMap[l.mood]||''}</div>
      </div>`);
  });
  renderSleepCharts();
}

// ---------- VITALS PAGE ----------
function renderVitalsPage() {
  const t = getLog();
  $('vWeight').textContent = t.weight ?? state.profile.weight ?? '--';
  const bmi = computeBMI();
  $('vBMI').textContent = bmi.val || '--';
  $('vBMILabel').textContent = bmi.label;
  $('vHR').textContent = t.hr || '--';
  $('vBP').textContent = (t.bpSys && t.bpDia) ? `${t.bpSys}/${t.bpDia}` : '--/--';

  const list = $('vitalsHistory');
  list.innerHTML = '';
  const items = Object.entries(state.logs).filter(([_,l])=>l.weight||l.hr||l.bpSys).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,10);
  if (items.length===0) list.innerHTML = '<div class="empty-state">No vitals logged yet.</div>';
  items.forEach(([date,l]) => {
    list.insertAdjacentHTML('beforeend', `
      <div class="history-item">
        <div class="h-left"><span class="h-icon">❤️</span>
          <div class="h-meta"><strong>${date}</strong><small>${l.weight?l.weight+'kg ':''} ${l.hr?l.hr+'bpm ':''} ${l.bpSys?l.bpSys+'/'+l.bpDia+' BP':''}</small></div>
        </div>
        <div class="h-val">${l.sugar?l.sugar+' mg/dL':''}</div>
      </div>`);
  });
  renderVitalsCharts();
}

// ---------- GOALS PAGE ----------
function renderGoalsPage() {
  $('goalSteps').value = state.goals.steps;
  $('goalCals').value = state.goals.cals;
  $('goalWater').value = state.goals.water;
  $('goalSleep').value = state.goals.sleep;
  $('goalWorkouts').value = state.goals.workouts;

  // Badges
  const grid = $('badgesGrid');
  grid.innerHTML = '';
  BADGE_DEFS.forEach(b => {
    const earned = state.badges.includes(b.id);
    grid.insertAdjacentHTML('beforeend', `
      <div class="badge-card ${earned?'earned':''}">
        <span class="b-emoji">${b.emoji}</span>
        <strong>${b.name}</strong>
        <small>${b.desc}</small>
      </div>`);
  });

  // Weekly report
  const rep = $('weeklyReport');
  const days = last7Days();
  let steps=0, cals=0, workouts=0, sleep=0, sleepN=0, water=0;
  days.forEach(d => {
    const l = state.logs[d.key]||{};
    steps += l.steps||0;
    cals += l.cals||0;
    workouts += (l.workouts||[]).length;
    if (l.sleepHrs) { sleep += l.sleepHrs; sleepN++; }
    water += l.water||0;
  });
  rep.innerHTML = `
    <div class="report-item"><span>Total Steps</span><strong>${steps.toLocaleString()}</strong></div>
    <div class="report-item"><span>Total Calories Eaten</span><strong>${cals.toLocaleString()}</strong></div>
    <div class="report-item"><span>Workouts</span><strong>${workouts}</strong></div>
    <div class="report-item"><span>Avg Sleep</span><strong>${sleepN?(sleep/sleepN).toFixed(1)+'h':'--'}</strong></div>
    <div class="report-item"><span>Total Water Glasses</span><strong>${water}</strong></div>
    <div class="report-item"><span>Current Streak</span><strong>${currentStreak()} days</strong></div>
  `;
}

$('saveGoals').addEventListener('click', () => {
  state.goals.steps = +$('goalSteps').value || 10000;
  state.goals.cals = +$('goalCals').value || 2000;
  state.goals.water = +$('goalWater').value || 8;
  state.goals.sleep = +$('goalSleep').value || 8;
  state.goals.workouts = +$('goalWorkouts').value || 5;
  save();
  toast('🎯 Goals updated!');
  renderAll();
});

$('exportReport').addEventListener('click', () => {
  const text = $('weeklyReport').innerText;
  const blob = new Blob([`Pulse Weekly Report\n${new Date().toLocaleDateString()}\n\n${text}`], {type:'text/plain'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'pulse-report.txt'; a.click();
  URL.revokeObjectURL(url);
  toast('📄 Report downloaded');
});

// ---------- SETTINGS ----------
function renderSettingsPage() {
  $('setName').value = state.profile.name || '';
  $('setAge').value = state.profile.age || '';
  $('setHeight').value = state.profile.height || '';
  $('setWeight').value = state.profile.weight || '';
  $('setGender').value = state.profile.gender || '';
  const pv = $('photoPreview');
  if (state.profile.photo) pv.style.backgroundImage = `url(${state.profile.photo})`;
  ['remWater','remMeals','remWorkout','remBed'].forEach(k => {
    const key = k.replace('rem','').toLowerCase();
    $(k).checked = !!state.reminders[key];
  });
}
$('saveProfile').addEventListener('click', () => {
  state.profile.name = $('setName').value.trim() || 'Friend';
  state.profile.age = +$('setAge').value || null;
  state.profile.height = +$('setHeight').value || null;
  state.profile.weight = +$('setWeight').value || null;
  state.profile.gender = $('setGender').value;
  save();
  toast('👤 Profile saved!');
  renderAll();
});
$('setPhoto').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    state.profile.photo = ev.target.result;
    $('photoPreview').style.backgroundImage = `url(${ev.target.result})`;
    save();
    renderHero();
  };
  reader.readAsDataURL(file);
});
['remWater','remMeals','remWorkout','remBed'].forEach(k => {
  $(k).addEventListener('change', e => {
    const key = k.replace('rem','').toLowerCase();
    state.reminders[key] = e.target.checked;
    save();
    setupReminders();
  });
});
$('enableNotif').addEventListener('click', async () => {
  if (!('Notification' in window)) { toast('Notifications not supported'); return; }
  const perm = await Notification.requestPermission();
  toast(perm === 'granted' ? '🔔 Reminders enabled' : 'Permission denied');
  setupReminders();
});

$('exportData').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'pulse-data-' + todayKey() + '.json'; a.click();
  URL.revokeObjectURL(url);
  toast('💾 Data exported');
});
$('importData').addEventListener('click', () => $('importFile').click());
$('importFile').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const parsed = JSON.parse(ev.target.result);
      state = { ...structuredClone(defaultState), ...parsed };
      save();
      applyTheme();
      renderAll();
      toast('📥 Data imported');
    } catch(err) { toast('Invalid file'); }
  };
  reader.readAsText(file);
});
$('resetData').addEventListener('click', () => {
  if (confirm('Erase ALL your health data? This cannot be undone.')) {
    state = structuredClone(defaultState);
    save();
    applyTheme();
    renderAll();
    toast('🗑 All data reset');
  }
});

// ---------- REMINDERS ----------
let reminderTimers = [];
function setupReminders() {
  reminderTimers.forEach(t => clearInterval(t));
  reminderTimers = [];
  if (Notification.permission !== 'granted') return;
  if (state.reminders.water) {
    reminderTimers.push(setInterval(() => new Notification('💧 Hydration time!', { body: 'Drink a glass of water.' }), 2*60*60*1000));
  }
  if (state.reminders.meals) {
    const checkMeals = () => {
      const h = new Date().getHours();
      if ([8,13,19].includes(h) && new Date().getMinutes() < 5) {
        new Notification('🍽️ Meal time', { body: 'Don\'t forget to log your meal!' });
      }
    };
    reminderTimers.push(setInterval(checkMeals, 5*60*1000));
  }
  if (state.reminders.workout) {
    reminderTimers.push(setInterval(() => {
      const h = new Date().getHours();
      if (h === 17 && new Date().getMinutes() < 5) new Notification('💪 Workout time!', { body: 'Move your body for 30 minutes.' });
    }, 5*60*1000));
  }
  if (state.reminders.bed) {
    reminderTimers.push(setInterval(() => {
      const h = new Date().getHours();
      if (h === 22 && new Date().getMinutes() < 5) new Notification('😴 Bedtime soon', { body: 'Wind down for better sleep.' });
    }, 5*60*1000));
  }
}

// ---------- WATER QUICK ----------
$('addWater').addEventListener('click', () => {
  getLog().water = (getLog().water||0) + 1;
  state.points += 2;
  save(); maybeEarnBadges(); renderAll();
  toast('💧 +1 glass');
});
$('removeWater').addEventListener('click', () => {
  const t = getLog();
  t.water = Math.max(0, (t.water||0) - 1);
  save(); renderAll();
});

// ---------- QUICK ADD MODAL ----------
const QUICK_FORMS = {
  fitness: {
    title: '💪 Quick Add — Fitness',
    fields: `
      <label>Steps to add <input type="number" id="qSteps" min="0" placeholder="e.g. 500" /></label>
      <label>Workout type <input type="text" id="qWType" placeholder="e.g. Running" /></label>
      <label>Duration (min) <input type="number" id="qWDur" min="0" /></label>
      <label>Calories burned <input type="number" id="qWCal" min="0" /></label>
    `,
    save() {
      const t = getLog();
      const steps = +$('qSteps').value || 0;
      t.steps += steps;
      const type = $('qWType').value.trim();
      if (type) {
        t.workouts.push({ type, duration: +$('qWDur').value||0, calBurn: +$('qWCal').value||0 });
        state.points += 15;
      }
      if (steps) state.points += Math.floor(steps/1000) * 2;
    }
  },
  nutrition: {
    title: '🥗 Quick Add — Nutrition',
    fields: `
      <label>Meal name <input type="text" id="qMName" placeholder="e.g. Lunch" /></label>
      <label>Calories <input type="number" id="qMCal" min="0" /></label>
      <label>Protein (g) <input type="number" id="qMP" min="0" /></label>
      <label>Carbs (g) <input type="number" id="qMC" min="0" /></label>
      <label>Fats (g) <input type="number" id="qMF" min="0" /></label>
      <label>Water glasses to add <input type="number" id="qMW" min="0" /></label>
    `,
    save() {
      const t = getLog();
      const cal = +$('qMCal').value||0;
      const name = $('qMName').value.trim();
      if (name || cal) {
        t.meals.push({ name: name||'Meal', cals: cal, time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) });
        t.cals += cal;
        t.protein += +$('qMP').value||0;
        t.carbs += +$('qMC').value||0;
        t.fats += +$('qMF').value||0;
        state.points += 10;
      }
      t.water += +$('qMW').value||0;
    }
  },
  sleep: {
    title: '😴 Quick Add — Sleep & Mood',
    fields: `
      <label>Hours slept <input type="number" id="qSH" min="0" max="24" step="0.5" /></label>
      <label>Quality (1-10) <input type="number" id="qSQ" min="1" max="10" /></label>
      <label>Mood
        <select id="qSM">
          <option value="">--</option>
          <option value="great">😄 Great</option>
          <option value="good">🙂 Good</option>
          <option value="okay">😐 Okay</option>
          <option value="low">😕 Low</option>
          <option value="bad">😞 Bad</option>
        </select>
      </label>
      <label>Stress (1-10) <input type="number" id="qSS" min="1" max="10" /></label>
    `,
    save() {
      const t = getLog();
      t.sleepHrs = +$('qSH').value || t.sleepHrs;
      t.sleepQ = +$('qSQ').value || t.sleepQ;
      t.mood = $('qSM').value || t.mood;
      t.stress = +$('qSS').value || t.stress;
      state.points += 10;
    }
  },
  vitals: {
    title: '❤️ Quick Add — Vitals',
    fields: `
      <label>Weight (kg) <input type="number" id="qVW" min="0" step="0.1" /></label>
      <label>Heart rate (bpm) <input type="number" id="qVH" min="30" max="220" /></label>
      <label>BP Systolic <input type="number" id="qVBS" min="60" max="220" /></label>
      <label>BP Diastolic <input type="number" id="qVBD" min="40" max="140" /></label>
      <label>Blood sugar (mg/dL) <input type="number" id="qVS" min="0" /></label>
    `,
    save() {
      const t = getLog();
      const w = +$('qVW').value;
      if (w) { t.weight = w; state.profile.weight = w; }
      const hr = +$('qVH').value; if (hr) t.hr = hr;
      const sys = +$('qVBS').value; if (sys) t.bpSys = sys;
      const dia = +$('qVBD').value; if (dia) t.bpDia = dia;
      const sug = +$('qVS').value; if (sug) t.sugar = sug;
      state.points += 10;
    }
  }
};

function openQuick(area) {
  const f = QUICK_FORMS[area];
  if (!f) return;
  $('modalTitle').textContent = f.title;
  $('modalBody').innerHTML = f.fields + `<button class="primary-btn big" id="qSave">💾 Save</button>`;
  $('modalBackdrop').classList.add('active');
  $('qSave').addEventListener('click', () => {
    f.save();
    save();
    maybeEarnBadges();
    closeModal();
    renderAll();
    toast('✅ Saved!');
  });
}
function closeModal() { $('modalBackdrop').classList.remove('active'); }
$('modalClose').addEventListener('click', closeModal);
$('modalBackdrop').addEventListener('click', e => { if (e.target.id === 'modalBackdrop') closeModal(); });

document.body.addEventListener('click', e => {
  const btn = e.target.closest('[data-quick]');
  if (btn) openQuick(btn.dataset.quick);
});

// ---------- FULL LOG MODAL ----------
$('openFullLog').addEventListener('click', () => {
  const t = getLog();
  $('flSteps').value = '';
  $('flWorkoutType').value = '';
  $('flDuration').value = '';
  $('flCalBurn').value = '';
  $('flCalsIn').value = '';
  $('flProtein').value = '';
  $('flCarbs').value = '';
  $('flFats').value = '';
  $('flWater').value = '';
  $('flMeals').value = '';
  $('flSleepHrs').value = t.sleepHrs||'';
  $('flSleepQ').value = t.sleepQ||'';
  $('flMood').value = t.mood||'';
  $('flStress').value = t.stress||'';
  $('flWeight').value = t.weight||state.profile.weight||'';
  $('flHR').value = t.hr||'';
  $('flBPSys').value = t.bpSys||'';
  $('flBPDia').value = t.bpDia||'';
  $('flSugar').value = t.sugar||'';
  $('fullLogBackdrop').classList.add('active');
});
$('fullLogClose').addEventListener('click', () => $('fullLogBackdrop').classList.remove('active'));
$('fullLogBackdrop').addEventListener('click', e => { if (e.target.id==='fullLogBackdrop') $('fullLogBackdrop').classList.remove('active'); });

$('saveFullLog').addEventListener('click', () => {
  const t = getLog();
  const addNum = (id) => +$(id).value || 0;
  t.steps += addNum('flSteps');
  const wType = $('flWorkoutType').value.trim();
  if (wType) t.workouts.push({ type: wType, duration: addNum('flDuration'), calBurn: addNum('flCalBurn') });
  t.cals += addNum('flCalsIn');
  t.protein += addNum('flProtein');
  t.carbs += addNum('flCarbs');
  t.fats += addNum('flFats');
  t.water += addNum('flWater');
  const meals = $('flMeals').value.split(',').map(s=>s.trim()).filter(Boolean);
  meals.forEach(name => t.meals.push({ name, cals: 0, time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) }));
  if (+$('flSleepHrs').value) t.sleepHrs = +$('flSleepHrs').value;
  if (+$('flSleepQ').value) t.sleepQ = +$('flSleepQ').value;
  if ($('flMood').value) t.mood = $('flMood').value;
  if (+$('flStress').value) t.stress = +$('flStress').value;
  if (+$('flWeight').value) { t.weight = +$('flWeight').value; state.profile.weight = t.weight; }
  if (+$('flHR').value) t.hr = +$('flHR').value;
  if (+$('flBPSys').value) t.bpSys = +$('flBPSys').value;
  if (+$('flBPDia').value) t.bpDia = +$('flBPDia').value;
  if (+$('flSugar').value) t.sugar = +$('flSugar').value;
  state.points += 30;
  save();
  maybeEarnBadges();
  $('fullLogBackdrop').classList.remove('active');
  renderAll();
  toast('✅ Today\'s log saved! +30 pts');
});

// ---------- MASTER RENDER ----------
function renderAll() {
  renderHero();
  renderHighlights();
  renderQuickGrid();
  renderHeatmap();
  renderDashboardCharts();
  renderFitnessPage();
  renderNutritionPage();
  renderSleepPage();
  renderVitalsPage();
  renderGoalsPage();
  renderSettingsPage();
}

// ---------- NOTIF BUTTON (topbar shortcut) ----------
$('notifBtn').addEventListener('click', () => {
  document.querySelector('[data-page="settings"]').click();
  toast('Open reminder settings below 🔔');
});

// ---------- INIT ----------
setDailyQuote();
applyTheme();
setupReminders();
maybeEarnBadges();
renderAll();
